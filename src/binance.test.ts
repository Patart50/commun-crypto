import { describe, expect, it } from 'vitest';
import { dec, type Dec } from './money';
import { eurRoute, fetchTicker, loadTicker, priceEur, priceEurAsync, roundPrice, PriceFetchError, type Fetcher } from './binance';

const TICKER = [
  { symbol: 'BTCEUR', price: '60000.00' },
  { symbol: 'EURUSDT', price: '1.08' },
  { symbol: 'SOLUSDT', price: '216.00' },
  { symbol: 'ABCUSDC', price: '2' },
  { symbol: 'USDCUSDT', price: '1.0008' },
  { symbol: 'XYZBTC', price: '0.0001' },
  { symbol: 'BADEUR', price: 'n/a' },
];

const ok: Fetcher = async () => ({ ok: true, status: 200, json: async () => TICKER });

describe('Binance : table des cours', () => {
  it('chemins de conversion en euros', async () => {
    const t = await loadTicker(ok);
    expect(priceEur('btc', t)).toEqual({ price: dec('60000'), route: 'BTCEUR' });
    expect(priceEur('EUR', t)!.route).toBe('EUR');
    expect(priceEur('SOL', t)!.price.toString()).toBe('200');
    expect(priceEur('SOL', t)!.route).toBe('SOLUSDT ÷ EURUSDT');
    expect(priceEur('ABC', t)!.route).toBe('ABCUSDC × USDCUSDT ÷ EURUSDT');
    expect(priceEur('XYZ', t)!.price.toString()).toBe('6');
    expect(priceEur('USDT', t)!.route).toBe('1 ÷ EURUSDT');
    expect(priceEur('USD', t)!.route).toBe('1 ÷ EURUSDT (USD ≈ USDT)');
    expect(priceEur('BAD', t)).toBeNull();
    expect(priceEur('NOPE', t)).toBeNull();
  });

  it('second hôte si le premier échoue, hôte retenu, erreur claire si aucun ne répond', async () => {
    const urls: string[] = [];
    const flaky: Fetcher = async (url) => {
      urls.push(url);
      if (url.includes('binance.vision')) throw new TypeError('Failed to fetch');
      return { ok: true, status: 200, json: async () => TICKER };
    };
    const t = await fetchTicker(flaky);
    expect(t.prices.size).toBe(TICKER.length);
    expect(t.host).toBe(1);
    expect(urls.map((u) => new URL(u).host)).toEqual(['data-api.binance.vision', 'api.binance.com']);
    urls.length = 0;
    await fetchTicker(flaky, t.host);
    expect(urls.map((u) => new URL(u).host)).toEqual(['api.binance.com']);
    const down: Fetcher = async () => ({ ok: false, status: 503, json: async () => null });
    await expect(loadTicker(down)).rejects.toBeInstanceOf(PriceFetchError);
  });

  it('seule la liste publique des cours est demandée (aucun paramètre)', async () => {
    const urls: string[] = [];
    await loadTicker(async (url) => {
      urls.push(url);
      return { ok: true, status: 200, json: async () => TICKER };
    });
    expect(urls).toEqual(['https://data-api.binance.vision/api/v3/ticker/price']);
  });

  it('arrondi des cours (pmpa D-030)', () => {
    expect(roundPrice(dec('60123.4567')).toString()).toBe('60123.46');
    expect(roundPrice(dec('2.345678')).toString()).toBe('2.3457');
    expect(roundPrice(dec('0.000123456789')).toString()).toBe('0.000123457');
  });
});

describe('Binance : chemins à la demande', () => {
  it('ne demande que les paires nécessaires, dans l’ordre', async () => {
    const asked: string[] = [];
    const prices = new Map<string, Dec>([
      ['EURUSDT', dec('1.08')],
      ['SOLUSDT', dec('216')],
    ]);
    const quote = await priceEurAsync('SOL', async (symbol) => {
      asked.push(symbol);
      return prices.get(symbol) ?? null;
    });
    expect(quote!.price.toString()).toBe('200');
    expect(asked).toEqual(['SOLEUR', 'EURUSDT', 'SOLUSDT']);
  });

  it('paire directe : une seule demande', () => {
    const route = eurRoute('BTC');
    const first = route.next();
    expect(first.value).toBe('BTCEUR');
    const end = route.next(dec('60000'));
    expect(end.done).toBe(true);
    expect(end.value).toEqual({ price: dec('60000'), route: 'BTCEUR' });
  });
});
