export const IOL_SFERICA_FIELD_KEYS = [
  'iol_argos_barrett_res',
  'iol_tomey_barrett_res',
  'iol_evo2_res',
  'iol_hoffer_qst_res',
  'iol_kane_res',
  'iol_pearl_dgs_res',
];

export const IOL_TORICA_FIELD_KEYS = [
  'iol_argos_barrett_toric_res',
  'iol_argos_barrett_toric_t',
  'iol_argos_barrett_toric_axis',
  'iol_tomey_barrett_toric_res',
  'iol_tomey_barrett_toric_t',
  'iol_tomey_barrett_toric_axis',
  'iol_evo_toric_res',
  'iol_evo_toric',
  'iol_evo_toric_rescyl',
  'iol_hoffer_qst_toric_res',
  'iol_hoffer_qst_toric',
  'iol_hoffer_qst_toric_rescyl',
  'iol_kane_toric_res',
  'iol_kane_toric',
  'iol_kane_toric_rescyl',
];

export const IOL_POST_LVC_FIELD_KEYS = [
  'iol_argos_barrett_tk_res',
  'iol_tomey_barrett_tk_res',
  'iol_tomey_oculix_res',
  'iol_ray_tracing_res',
  'iol_evo2_post_res',
  'iol_pearl_dgs_post_res',
];

export const IOL_CALCULATION_FIELD_KEYS = [
  ...IOL_SFERICA_FIELD_KEYS,
  ...IOL_TORICA_FIELD_KEYS,
  ...IOL_POST_LVC_FIELD_KEYS,
];

/** @typedef {'sferica' | 'torica' | 'postLvc'} IolCalculationPanel */

export function hasIolFieldValue(form, key) {
  const v = form?.[key];
  return v != null && String(v).trim() !== '';
}

/** @param {Record<string, unknown>} form @param {IolCalculationPanel} panel */
export function iolPanelHasData(form, panel) {
  if (panel === 'sferica') {
    return IOL_SFERICA_FIELD_KEYS.some((key) => hasIolFieldValue(form, key));
  }
  if (panel === 'torica') {
    return IOL_TORICA_FIELD_KEYS.some((key) => hasIolFieldValue(form, key));
  }
  return IOL_POST_LVC_FIELD_KEYS.some((key) => hasIolFieldValue(form, key));
}

/** @param {Record<string, unknown>} form @returns {IolCalculationPanel | null} */
export function inferActiveIolPanel(form) {
  /** @type {IolCalculationPanel[]} */
  const filled = ['sferica', 'torica', 'postLvc'].filter((panel) => iolPanelHasData(form, panel));
  return filled.length === 1 ? filled[0] : null;
}

/** @param {Record<string, unknown>} form @returns {IolCalculationPanel | null} */
export function resolveActiveIolPanel(form) {
  const explicit = form?.iolActivePanel;
  if (explicit === 'sferica' || explicit === 'torica' || explicit === 'postLvc') {
    return explicit;
  }
  return inferActiveIolPanel(form);
}

/** @param {Record<string, unknown>} form @param {IolCalculationPanel} panel */
export function shouldShowIolPanel(form, panel) {
  const active = resolveActiveIolPanel(form);
  if (active === null) return true;
  return active === panel;
}
