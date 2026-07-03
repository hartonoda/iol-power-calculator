import { ipcMain } from 'electron';
import { VALUTAZIONE_DB_FIELDS } from '../config/valutazioneSchema.js';

const SHARED_SMARTIOL_OPERATION_FIELDS = new Set([
  'operationDate',
  'age',
  'eye',
  'interventoDi',
  'costo',
  'noteIntervento',
  'noteSistemic',
  'noteEye',
  'cellEndotelio',
  'cellEndotelioNote',
  'bcdva_sph',
  'bcdva_cyl',
  'bcdva_ax',
  'bcdva_va',
  'refSf',
  'target',
  'cso_avgKm',
  'cilTotal',
  'axConclusion',
  'cso_cil',
  'cso_ax',
  'cso_AXL',
  'cso_ACD',
  'cso_LT',
  'iol_evo2_res',
  'iol_hoffer_qst_res',
  'iol_kane_res',
  'iol_pearl_dgs_res',
  'iol_evo_toric_res',
  'iol_evo_toric',
  'iol_evo_toric_rescyl',
  'compat_monofocale_standard',
  'compat_monofocale_plus',
  'compat_edof',
  'compat_multifocal',
  'iol_hoffer_qst_toric_res',
  'iol_hoffer_qst_toric',
  'iol_hoffer_qst_toric_rescyl',
  'iol_kane_toric_res',
  'iol_kane_toric',
  'iol_kane_toric_rescyl',
  'iol_ray_tracing_res',
  'iol_evo2_post_res',
  'iol_pearl_dgs_post_res',
  'iolModelSelected',
]);

const DUPLICATE_PERCENTAGE_FIELDS = [
  'compat_monofocale_standard',
  'compat_monofocale_plus',
  'compat_edof',
  'compat_multifocal',
];

function normalizeEye(eye) {
  const v = String(eye || '').trim().toUpperCase();
  if (v === 'OD' || v === 'OS' || v === 'OU') return v;
  return '';
}

function splitNoteParts(raw) {
  return String(raw || '')
    .replace(/\r/g, '\n')
    .split(/[;\n]+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function extractAfterKeyword(part, keywordRegex) {
  const match = part.match(keywordRegex);
  if (!match) return '';
  const tail = part.slice(match.index + match[0].length).replace(/^[:\s-]+/, '').trim();
  return tail;
}

function formatCompatibilityPercent(value) {
  if (value == null) return '';
  const raw = String(value).trim();
  if (!raw) return '';
  if (/valut/i.test(raw)) return raw;
  const normalized = raw.replace('%', '').trim().replace(',', '.');
  const n = Number(normalized);
  if (!Number.isFinite(n)) return raw;
  return `${n.toFixed(1)} %`;
}

function mapSystemicNoteFromSmartIol(raw) {
  const parts = splitNoteParts(raw);
  if (!parts.length) return '';
  const mapped = [];
  const other = [];
  const addUnique = (value) => {
    if (value && !mapped.includes(value)) mapped.push(value);
  };

  for (const part of parts) {
    const lower = part.toLowerCase();
    if (lower === 'nessuna' || lower === 'none') {
      addUnique('Nessuna');
      continue;
    }
    if (lower.includes('allerg')) {
      const detail = extractAfterKeyword(part, /allerg(y|ia)?\s*(a)?/i);
      addUnique(detail ? `Allergia a: ${detail}` : 'Allergia a:');
      continue;
    }
    if (lower.includes('diabet')) {
      addUnique('Diabete');
      continue;
    }
    if (lower.includes('neuropsich') || lower.includes('neuropsychi')) {
      const detail = extractAfterKeyword(part, /(neuropsichiatrici?|neuropsychiatric)/i);
      addUnique(detail ? `Disordini neuropsichiatrici: ${detail}` : 'Disordini neuropsichiatrici:');
      continue;
    }
    if (lower.includes('autoimmun') || lower.includes('infiamm')) {
      const detail = extractAfterKeyword(part, /(autoimmune|infiammatori[ao]?)/i);
      addUnique(detail ? `Patologia autoimmune/infiammatoria: ${detail}` : 'Patologia autoimmune/infiammatoria:');
      continue;
    }
    if (lower.includes('neurolog')) {
      const detail = extractAfterKeyword(part, /neurologic[ao]?/i);
      addUnique(detail ? `Patologia neurologica: ${detail}` : 'Patologia neurologica:');
      continue;
    }
    if (lower.includes('respirat')) {
      const detail = extractAfterKeyword(part, /respiratori[ao]?/i);
      addUnique(detail ? `Patologia respiratoria: ${detail}` : 'Patologia respiratoria:');
      continue;
    }
    if (lower.includes('ansios')) {
      addUnique('Paziente molto ansioso');
      continue;
    }
    if (lower.includes('alfa') || lower.includes('alpha')) {
      addUnique('Uso di alfa-agonisti');
      continue;
    }
    if (lower.includes('antiaggreg') || lower.includes('anticoag')) {
      addUnique('Uso di antiaggreganti-anticoagulanti');
      continue;
    }
    other.push(part);
  }

  if (other.length) {
    addUnique(`Altro: ${other.join(' / ')}`);
  }
  return mapped.join('; ');
}

function mapEyeNoteFromSmartIol(raw) {
  const parts = splitNoteParts(raw);
  if (!parts.length) return '';
  const mapped = [];
  const other = [];
  const addUnique = (value) => {
    if (value && !mapped.includes(value)) mapped.push(value);
  };

  for (const part of parts) {
    const lower = part.toLowerCase();
    if (lower === 'nessuna' || lower === 'none') {
      addUnique('Nessuna');
      continue;
    }
    if (lower.includes('trauma')) {
      addUnique('Pregresso trauma oculare');
      continue;
    }
    if (lower.includes('refratt') || lower.includes('refractive')) {
      addUnique('Pregressa chirurgia refrattiva');
      continue;
    }
    if (lower.includes('chirurgia corne') || lower.includes('corneal surg')) {
      addUnique('Pregressa chirurgia corneale');
      continue;
    }
    if (lower.includes('vitreo') || lower.includes('retin') && lower.includes('surg')) {
      addUnique('Pregressa chirurgia vitreo-retinica');
      continue;
    }
    if (lower.includes('motilit')) {
      const detail = extractAfterKeyword(part, /motilit[aà]|motility/i);
      addUnique(detail ? `Problema di motilità: ${detail}` : 'Problema di motilità:');
      continue;
    }
    if (lower.includes('palpebr') || lower.includes('eyelid')) {
      const detail = extractAfterKeyword(part, /palpebral[e]?|eyelid/i);
      addUnique(detail ? `Problema palpebrale: ${detail}` : 'Problema palpebrale:');
      continue;
    }
    if (lower.includes('cornea') || lower.includes('corneal')) {
      const detail = extractAfterKeyword(part, /corneal|corneal[e]?/i);
      addUnique(detail ? `Problema corneale: ${detail}` : 'Problema corneale:');
      continue;
    }
    if (lower.includes('iride') || lower.includes('pupil')) {
      const detail = extractAfterKeyword(part, /iride|pupilla|pupil/i);
      addUnique(detail ? `Problema iride/pupilla: ${detail}` : 'Problema iride/pupilla:');
      continue;
    }
    if (lower.includes('cristall') || lower.includes('lens')) {
      const detail = extractAfterKeyword(part, /cristallino|lens/i);
      addUnique(detail ? `Problema cristallino: ${detail}` : 'Problema cristallino:');
      continue;
    }
    if (lower.includes('retin')) {
      const detail = extractAfterKeyword(part, /retinic[oa]?|retinal/i);
      addUnique(detail ? `Problema retinico: ${detail}` : 'Problema retinico:');
      continue;
    }
    if (lower.includes('glaucoma')) {
      addUnique('Glaucoma');
      continue;
    }
    if (lower.includes('osd')) {
      addUnique('OSD');
      continue;
    }
    other.push(part);
  }

  if (other.length) {
    addUnique(`Altro: ${other.join(' / ')}`);
  }
  return mapped.join('; ');
}

function findOperationId(operationRepo, patientId, operationDate, eye) {
  if (!patientId || !operationDate || !eye) return null;
  const row = operationRepo.db.prepare(`
    SELECT id
    FROM operations
    WHERE patientId = ?
      AND operationDate = ?
      AND eye = ?
      AND deletedAt IS NULL
    LIMIT 1
  `).get(patientId, operationDate, eye);
  return row?.id ? Number(row.id) : null;
}

function updateDuplicatePercentageOnly(operationRepo, operationId, mapped) {
  if (!operationId) return { success: false };
  const existing = operationRepo.db.prepare(`
    SELECT noteSistemic, noteEye
    FROM operations
    WHERE id = ?
  `).get(operationId);
  const sets = [];
  const values = [];
  for (const field of DUPLICATE_PERCENTAGE_FIELDS) {
    const value = mapped[field];
    if (value == null || value === '') continue;
    sets.push(`${field} = ?`);
    values.push(value);
  }
  // Preserve existing clinical data for duplicates, but if notes are empty locally
  // we can safely hydrate them from SmartIOL import.
  if (mapped.noteSistemic && !(existing?.noteSistemic || '').trim()) {
    sets.push('noteSistemic = ?');
    values.push(mapped.noteSistemic);
  }
  if (mapped.noteEye && !(existing?.noteEye || '').trim()) {
    sets.push('noteEye = ?');
    values.push(mapped.noteEye);
  }
  if (!sets.length) return { success: true, updated: 0 };

  sets.push('updatedAt = ?');
  values.push(new Date().toISOString(), operationId);
  operationRepo.db.prepare(`
    UPDATE operations
    SET ${sets.join(', ')}
    WHERE id = ?
  `).run(...values);
  return { success: true, updated: 1 };
}

function mapSmartIolOperation(source, patientId) {
  const mapped = { patientId };
  for (const field of VALUTAZIONE_DB_FIELDS) {
    if (field === 'patientId') continue;
    if (field === 'interventoDi') {
      mapped[field] = source.interventoDi || 'Faco + IOL';
      continue;
    }
    if (field === 'noteIntervento') {
      mapped[field] = source.noteIntervento || source.noteIOLType || '';
      continue;
    }
    if (field === 'eye') {
      mapped[field] = normalizeEye(source.eye);
      continue;
    }
    if (SHARED_SMARTIOL_OPERATION_FIELDS.has(field) && source[field] != null) {
      mapped[field] = source[field];
      continue;
    }
    mapped[field] = '';
  }

  // Fallback: if source provides combined BCDVA text, parse into sph/cyl/ax/va.
  const combinedBcdva = String(
    source.BCDVA || source.bcdva || source.bcvda || source.BCVDA || '',
  ).trim();
  const hasStructuredBcdva = mapped.bcdva_sph || mapped.bcdva_cyl || mapped.bcdva_ax || mapped.bcdva_va;
  if (combinedBcdva && !hasStructuredBcdva) {
    const sphMatch = combinedBcdva.match(/(?:sf|sph)\s*[:=]?\s*([+-]?\d+(?:[.,]\d+)?)/i);
    const cylMatch = combinedBcdva.match(/(?:cil|cyl)\s*[:=]?\s*([+-]?\d+(?:[.,]\d+)?)/i);
    const axMatch = combinedBcdva.match(/(?:ax|asse)\s*[:=]?\s*(\d{1,3})/i);
    const vaMatch = combinedBcdva.match(/(?:va|visus)\s*[:=]?\s*([0-9]+\/10)/i);
    if (sphMatch) mapped.bcdva_sph = sphMatch[1].replace(',', '.');
    if (cylMatch) mapped.bcdva_cyl = cylMatch[1].replace(',', '.');
    if (axMatch) mapped.bcdva_ax = axMatch[1];
    if (vaMatch) mapped.bcdva_va = vaMatch[1];
  }

  // Compatibility columns can come from different SmartIOL schema variants:
  // - compat_monofocale_standard / ...
  // - iol_compat_monofocale_standard / ...
  // Also handle multifocale vs multifocal naming.
  const compatSource = {
    compat_monofocale_standard:
      source.compat_monofocale_standard ?? source.iol_compat_monofocale_standard,
    compat_monofocale_plus:
      source.compat_monofocale_plus ?? source.iol_compat_monofocale_plus,
    compat_edof:
      source.compat_edof ?? source.iol_compat_edof,
    compat_multifocal:
      source.compat_multifocal
      ?? source.compat_multifocale
      ?? source.iol_compat_multifocal
      ?? source.iol_compat_multifocale,
  };
  Object.entries(compatSource).forEach(([key, value]) => {
    if (value != null && String(value).trim() !== '') {
      mapped[key] = formatCompatibilityPercent(value);
    }
  });

  const compatKeys = [
    'compat_monofocale_standard',
    'compat_monofocale_plus',
    'compat_edof',
    'compat_multifocal',
  ];
  const compatValues = compatKeys.map((k) => mapped[k]);
  const allCompatMissing = compatValues.every((v) => v == null || String(v).trim() === '');
  const compatCalculatedAt = String(
    source.compat_calculated_at || source.iol_compat_calculated_at || '',
  ).trim();
  if (allCompatMissing && compatCalculatedAt) {
    for (const key of compatKeys) {
      mapped[key] = 'non valutabile';
    }
  }

  const systemicRaw = source.noteSistemic ?? source.noteSystemic ?? '';
  const eyeRaw = source.noteEye ?? source.noteOcular ?? '';
  const mappedSystemic = mapSystemicNoteFromSmartIol(systemicRaw);
  const mappedEye = mapEyeNoteFromSmartIol(eyeRaw);
  if (mappedSystemic) mapped.noteSistemic = mappedSystemic;
  if (mappedEye) mapped.noteEye = mappedEye;

  return mapped;
}

function buildOperationCandidates(operationRepo, smartIolOperations, localPatientId, selectedKeys = null) {
  const candidates = [];
  const selectedSet = selectedKeys ? new Set(selectedKeys.map((v) => String(v))) : null;
  for (const smartOp of smartIolOperations) {
    const eye = normalizeEye(smartOp.eye);
    const operationDate = String(smartOp.operationDate || '').trim();
    if (!eye || !operationDate) continue;
    const targetEyes = eye === 'OU' ? ['OD', 'OS'] : [eye];
    for (const targetEye of targetEyes) {
      const key = `${smartOp.id}:${targetEye}`;
      const selected = !selectedSet || selectedSet.has(key);
      const existingOperationId = findOperationId(
        operationRepo,
        localPatientId,
        operationDate,
        targetEye,
      );
      const duplicate = !!existingOperationId;
      const mapped = mapSmartIolOperation(smartOp, localPatientId);
      mapped.eye = targetEye;
      candidates.push({
        key,
        selected,
        duplicate,
        operationDate,
        eye: targetEye,
        sourceOperationId: smartOp.id,
        existingOperationId,
        noteIntervento: mapped.noteIntervento || '',
        mapped,
      });
    }
  }
  return candidates;
}

export function registerPatientHandlers(patientRepo, operationRepo, appDatabase) {
  ipcMain.handle('patient:add', (_, patient) => {
    const result = patientRepo.add(patient);
    if (result.success && appDatabase) appDatabase.fallbackBackup();
    return result;
  });

  ipcMain.handle('patient:update', (_, patient) => {
    const result = patientRepo.update(patient);
    if (result.success && appDatabase) appDatabase.fallbackBackup();
    return result;
  });

  ipcMain.handle('patient:delete', (_, id) => {
    const result = patientRepo.delete(id);
    if (result.success && appDatabase) appDatabase.fallbackBackup();
    return result;
  });

  ipcMain.handle('patient:getAll', () => patientRepo.getAll());
  ipcMain.handle('patient:getById', (_, id) => patientRepo.getById(id));
  ipcMain.handle('patient:checkExists', (_, name, dateOfBirth) => {
    const row = patientRepo.checkPatientExists(name, dateOfBirth);
    return row ? { exists: true, id: row.id } : { exists: false };
  });

  ipcMain.handle('patient:smartiolStatus', () => {
    if (!appDatabase) return { available: false };
    const dbPath = appDatabase.getSmartIolDbPath();
    return { available: !!dbPath, dbPath };
  });

  ipcMain.handle('patient:listFromSmartiol', (_, search) => {
    if (!appDatabase) return [];
    return appDatabase.listSmartIolPatients(search || '');
  });

  ipcMain.handle('patient:listOperationsFromSmartiol', (_, patient) => {
    if (!patient?.id || !patient?.name || !patient?.dateOfBirth) {
      return { success: false, error: 'Dati paziente SmartIOL non validi.', operations: [] };
    }
    const existing = patientRepo.checkPatientExists(
      String(patient.name).trim(),
      String(patient.dateOfBirth).trim(),
    );
    const localPatientId = existing?.id ?? null;
    const smartIolOperations = appDatabase?.listSmartIolOperationsByPatientId(patient.id) || [];
    const operations = buildOperationCandidates(operationRepo, smartIolOperations, localPatientId).map((item) => ({
      key: item.key,
      operationDate: String(item.operationDate || ''),
      eye: String(item.eye || ''),
      sourceOperationId: Number(item.sourceOperationId || 0),
      duplicate: !!item.duplicate,
      noteIntervento: String(item.noteIntervento || ''),
    }));
    return { success: true, operations };
  });

  ipcMain.handle('patient:importFromSmartiol', (_, patient) => {
    if (!patient?.id || !patient?.name || !patient?.dateOfBirth) {
      return { success: false, error: 'Dati paziente SmartIOL non validi.' };
    }
    const selectedKeys = Array.isArray(patient.selectedOperationKeys)
      ? patient.selectedOperationKeys.map((v) => String(v))
      : null;
    const name = String(patient.name).trim();
    const dateOfBirth = String(patient.dateOfBirth).trim();
    const gender = patient.gender || '';

    const existing = patientRepo.checkPatientExists(name, dateOfBirth);
    let patientId = existing?.id ?? null;
    let patientAdded = false;

    if (!patientId) {
      const addResult = patientRepo.add({ name, dateOfBirth, gender });
      if (!addResult.success) return addResult;
      patientId = addResult.id;
      patientAdded = true;
    }

    const smartIolOperations = appDatabase?.listSmartIolOperationsByPatientId(patient.id) || [];
    const candidates = buildOperationCandidates(operationRepo, smartIolOperations, patientId, selectedKeys);
    let importedOperations = 0;
    let updatedOperations = 0;
    let skippedOperations = 0;
    let notSelectedOperations = 0;
    const touchedMeta = [];

    for (const candidate of candidates) {
      if (!candidate.selected) {
        notSelectedOperations += 1;
        continue;
      }
      if (candidate.duplicate) {
        if (candidate.existingOperationId) {
          const updateResult = updateDuplicatePercentageOnly(
            operationRepo,
            candidate.existingOperationId,
            candidate.mapped,
          );
          if (updateResult.success) {
            updatedOperations += updateResult.updated || 0;
            touchedMeta.push({
              id: Number(candidate.existingOperationId),
              operationDate: String(candidate.operationDate || ''),
            });
          } else {
            skippedOperations += 1;
          }
        } else {
          skippedOperations += 1;
        }
        continue;
      }
      const opResult = operationRepo.add(candidate.mapped);
      if (opResult.success) {
        importedOperations += 1;
        touchedMeta.push({
          id: Number(opResult.id),
          operationDate: String(candidate.operationDate || ''),
        });
      }
      else skippedOperations += 1;
    }

    const latestImportedOperationId = touchedMeta
      .sort((a, b) => {
        if (a.operationDate === b.operationDate) return b.id - a.id;
        return b.operationDate.localeCompare(a.operationDate);
      })[0]?.id || null;

    if (appDatabase) appDatabase.fallbackBackup();
    return {
      success: true,
      id: patientId,
      patientAdded,
      importedOperations,
      updatedOperations,
      skippedOperations,
      notSelectedOperations,
      lastImportedOperationId: touchedMeta.length ? touchedMeta[touchedMeta.length - 1].id : null,
      latestImportedOperationId,
    };
  });
}
