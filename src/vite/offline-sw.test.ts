import { describe, expect, it } from 'vitest';
import { offlineServiceWorker, serviceWorkerSource } from './offline-sw.js';

describe('service worker hors ligne', () => {
  it('cache préfixé par l’outil, fichiers pré-chargés, alphabets non latins exclus', () => {
    const emitted: { fileName: string; source: string }[] = [];
    const plugin = offlineServiceWorker({ name: 'carnet-crypto' });
    expect(plugin.name).toBe('carnet-crypto-offline-sw');
    expect(plugin.apply).toBe('build');
    const bundle = { 'assets/index.js': {}, 'assets/index.js.map': {}, 'assets/font-latin.woff2': {}, 'assets/font-cyrillic.woff2': {} };
    const generate = plugin.generateBundle as unknown as (this: unknown, o: unknown, b: unknown) => void;
    generate.call({ emitFile: (f: { fileName: string; source: string }) => emitted.push(f) }, {}, bundle);
    expect(emitted).toHaveLength(1);
    const { fileName, source } = emitted[0];
    expect(fileName).toBe('sw.js');
    expect(source).toMatch(/const CACHE = 'carnet-crypto-[0-9a-f]{12}';/);
    expect(source).toContain('"./assets/index.js"');
    expect(source).toContain('"./assets/font-latin.woff2"');
    expect(source).not.toContain('index.js.map');
    expect(source).not.toContain('cyrillic');
    expect(source).toContain("k.startsWith('carnet-crypto-')");
  });

  it('nom invalide refusé, source stable', () => {
    expect(() => offlineServiceWorker({ name: "x'; alert(1)" })).toThrow();
    expect(serviceWorkerSource('a', 'v1', ['./'])).toBe(serviceWorkerSource('a', 'v1', ['./']));
  });
});
