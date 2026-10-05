import { describe, expect, it } from 'vitest';
import { parseNumber } from './parse';

describe('parseNumber', () => {
  it('formats français et anglais', () => {
    expect(parseNumber('1 234,56')!.toString()).toBe('1234.56');
    expect(parseNumber('1 234,5 €')!.toString()).toBe('1234.5');
    expect(parseNumber('1.234,56')!.toString()).toBe('1234.56');
    expect(parseNumber('1,234.56')!.toString()).toBe('1234.56');
    expect(parseNumber('0.25')!.toString()).toBe('0.25');
    expect(parseNumber(',5')!.toString()).toBe('0.5');
    expect(parseNumber('0,1 %')!.toString()).toBe('0.1');
    expect(parseNumber('-3,5')!.toString()).toBe('-3.5');
  });

  it('vide → null, illisible → erreur', () => {
    expect(parseNumber('  ')).toBeNull();
    expect(() => parseNumber('abc')).toThrow(RangeError);
    expect(() => parseNumber('1,2,3')).toThrow(RangeError);
    expect(() => parseNumber('1..2')).toThrow(RangeError);
  });
});
