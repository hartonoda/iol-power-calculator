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
import { formatCostoImport, formatVisus } from '../src/utils/numberUtils.js';

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
      const detail = cleanText(line.replace(/disordini neuropsichiatrici[:\s-]*/i, ''));
      addUnique(detail ? `Disordini neuropsichiatrici: ${detail}` : 'Disordini neuropsichiatrici:');
      continue;
    }
    if (n.includes('autoimmun') || n.includes('infiammat')) {
      const detail = cleanText(line.replace(/patologia autoimmune\/infiammatoria[:\s-]*/i, ''));
      addUnique(detail ? `Patologia autoimmune/infiammatoria: ${detail}` : 'Patologia autoimmune/infiammatoria:');
      continue;
    }
    if (n.includes('neurolog')) {
      const detail = cleanText(line.replace(/patologia neurologica[:\s-]*/i, ''));
      addUnique(detail ? `Patologia neurologica: ${detail}` : 'Patologia neurologica:');
      continue;
    }
    if (n.includes('respirat')) {
      const detail = cleanText(line.replace(/patologia respiratoria[:\s-]*/i, ''));
      addUnique(detail ? `Patologia respiratoria: ${detail}` : 'Patologia respiratoria:');
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

/** FileMaker often stores diopters ×100 (e.g. -209 → -2.09). */
function scaleIolResidual(v) {
  return scaledDecimal(v, 10);
}

function firstCsvValue(read, ...keys) {
  for (const key of keys) {
    const t = trimValue(read(key));
    if (t !== '') return t;
  }
  return '';
}

function mapCostoFromCsv(read) {
  const raw = trimValue(read('Costo int'));
  if (raw === '' || raw === '0') return 'Assic';
  return formatCostoImport(raw) || null;
}

/**
 * IOL calculation columns from valutazione.csv (FileMaker export).
 * Toric layout verified against genovesi maurizio OD sample.
 */
function csvFieldPresent(read, key) {
  return trimValue(read(key)) !== '';
}

/** FileMaker `residuo` as compact toric residual (e.g. 2 → +0.02), not large sferica-scale values. */
function isCompactToricResidual(read, key = 'residuo') {
  const n = parseNumberLoose(read(key));
  if (n === null) return false;
  const abs = Math.abs(n);
  return abs > 0 && abs < 10;
}

/** `residuo` toric column stores hundredths when value is a small integer (2 → 0.02). */
function scaleEvoToricResiduo(v) {
  const n = parseNumberLoose(v);
  if (n === null) return null;
  const abs = Math.abs(n);
  if (abs >= 1 && Number.isInteger(n)) {
    return formatNumberForDb(n / 100, 2);
  }
  return formatNumberForDb(n, 2);
}

function mapIolFromCsv(read) {
  const res = (...keys) => {
    const v = firstCsvValue(read, ...keys);
    return v ? scaleIolResidual(v) : null;
  };
  const raw = (...keys) => toNullIfEmpty(firstCsvValue(read, ...keys));
  const resWhen = (trigger, ...keys) => (csvFieldPresent(read, trigger) ? res(...keys) : null);
  const rawWhen = (trigger, ...keys) => (csvFieldPresent(read, trigger) ? raw(...keys) : null);

  const evoToricFromResRef2 = csvFieldPresent(read, 'res ref2');
  const evoToricFromResiduo = !evoToricFromResRef2 && isCompactToricResidual(read);
  const evoToricActive = evoToricFromResRef2 || evoToricFromResiduo;

  return {
    // IOL sferica (e.g. 8 favali cristina OS): res r Copia → Argos, res r Copia2 → Tomey,
    // res ref Copia2 → Evo, res ref Copia4 → Hoffer, res ref Copia5 → Kane, res r → Pearl
    iol_argos_barrett_res: res('res r Copia'),
    iol_tomey_barrett_res: res('res r Copia2'),
    iol_evo2_res: res('res ref Copia2', 'Evo 2.0 cso'),
    iol_hoffer_qst_res: res('res ref Copia4'),
    iol_kane_res: res('res ref Copia5'),
    iol_pearl_dgs_res: res('res r', 'pearl cso'),

    // Toric rows only when FileMaker toric residual columns exist (avoid biometry axes like Asse 2)
    iol_argos_barrett_toric_res: resWhen('residuo tomey toric', 'residuo tomey toric'),
    iol_argos_barrett_toric_t: rawWhen('residuo tomey toric', 'T Copia', 'T4'),
    iol_argos_barrett_toric_axis: rawWhen('residuo tomey toric', 'asee t2', 'asse7'),

    iol_tomey_barrett_toric_res: resWhen('residuo1', 'residuo1'),
    iol_tomey_barrett_toric_t: rawWhen('residuo1', 'T4', 'T Copia'),
    iol_tomey_barrett_toric_axis: rawWhen('residuo1', 'Asse 5 Copia', 'asse t3'),

    iol_evo_toric_res: evoToricActive
      ? (evoToricFromResRef2
        ? res('res ref2')
        : toNullIfEmpty(scaleEvoToricResiduo(firstCsvValue(read, 'residuo'))))
      : null,
    iol_evo_toric: evoToricActive ? raw('T') : null,
    iol_evo_toric_rescyl: evoToricActive
      ? (evoToricFromResRef2 ? raw('Asse 2', 'Asse 5') : raw('Asse 5', 'Asse 2'))
      : null,

    iol_hoffer_qst_toric_res: resWhen('res ref2', 'res ref2'),
    iol_hoffer_qst_toric: rawWhen('res ref2', 't2'),
    iol_hoffer_qst_toric_rescyl: rawWhen('res ref2', 'asee t2', 'asse7'),

    iol_kane_toric_res: resWhen('res ref3', 'res ref3'),
    iol_kane_toric: rawWhen('res ref3', 't3'),
    iol_kane_toric_rescyl: rawWhen('res ref3', 'asse t3'),

    // IOL post LVC (e.g. bondani giorgio OS): RR Copia3 → Argos TK, res r Copia → Tomey TK,
    // RR Copia → Oculix, RR Copia4 → Ray tracing
    iol_argos_barrett_tk_res: resWhen('RR Copia3', 'RR Copia3'),
    iol_tomey_barrett_tk_res: resWhen('RR Copia3', 'res r Copia'),
    iol_tomey_oculix_res: resWhen('RR Copia', 'RR Copia'),
    iol_ray_tracing_res: resWhen('RR Copia4', 'RR Copia4'),
    iol_evo2_post_res: null,
    iol_pearl_dgs_post_res: null,

    tunnel: raw('Asse tunnel'),
    iolModelSelected: raw('modello iol', 'iol'),
    // Footer T/ast and AX IOL (model section) — not per-formula toric T/axis columns
    iolT: raw('T fin'),
    iolAx: raw('ax iol'),
    iolPower: raw('p1'),
  };
}

/**
 * FileMaker valutazione.csv biometry layout (per device):
 * - CSO: Km ms39, Astig (cil. tot.), Ast 2 (cil.), asse 3 (Ax), AXL ms39, ACD MS, LT CSO
 * - Tomey: Km tomey, cil 1 Copia (cil.), Asse 4 Copia (Ax), Axl, ACD Copia, LT
 * - Argos: Km argos, Ast 1 (cil.), Asse 1 (Ax), Axl Copia2, ACD Copia2, LT Copia
 * - Total axis (CSO TK): Asse 2
 */
function mapBiometryFromCsv(read) {
  return {
    cso_avgKm: scaledDecimal(read('Km ms39'), 100),
    cilTotal: scaledDecimal(read('Astig'), 20),
    axConclusion: toNullIfEmpty(read('Asse 2')),
    cso_cil: scaledDecimal(read('Ast 2'), 20),
    cso_ax: toNullIfEmpty(read('asse 3')),
    cso_AXL: scaledDecimal(read('AXL ms39'), 100),
    cso_ACD: scaledDecimal(read('ACD MS'), 20),
    cso_LT: scaledDecimal(read('LT CSO'), 20),

    tomey_avgKm: scaledDecimal(read('Km tomey'), 100),
    tomey_cilTotal: null,
    tomey_cil: scaledDecimal(read('cil 1 Copia'), 20),
    tomey_ax: toNullIfEmpty(read('Asse 4 Copia')) || toNullIfEmpty(read('Asse 4')),
    tomey_AXL: scaledDecimal(read('Axl'), 100),
    tomey_ACD: scaledDecimal(read('ACD Copia'), 20),
    tomey_LT: scaledDecimal(read('LT'), 20),

    argos_avgKm: scaledDecimal(read('Km argos'), 100),
    argos_cilTotal: null,
    argos_cil: scaledDecimal(read('Ast 1'), 20),
    argos_ax: toNullIfEmpty(read('Asse 1')),
    argos_AXL: scaledDecimal(read('Axl Copia2'), 100),
    argos_ACD: scaledDecimal(read('ACD Copia2'), 20),
    argos_LT: scaledDecimal(read('LT Copia'), 20),
  };
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
      cso_avgKm, cilTotal, axConclusion, cso_cil, cso_ax, cso_AXL, cso_ACD, cso_LT,
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
      ?, ?, ?, ?, ?, ?, ?, ?,
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
        const bio = mapBiometryFromCsv(read);

        const iol = mapIolFromCsv(read);

        insertOperationStmt.run(
          opDate, patientId, toNullIfEmpty(read('Eta')), eye,
          toNullIfEmpty(read('tipo di intervento')) || 'Faco + IOL',
          mapCostoFromCsv(read),
          toNullIfEmpty(noteIntervento),
          toNullIfEmpty(noteSistemic),
          toNullIfEmpty(noteEye),
          toNullIfEmpty(read('cellule endot')),
          toNullIfEmpty(read('sfera')),
          toNullIfEmpty(read('cilindro')),
          toNullIfEmpty(read('asse')),
          formatVisus(read('decimi')) || null,
          toNullIfEmpty(read('RR')),
          toNullIfEmpty(read('Target')),
          toNullIfEmpty(read('Occhio controlaterale')),
          bio.cso_avgKm,
          bio.cilTotal,
          bio.axConclusion,
          bio.cso_cil,
          bio.cso_ax,
          bio.cso_AXL,
          bio.cso_ACD,
          bio.cso_LT,
          bio.tomey_avgKm,
          bio.tomey_cilTotal,
          bio.tomey_cil,
          bio.tomey_ax,
          bio.tomey_AXL,
          bio.tomey_ACD,
          bio.tomey_LT,
          bio.argos_avgKm,
          bio.argos_cilTotal,
          bio.argos_cil,
          bio.argos_ax,
          bio.argos_AXL,
          bio.argos_ACD,
          bio.argos_LT,
          iol.iol_argos_barrett_res,
          iol.iol_tomey_barrett_res,
          iol.iol_evo2_res,
          iol.iol_hoffer_qst_res,
          iol.iol_kane_res,
          iol.iol_pearl_dgs_res,
          iol.iol_argos_barrett_toric_res,
          iol.iol_argos_barrett_toric_t,
          iol.iol_argos_barrett_toric_axis,
          iol.iol_tomey_barrett_toric_res,
          iol.iol_tomey_barrett_toric_t,
          iol.iol_tomey_barrett_toric_axis,
          iol.iol_evo_toric_res,
          iol.iol_evo_toric,
          iol.iol_evo_toric_rescyl,
          iol.iol_hoffer_qst_toric_res,
          iol.iol_hoffer_qst_toric,
          iol.iol_hoffer_qst_toric_rescyl,
          iol.iol_kane_toric_res,
          iol.iol_kane_toric,
          iol.iol_kane_toric_rescyl,
          iol.iol_argos_barrett_tk_res,
          iol.iol_tomey_barrett_tk_res,
          iol.iol_tomey_oculix_res,
          iol.iol_ray_tracing_res,
          iol.iol_evo2_post_res,
          iol.iol_pearl_dgs_post_res,
          iol.tunnel,
          iol.iolModelSelected,
          iol.iolT,
          iol.iolAx,
          iol.iolPower,
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
