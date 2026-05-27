import path from 'path';
import * as XLSX from 'xlsx';

export const DEFAULT_CSV_PATH =
  'c:\\Users\\hartono\\Documents\\hartonoda-project\\smartiol\\valutazione.csv';

export const DEFAULT_XLS_PATH =
  'c:\\Users\\hartono\\Documents\\hartonoda-project\\smartiol\\valutazione.xls';

function normalizeName(name) {
  return (name || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

export function formatPatientName(cognome) {
  return (cognome || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

export function parseOperationDate(value) {
  if (value == null || value === '') return null;
  if (typeof value === 'number' && Number.isFinite(value)) {
    const utc = (value - 25569) * 86400 * 1000;
    return new Date(utc).toISOString().slice(0, 10);
  }
  const str = String(value).trim();
  const dmy = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (dmy) {
    const [, d, m, y] = dmy;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  const iso = str.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) return str;
  return null;
}

export function estimateBirthDate(operationDateIso, age) {
  if (!operationDateIso) return '1900-01-01';
  const ageNum = Number(age);
  if (!Number.isFinite(ageNum) || ageNum < 0 || ageNum > 120) return '1900-01-01';
  const op = new Date(`${operationDateIso}T12:00:00`);
  if (Number.isNaN(op.getTime())) return '1900-01-01';
  const birth = new Date(op);
  birth.setFullYear(op.getFullYear() - Math.round(ageNum));
  return birth.toISOString().slice(0, 10);
}

export function readValutazioneRows(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const options = ext === '.csv' ? { type: 'file', FS: ',' } : undefined;
  const workbook = XLSX.readFile(filePath, options);
  const sheetName = workbook.SheetNames[0];
  return XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
}

/**
 * Unique patients from valutazione export (CSV or XLS).
 * DOB estimated from Eta + most recent "data intervento" per Cognome.
 */
export function extractPatientsFromRows(rows) {
  const byName = new Map();

  for (const row of rows) {
    const key = normalizeName(row.Cognome);
    if (!key) continue;

    const operationDate = parseOperationDate(row['data intervento']);
    const ageRaw = row.Eta;
    const age =
      ageRaw != null && ageRaw !== '' && !Number.isNaN(Number(ageRaw))
        ? Number(ageRaw)
        : null;

    if (!byName.has(key)) {
      byName.set(key, {
        cognome: row.Cognome,
        latestOpDate: operationDate,
        age,
      });
      continue;
    }

    const entry = byName.get(key);
    if (operationDate && (!entry.latestOpDate || operationDate > entry.latestOpDate)) {
      entry.latestOpDate = operationDate;
      if (age != null) entry.age = age;
    } else if (age != null && entry.age == null) {
      entry.age = age;
    }
  }

  const patients = [];
  for (const entry of byName.values()) {
    patients.push({
      name: formatPatientName(entry.cognome),
      dateOfBirth: estimateBirthDate(entry.latestOpDate, entry.age),
      gender: '',
    });
  }

  patients.sort((a, b) => a.name.localeCompare(b.name, 'it'));
  return patients;
}

export function extractPatientsFromValutazioneFile(filePath = DEFAULT_CSV_PATH) {
  const rows = readValutazioneRows(filePath);
  return extractPatientsFromRows(rows);
}

/** @deprecated use extractPatientsFromValutazioneFile */
export function extractPatientsFromValutazioneXls(filePath = DEFAULT_XLS_PATH) {
  return extractPatientsFromValutazioneFile(filePath);
}
