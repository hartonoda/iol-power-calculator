/**
 * One-shot full import:
 * valutazione.csv -> patients + operations in iol-calculator-patient-data.sqlite
 *
 * Usage:
 *   node scripts/import-valutazione-full.mjs [csvPath] [dbPath]
 *
 * If dbPath is omitted, imports into:
 *   1) <project>/iol-calculator-patient-data.sqlite
 *   2) %APPDATA%/IOL Power Calculator/database/iol-calculator-patient-data.sqlite (if exists)
 */
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import { DatabaseSync } from 'node:sqlite';
import XLSX from 'xlsx';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');

const DEFAULT_CSV_PATH =
  'c:\\Users\\hartono\\Documents\\hartonoda-project\\smartiol\\valutazione.csv';

const csvPath = process.argv[2] || DEFAULT_CSV_PATH;
const explicitDbPath = process.argv[3] || null;

if (!fs.existsSync(csvPath)) {
  console.error('CSV not found:', csvPath);
  process.exit(1);
}

function trimValue(value) {
  if (value == null) return '';
  if (typeof value === 'string') return value.trim();
  return String(value).trim();
}

function parseOperationDate(value) {
  const str = trimValue(value);
  if (!str) return null;

  const dmy = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})$/);
  if (dmy) {
    const [, d, m, yRaw] = dmy;
    const yNum = Number(yRaw);
    const y = yRaw.length === 2 ? String(yNum >= 70 ? 1900 + yNum : 2000 + yNum) : yRaw;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  const iso = str.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) return str;

  // Excel serial fallback
  if (/^\d+(\.\d+)?$/.test(str)) {
    const n = Number(str);
    if (Number.isFinite(n)) {
      const ms = (n - 25569) * 86400 * 1000;
      return new Date(ms).toISOString().slice(0, 10);
    }
  }

  return null;
}

function formatPatientName(name) {
  return trimValue(name)
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

function normalizeKeyName(name) {
  return trimValue(name).toLowerCase().replace(/\s+/g, ' ');
}

function normalizeEye(eye) {
  const v = trimValue(eye).toUpperCase();
  if (v === 'OD' || v === 'D' || v.startsWith('OD')) return 'OD';
  if (v === 'OS' || v === 'S' || v.startsWith('OS')) return 'OS';
  if (v === 'OO') return 'OO';
  return '';
}

function expandEyes(eye) {
  const n = normalizeEye(eye);
  if (n === 'OD') return ['OD'];
  if (n === 'OS') return ['OS'];
  if (n === 'OO') return ['OD', 'OS'];
  return [];
}

function cleanText(v) {
  return trimValue(v).replace(/\s+/g, ' ').trim();
}

function pickByKeywords(value, options) {
  const text = normalizeKeyName(value);
  for (const option of options) {
    if (option.keywords.some((kw) => text.includes(kw))) {
      return option.label;
    }
  }
  return cleanText(value);
}

function buildSystemicNote(read) {
  const raw = trimValue(read('Note sistemiche'));
  if (!raw) return null;

  const lines = raw
    .split(/\r?\n|;/)
    .map((v) => cleanText(v))
    .filter(Boolean);

  if (!lines.length) return null;

  const picked = [];
  const others = [];

  const addUnique = (label) => {
    if (!picked.includes(label)) picked.push(label);
  };

  for (const line of lines) {
    const n = normalizeKeyName(line);

    if (n === 'nessuna' || n === 'nulla' || n === 'nn' || n === 'n' || n === 'no') continue;

    if (n.includes('allerg')) {
      const detail = cleanText(line.replace(/allergia a farmaci[:\s-]*/i, '').replace(/allergia a[:\s-]*/i, ''));
      addUnique(detail ? `Allergia a: ${detail}` : 'Allergia a:');
      continue;
    }
    if (n.includes('diabet')) {
      addUnique('Diabete');
      continue;
    }
    if (n.includes('neuropsich')) {
      addUnique('Disordini neuropsichiatrici');
      continue;
    }
    if (n.includes('autoimmun') || n.includes('infiammat')) {
      addUnique('Patologia autoimmune/infiammatoria');
      continue;
    }
    if (n.includes('neurolog')) {
      addUnique('Patologia neurologica');
      continue;
    }
    if (n.includes('respirat')) {
      addUnique('Patologia respiratoria');
      continue;
    }
    if (n.includes('ansios')) {
      addUnique('Paziente molto ansioso');
      continue;
    }
    if (n.includes('alfa-agon') || n.includes('alfa agon') || n.includes('tamsulosin')) {
      addUnique('Uso di alfa-agonisti');
      continue;
    }
    if (n.includes('antiaggreg') || n.includes('anticoagul')) {
      addUnique('Uso di antiaggreganti-anticoagulanti');
      continue;
    }

    others.push(line);
  }

  if (others.length) {
    addUnique(`Altro: ${others.join(', ')}`);
  }

  if (!picked.length) {
    return 'Nessuna';
  }

  return picked.join('; ');
}

function buildEyeNotes(read) {
  const parts = [];
  const seen = new Set();
  const addPart = (value) => {
    const v = cleanText(value);
    if (!v || seen.has(v)) return;
    seen.add(v);
    parts.push(v);
  };
  const noteFreeRaw = trimValue(read('Note'));
  const noteFree = cleanText(noteFreeRaw);
  const otherEyeOps = cleanText(read('altri interventi oculari'));

  const motility = cleanText(read('Motilità oculare'));
  if (motility) {
    const val = pickByKeywords(motility, [
      { label: 'Nistagmo', keywords: ['nistag'] },
      { label: 'Orbitopatia tiroidea', keywords: ['orbitop', 'tiroid'] },
      { label: 'Paresi', keywords: ['pares'] },
      { label: 'Strabismo ampio', keywords: ['strab'] },
    ]);
    addPart(`Problema di motilità: ${val}`);
  }

  const eyelid = cleanText(read('Palpebre'));
  if (eyelid) {
    const val = pickByKeywords(eyelid, [
      { label: 'Blefarospasmo', keywords: ['blefarospasm'] },
      { label: 'Ptosi severa', keywords: ['ptosi'] },
      { label: 'Rima stretta', keywords: ['rima'] },
    ]);
    addPart(`Problema palpebrale: ${val}`);
  }

  const corneal = cleanText(read('Cornea'));
  if (corneal) {
    const val = pickByKeywords(corneal, [
      { label: 'ECD bassa/Fuchs', keywords: ['fuchs', 'ecd', 'endotel'] },
      { label: 'KC avanzato', keywords: ['kc', 'cheratocono'] },
      { label: 'Neovasi', keywords: ['neovas'] },
      { label: 'Opacità centrale', keywords: ['opacit', 'leucom'] },
      { label: 'OSD severa', keywords: ['osd', 'occhio secco'] },
    ]);
    addPart(`Problema corneale: ${val}`);
  }

  const iris = cleanText(read('Iride pupilla'));
  if (iris) {
    const val = pickByKeywords(iris, [
      { label: 'IFIS probabile', keywords: ['ifis'] },
      { label: 'Iride atrofica', keywords: ['atrof'] },
      { label: 'Miosi', keywords: ['miosi'] },
      { label: 'PEX', keywords: ['pex', 'pseudoesf'] },
      { label: 'Sinechie', keywords: ['sinechi'] },
    ]);
    addPart(`Problema iride/pupilla: ${val}`);
  }

  const lens = cleanText(read('Cristallino'));
  if (lens) {
    const val = pickByKeywords(lens, [
      { label: 'Capsula fibrotica', keywords: ['capsula fibrot'] },
      { label: 'Cataratta ipermatura', keywords: ['ipermatur'] },
      { label: 'Cristallino voluminoso', keywords: ['voluminos'] },
      { label: 'Sublussazione', keywords: ['subluss'] },
      { label: 'Post traumatica', keywords: ['traumat'] },
    ]);
    addPart(`Problema cristallino: ${val}`);
  }

  const retina = cleanText(read('Retina'));
  if (retina) {
    const val = pickByKeywords(retina, [
      { label: 'DMLE', keywords: ['dmle', 'amd'] },
      { label: 'Maculopatia', keywords: ['macul'] },
      { label: 'Miopia elevata', keywords: ['miopia elevata', 'alta miopia'] },
      { label: 'Pregressa VVPP', keywords: ['vvpp', 'vitrect'] },
      { label: 'Retinopatia Diabetica', keywords: ['retinopatia diabet'] },
      { label: 'OVBCR', keywords: ['ovbcr', 'occlus'] },
    ]);
    addPart(`Problema retinico: ${val}`);
  }

  const combinedEyeText = `${noteFree} ${otherEyeOps}`.toLowerCase();
  if (combinedEyeText.includes('glaucoma')) addPart('Glaucoma');
  if (combinedEyeText.includes('osd')) addPart('OSD');

  if (otherEyeOps) {
    const low = otherEyeOps.toLowerCase();
    if (low.includes('trauma')) addPart('Pregresso trauma oculare');
    if (low.includes('refratt') || low.includes('lasik') || low.includes('prk')) {
      addPart('Pregressa chirurgia refrattiva');
    }
    if (low.includes('corne')) addPart('Pregressa chirurgia corneale');
    if (low.includes('vitreo') || low.includes('retin') || low.includes('vvpp')) {
      addPart('Pregressa chirurgia vitreo-retinica');
    }
  }

  const extraLines = [];
  if (noteFreeRaw) {
    const lines = noteFreeRaw.split(/\r?\n|;/).map((v) => cleanText(v)).filter(Boolean);
    for (const line of lines) {
      const low = line.toLowerCase();
      let recognized = false;

      if (low.includes('pregressa chirurgia vitreo-retinica') || low.includes('pregressa vvpp') || low.includes('vitreo-retin')) {
        addPart('Pregressa chirurgia vitreo-retinica');
        recognized = true;
      } else if (low.includes('pregressa chirurgia refratt') || low.includes('pregressa prk') || low.includes('pregressa lasik')) {
        addPart('Pregressa chirurgia refrattiva');
        recognized = true;
      } else if (low.includes('pregressa chirurgia corne')) {
        addPart('Pregressa chirurgia corneale');
        recognized = true;
      } else if (low.includes('pregresso trauma oculare') || low.includes('trauma oculare')) {
        addPart('Pregresso trauma oculare');
        recognized = true;
      } else if (low.includes('problema palpebrale')) {
        const specific = cleanText(line.replace(/problema\s+palpebrale\s*:?\s*/i, ''));
        addPart(specific ? `Problema palpebrale: ${specific}` : 'Problema palpebrale:');
        recognized = true;
      } else if (low.includes('problema corneale')) {
        const specific = cleanText(line.replace(/problema\s+corneale\s*:?\s*/i, ''));
        addPart(specific ? `Problema corneale: ${specific}` : 'Problema corneale:');
        recognized = true;
      } else if (low.includes('problema iride/pupilla') || low.includes('problema iride pupilla')) {
        const specific = cleanText(line.replace(/problema\s+iride\/?pupilla\s*:?\s*/i, ''));
        addPart(specific ? `Problema iride/pupilla: ${specific}` : 'Problema iride/pupilla:');
        recognized = true;
      } else if (low.includes('problema cristallino')) {
        const specific = cleanText(line.replace(/problema\s+cristallino\s*:?\s*/i, ''));
        addPart(specific ? `Problema cristallino: ${specific}` : 'Problema cristallino:');
        recognized = true;
      } else if (low.includes('problema retinico')) {
        const specific = cleanText(line.replace(/problema\s+retinico\s*:?\s*/i, ''));
        addPart(specific ? `Problema retinico: ${specific}` : 'Problema retinico:');
        recognized = true;
      } else if (low.includes('problema di motilità') || low.includes('problema di motilita')) {
        const specific = cleanText(line.replace(/problema\s+di\s+motilit[àa]\s*:?\s*/i, ''));
        addPart(specific ? `Problema di motilità: ${specific}` : 'Problema di motilità:');
        recognized = true;
      } else if (low.includes('glaucoma')) {
        addPart('Glaucoma');
        recognized = true;
      } else if (low === 'osd' || low.includes(' osd')) {
        addPart('OSD');
        recognized = true;
      }

      if (!recognized) {
        extraLines.push(line);
      }
    }
  }

  if (extraLines.length) addPart(`Altro: ${extraLines.join(', ')}`);

  return parts.join('; ');
}

function buildInterventionNotes(read) {
  // Keep noteIntervento aligned to CSV column AX only.
  return cleanText(read('note intervento'));
}

function estimateBirthDate(operationDateIso, ageValue) {
  const age = Number(trimValue(ageValue));
  if (!operationDateIso || !Number.isFinite(age) || age < 0 || age > 120) {
    return '1900-01-01';
  }
  const opDate = new Date(`${operationDateIso}T12:00:00`);
  if (Number.isNaN(opDate.getTime())) return '1900-01-01';
  opDate.setFullYear(opDate.getFullYear() - Math.round(age));
  return opDate.toISOString().slice(0, 10);
}

function loadRows(filePath) {
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  return XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
    raw: false,
    defval: '',
  });
}

function buildPatientProfiles(rows) {
  const byNormName = new Map();
  for (const row of rows) {
    const rawName = trimValue(row.Cognome);
    if (!rawName) continue;

    const normName = normalizeKeyName(rawName);
    const opDate = parseOperationDate(row['data intervento']);
    const age = trimValue(row.Eta);

    if (!byNormName.has(normName)) {
      byNormName.set(normName, {
        formattedName: formatPatientName(rawName),
        latestOperationDate: opDate,
        age,
      });
      continue;
    }

    const existing = byNormName.get(normName);
    if (opDate && (!existing.latestOperationDate || opDate > existing.latestOperationDate)) {
      existing.latestOperationDate = opDate;
      if (age) existing.age = age;
    } else if (!existing.age && age) {
      existing.age = age;
    }
  }
  return byNormName;
}

function inferDbPaths() {
  if (explicitDbPath) return [explicitDbPath];

  const candidatePaths = [
    path.join(projectRoot, 'iol-calculator-patient-data.sqlite'),
    path.join(os.homedir(), 'AppData', 'Roaming', 'IOL Power Calculator', 'database', 'iol-calculator-patient-data.sqlite'),
  ];

  return candidatePaths.filter((p, idx) => idx === 0 || fs.existsSync(p));
}

function toNullIfEmpty(v) {
  const t = trimValue(v);
  return t === '' ? null : t;
}

function parseNumberLoose(v) {
  const t = trimValue(v).replace(',', '.');
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

function formatNumberForDb(n, digits = 2) {
  const fixed = n.toFixed(digits);
  return fixed.replace(/\.?0+$/, '');
}

function scaledDecimal(v, threshold, divisor = 100) {
  const n = parseNumberLoose(v);
  if (n === null) return null;
  const abs = Math.abs(n);
  const scaled = abs >= threshold ? n / divisor : n;
  return formatNumberForDb(scaled, 2);
}

function normalizeBiometryDecimals(db) {
  const updates = [
    { col: 'cso_avgKm', threshold: 100 },
    { col: 'tomey_avgKm', threshold: 100 },
    { col: 'argos_avgKm', threshold: 100 },
    { col: 'cilTotal', threshold: 20 },
    { col: 'tomey_cilTotal', threshold: 20 },
    { col: 'argos_cilTotal', threshold: 20 },
    { col: 'cso_cil', threshold: 20 },
    { col: 'tomey_cil', threshold: 20 },
    { col: 'argos_cil', threshold: 20 },
    { col: 'cso_AXL', threshold: 100 },
    { col: 'tomey_AXL', threshold: 100 },
    { col: 'argos_AXL', threshold: 100 },
    { col: 'cso_ACD', threshold: 20 },
    { col: 'tomey_ACD', threshold: 20 },
    { col: 'argos_ACD', threshold: 20 },
    { col: 'cso_LT', threshold: 20 },
    { col: 'tomey_LT', threshold: 20 },
    { col: 'argos_LT', threshold: 20 },
  ];

  for (const { col, threshold } of updates) {
    db.exec(`
      UPDATE operations
      SET ${col} = CAST(ROUND(CAST(${col} AS REAL) / 100.0, 2) AS TEXT)
      WHERE ${col} IS NOT NULL
        AND TRIM(${col}) != ''
        AND ABS(CAST(${col} AS REAL)) >= ${threshold}
    `);
  }
}

function importIntoDatabase(dbPath, rows, profiles) {
  const db = new DatabaseSync(dbPath);
  db.exec('PRAGMA foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS patients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      dateOfBirth TEXT NOT NULL,
      gender TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      deletedAt TEXT NULL
    )
  `);

  const getPatientStmt = db.prepare(`
    SELECT id
    FROM patients
    WHERE name = ? AND dateOfBirth = ? AND deletedAt IS NULL
    LIMIT 1
  `);

  const insertPatientStmt = db.prepare(`
    INSERT INTO patients (name, dateOfBirth, gender, createdAt, updatedAt, deletedAt)
    VALUES (?, ?, ?, ?, ?, NULL)
  `);

  const insertOperationStmt = db.prepare(`
    INSERT INTO operations (
      operationDate, patientId, age, eye,
      interventoDi, costo, noteIntervento, noteSistemic, noteEye, cellEndotelio,
      bcdva_sph, bcdva_cyl, bcdva_ax, bcdva_va, refSf, target, contralateralEye,
      cso_avgKm, cilTotal, cso_cil, cso_ax, cso_AXL, cso_ACD, cso_LT,
      tomey_avgKm, tomey_cilTotal, tomey_cil, tomey_ax, tomey_AXL, tomey_ACD, tomey_LT,
      argos_avgKm, argos_cilTotal, argos_cil, argos_ax, argos_AXL, argos_ACD, argos_LT,
      iol_argos_barrett_res, iol_tomey_barrett_res, iol_evo2_res, iol_hoffer_qst_res, iol_kane_res, iol_pearl_dgs_res,
      iol_argos_barrett_toric_res, iol_argos_barrett_toric_t, iol_argos_barrett_toric_axis,
      iol_tomey_barrett_toric_res, iol_tomey_barrett_toric_t, iol_tomey_barrett_toric_axis,
      iol_evo_toric_res, iol_evo_toric, iol_evo_toric_rescyl,
      iol_hoffer_qst_toric_res, iol_hoffer_qst_toric, iol_hoffer_qst_toric_rescyl,
      iol_kane_toric_res, iol_kane_toric, iol_kane_toric_rescyl,
      iol_argos_barrett_tk_res, iol_tomey_barrett_tk_res, iol_tomey_oculix_res,
      iol_ray_tracing_res, iol_evo2_post_res, iol_pearl_dgs_post_res,
      tunnel, iolModelSelected, iolT, iolAx, iolPower,
      linkedOperationId, createdAt, updatedAt, deletedAt
    )
    VALUES (
      ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?,
      ?, ?, ?,
      ?, ?, ?,
      ?, ?, ?,
      ?, ?, ?,
      ?, ?, ?,
      ?, ?, ?,
      ?, ?, ?,
      ?, ?, ?, ?, ?,
      NULL, ?, ?, NULL
    )
  `);

  const countPatientsStmt = db.prepare('SELECT COUNT(*) AS n FROM patients WHERE deletedAt IS NULL');
  const countOperationsStmt = db.prepare('SELECT COUNT(*) AS n FROM operations WHERE deletedAt IS NULL');

  const now = new Date().toISOString();
  let addedPatients = 0;
  let addedOperations = 0;
  let skippedOperations = 0;

  const patientIdByName = new Map();

  db.exec('BEGIN');
  try {
    // Full refresh requested: replace current app data with CSV data.
    db.exec('DELETE FROM operations');
    db.exec('DELETE FROM patients');

    // Insert patients first
    for (const [normName, profile] of profiles.entries()) {
      const dateOfBirth = estimateBirthDate(profile.latestOperationDate, profile.age);
      const existing = getPatientStmt.get(profile.formattedName, dateOfBirth);
      let patientId = existing?.id;
      if (!patientId) {
        const res = insertPatientStmt.run(profile.formattedName, dateOfBirth, '', now, now);
        patientId = Number(res.lastInsertRowid);
      }
      addedPatients += 1;
      patientIdByName.set(normName, patientId);
    }

    // Insert operations
    for (const row of rows) {
      const rawName = trimValue(row.Cognome);
      if (!rawName) continue;
      const normName = normalizeKeyName(rawName);
      const patientId = patientIdByName.get(normName);
      if (!patientId) continue;

      const read = (key) => trimValue(row[key]);
      const opDate = parseOperationDate(read('data intervento'));
      const eyes = expandEyes(read('occhio'));
      if (!opDate || !eyes.length) continue;

      const noteEye = buildEyeNotes(read);
      const noteSistemic = buildSystemicNote(read);
      const noteIntervento = buildInterventionNotes(read);

      for (const eye of eyes) {
        const csoAvgKm = scaledDecimal(read('Km ms39'), 100);
        const csoCilTot = scaledDecimal(read('Astig'), 20);
        const csoCil = scaledDecimal(read('cil 1 Copia')) ?? scaledDecimal(read('cilindro'), 20);
        const csoAxl = scaledDecimal(read('AXL ms39'), 100);
        const csoAcd = scaledDecimal(read('ACD MS'), 20);
        const csoLt = scaledDecimal(read('LT CSO'), 20);

        const tomeyAvgKm = scaledDecimal(read('Km tomey'), 100);
        const tomeyCilTot = scaledDecimal(read('Ast 2'), 20);
        const tomeyCil = scaledDecimal(read('Ast 2'), 20);
        const tomeyAxl = scaledDecimal(read('Axl Copia2'), 100);
        const tomeyAcd = scaledDecimal(read('ACD Copia2'), 20);
        const tomeyLt = scaledDecimal(read('LT Copia'), 20);

        const argosAvgKm = scaledDecimal(read('Km argos'), 100);
        const argosCilTot = scaledDecimal(read('Ast 1'), 20);
        const argosCil = scaledDecimal(read('Ast 1'), 20);
        const argosAxl = scaledDecimal(read('Axl'), 100);
        const argosAcd = scaledDecimal(read('ACD Copia'), 20);
        const argosLt = scaledDecimal(read('LT'), 20);

        insertOperationStmt.run(
          opDate, patientId, toNullIfEmpty(read('Eta')), eye,
          toNullIfEmpty(read('tipo di intervento')) || 'Faco + IOL',
          toNullIfEmpty(read('Costo int')),
          toNullIfEmpty(noteIntervento),
          toNullIfEmpty(noteSistemic),
          toNullIfEmpty(noteEye),
          toNullIfEmpty(read('cellule endot')),
          toNullIfEmpty(read('sfera')),
          toNullIfEmpty(read('cilindro')),
          toNullIfEmpty(read('asse')),
          toNullIfEmpty(read('decimi')),
          toNullIfEmpty(read('RR')),
          toNullIfEmpty(read('Target')),
          toNullIfEmpty(read('Occhio controlaterale')),
          csoAvgKm,
          csoCilTot,
          csoCil,
          toNullIfEmpty(read('Asse 1')) || toNullIfEmpty(read('asse')),
          csoAxl,
          csoAcd,
          csoLt,
          tomeyAvgKm,
          tomeyCilTot,
          tomeyCil,
          toNullIfEmpty(read('Asse 2')),
          tomeyAxl,
          tomeyAcd,
          tomeyLt,
          argosAvgKm,
          argosCilTot,
          argosCil,
          toNullIfEmpty(read('asse 3')),
          argosAxl,
          argosAcd,
          argosLt,
          toNullIfEmpty(read('residuo1')) || toNullIfEmpty(read('res ref2')),
          toNullIfEmpty(read('residuo')) || toNullIfEmpty(read('res ref3')),
          toNullIfEmpty(read('Evo 2.0 cso')),
          toNullIfEmpty(read('res r')),
          toNullIfEmpty(read('res r Copia')),
          toNullIfEmpty(read('pearl cso')),
          toNullIfEmpty(read('residuo tomey toric')),
          toNullIfEmpty(read('t2')),
          toNullIfEmpty(read('asee t2')),
          toNullIfEmpty(read('res ref Copia2')),
          toNullIfEmpty(read('t3')),
          toNullIfEmpty(read('asse t3')),
          toNullIfEmpty(read('res ref Copia4')),
          toNullIfEmpty(read('T')),
          toNullIfEmpty(read('ax iol')),
          toNullIfEmpty(read('res ref Copia5')),
          toNullIfEmpty(read('T Copia')),
          toNullIfEmpty(read('Asse 5')),
          toNullIfEmpty(read('res ref2')),
          toNullIfEmpty(read('T fin')),
          toNullIfEmpty(read('Asse 5 Copia')),
          toNullIfEmpty(read('res ref3')),
          toNullIfEmpty(read('res r Copia2')),
          toNullIfEmpty(read('residuo')),
          toNullIfEmpty(read('res r')),
          toNullIfEmpty(read('RR Copia3')),
          toNullIfEmpty(read('RR Copia4')),
          toNullIfEmpty(read('Asse tunnel')),
          toNullIfEmpty(read('modello iol')) || toNullIfEmpty(read('iol')),
          toNullIfEmpty(read('T')) || toNullIfEmpty(read('T fin')),
          toNullIfEmpty(read('ax iol')) || toNullIfEmpty(read('asse t3')),
          toNullIfEmpty(read('p1')),
          now, now,
        );

        addedOperations += 1;
      }
    }

    // Link OD/OS pairs by patient and date
    db.exec(`
      UPDATE operations AS od
      SET linkedOperationId = (
        SELECT os.id
        FROM operations AS os
        WHERE os.patientId = od.patientId
          AND os.operationDate = od.operationDate
          AND os.eye = 'OS'
          AND os.deletedAt IS NULL
          AND od.eye = 'OD'
        LIMIT 1
      )
      WHERE od.eye = 'OD' AND od.deletedAt IS NULL
    `);
    db.exec(`
      UPDATE operations AS os
      SET linkedOperationId = (
        SELECT od.id
        FROM operations AS od
        WHERE od.patientId = os.patientId
          AND od.operationDate = os.operationDate
          AND od.eye = 'OD'
          AND od.deletedAt IS NULL
          AND os.eye = 'OS'
        LIMIT 1
      )
      WHERE os.eye = 'OS' AND os.deletedAt IS NULL
    `);

    normalizeBiometryDecimals(db);

    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    db.close();
    throw err;
  }

  const totalPatients = Number(countPatientsStmt.get().n);
  const totalOperations = Number(countOperationsStmt.get().n);
  db.close();

  return {
    dbPath,
    addedPatients,
    addedOperations,
    skippedOperations,
    totalPatients,
    totalOperations,
  };
}

const rows = loadRows(csvPath);
const profiles = buildPatientProfiles(rows);
const dbPaths = inferDbPaths();

if (!dbPaths.length) {
  console.error('No target DB path found.');
  process.exit(1);
}

console.log(`CSV rows: ${rows.length}`);
console.log(`Unique patient names: ${profiles.size}`);
console.log('');

for (const dbPath of dbPaths) {
  const result = importIntoDatabase(dbPath, rows, profiles);
  console.log(`Database: ${result.dbPath}`);
  console.log(`  Added patients: ${result.addedPatients}`);
  console.log(`  Added operations: ${result.addedOperations}`);
  console.log(`  Skipped existing operations: ${result.skippedOperations}`);
  console.log(`  Total patients: ${result.totalPatients}`);
  console.log(`  Total operations: ${result.totalOperations}`);
  console.log('');
}
