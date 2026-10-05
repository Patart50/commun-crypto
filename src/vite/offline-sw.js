// @ts-check
/**
 * Plugin Vite : génère au build un service worker minimal qui met en cache tous
 * les fichiers produits ; l'outil fonctionne ensuite hors ligne. Aucune dépendance
 * tierce, aucun appel réseau autre que vers le site lui-même.
 * Origine : pmpa-crypto (commit 14849f5, vite.config.ts), nom du cache paramétré.
 *
 * Écrit en JavaScript (et non en TypeScript) : la configuration de Vite charge ce
 * fichier avec Node, qui ne retire pas les types des fichiers de node_modules.
 */
import { createHash } from 'node:crypto';

/**
 * @param {{ name: string }} options `name` : identifiant de l'outil, ex. « carnet-crypto »
 *   (préfixe des caches ; les caches d'un autre outil servi sur la même origine ne sont pas touchés).
 * @returns {import('vite').Plugin}
 */
export function offlineServiceWorker({ name }) {
  if (!/^[a-z0-9-]+$/.test(name)) throw new Error(`offlineServiceWorker : nom invalide « ${name} »`);
  return {
    name: `${name}-offline-sw`,
    apply: 'build',
    generateBundle(_options, bundle) {
      // Polices : seuls les jeux latins sont pré-chargés ; les autres alphabets
      // sont mis en cache à la demande s'ils servent un jour.
      const files = Object.keys(bundle).filter((f) => !f.endsWith('.map') && !/(cyrillic|greek|vietnamese)/.test(f));
      const precache = ['./', './favicon.svg', ...files.map((f) => `./${f}`)];
      const version = createHash('sha256').update(precache.join('|')).digest('hex').slice(0, 12);
      this.emitFile({ type: 'asset', fileName: 'sw.js', source: serviceWorkerSource(name, version, precache) });
    },
  };
}

/**
 * Source du service worker (exportée pour les tests).
 * @param {string} name
 * @param {string} version
 * @param {string[]} precache
 */
export function serviceWorkerSource(name, version, precache) {
  return `// Généré au build. Ne pas modifier.
const CACHE = '${name}-${version}';
const PRECACHE = ${JSON.stringify(precache)};

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('${name}-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;
  if (request.mode === 'navigate') {
    // Réseau d'abord pour la page (mises à jour), cache si hors ligne.
    event.respondWith(fetch(request).catch(() => caches.match('./', { ignoreSearch: true })));
    return;
  }
  event.respondWith(
    caches.match(request).then(
      (cached) =>
        cached ||
        fetch(request).then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        }),
    ),
  );
});
`;
}
