<template>
  <div class="iol-block">
    <div class="iol-header">
      <button
        v-if="showReset"
        type="button"
        class="reset-btn"
        :disabled="disabled"
        @click="resetAll"
      >
        Reimposta IOL
      </button>
    </div>

    <div class="iol-panels">
      <div class="iol-panel" :class="{ 'panel-inactive': isPanelInactive('sferica') }">
        <div class="panel-title">IOL sferica</div>
        <table class="iol-table">
          <thead>
            <tr>
              <th></th>
              <th>Residuo refr.</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in sferica" :key="row.resKey">
              <td class="formula-name">{{ row.label }}</td>
              <td>
                <BioCell
                  v-model="form[row.resKey]"
                  :disabled="isCellDisabled('sferica')"
                  @focus="activatePanel('sferica')"
                  @update:modelValue="activatePanel('sferica')"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="iol-panel" :class="{ 'panel-inactive': isPanelInactive('torica') }">
        <div class="panel-title">IOL torica</div>
        <table class="iol-table">
          <thead>
            <tr>
              <th></th>
              <th>Residuo refr.</th>
              <th>T</th>
              <th>Asse</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in torica" :key="row.resKey">
              <td class="formula-name">{{ row.label }}</td>
              <td>
                <BioCell
                  v-model="form[row.resKey]"
                  :disabled="isCellDisabled('torica')"
                  @focus="activatePanel('torica')"
                  @update:modelValue="activatePanel('torica')"
                />
              </td>
              <td>
                <BioCell
                  v-model="form[row.tKey]"
                  :disabled="isCellDisabled('torica')"
                  @focus="activatePanel('torica')"
                  @update:modelValue="activatePanel('torica')"
                />
              </td>
              <td>
                <BioCell
                  v-model="form[row.axisKey]"
                  :disabled="isCellDisabled('torica')"
                  @focus="activatePanel('torica')"
                  @update:modelValue="activatePanel('torica')"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="iol-panel" :class="{ 'panel-inactive': isPanelInactive('postLvc') }">
        <div class="panel-title">IOL post LVC</div>
        <table class="iol-table">
          <thead>
            <tr>
              <th></th>
              <th>Residuo refr.</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in postLvc" :key="row.resKey">
              <td class="formula-name">{{ row.label }}</td>
              <td>
                <BioCell
                  v-model="form[row.resKey]"
                  :disabled="isCellDisabled('postLvc')"
                  @focus="activatePanel('postLvc')"
                  @update:modelValue="activatePanel('postLvc')"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import BioCell from '@/components/atoms/BioCell.vue';
import {
  IOL_CALCULATION_FIELD_KEYS,
  inferActiveIolPanel,
  iolPanelHasData,
} from '@/utils/iolCalculationPanels.js';

const props = defineProps({
  form: { type: Object, required: true },
  disabled: { type: Boolean, default: false },
});

const sferica = [
  { label: 'Argos — Barrett UII', resKey: 'iol_argos_barrett_res' },
  { label: 'Tomey — Barrett UII', resKey: 'iol_tomey_barrett_res' },
  { label: 'CSO — Evo 2.0', resKey: 'iol_evo2_res' },
  { label: 'CSO — Hoffer QST', resKey: 'iol_hoffer_qst_res' },
  { label: 'CSO — Kane', resKey: 'iol_kane_res' },
  { label: 'CSO — Pearl DGS', resKey: 'iol_pearl_dgs_res' },
];

const torica = [
  { label: 'Argos — Barrett Toric', resKey: 'iol_argos_barrett_toric_res', tKey: 'iol_argos_barrett_toric_t', axisKey: 'iol_argos_barrett_toric_axis' },
  { label: 'Tomey — Barrett Toric', resKey: 'iol_tomey_barrett_toric_res', tKey: 'iol_tomey_barrett_toric_t', axisKey: 'iol_tomey_barrett_toric_axis' },
  { label: 'CSO — Evo Toric', resKey: 'iol_evo_toric_res', tKey: 'iol_evo_toric', axisKey: 'iol_evo_toric_rescyl' },
  { label: 'CSO — Hoffer QST T', resKey: 'iol_hoffer_qst_toric_res', tKey: 'iol_hoffer_qst_toric', axisKey: 'iol_hoffer_qst_toric_rescyl' },
  { label: 'CSO — Kane T', resKey: 'iol_kane_toric_res', tKey: 'iol_kane_toric', axisKey: 'iol_kane_toric_rescyl' },
];

const postLvc = [
  { label: 'Argos — Barrett TK', resKey: 'iol_argos_barrett_tk_res' },
  { label: 'Tomey — Barrett TK', resKey: 'iol_tomey_barrett_tk_res' },
  { label: 'Tomey — Oculix', resKey: 'iol_tomey_oculix_res' },
  { label: 'CSO — Ray tracing', resKey: 'iol_ray_tracing_res' },
  { label: 'CSO — Evo 2.0', resKey: 'iol_evo2_post_res' },
  { label: 'CSO — Pearl DGS', resKey: 'iol_pearl_dgs_post_res' },
];

const allFieldKeys = IOL_CALCULATION_FIELD_KEYS;

/** @type {import('vue').Ref<'sferica' | 'torica' | 'postLvc' | null>} */
const activePanel = ref(null);

function panelHasData(panel) {
  return iolPanelHasData(props.form, panel);
}

function syncActivePanelFromForm() {
  activePanel.value = inferActiveIolPanel(props.form);
  props.form.iolActivePanel = activePanel.value;
}

watch(
  () => props.form.id,
  () => syncActivePanelFromForm(),
  { immediate: true },
);

const showReset = computed(
  () => activePanel.value !== null || allFieldKeys.some((key) => {
    const v = props.form[key];
    return v != null && String(v).trim() !== '';
  }),
);

function activatePanel(panel) {
  if (props.disabled) return;
  activePanel.value = panel;
  props.form.iolActivePanel = panel;
}

function isCellDisabled(panel) {
  return props.disabled || (activePanel.value !== null && activePanel.value !== panel);
}

function isPanelInactive(panel) {
  return activePanel.value !== null && activePanel.value !== panel;
}

function resetAll() {
  if (props.disabled) return;
  for (const key of allFieldKeys) {
    props.form[key] = '';
  }
  activePanel.value = null;
  props.form.iolActivePanel = null;
}
</script>

<style scoped>
.iol-block {
  border-top: 2px solid #2563eb;
  padding-top: 10px;
  margin-top: 10px;
}
.iol-header {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 8px;
}
.reset-btn {
  padding: 4px 12px;
  font-size: 12px;
  border: 1px solid #2563eb;
  background: #fff;
  color: #1e40af;
  border-radius: 4px;
  cursor: pointer;
}
.reset-btn:hover:not(:disabled) {
  background: #eff6ff;
}
.reset-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.iol-panels {
  display: grid;
  grid-template-columns: 1fr 1.2fr 1fr;
  gap: 18px;
}
.iol-panel {
  transition: opacity 0.15s ease;
}
.panel-inactive {
  opacity: 0.45;
}
.panel-title {
  font-weight: 600;
  color: #1e40af;
  margin-bottom: 6px;
  font-size: 13px;
}
.iol-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 10px 8px;
  font-size: 12px;
}
.iol-table th {
  color: #6b7280;
  font-weight: 600;
  padding: 6px 8px;
  text-align: center;
  font-size: 11px;
}
.iol-table td {
  padding: 4px 6px;
}
.formula-name {
  text-align: left;
  padding: 6px 10px 6px 0;
  white-space: nowrap;
}
@media (max-width: 1100px) {
  .iol-panels {
    grid-template-columns: 1fr;
  }
}
</style>
