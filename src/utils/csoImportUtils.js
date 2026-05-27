/**
 * CSO Plugin Import - Convert JSON from CSO to operation form data
 * Handles patient matching by name + dateOfBirth
 */

import { getTodayDate, getEmptyForm } from '@/config/formSchema';

function calcAge(dateOfBirth, operationDate) {
    if (!dateOfBirth || !operationDate) return null;
    const dob = new Date(dateOfBirth);
    const opDate = new Date(operationDate);
    if (isNaN(dob.getTime()) || isNaN(opDate.getTime())) return null;
    let age = opDate.getFullYear() - dob.getFullYear();
    const monthDiff = opDate.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && opDate.getDate() < dob.getDate())) age--;
    return age >= 0 ? age : null;
}

/**
 * JSON structure expected from CSO plugin:
 * {
 *   source: "CSO",
 *   version: "1.0",
 *   patient: { name, dateOfBirth, gender? },
 *   operation: { operationDate, eye, ...all form fields }
 * }
 */

/**
 * Map CSO JSON to form-compatible operation object
 * @param {Object} jsonData - JSON from CSO plugin
 * @returns {Object} - { patient: {name, dateOfBirth, gender}, operation: {...} } or null if invalid
 */
export function parseCsoImportJson(jsonData) {
    if (!jsonData || typeof jsonData !== 'object') {
        return null;
    }
    const patient = jsonData.patient || {};
    const op = jsonData.operation || jsonData;
    const name = patient.name || jsonData.meta?.patientName || '';
    const dateOfBirth = patient.dateOfBirth || jsonData.meta?.patientDateOfBirth || '';
    if (!name || !dateOfBirth) {
        return null;
    }
    return {
        patient: {
            name: String(name).trim(),
            dateOfBirth: String(dateOfBirth).trim(),
            gender: patient.gender || '-'
        },
        operation: mapToOperationFields(op)
    };
}

/**
 * Map operation JSON to form field names
 */
function mapToOperationFields(op) {
    const formFields = [
        'operationDate', 'eye', 'noteSistemic', 'noteEye', 'noteIOLType',
        'bcdva_sph', 'bcdva_cyl', 'bcdva_ax', 'bcdva_va',
        'offsetLimbus', 'offsetPupilla', 'AbS', 'Coma', 'HOA', 'SDP', 'SRI', 'SAI',
        'pupillaPhotopic', 'pupillaMesopica', 'pupillaScotopic', 'cellEndotelio',
        'cso_K1', 'cso_axK1', 'cso_K2', 'cso_axK2', 'cso_avgKm', 'cso_cil', 'cso_ax',
        'cilTotal', 'axConclusion', 'cso_AXL', 'cso_ACD', 'cso_LT',
        'iolModelSelected'
    ];
    const result = {};
    formFields.forEach(field => {
        if (op[field] !== undefined && op[field] !== null) {
            result[field] = String(op[field]);
        }
    });
    // Also support nested structure (meta, machineData, eyeInfo, notes, bcdva)
    if (op.operationDate === undefined && op.meta?.examDate) {
        result.operationDate = String(op.meta.examDate);
    }
    if (op.eye === undefined && op.meta?.eye) {
        result.eye = String(op.meta.eye);
    }
    if (op.bcdva_sph === undefined && op.bcdva?.sph !== undefined) {
        result.bcdva_sph = String(op.bcdva.sph);
    }
    if (op.bcdva_cyl === undefined && op.bcdva?.cyl !== undefined) {
        result.bcdva_cyl = String(op.bcdva.cyl);
    }
    if (op.bcdva_ax === undefined && op.bcdva?.ax !== undefined) {
        result.bcdva_ax = String(op.bcdva.ax);
    }
    if (op.bcdva_va === undefined && op.bcdva?.va !== undefined) {
        result.bcdva_va = String(op.bcdva.va);
    }
    if (op.noteSistemic === undefined && op.notes?.systemic !== undefined) {
        result.noteSistemic = String(op.notes.systemic);
    }
    if (op.noteEye === undefined && op.notes?.ocular !== undefined) {
        result.noteEye = String(op.notes.ocular);
    }
    if (op.noteIOLType === undefined && op.notes?.general !== undefined) {
        result.noteIOLType = String(op.notes.general);
    }
    if (op.machineData?.cso) {
        const cso = op.machineData.cso;
        ['K1', 'axK1', 'K2', 'axK2', 'avgKm', 'cil', 'ax', 'AXL', 'ACD', 'LT'].forEach(f => {
            if (cso[f] !== undefined && result[`cso_${f}`] === undefined) {
                result[`cso_${f}`] = String(cso[f]);
            }
        });
        if (cso.cilTotal !== undefined) result.cilTotal = String(cso.cilTotal);
        if (cso.axTotal !== undefined) result.axConclusion = String(cso.axTotal);
    }
    if (op.eyeInfo) {
        const eyeFields = ['offsetLimbus', 'offsetPupilla', 'AbS', 'Coma', 'HOA', 'SDP', 'SRI', 'SAI',
            'pupillaPhotopic', 'pupillaMesopica', 'pupillaScotopic', 'cellEndotelio', 'noteSistemic', 'noteEye'];
        eyeFields.forEach(f => {
            if (op.eyeInfo[f] !== undefined && result[f] === undefined) {
                result[f] = String(op.eyeInfo[f]);
            }
        });
    }
    if (!result.operationDate) result.operationDate = getTodayDate();
    if (!result.eye) result.eye = 'OD';
    return result;
}

/**
 * Build operation object for DB add, including patientId and age
 * @param {Object} parsed - Result from parseCsoImportJson
 * @param {number} patientId - Resolved patient ID
 * @returns {Object} - Operation object for operation.add
 */
export function buildOperationForImport(parsed, patientId) {
    const { patient, operation } = parsed;
    const age = calcAge(patient.dateOfBirth, operation.operationDate);
    const empty = getEmptyForm();
    return {
        ...empty,
        ...operation,
        patientId,
        age: age ?? ''
    };
}
