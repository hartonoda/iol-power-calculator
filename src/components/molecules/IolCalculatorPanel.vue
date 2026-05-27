<template>
  <div class="calc-block">
    <div class="warning-banner">
      {{ formulaSources.warningBanner }}
    </div>

    <div class="calc-header">
      <label class="field formula-field">
        <span class="lbl">Formula non torica</span>
        <select v-model="form.iolCalcFormula" :disabled="disabled">
          <option v-for="f in formulas" :key="f.id" :value="f.id">{{ f.label }}</option>
        </select>
      </label>
      <span class="formula-info" :title="selectedFormulaTooltip">ⓘ</span>
    </div>

    <div class="constants-grid">
      <label class="field small">
        <span class="lbl">A-constant</span>
        <input v-model="form.iolCalcAConstant" type="text" :disabled="disabled" />
      </label>
      <label class="field small">
        <span class="lbl">Surgeon factor</span>
        <input v-model="form.iolCalcSurgeonFactor" type="text" :disabled="disabled" />
      </label>
      <label class="field small" :class="{ ghosted: !isHaigis }">
        <span class="lbl">a0</span>
        <input v-model="form.iolCalcA0" type="text" :disabled="disabled || !isHaigis" />
      </label>
      <label class="field small" :class="{ ghosted: !isHaigis }">
        <span class="lbl">a1</span>
        <input v-model="form.iolCalcA1" type="text" :disabled="disabled || !isHaigis" />
      </label>
      <label class="field small" :class="{ ghosted: !isHaigis }">
        <span class="lbl">a2</span>
        <input v-model="form.iolCalcA2" type="text" :disabled="disabled || !isHaigis" />
      </label>
    </div>

    <div class="actions-row">
      <button type="button" class="btn-calc" :disabled="disabled" @click="runCalculation">
        Calcola
      </button>
      <button
        type="button"
        class="btn-apply"
        :disabled="disabled || !form.iolCalcRecommendedPower"
        @click="applyResult"
      >
        Applica risultato
      </button>
      <span v-if="errorMessage" class="error-text">{{ errorMessage }}</span>
    </div>

    <div class="result-grid">
      <label class="field small readonly">
        <span class="lbl">Potere suggerito</span>
        <input :value="form.iolCalcRecommendedPower" type="text" readonly />
      </label>
      <label class="field small readonly">
        <span class="lbl">Residuo stimato</span>
        <input :value="form.iolCalcPredictedResidual" type="text" readonly />
      </label>
      <label class="field small readonly">
        <span class="lbl">K usato</span>
        <input :value="form.iolCalcKUsed" type="text" readonly />
      </label>
      <label class="field small readonly">
        <span class="lbl">AL usato</span>
        <input :value="form.iolCalcAlUsed" type="text" readonly />
      </label>
      <label class="field small readonly">
        <span class="lbl">ACD usato</span>
        <input :value="form.iolCalcAcdUsed" type="text" readonly />
      </label>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import formulaSources from '@/config/iolFormulaSources.json';
import { computeNonToricIolEstimate } from '@/utils/iolAdvancedFormulas';

const props = defineProps({
  form: { type: Object, required: true },
  disabled: { type: Boolean, default: false },
});

const formulas = formulaSources.formulas;

if (!props.form.iolCalcFormula) props.form.iolCalcFormula = 'srk2';
if (!props.form.iolCalcAConstant) props.form.iolCalcAConstant = '118.4';
if (!props.form.iolCalcA2) props.form.iolCalcA2 = '0.1';

const isHaigis = computed(() => props.form.iolCalcFormula === 'haigis_style');
const selectedFormula = computed(
  () => formulas.find((f) => f.id === props.form.iolCalcFormula) || formulas[0],
);
const selectedFormulaTooltip = computed(
  () => `${selectedFormula.value.description}\nFonte: ${selectedFormula.value.source}`,
);
const errorMessage = ref('');
const lastResidualFieldKey = ref('');

watch(
  () => props.form.iolCalcFormula,
  (newFormula) => {
    if (newFormula === 'haigis_style' && !props.form.iolCalcA2) {
      props.form.iolCalcA2 = '0.1';
    }
  },
);

function runCalculation() {
  const result = computeNonToricIolEstimate({
    formulaId: props.form.iolCalcFormula || 'srk2',
    form: props.form,
    constants: {
      aConstant: props.form.iolCalcAConstant,
      surgeonFactor: props.form.iolCalcSurgeonFactor,
      a0: props.form.iolCalcA0,
      a1: props.form.iolCalcA1,
      a2: props.form.iolCalcA2,
    },
  });

  if (!result.success) {
    errorMessage.value = result.error;
    props.form.iolCalcRecommendedPower = '';
    props.form.iolCalcPredictedResidual = '';
    lastResidualFieldKey.value = '';
    return;
  }

  errorMessage.value = '';
  props.form.iolCalcRecommendedPower = result.recommendedPower;
  props.form.iolCalcPredictedResidual = result.predictedResidual;
  props.form.iolCalcKUsed = result.details.kUsed;
  props.form.iolCalcAlUsed = result.details.alUsed;
  props.form.iolCalcAcdUsed = result.details.acdUsed;
  lastResidualFieldKey.value = result.residualFieldKey || '';
}

function applyResult() {
  if (!props.form.iolCalcRecommendedPower) {
    runCalculation();
  }
  if (!props.form.iolCalcRecommendedPower) return;

  props.form.iolPower = props.form.iolCalcRecommendedPower;

  const residualFieldKey = lastResidualFieldKey.value;
  if (residualFieldKey && residualFieldKey in props.form && props.form.iolCalcPredictedResidual) {
    props.form[residualFieldKey] = props.form.iolCalcPredictedResidual;
  }
}
</script>

<style scoped>
.calc-block {
  border-top: 2px solid #2563eb;
  margin-top: 10px;
  padding-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.warning-banner {
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  color: #1e3a8a;
  padding: 8px 10px;
  border-radius: 6px;
  font-size: 12px;
}
.calc-header {
  display: flex;
  align-items: end;
  gap: 8px;
}
.formula-field {
  min-width: 240px;
}
.formula-info {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 1px solid #93c5fd;
  color: #1d4ed8;
  background: #eff6ff;
  font-size: 12px;
  cursor: help;
}
.constants-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(120px, 1fr));
  gap: 8px 10px;
}
.result-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(110px, 1fr));
  gap: 8px 10px;
}
.field {
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.lbl {
  color: #1e40af;
  font-weight: 600;
  font-size: 12px;
}
.field input,
.field select {
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  padding: 6px 8px;
  font-size: 13px;
}
.readonly input {
  background: #f8fafc;
}
.ghosted {
  opacity: 0.5;
}
.actions-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.btn-calc,
.btn-apply {
  border-radius: 6px;
  border: 1px solid #2563eb;
  padding: 6px 12px;
  font-weight: 600;
  cursor: pointer;
}
.btn-calc {
  background: #2563eb;
  color: #fff;
}
.btn-apply {
  background: #eff6ff;
  color: #1d4ed8;
}
.btn-calc:disabled,
.btn-apply:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.error-text {
  color: #b91c1c;
  font-size: 12px;
}
@media (max-width: 1200px) {
  .constants-grid,
  .result-grid {
    grid-template-columns: repeat(2, minmax(120px, 1fr));
  }
}
</style>
