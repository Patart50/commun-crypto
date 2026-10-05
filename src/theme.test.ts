import { describe, expect, it } from 'vitest';
import { applyTheme, isTheme, nextTheme } from './theme';

describe('thème', () => {
  it('cycle et validation', () => {
    expect(nextTheme('auto')).toBe('light');
    expect(nextTheme('light')).toBe('dark');
    expect(nextTheme('dark')).toBe('auto');
    expect(isTheme('dark')).toBe(true);
    expect(isTheme('bleu')).toBe(false);
    expect(isTheme(undefined)).toBe(false);
  });

  it('data-theme posé ou retiré', () => {
    const attrs = new Map<string, string>();
    const root = { setAttribute: (n: string, v: string) => attrs.set(n, v), removeAttribute: (n: string) => attrs.delete(n) };
    applyTheme('dark', root);
    expect(attrs.get('data-theme')).toBe('dark');
    applyTheme('auto', root);
    expect(attrs.has('data-theme')).toBe(false);
  });
});
