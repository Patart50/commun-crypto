import { describe, expect, it } from 'vitest';
import { LocalStore, MemoryStore, openLocalStore, type KeyValueStore } from './storage';

describe('storage', () => {
  it('préfixe, lecture, écriture, suppression, listage', () => {
    const mem = new MemoryStore();
    mem.setItem('autre:x', '1');
    const s = openLocalStore('carnet-crypto:', mem);
    expect(s.writeJson('reglages', { theme: 'dark' })).toBe(true);
    expect(s.writeJson('prix:BTC', 1)).toBe(true);
    expect(mem.getItem('carnet-crypto:reglages')).toBe('{"theme":"dark"}');
    expect(s.readJson<{ theme: string }>('reglages')).toEqual({ theme: 'dark' });
    expect(s.keysWith('prix:')).toEqual(['prix:BTC']);
    s.remove('prix:BTC');
    expect(s.readJson('prix:BTC')).toBeNull();
  });

  it('JSON illisible → null ; stockage qui refuse → false, sans exception', () => {
    const mem = new MemoryStore();
    mem.setItem('t:k', '{pas du json');
    const broken: KeyValueStore = {
      getItem: () => {
        throw new Error('bloqué');
      },
      setItem: () => {
        throw new Error('quota');
      },
      removeItem: () => {
        throw new Error('bloqué');
      },
      key: () => null,
      get length(): number {
        throw new Error('bloqué');
      },
    };
    expect(new LocalStore(mem, 't:', true).readJson('k')).toBeNull();
    const s = new LocalStore(broken, 't:', true);
    expect(s.readJson('k')).toBeNull();
    expect(s.writeJson('k', 1)).toBe(false);
    expect(() => s.remove('k')).not.toThrow();
    expect(s.keysWith('')).toEqual([]);
  });

  it('sans localStorage : repli en mémoire, signalé', () => {
    const s = openLocalStore('t:');
    expect(s.persistent).toBe(false);
    expect(s.writeJson('k', 2)).toBe(true);
    expect(s.readJson('k')).toBe(2);
  });
});
