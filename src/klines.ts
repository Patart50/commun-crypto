/**
 * Cours historiques à la minute via l'API publique de Binance (bougies d'une minute).
 * Origine : pmpa-crypto (commit 37e9dc9, src/lib/prices/binance.ts, pmpa D-026, D-028).
 *
 * Règles (commun-crypto/binance) : appel seulement après consentement ; n'est envoyé
 * qu'un nom de paire et une heure ; on n'interroge que des paires listées, car Binance
 * répond à une paire inconnue sans en-tête CORS (panne réseau apparente).
 */
import { dec, type Dec } from './money';
import { fetchTicker, HOSTS, type Fetcher } from './binance';

/** Au-delà, la première bougie trouvée est trop éloignée de l'heure demandée. */
export const MAX_GAP_MS = 60 * 60_000;

export const PARIS = 'Europe/Paris';

const offsetFormatter = new Intl.DateTimeFormat('en-US', { timeZone: PARIS, timeZoneName: 'longOffset' });

function parisOffsetMinutes(utcMs: number): number {
  const name = offsetFormatter.formatToParts(new Date(utcMs)).find((p) => p.type === 'timeZoneName')?.value ?? 'GMT';
  const m = /GMT([+-])(\d{2}):?(\d{2})?/.exec(name);
  if (!m) return 0;
  return (m[1] === '-' ? -1 : 1) * (Number(m[2]) * 60 + Number(m[3] ?? 0));
}

/** Date-heure locale de Paris (AAAA-MM-JJ(THH:mm(:ss))) → instant UTC en millisecondes. */
export function parisToUtcMs(local: string): number {
  const m = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2})(?::(\d{2}))?)?/.exec(local);
  if (!m) throw new RangeError(`Date invalide : ${local}`);
  const wall = Date.UTC(+m[1], +m[2] - 1, +m[3], +(m[4] ?? 0), +(m[5] ?? 0), +(m[6] ?? 0));
  let utc = wall - parisOffsetMinutes(wall) * 60_000;
  utc = wall - parisOffsetMinutes(utc) * 60_000;
  return utc;
}

/**
 * Bougies d'une minute, avec cache et liste des paires chargée une fois.
 * `failures` compte les bougies illisibles (réseau, réponse invalide).
 */
export class MinuteKlines {
  private readonly cache = new Map<string, Promise<Dec | null>>();
  private symbolList: Promise<Set<string>> | null = null;
  private host = 0;
  failures = 0;

  constructor(private readonly fetcher: Fetcher = (url) => fetch(url)) {}

  /** Paires listées (une requête, la liste publique des cours), chargées une fois. */
  symbols(): Promise<Set<string>> {
    if (!this.symbolList) {
      this.symbolList = fetchTicker(this.fetcher, this.host).then((t) => {
        this.host = t.host;
        return new Set(t.prices.keys());
      });
      this.symbolList.catch(() => (this.symbolList = null));
    }
    return this.symbolList;
  }

  /** Cours de clôture de la bougie d'une minute contenant l'instant ; null si la paire n'existe pas ou sans bougie proche. */
  async close(symbol: string, utcMs: number): Promise<Dec | null> {
    const known = await this.symbols();
    if (!known.has(symbol)) return null;
    const minute = Math.floor(utcMs / 60_000) * 60_000;
    const key = `${symbol}@${minute}`;
    let pending = this.cache.get(key);
    if (!pending) {
      pending = this.load(symbol, minute);
      this.cache.set(key, pending);
    }
    return pending;
  }

  private async load(symbol: string, minute: number): Promise<Dec | null> {
    try {
      const res = await this.fetcher(`${HOSTS[this.host]}/api/v3/klines?symbol=${symbol}&interval=1m&startTime=${minute}&limit=1`);
      if (!res.ok) {
        this.failures++;
        return null;
      }
      const data = (await res.json()) as unknown[][];
      const candle = data?.[0];
      if (!candle || Math.abs(Number(candle[0]) - minute) > MAX_GAP_MS) return null;
      return dec(String(candle[4]));
    } catch {
      this.failures++;
      return null;
    }
  }
}
