/**
 * Stockage clé-valeur local (localStorage), avec préfixe propre à chaque outil.
 * Origine : dca-crypto (commit 9414232, src/lib/state/storage.ts), préfixe paramétré.
 *
 * Une erreur de stockage (navigation privée, quota) ne doit jamais casser
 * l'application : chaque opération l'absorbe et le signale par sa valeur de retour.
 * Pour les gros volumes (journaux, historiques), préférer IndexedDB (pmpa D-016).
 */
export interface KeyValueStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  key(index: number): string | null;
  readonly length: number;
}

/** Mémoire de repli quand localStorage est indisponible. */
export class MemoryStore implements KeyValueStore {
  private data = new Map<string, string>();
  getItem(key: string) {
    return this.data.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    this.data.set(key, value);
  }
  removeItem(key: string) {
    this.data.delete(key);
  }
  key(index: number) {
    return [...this.data.keys()][index] ?? null;
  }
  get length() {
    return this.data.size;
  }
}

/** Accès préfixé à un stockage : toutes les clés commencent par `prefix`. */
export class LocalStore {
  constructor(
    readonly store: KeyValueStore,
    readonly prefix: string,
    /** false si l'on travaille en mémoire (données perdues à la fermeture). */
    readonly persistent: boolean,
  ) {}

  readJson<T>(key: string): T | null {
    try {
      const raw = this.store.getItem(this.prefix + key);
      return raw === null ? null : (JSON.parse(raw) as T);
    } catch {
      return null;
    }
  }

  /** Écrit une valeur ; renvoie false si le stockage a refusé (quota plein…). */
  writeJson(key: string, value: unknown): boolean {
    try {
      this.store.setItem(this.prefix + key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  }

  remove(key: string): void {
    try {
      this.store.removeItem(this.prefix + key);
    } catch {
      // rien à faire
    }
  }

  /** Clés de l'outil (sans le préfixe) commençant par `start`. */
  keysWith(start: string): string[] {
    const out: string[] = [];
    try {
      for (let i = 0; i < this.store.length; i++) {
        const k = this.store.key(i);
        if (k?.startsWith(this.prefix + start)) out.push(k.slice(this.prefix.length));
      }
    } catch {
      // stockage illisible : aucune clé
    }
    return out;
  }
}

/**
 * localStorage s'il fonctionne, sinon une mémoire. `prefix` identifie l'outil,
 * ex. « carnet-crypto: » ; il doit rester stable d'une version à l'autre.
 */
export function openLocalStore(prefix: string, backend?: KeyValueStore): LocalStore {
  if (backend) return new LocalStore(backend, prefix, true);
  try {
    const ls = globalThis.localStorage;
    const probe = `${prefix}probe`;
    ls.setItem(probe, '1');
    ls.removeItem(probe);
    return new LocalStore(ls, prefix, true);
  } catch {
    return new LocalStore(new MemoryStore(), prefix, false);
  }
}
