import { parseNum, formatPower } from './numberUtils.js';

/**
 * SRK-II simplified: P = A - 2.5*AL - 0.9*K
 * A = A-constant, AL = axial length (mm), K = average keratometry (D)
 */
export function calculateSrk2(aConstant, axialLength, avgKm) {
  const a = parseNum(aConstant);
  const al = parseNum(axialLength);
  const k = parseNum(avgKm);
  if (a === null || al === null || k === null) return '';
  return formatPower(a - 2.5 * al - 0.9 * k);
}

/**
 * Mean of spherical IOL powers entered from external calculators (non-empty).
 */
export function meanSphericalPower(form) {
  const keys = ['iol_evo2', 'iol_hoffer_qst', 'iol_kane', 'iol_pearl_dgs'];
  const values = keys.map((k) => parseNum(form[k])).filter((v) => v !== null);
  if (values.length === 0) return '';
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  return formatPower(mean);
}

function meanOfAvailable(values) {
  const nums = values.map((v) => parseNum(v)).filter((v) => v !== null);
  if (!nums.length) return null;
  return nums.reduce((acc, n) => acc + n, 0) / nums.length;
}

/**
 * Auto estimate IOL power from available biometry.
 * Strategy:
 * - K: average of available device Avg Km (CSO/Tomey/Argos)
 * - AL: average of available device AXL (CSO/Tomey/Argos)
 * - Formula: SRK-II simplified
 * - Target adjustment: P_target = P_emmetropia - targetRefraction
 */
export function estimateAutoIolPower(form, aConstant = 118.4) {
  const avgKm = meanOfAvailable([form.cso_avgKm, form.tomey_avgKm, form.argos_avgKm]);
  const axialLength = meanOfAvailable([form.cso_AXL, form.tomey_AXL, form.argos_AXL]);
  const target = parseNum(form.target) ?? 0;

  if (avgKm === null || axialLength === null) {
    return {
      success: false,
      error: 'Servono Avg Km e AXL (almeno da un dispositivo) per il calcolo automatico.',
    };
  }

  const emmetropiaPower = parseNum(calculateSrk2(aConstant, axialLength, avgKm));
  if (emmetropiaPower === null) {
    return {
      success: false,
      error: 'Impossibile calcolare la potenza IOL con i dati disponibili.',
    };
  }

  const targetAdjusted = emmetropiaPower - target;

  return {
    success: true,
    iolPower: formatPower(targetAdjusted),
    details: {
      aConstant,
      avgKm: formatPower(avgKm),
      axialLength: formatPower(axialLength),
      target: formatPower(target),
      formula: 'SRK-II semplificata: P = A - 2.5*AL - 0.9*K; poi P_target = P - Target',
      source: 'Retzlaff, Sanders, Kraff (SRK-II, 1990, formula empirica).',
    },
  };
}
