/**
 * Constants from https://iolcon.org/lensesTable.php
 * - Nominal (A)
 * - Hoffer Q / QST (pACD): optimized when available, else manufacturer
 * - Barrett (LF / DF): optimized when available
 */
export const IOL_MODEL_CONSTANTS_DEFAULTS = {
  'Alcon MA60MA (+/-5)': {
    nominalA: 118.91,
    hofferPacd: 15.942,
    barrett: null,
    barrettDf: null,
  },
  'Alcon MA60AC': {
    nominalA: 118.81,
    hofferPacd: 5.672,
    barrett: null,
    barrettDf: null,
  },
  'Alcon SA60AT': {
    nominalA: 118.41,
    hofferPacd: 5.453,
    barrett: 0.29,
    barrettDf: 0.114,
  },
  'Alcon SN60WF': {
    nominalA: 118.71,
    hofferPacd: 5.573,
    barrett: 0.359,
    barrettDf: 0.079,
  },
  'Alcon SN6AT': {
    nominalA: 119.01,
    hofferPacd: 5.812,
    barrett: null,
    barrettDf: null,
  },
  'Alcon Clareon': {
    nominalA: 118.81,
    hofferPacd: 5.793,
    barrett: 0.347,
    barrettDf: 0.17,
  },
  'Alcon Clareon T': {
    nominalA: 118.81,
    hofferPacd: 5.611,
    barrett: 1.945,
    barrettDf: 5.01,
  },
  'Alcon Vivity': {
    nominalA: 118.81,
    hofferPacd: 5.671,
    barrett: 1.995,
    barrettDf: 5.01,
  },
  'Alcon Vivity T': {
    nominalA: 118.81,
    hofferPacd: 5.671,
    barrett: 1.995,
    barrettDf: 5.01,
  },
  'Alcon Panoptix': {
    nominalA: 118.71,
    hofferPacd: 5.611,
    barrett: 1.945,
    barrettDf: 5.01,
  },
  'Alcon Panoptix T': {
    nominalA: 118.71,
    hofferPacd: 5.611,
    barrett: 1.945,
    barrettDf: 5.01,
  },
  'J&J Eyhance': {
    nominalA: 119.31,
    hofferPacd: 5.7763,
    barrett: null,
    barrettDf: null,
  },
  'J&J Eyhance T': {
    nominalA: 119.31,
    hofferPacd: 5.71,
    barrett: 2.044,
    barrettDf: 0.51,
  },
  'J&J Puresee': {
    nominalA: 119.31,
    hofferPacd: 5.7763,
    barrett: 2.044,
    barrettDf: 0.51,
  },
  Luxsmart: {
    nominalA: 119.21,
    hofferPacd: 5.231,
    barrett: 1.57,
    barrettDf: null,
  },
  'Luxsmart T': {
    nominalA: 119.21,
    hofferPacd: 5.231,
    barrett: 1.57,
    barrettDf: null,
  },
  'BVI isopure serenity': {
    nominalA: 119.41,
    hofferPacd: 5.851,
    barrett: 2.0914,
    barrettDf: null,
  },
};

/** DB / API fields for IOL calculation constants */
export const IOL_CONSTANT_FIELDS = ['nominalA', 'hofferPacd', 'barrett', 'barrettDf'];
