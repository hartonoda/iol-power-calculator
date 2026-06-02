export function normalizeDecimal(value) {
  if (typeof value !== 'string') return value;
  return value.replace(/,/g, '.');
}

/** Form fields stored as diopters (sf., cil., target, etc.) */
export const DIOPTER_FORM_FIELDS = ['bcdva_sph', 'bcdva_cyl', 'refSf', 'target'];

/**
 * Format refraction diopters: values without a decimal (e.g. -250) become -2.50.
 * Axis (degrees) and VA must not use this helper.
 */
export function formatDiopter(value, digits = 2) {
  if (value === null || value === undefined) return '';
  const trimmed = String(value).trim();
  if (!trimmed || trimmed === '-' || trimmed === '+') return trimmed;

  const normalized = normalizeDecimal(trimmed);
  if (/[a-zA-Z/]/.test(normalized.replace(/^[+-]/, ''))) {
    return trimmed;
  }

  const hasDecimal = normalized.includes('.');
  const n = parseFloat(normalized);
  if (!Number.isFinite(n)) return trimmed;

  if (hasDecimal) {
    const sign = n < 0 ? '-' : (normalized.startsWith('+') ? '+' : '');
    return `${sign}${Math.abs(n).toFixed(digits)}`;
  }

  const intN = Math.trunc(n);
  const abs = Math.abs(intN);
  if (abs >= 10) {
    const diopter = intN / 100;
    const sign = diopter < 0 ? '-' : (normalized.startsWith('+') ? '+' : '');
    return `${sign}${Math.abs(diopter).toFixed(digits)}`;
  }

  const sign = intN < 0 ? '-' : (normalized.startsWith('+') ? '+' : '');
  return `${sign}${abs.toFixed(digits)}`;
}

export function formatDiopterFields(form, fields = DIOPTER_FORM_FIELDS) {
  if (!form || typeof form !== 'object') return;
  for (const key of fields) {
    if (form[key]) {
      form[key] = formatDiopter(form[key]);
    }
  }
}

export function parseNum(value) {
  if (value === null || value === undefined || value === '') return null;
  const n = parseFloat(normalizeDecimal(String(value)));
  return Number.isFinite(n) ? n : null;
}

export function formatPower(value, digits = 2) {
  if (value === null || value === undefined || Number.isNaN(value)) return '';
  return value.toFixed(digits);
}
