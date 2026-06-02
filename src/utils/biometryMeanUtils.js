import { parseNum, formatPower } from './numberUtils.js';

export function meanNumeric(values) {
  const nums = values.map((v) => parseNum(v)).filter((n) => n !== null);
  if (!nums.length) return null;
  return nums.reduce((sum, n) => sum + n, 0) / nums.length;
}

/** Circular mean for keratometry / IOL axis (0–180°). */
export function meanAxisDeg(values) {
  const nums = values.map((v) => parseNum(v)).filter((n) => n !== null);
  if (!nums.length) return null;
  let sx = 0;
  let sy = 0;
  for (const deg of nums) {
    const rad = (deg * 2 * Math.PI) / 180;
    sx += Math.cos(rad);
    sy += Math.sin(rad);
  }
  let mean = (Math.atan2(sy, sx) * 180) / Math.PI / 2;
  if (mean < 0) mean += 180;
  return mean;
}

export function formatBiometryMean(value, { kind = 'decimal', digits = 2 } = {}) {
  if (value === null || value === undefined || Number.isNaN(value)) return '';
  if (kind === 'axis') return String(Math.round(value));
  if (kind === 'integer') return String(Math.round(value));
  return formatPower(value, digits);
}
