export function normalizeDecimal(value) {
  if (typeof value !== 'string') return value;
  return value.replace(/,/g, '.');
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
