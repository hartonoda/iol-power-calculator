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

function maxDeviceDiff(form, a, b, c) {
  return Math.max(
    deviceDiff(form[a], form[b]) ?? 0,
    deviceDiff(form[b], form[c]) ?? 0,
    deviceDiff(form[a], form[c]) ?? 0,
  ) || null;
}

function maxAxisDiff(form, a, b, c) {
  const diffs = [
    axisDiff(form[a], form[b]),
    axisDiff(form[b], form[c]),
    axisDiff(form[a], form[c]),
  ].filter((d) => d !== null);
  return diffs.length ? Math.max(...diffs) : null;
}

/** Cross-device tolerance warnings for Avg Km, cil., and Ax columns. */
export function computeMetricWarnings(form) {
  const avgKmDiff = maxDeviceDiff(form, 'cso_avgKm', 'tomey_avgKm', 'argos_avgKm');
  const cilDiff = maxDeviceDiff(form, 'cso_cil', 'tomey_cil', 'argos_cil');
  const axDiff = maxAxisDiff(form, 'cso_ax', 'tomey_ax', 'argos_ax');

  return {
    avgKm: {
      label: toleranceLabel(avgKmDiff, 0.3),
      alert: avgKmDiff !== null && avgKmDiff > 0.3,
    },
    cil: {
      label: toleranceLabel(cilDiff, 0.3),
      alert: cilDiff !== null && cilDiff > 0.3,
    },
    ax: {
      label: toleranceLabel(axDiff, AX_TOLERANCE_DEG, '°'),
      alert: axDiff !== null && axDiff > AX_TOLERANCE_DEG,
    },
  };
}
