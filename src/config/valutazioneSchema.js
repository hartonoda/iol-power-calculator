/**
 * Form fields matching FileMaker "0 valutazione" layout.
 */

export const getTodayDate = () => new Date().toISOString().split('T')[0];

/** Columns persisted on operations (excludes id, timestamps, linkedOperationId) */
export const VALUTAZIONE_DB_FIELDS = [
  'operationDate', 'patientId', 'age', 'eye',
  'interventoDi', 'costo', 'noteIntervento',
  'noteSistemic', 'noteEye', 'cellEndotelio',
  'bcdva_sph', 'bcdva_cyl', 'bcdva_ax', 'bcdva_va',
  'refSf', 'target', 'contralateralEye',
  'cso_avgKm', 'cilTotal', 'cso_cil', 'cso_ax', 'cso_AXL', 'cso_ACD', 'cso_LT',
  'tomey_avgKm', 'tomey_cilTotal', 'tomey_cil', 'tomey_ax', 'tomey_AXL', 'tomey_ACD', 'tomey_LT',
  'argos_avgKm', 'argos_cilTotal', 'argos_cil', 'argos_ax', 'argos_AXL', 'argos_ACD', 'argos_LT',
  'iol_argos_barrett_res', 'iol_tomey_barrett_res',
  'iol_evo2_res', 'iol_hoffer_qst_res', 'iol_kane_res', 'iol_pearl_dgs_res',
  'iol_argos_barrett_toric_res', 'iol_argos_barrett_toric_t', 'iol_argos_barrett_toric_axis',
  'iol_tomey_barrett_toric_res', 'iol_tomey_barrett_toric_t', 'iol_tomey_barrett_toric_axis',
  'compat_monofocale_standard', 'compat_monofocale_plus', 'compat_edof', 'compat_multifocal',
  'iol_evo_toric_res', 'iol_evo_toric', 'iol_evo_toric_rescyl',
  'iol_hoffer_qst_toric_res', 'iol_hoffer_qst_toric', 'iol_hoffer_qst_toric_rescyl',
  'iol_kane_toric_res', 'iol_kane_toric', 'iol_kane_toric_rescyl',
  'iol_argos_barrett_tk_res', 'iol_tomey_barrett_tk_res', 'iol_tomey_oculix_res',
  'iol_ray_tracing_res', 'iol_evo2_post_res', 'iol_pearl_dgs_post_res',
  'tunnel', 'iolModelSelected', 'iolT', 'iolAx', 'iolPower',
];

export const perEyeFields = VALUTAZIONE_DB_FIELDS.filter(
  (f) => !['operationDate', 'patientId', 'age', 'interventoDi', 'costo', 'noteIntervento', 'noteSistemic'].includes(f),
);

export const getEmptyForm = () => {
  const form = { patientId: '', linkedOperationId: null };
  for (const key of VALUTAZIONE_DB_FIELDS) {
    if (key === 'operationDate') form[key] = getTodayDate();
    else if (key === 'interventoDi') form[key] = 'Faco + IOL';
    else form[key] = '';
  }
  return form;
};

export const getEmptyEyeData = () => {
  const data = {};
  perEyeFields.forEach((field) => {
    data[field] = '';
  });
  return data;
};
