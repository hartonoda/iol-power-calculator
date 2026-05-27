import { parseNum } from './numberUtils.js';

export function deviceDiff(a, b) {
  const x = parseNum(a);
  const y = parseNum(b);
  if (x === null || y === null) return null;
  return Math.abs(x - y);
}

export function toleranceLabel(diff, max, unit = '') {
  if (diff === null) return '';
  const ok = diff <= max;
  const prefix = ok ? '' : '⚠ ';
  return `${prefix}Differenza tollerabile < ${max}${unit}`;
}
