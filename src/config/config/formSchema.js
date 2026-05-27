/**
 * Form schema configuration for operations
 */

/**
 * Get today's date in YYYY-MM-DD format
 */
export const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
};

/**
 * Fields that are per-eye (BCDVA, ocular parameters, IOL model, eye notes)
 * Used for "both eyes" mode to track data separately for each eye
 */
export const perEyeFields = [
    // BCDVA
    'bcdva_sph', 'bcdva_cyl', 'bcdva_ax', 'bcdva_va',
    // Ocular Parameters
    'noteEye', 'offsetLimbus', 'offsetPupilla',
    'AbS', 'Coma', 'HOA', 'SDP', 'SRI', 'SAI',
    'pupillaPhotopic', 'pupillaMesopica', 'pupillaScotopic', 'cellEndotelio',
    // Keratometry
    'cso_K1', 'cso_axK1', 'cso_K2', 'cso_axK2', 'cso_avgKm', 'cso_cil', 'cso_ax',
    'cilTotal', 'axConclusion',
    // Biometry
    'cso_AXL', 'cso_ACD', 'cso_LT',
    // IOL Model
    'iolModelSelected', 'noteIOLType'
];

/**
 * Get an empty form object with all fields initialized
 */
export const getEmptyForm = () => ({
    patientId: '',
    operationDate: getTodayDate(),
    age: '',
    eye: '',
    noteSistemic: '',
    noteEye: '',
    noteIOLType: '',
    // BCDVA
    bcdva_sph: '',
    bcdva_cyl: '',
    bcdva_ax: '',
    bcdva_va: '',
    // Ocular Parameters
    offsetLimbus: '',
    offsetPupilla: '',
    AbS: '',
    Coma: '',
    HOA: '',
    SDP: '',
    SRI: '',
    SAI: '',
    pupillaPhotopic: '',
    pupillaMesopica: '',
    pupillaScotopic: '',
    cellEndotelio: '',
    // Keratometry
    cso_K1: '',
    cso_axK1: '',
    cso_K2: '',
    cso_axK2: '',
    cso_avgKm: '',
    cso_cil: '',
    cso_ax: '',
    cilTotal: '',
    axConclusion: '',
    // Biometry
    cso_AXL: '',
    cso_ACD: '',
    cso_LT: '',
    // IOL Model Selected
    iolModelSelected: ''
});

/**
 * Get empty per-eye data object
 */
export const getEmptyEyeData = () => {
    const data = {};
    perEyeFields.forEach(field => data[field] = '');
    return data;
};
