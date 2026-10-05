/**
 * Accès à l'API publique de données de marché de Binance, et conversion en euros.
 * Origine : pmpa-crypto (commit 37e9dc9, src/lib/prices/binance.ts, pmpa D-026,
 * D-028, D-030) et renfort-crypto (commit 6bc9fb8, renfort D-013).
 *
 * Règles communes à tous les outils :
 * - appel uniquement après consentement explicite de l'utilisateur ;
 * - rien d'autre n'est envoyé que des noms de paires et des heures ;
 *   la liste des cours (/api/v3/ticker/price) se charge sans paramètre ;
 * - ne jamais interroger une paire inexistante : Binance y répond sans en-tête
 *   CORS, ce que le navigateur présente comme une panne réseau (pmpa D-028).
 */
import { D, dec, type Dec } from './money';

export type Fetcher = (url: string) => Promise<{ ok: boolean; status: number; json(): Promise<unknown> }>;

/** Hôtes essayés dans l'ordre. */
export const HOSTS: readonly string[] = ['https://data-api.binance.vision', 'https://api.binance.com'];

export class PriceFetchError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PriceFetchError';
  }
}

export interface PriceQuote {
  price: Dec;
  /** Chemin utilisé, ex. « SOLUSDT ÷ EURUSDT ». */
  route: string;
}

/** Cours de chaque paire listée (null si le prix est illisible) et hôte qui a répondu. */
export interface Ticker {
  prices: Map<string, Dec | null>;
  /** Index dans HOSTS de l'hôte qui a répondu : à réutiliser pour les requêtes suivantes. */
  host: number;
}

const defaultFetcher: Fetcher = (url) => fetch(url);

/** Toutes les paires listées avec leur dernier prix, en une requête, en commençant par l'hôte `startHost`. */
export async function fetchTicker(fetcher: Fetcher = defaultFetcher, startHost = 0): Promise<Ticker> {
  for (let attempt = 0; attempt < HOSTS.length; attempt++) {
    const host = (startHost + attempt) % HOSTS.length;
    try {
      const res = await fetcher(`${HOSTS[host]}/api/v3/ticker/price`);
      if (!res.ok) continue;
      const data = (await res.json()) as { symbol: string; price: string }[];
      if (!Array.isArray(data) || data.length === 0) continue;
      const prices = new Map<string, Dec | null>();
      for (const d of data) {
        let price: Dec | null = null;
        try {
          const p = dec(String(d.price));
          if (p.gt(0)) price = p;
        } catch {
          // prix illisible : la paire reste connue, sans cours
        }
        prices.set(d.symbol, price);
      }
      return { prices, host };
    } catch {
      // hôte suivant
    }
  }
  throw new PriceFetchError('Impossible de joindre Binance (connexion coupée ou accès bloqué par le navigateur).');
}

/** Raccourci : seulement la table des cours. */
export async function loadTicker(fetcher: Fetcher = defaultFetcher): Promise<Map<string, Dec | null>> {
  return (await fetchTicker(fetcher)).prices;
}

/**
 * Chemins de conversion en euros (pmpa D-026), écrits une seule fois sous forme
 * de générateur : il demande des paires une par une (`yield 'SOLEUR'`) et reçoit
 * leur cours. Le même chemin sert donc à une table déjà chargée (synchrone) et à
 * des bougies chargées à la demande (asynchrone), sans requête inutile.
 *
 * Ordre (identique à pmpa) : EUR ; USD → 1 ÷ EURUSDT ; paire directe XEUR ; XUSDT ÷ EURUSDT ; XUSDC × USDCUSDT ÷ EURUSDT ;
 * XBTC × BTCEUR. L'USD est assimilé à l'USDT (pas de paire EUR/USD, écart ~0,1 %).
 */
export function* eurRoute(asset: string): Generator<string, PriceQuote | null, Dec | null> {
  const a = asset.toUpperCase();
  if (a === 'EUR') return { price: new D(1), route: 'EUR' };

  if (a === 'USD') {
    const eurUsdt = yield 'EURUSDT';
    return eurUsdt && !eurUsdt.isZero() ? { price: new D(1).dividedBy(eurUsdt), route: '1 ÷ EURUSDT (USD ≈ USDT)' } : null;
  }

  const direct = yield `${a}EUR`;
  if (direct) return { price: direct, route: `${a}EUR` };

  const eurUsdt = yield 'EURUSDT';
  if (!eurUsdt || eurUsdt.isZero()) return null;
  if (a === 'USDT') return { price: new D(1).dividedBy(eurUsdt), route: '1 ÷ EURUSDT' };

  const viaUsdt = yield `${a}USDT`;
  if (viaUsdt) return { price: viaUsdt.dividedBy(eurUsdt), route: `${a}USDT ÷ EURUSDT` };

  const viaUsdc = yield `${a}USDC`;
  if (viaUsdc) {
    const usdcUsdt = yield 'USDCUSDT';
    if (usdcUsdt) return { price: viaUsdc.times(usdcUsdt).dividedBy(eurUsdt), route: `${a}USDC × USDCUSDT ÷ EURUSDT` };
  }

  const viaBtc = yield `${a}BTC`;
  if (viaBtc) {
    const btcEur = yield 'BTCEUR';
    if (btcEur) return { price: viaBtc.times(btcEur), route: `${a}BTC × BTCEUR` };
  }
  return null;
}

/** Prix en euros d'un actif à partir d'une table de cours déjà chargée. */
export function priceEur(asset: string, ticker: Map<string, Dec | null>): PriceQuote | null {
  const route = eurRoute(asset);
  let step = route.next();
  while (!step.done) step = route.next(ticker.get(step.value) ?? null);
  return step.value;
}

/** Prix en euros d'un actif, chaque paire étant obtenue à la demande (bougies historiques…). */
export async function priceEurAsync(asset: string, get: (symbol: string) => Promise<Dec | null>): Promise<PriceQuote | null> {
  const route = eurRoute(asset);
  let step = route.next();
  while (!step.done) step = route.next(await get(step.value));
  return step.value;
}

/** Arrondi d'un cours à l'enregistrement (pmpa D-030) : 2 décimales au-delà de 100 €, 4 au-delà de 1 €, 6 chiffres significatifs en dessous. */
export function roundPrice(price: Dec): Dec {
  if (price.gte(100)) return price.toDecimalPlaces(2, D.ROUND_HALF_UP);
  if (price.gte(1)) return price.toDecimalPlaces(4, D.ROUND_HALF_UP);
  return price.toSignificantDigits(6, D.ROUND_HALF_UP);
}
