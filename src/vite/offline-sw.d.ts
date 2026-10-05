import type { Plugin } from 'vite';

/** Plugin Vite : service worker hors ligne généré au build. `name` : identifiant de l'outil (préfixe des caches). */
export function offlineServiceWorker(options: { name: string }): Plugin;

/** Source du service worker (tests). */
export function serviceWorkerSource(name: string, version: string, precache: string[]): string;
