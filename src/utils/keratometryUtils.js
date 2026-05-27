import { parseNum } from './numberUtils.js';

export function calcAvgKm(k1, k2) {
  const a = parseNum(k1);
  const b = parseNum(k2);
  if (a === null || b === null) return '';
  return ((a + b) / 2).toFixed(2);
}

export function calcCylinder(k1, k2) {
  const a = parseNum(k1);
  const b = parseNum(k2);
  if (a === null || b === null) return '';
  return Math.abs(b - a).toFixed(2);
}

export function calcK2Axis(k1Axis) {
  const axis = parseNum(k1Axis);
  if (axis === null) return '';
  let k2 = axis - 90;
  if (k2 < 0) k2 += 180;
  return String(Math.round(k2));
}
