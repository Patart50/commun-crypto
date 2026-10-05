/**
 * Lecture d'un nombre saisi à la française ou à l'anglaise.
 * Origine : renfort-crypto (commit 6bc9fb8, src/lib/core/calc.ts, renfort D-012).
 *
 * « 100 000 », « 1.234,56 », « 1,234.56 », « 0,1 % » ; avec un seul séparateur,
 * il est décimal. Espaces (y compris insécables), « € » et « % » ignorés.
 */
import { dec, type Dec } from './money';

/** Renvoie null pour une saisie vide ; lève RangeError pour une saisie illisible. */
export function parseNumber(raw: string): Dec | null {
  const s = raw.replace(/[\s  €%]/g, '');
  if (s === '') return null;
  const lastComma = s.lastIndexOf(',');
  const lastDot = s.lastIndexOf('.');
  let normalized: string;
  if (lastComma >= 0 && lastDot >= 0) normalized = lastComma > lastDot ? s.replace(/\./g, '').replace(',', '.') : s.replace(/,/g, '');
  else normalized = s.replace(',', '.');
  if (!/^-?(\d+\.?\d*|\.\d+)$/.test(normalized)) throw new RangeError(`Nombre illisible : ${raw}`);
  return dec(normalized);
}
