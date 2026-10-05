/**
 * Thème clair / sombre / automatique, commun à tous les outils.
 * Le thème « auto » suit le système (prefers-color-scheme) ; les autres posent
 * data-theme sur <html>, que theme.css interprète.
 */
export type Theme = 'auto' | 'light' | 'dark';

export const THEMES: readonly Theme[] = ['auto', 'light', 'dark'];

export function isTheme(value: unknown): value is Theme {
  return typeof value === 'string' && (THEMES as readonly string[]).includes(value);
}

/** Thème suivant dans le cycle auto → clair → sombre. */
export function nextTheme(current: Theme): Theme {
  return THEMES[(THEMES.indexOf(current) + 1) % THEMES.length];
}

/** Applique le thème au document. */
export function applyTheme(theme: Theme, root: { setAttribute(n: string, v: string): void; removeAttribute(n: string): void } = document.documentElement): void {
  if (theme === 'auto') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', theme);
}
