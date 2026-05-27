import { parseNum, formatPower } from './numberUtils.js';

export const RESIDUAL_FIELD_BY_FORMULA = {
  srk2: 'iol_evo2_res',
  srkt_style: 'iol_kane_res',
  hoffer_q_style: 'iol_hoffer_qst_res',
  haigis_style: 'iol_pearl_dgs_res',
};

function meanOf(keys, form) {
  const values = keys.map((k) => parseNum(form[k])).filter((v) => v !== null);
  if (!values.length) return null;
  return values.reduce((acc, v) => acc + v, 0) / values.length;
}

function getBiometry(form) {
  return {
    k: meanOf(['cso_avgKm', 'tomey_avgKm', 'argos_avgKm'], form),
    al: meanOf(['cso_AXL', 'tomey_AXL', 'argos_AXL'], form),
    acd: meanOf(['cso_ACD', 'tomey_ACD', 'argos_ACD'], form),
  };
}

function srk2Power({ aConstant, al, k }) {
  return aConstant - 2.5 * al - 0.9 * k;
}

function srktStylePower({ aConstant, al, k, surgeonFactor }) {
  return aConstant - 2.5 * al - 0.9 * k + 0.12 * (al - 23.5) + surgeonFactor;
}

function hofferQStylePower({ aConstant, al, k, surgeonFactor }) {
  const shortEyeAdjustment = 0.04 * (23.5 - al) * (23.5 - al);
  return aConstant - 2.5 * al - 0.9 * k + shortEyeAdjustment + surgeonFactor;
}

function haigisStylePower({ a0, a1, a2, al, acd, k, surgeonFactor }) {
  const effectiveA = 118.4 + a0 + a1 * acd + a2 * al;
  return effectiveA - 2.5 * al - 0.9 * k + surgeonFactor;
}

export function computeNonToricIolEstimate({ formulaId, form, constants }) {
  const biometry = getBiometry(form);
  const target = parseNum(form.target) ?? 0;
  const selectedIolPower = parseNum(form.iolPower);
  const aConstant = parseNum(constants.aConstant) ?? 118.4;
  const surgeonFactor = parseNum(constants.surgeonFactor) ?? 0;
  const a0 = parseNum(constants.a0) ?? 0;
  const a1 = parseNum(constants.a1) ?? 0;
  const a2 = parseNum(constants.a2) ?? 0.1;

  if (biometry.k === null || biometry.al === null) {
    return {
      success: false,
      error: 'Dati insufficienti: servono Avg Km e AXL (almeno da un dispositivo).',
    };
  }
  if (formulaId === 'haigis_style' && biometry.acd === null) {
    return {
      success: false,
      error: 'Per Haigis-style serve anche ACD.',
    };
  }

  let emmetropiaPower;
  if (formulaId === 'srk2') {
    emmetropiaPower = srk2Power({ aConstant, al: biometry.al, k: biometry.k });
  } else if (formulaId === 'srkt_style') {
    emmetropiaPower = srktStylePower({
      aConstant,
      al: biometry.al,
      k: biometry.k,
      surgeonFactor,
    });
  } else if (formulaId === 'hoffer_q_style') {
    emmetropiaPower = hofferQStylePower({
      aConstant,
      al: biometry.al,
      k: biometry.k,
      surgeonFactor,
    });
  } else if (formulaId === 'haigis_style') {
    emmetropiaPower = haigisStylePower({
      a0,
      a1,
      a2,
      al: biometry.al,
      acd: biometry.acd,
      k: biometry.k,
      surgeonFactor,
    });
  } else {
    return {
      success: false,
      error: 'Formula non supportata.',
    };
  }

  const recommendedPower = emmetropiaPower - target;
  const predictedResidual = selectedIolPower === null
    ? null
    : target + (recommendedPower - selectedIolPower) * 0.7;

  return {
    success: true,
    formulaId,
    recommendedPower: formatPower(recommendedPower),
    predictedResidual: predictedResidual === null ? '' : formatPower(predictedResidual),
    residualFieldKey: RESIDUAL_FIELD_BY_FORMULA[formulaId] || null,
    details: {
      kUsed: formatPower(biometry.k),
      alUsed: formatPower(biometry.al),
      acdUsed: biometry.acd === null ? '' : formatPower(biometry.acd),
      targetUsed: formatPower(target),
      aConstant: formatPower(aConstant),
      surgeonFactor: formatPower(surgeonFactor),
      a0: formatPower(a0),
      a1: formatPower(a1),
      a2: formatPower(a2),
    },
  };
}
