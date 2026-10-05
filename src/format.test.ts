import { describe, expect, it } from 'vitest';
import { amount, amountSigned, dateFr, duration, eur, eurPrice, eurSigned, pct, qty } from './format';
import { dec } from './money';

// Intl insère des espaces insécables : on les normalise pour comparer.
const n = (s: string) => s.replace(/[  ]/g, ' ');

describe('format', () => {
  it('euros, signes et pourcentages', () => {
    expect(n(eur(dec('1234.565')))).toBe('1 234,57 €');
    expect(n(eurSigned(dec('-4')))).toBe('−4,00 €');
    expect(n(eurSigned(dec('12.3')))).toBe('+12,30 €');
    expect(n(pct(dec('-12.34')))).toBe('−12,3 %');
  });

  it('cours et quantités', () => {
    expect(n(eurPrice(dec('62345.678')))).toBe('62 345,68 €');
    expect(n(eurPrice(dec('1.23456')))).toBe('1,2346 €');
    expect(n(qty(dec('0.123456789')))).toBe('0,12345678');
  });

  it('devises de cotation, ISO ou non', () => {
    expect(n(amount(dec('1234.5'), 'EUR'))).toBe('1 234,50 €');
    expect(n(amount(dec('1234.5'), 'usdt'))).toBe('1 234,50 USDT');
    expect(n(amount(dec('0.5'), 'USDC', 4))).toBe('0,5000 USDC');
    expect(n(amount(dec('10'), 'USD'))).toBe('10,00 $US');
    expect(n(amountSigned(dec('-3'), 'USDT'))).toBe('−3,00 USDT');
    expect(n(amountSigned(dec('0'), 'USDT'))).toBe('0,00 USDT');
  });

  it('dates et durées', () => {
    expect(dateFr('2026-10-05')).toBe('05/10/2026');
    expect(duration('2024-01-15', '2026-03-20')).toBe('2 ans et 2 mois');
    expect(duration('2026-10-01', '2026-10-05')).toBe('5 jours');
  });
});
