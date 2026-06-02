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

/** Allowed BCDVA / visus values in Valutazione form. */
export const VISUS_VA_OPTIONS = [
  'PL',
  'CD',
  '0.5/10',
  '1/10',
  '2/10',
  '3/10',
  '4/10',
  '5/10',
  '6/10',
  '7/10',
  '8/10',
  '9/10',
  '10/10',
];

/** Numerator from stored VA (e.g. "5/10" -> "5"). */
export function parseVisusNumerator(value) {
  const t = String(value ?? '').trim();
  if (!t) return '';
  const m = t.match(/^([\d.]+)\s*(?:\/\s*10)?$/i);
  return m ? m[1] : t.replace(/\/.*$/, '').trim();
}

/** Normalize to a valid VISUS_VA_OPTIONS value (e.g. 5 -> "5/10", pl -> "PL"). */
export function formatVisus(value) {
  const t = String(value ?? '').trim();
  if (!t) return '';

  const upper = t.toUpperCase();
  if (upper === 'PL' || upper === 'CD') return upper;
  if (VISUS_VA_OPTIONS.includes(t)) return t;

  const num = parseVisusNumerator(t);
  const n = parseFloat(normalizeDecimal(num));
  if (!Number.isFinite(n)) return '';

  if (n === 0.5) return '0.5/10';
  if (Number.isInteger(n) && n >= 1 && n <= 10) return `${n}/10`;

  const candidate = `${num}/10`;
  return VISUS_VA_OPTIONS.includes(candidate) ? candidate : '';
}

export function formatVisusFields(form, field = 'bcdva_va') {
  if (!form || typeof form !== 'object' || !form[field]) return;
  form[field] = formatVisus(form[field]);
}

/**
 * FileMaker Costo int often encodes two amounts: 1250600 -> "1250 (600)".
 */
export function formatCostoImport(value) {
  const t = String(value ?? '').trim();
  if (!t) return '';
  if (t.includes('(')) return t;

  const n = parseNum(t);
  if (n === null) return t;

  const abs = Math.abs(Math.trunc(n));
  if (abs >= 10000) {
    const secondary = abs % 1000;
    const primary = Math.floor(abs / 1000);
    if (primary > 0 && secondary > 0) {
      return `${primary} (${secondary})`;
    }
  }

  return Number.isInteger(n) ? String(Math.trunc(n)) : String(n);
}
