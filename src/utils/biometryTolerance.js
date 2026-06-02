import { parseNum } from './numberUtils.js';

export function deviceDiff(a, b) {
  const x = parseNum(a);
  const y = parseNum(b);
  if (x === null || y === null) return null;
  return Math.abs(x - y);
}

/** Minimum angular separation on a 0–180° axis scale. */
export function axisDiff(a, b) {
  const x = parseNum(a);
  const y = parseNum(b);
  if (x === null || y === null) return null;
  const d = Math.abs(x - y) % 180;
  return Math.min(d, 180 - d);
}

export const AX_TOLERANCE_DEG = 10;

export function toleranceLabel(diff, max, unit = '') {
  if (diff === null) return '';
  const ok = diff <= max;
  const prefix = ok ? '' : '⚠ ';
  return `${prefix}Differenza tollerabile < ${max}${unit}`;
}
