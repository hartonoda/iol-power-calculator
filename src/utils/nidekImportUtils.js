function splitCsvLine(line) {
    return line.split(',').map((part) => part.trim());
}

function toNumber(raw) {
    if (raw == null) return null;
    const cleaned = String(raw).replace(/[^\d.+-]/g, '');
    if (!cleaned || cleaned === '+' || cleaned === '-') return null;
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : null;
}

function normalizeName(name) {
    return String(name || '')
        .replace(/[.]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function parseFileMeta(filename) {
    const match = filename.match(/^(\d+)_([^_]+)_(L|R)_(\d{8}_\d{6})\.csv$/i);
    if (!match) return null;
    const [, patientId, testTypeRaw, sideRaw, timestamp] = match;
    return {
        patientId,
        testType: testTypeRaw.toLowerCase(),
        eye: sideRaw.toUpperCase() === 'L' ? 'OS' : 'OD',
        timestamp
    };
}

function findValue(lines, prefix) {
    const line = lines.find((l) => l.startsWith(prefix));
    return line ? line.slice(prefix.length).trim() : null;
}

function findLineAfterHeader(lines, headerStart) {
    const idx = lines.findIndex((line) => line.startsWith(headerStart));
    if (idx === -1 || idx + 1 >= lines.length) return null;
    return splitCsvLine(lines[idx + 1]);
}

function parseDaya(lines) {
    const out = {};

    const axialValues = findLineAfterHeader(lines, 'Steep_D,Steep_deg,Flat_d,Flat_deg,Avg,Astig');
    if (axialValues && axialValues.length >= 18) {
        out.SRI = toNumber(axialValues[16]);
        out.SAI = toNumber(axialValues[17]);
    }

    const opdDayaValues = findLineAfterHeader(
        lines,
        'Sph,Cyl,Axis,RMS,Sph,Cyl,Axis,RMS,Sph,Cyl,Axis,RMS,T.Sph,T.Coma,HO,T.Sph,T.Coma,HO,T.Sph,T.Coma,HO'
    );
    if (opdDayaValues && opdDayaValues.length >= 18) {
        out['SA C'] = toNumber(opdDayaValues[15]);
        out['Coma C'] = toNumber(opdDayaValues[16]);
        out['HOA C'] = toNumber(opdDayaValues[17]);
    }

    out.AXL = toNumber(findValue(lines, 'AXL :'));
    out.ACD = toNumber(findValue(lines, 'ACD :'));
    out.LT = toNumber(findValue(lines, 'LT :'));

    return out;
}

function parseOptical(lines) {
    const out = {};
    out.PSFSR = toNumber(findValue(lines, 'Strehl Ratio :'));

    const mtfValues = findLineAfterHeader(lines, 'AreaRatio');
    if (mtfValues && mtfValues.length > 1) {
        // Prefer 4mm value if present, fallback to first available value.
        const mtf4 = toNumber(mtfValues[1]);
        const mtfRaw = mtf4 == null ? toNumber(mtfValues.find((v) => toNumber(v) != null)) : mtf4;
        if (mtfRaw != null) {
            out.MTF = `${Math.round(mtfRaw * 1000) / 10}%`;
        }
    }

    const eyeImageValues = findLineAfterHeader(
        lines,
        'Photopic(mm),Mesopic(mm),(mm/deg),,(mm/deg),,(mm/deg),,Photopic(mm/deg),,Mesopic(mm/deg),,Photopic(mm),Mesopic(mm),Manual(mm),Photopic(mm/deg),,Mesopic(mm/deg),,Manual(mm/deg)'
    );
    if (eyeImageValues && eyeImageValues.length >= 19) {
        out['Pupilla F'] = toNumber(eyeImageValues[0]);
        out['Pupilla M'] = toNumber(eyeImageValues[1]);
        out['Offset pup.'] = toNumber(eyeImageValues[6]);

        const limbusMesopic = toNumber(eyeImageValues[17]);
        const limbusMesopicDeg = toNumber(eyeImageValues[18]);
        const limbusPhotopic = toNumber(eyeImageValues[15]);
        if (limbusMesopic != null && limbusMesopicDeg != null && limbusMesopicDeg <= 30) {
            out['Offset limb.'] = limbusMesopic;
        } else {
            out['Offset limb.'] = limbusPhotopic ?? limbusMesopic;
        }
    }

    out.AXL = toNumber(findValue(lines, 'AXL :'));
    out.ACD = toNumber(findValue(lines, 'ACD :'));
    out.LT = toNumber(findValue(lines, 'LT :'));
    return out;
}

export function parseNidekCsvText(text, filename) {
    const meta = parseFileMeta(filename);
    if (!meta) {
        return { error: `Unsupported filename format: ${filename}` };
    }

    const lines = text
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line.length > 0);

    const patientNameRaw = findValue(lines, 'Patient Name :');
    const examLine = lines.find((line) => line.startsWith('ExamNo:'));
    let examNo = null;
    let examDate = null;
    if (examLine) {
        const noMatch = examLine.match(/ExamNo:\s*(\d+)/i);
        if (noMatch) examNo = Number(noMatch[1]);
        const dateMatch = examLine.match(/Exam Date\s*:(.+)$/i);
        if (dateMatch) examDate = dateMatch[1].trim();
    }

    const parsedData = meta.testType.includes('daya') ? parseDaya(lines) : parseOptical(lines);
    return {
        patientId: meta.patientId,
        patientName: normalizeName(patientNameRaw),
        eye: meta.eye,
        sourceTimestamp: meta.timestamp,
        examNo,
        examDate,
        testType: meta.testType,
        ...parsedData
    };
}

export function mergeNidekRecords(records) {
    const groups = new Map();
    const issues = [];

    for (const record of records) {
        if (record.error) {
            issues.push(record.error);
            continue;
        }

        const key = `${record.patientId}_${record.eye}_${record.sourceTimestamp}`;
        if (!groups.has(key)) {
            groups.set(key, {
                patientId: record.patientId,
                patientName: record.patientName,
                eye: record.eye,
                sourceTimestamp: record.sourceTimestamp,
                examNo: record.examNo,
                examDate: record.examDate,
                hasDayaOverview: false,
                hasOpticalQuality: false
            });
        }

        const existing = groups.get(key);
        Object.keys(record).forEach((k) => {
            const value = record[k];
            if (value !== null && value !== undefined && value !== '') {
                existing[k] = value;
            } else if (!(k in existing)) {
                existing[k] = value;
            }
        });

        if (record.testType.includes('daya')) existing.hasDayaOverview = true;
        if (record.testType.includes('optical')) existing.hasOpticalQuality = true;
    }

    const rows = Array.from(groups.values())
        .map((row) => ({
            ...row,
            isComplete: row.hasDayaOverview && row.hasOpticalQuality
        }))
        .sort((a, b) => {
            if (a.patientId === b.patientId) return a.eye.localeCompare(b.eye);
            return a.patientId.localeCompare(b.patientId);
        });

    for (const row of rows) {
        if (!row.isComplete) {
            issues.push(`Incomplete set for patient ${row.patientId} ${row.eye} (${row.sourceTimestamp})`);
        }
    }
    return { rows, issues };
}

export function parseExamDateToOperationDate(examDate) {
    if (!examDate) return null;
    // Expected: DD/MM/YYYY HH:mm
    const m = examDate.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
    if (!m) return null;
    const [, dd, mm, yyyy] = m;
    return `${yyyy}-${mm}-${dd}`;
}

export function normalizePatientLookupName(name) {
    return String(name || '')
        .toLowerCase()
        .replace(/[^\p{L}\p{N}\s]/gu, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}
