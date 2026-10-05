import { describe, expect, it } from 'vitest';
import type { Fetcher } from './binance';
import { MinuteKlines, parisToUtcMs } from './klines';
import { priceEurAsync } from './binance';

function fake(prices: Record<string, string>, closes: Record<string, string>) {
  const urls: string[] = [];
  const fetcher: Fetcher = async (url) => {
    urls.push(url);
    if (url.endsWith('/api/v3/ticker/price')) return { ok: true, status: 200, json: async () => Object.entries(prices).map(([symbol, price]) => ({ symbol, price })) };
    const u = new URL(url);
    const symbol = u.searchParams.get('symbol')!;
    const start = Number(u.searchParams.get('startTime'));
    const close = closes[symbol];
    return { ok: true, status: 200, json: async () => (close ? [[start, '0', '0', '0', close]] : []) };
  };
  return { fetcher, urls };
}

describe('cours à la minute', () => {
  it('heure de Paris → UTC, été et hiver', () => {
    expect(new Date(parisToUtcMs('2026-01-05T09:30')).toISOString()).toBe('2026-01-05T08:30:00.000Z');
    expect(new Date(parisToUtcMs('2026-07-05T09:30')).toISOString()).toBe('2026-07-05T07:30:00.000Z');
    expect(() => parisToUtcMs('05/01/2026')).toThrow(RangeError);
  });

  it('bougie de la minute, paire inconnue jamais interrogée, cache', async () => {
    const { fetcher, urls } = fake({ BTCUSDT: '1' }, { BTCUSDT: '60123.45' });
    const k = new MinuteKlines(fetcher);
    const t = Date.UTC(2026, 0, 5, 8, 30, 42);
    expect((await k.close('BTCUSDT', t))!.toString()).toBe('60123.45');
    expect(await k.close('NOPEUSDT', t)).toBeNull();
    await k.close('BTCUSDT', t + 5000);
    const klineCalls = urls.filter((u) => u.includes('klines'));
    expect(klineCalls).toEqual([`https://data-api.binance.vision/api/v3/klines?symbol=BTCUSDT&interval=1m&startTime=${Date.UTC(2026, 0, 5, 8, 30)}&limit=1`]);
    expect(urls.filter((u) => u.includes('ticker'))).toHaveLength(1);
  });

  it('bougie trop éloignée ou absente : null ; erreur réseau comptée', async () => {
    const far: Fetcher = async (url) =>
      url.includes('ticker') ? { ok: true, status: 200, json: async () => [{ symbol: 'BTCUSDT', price: '1' }] } : { ok: true, status: 200, json: async () => [[0, '0', '0', '0', '5']] };
    expect(await new MinuteKlines(far).close('BTCUSDT', Date.UTC(2026, 0, 5))).toBeNull();
    const broken: Fetcher = async (url) => {
      if (url.includes('ticker')) return { ok: true, status: 200, json: async () => [{ symbol: 'BTCUSDT', price: '1' }] };
      throw new TypeError('Failed to fetch');
    };
    const k = new MinuteKlines(broken);
    expect(await k.close('BTCUSDT', Date.UTC(2026, 0, 5))).toBeNull();
    expect(k.failures).toBe(1);
  });

  it('se combine avec les chemins en euros', async () => {
    const { fetcher } = fake({ SOLUSDT: '1', EURUSDT: '1' }, { SOLUSDT: '216', EURUSDT: '1.08' });
    const k = new MinuteKlines(fetcher);
    const q = await priceEurAsync('SOL', (s) => k.close(s, Date.UTC(2026, 0, 5)));
    expect(q).toMatchObject({ route: 'SOLUSDT ÷ EURUSDT' });
    expect(q!.price.toString()).toBe('200');
  });
});
