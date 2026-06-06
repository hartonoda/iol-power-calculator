<template>
  <div class="biometry-block">
    <table class="bio-table">
      <colgroup>
        <col class="col-label" />
        <col v-for="n in 7" :key="n" class="col-metric" />
      </colgroup>
      <thead>
        <tr>
          <th class="row-label">Dispositivo</th>
          <th>
            <div class="th-title">Avg Km</div>
            <div class="tol-hint" :class="{ alert: metricWarnings.avgKm.alert }">
              {{ metricWarnings.avgKm.label }}
            </div>
          </th>
          <th>
            <div class="th-title">cil.</div>
            <div class="tol-hint" :class="{ alert: metricWarnings.cil.alert }">
              {{ metricWarnings.cil.label }}
            </div>
          </th>
          <th>
            <div class="th-title">Ax</div>
            <div class="tol-hint" :class="{ alert: metricWarnings.ax.alert }">
              {{ metricWarnings.ax.label }}
            </div>
          </th>
          <th title="Central corneal thickness">CCT</th>
          <th>AXL</th>
          <th>ACD</th>
          <th>LT</th>
        </tr>
      </thead>
      <tbody>
        <tr class="ciltot-row">
          <td class="row-label">CSO</td>
          <td class="ciltot-spacer"></td>
          <td>
            <div class="metric-field">
              <span class="metric-prefix">tot.</span>
              <BioCell v-model="form.cilTotal" :disabled="disabled" />
            </div>
          </td>
          <td>
            <div class="metric-field">
              <span class="metric-prefix">tot.</span>
              <BioCell v-model="form.axConclusion" :disabled="disabled" />
            </div>
          </td>
          <td class="ciltot-spacer"></td>
          <td class="ciltot-spacer" colspan="3"></td>
        </tr>
        <tr v-for="device in deviceRows" :key="device.key" class="device-row">
          <td class="row-label">{{ device.label }}</td>
          <td :class="{ 'alert-cell': metricWarnings.avgKm.alert }">
            <div class="metric-field">
              <span class="metric-prefix metric-prefix--spacer" aria-hidden="true">tot.</span>
              <BioCell v-model="form[device.avgKm]" :disabled="disabled" />
            </div>
          </td>
          <td :class="{ 'alert-cell': metricWarnings.cil.alert }">
            <div class="metric-field">
              <span class="metric-prefix metric-prefix--spacer" aria-hidden="true">tot.</span>
              <BioCell v-model="form[device.cil]" :disabled="disabled" />
            </div>
          </td>
          <td :class="{ 'alert-cell': metricWarnings.ax.alert }">
            <div class="metric-field">
              <span class="metric-prefix metric-prefix--spacer" aria-hidden="true">tot.</span>
              <BioCell v-model="form[device.ax]" :disabled="disabled" />
            </div>
          </td>
          <td>
            <div class="metric-field">
              <span class="metric-prefix metric-prefix--spacer" aria-hidden="true">tot.</span>
              <BioCell v-model="form[device.cct]" :disabled="disabled" />
            </div>
          </td>
          <td>
            <div class="metric-field">
              <span class="metric-prefix metric-prefix--spacer" aria-hidden="true">tot.</span>
              <BioCell v-model="form[device.axl]" :disabled="disabled" />
            </div>
          </td>
          <td>
            <div class="metric-field">
              <span class="metric-prefix metric-prefix--spacer" aria-hidden="true">tot.</span>
              <BioCell v-model="form[device.acd]" :disabled="disabled" />
            </div>
          </td>
          <td>
            <div class="metric-field">
              <span class="metric-prefix metric-prefix--spacer" aria-hidden="true">tot.</span>
              <BioCell v-model="form[device.lt]" :disabled="disabled" />
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import BioCell from '@/components/atoms/BioCell.vue';
import { computeMetricWarnings } from '@/utils/biometryTolerance';

const props = defineProps({
  form: { type: Object, required: true },
  disabled: { type: Boolean, default: false },
});

const deviceRows = [
  {
    key: 'cso',
    label: 'CSO',
    avgKm: 'cso_avgKm',
    cil: 'cso_cil',
    ax: 'cso_ax',
    cct: 'cso_CCT',
    axl: 'cso_AXL',
    acd: 'cso_ACD',
    lt: 'cso_LT',
  },
  {
    key: 'tomey',
    label: 'Tomey',
    avgKm: 'tomey_avgKm',
    cil: 'tomey_cil',
    ax: 'tomey_ax',
    cct: 'tomey_CCT',
    axl: 'tomey_AXL',
    acd: 'tomey_ACD',
    lt: 'tomey_LT',
  },
  {
    key: 'argos',
    label: 'Argos',
    avgKm: 'argos_avgKm',
    cil: 'argos_cil',
    ax: 'argos_ax',
    cct: 'argos_CCT',
    axl: 'argos_AXL',
    acd: 'argos_ACD',
    lt: 'argos_LT',
  },
];

const metricWarnings = computed(() => computeMetricWarnings(props.form));
</script>

<style scoped>
.biometry-block {
  border-top: 2px solid var(--color-section-divider);
  padding-top: 10px;
  margin-top: 10px;
}
.bio-table {
  --bio-input-width: 78px;
  --bio-prefix-width: 2.25rem;
  --bio-col-width: calc(var(--bio-prefix-width) + 6px + var(--bio-input-width));
  width: 100%;
  table-layout: fixed;
  border-collapse: separate;
  border-spacing: 10px 8px;
  font-size: 13px;
}
.col-label {
  width: auto;
}
.col-metric {
  width: var(--bio-col-width);
}
.bio-table th:not(.row-label),
.bio-table td:not(.row-label) {
  width: var(--bio-col-width);
  max-width: var(--bio-col-width);
}
.bio-table th {
  color: var(--color-label);
  font-weight: 600;
  padding: 4px 6px;
  text-align: center;
  border-bottom: 1px solid #e5e7eb;
  vertical-align: top;
}
.row-label {
  color: var(--color-label);
  font-weight: 600;
  text-align: left;
  padding: 6px 10px 6px 0;
  white-space: nowrap;
}
.ciltot-row .row-label {
  font-size: 12px;
  font-style: italic;
}
.ciltot-row td {
  vertical-align: bottom;
  padding-bottom: 2px;
  border-bottom: 1px dashed var(--color-accent-border-soft);
}
.ciltot-spacer {
  border-bottom: 1px dashed var(--color-accent-border-soft);
}
.device-row td {
  padding-top: 6px;
  padding-bottom: 6px;
}
.device-row:not(:last-child) td {
  padding-bottom: 12px;
  border-bottom: 1px solid #d1d5db;
}
.metric-field {
  display: grid;
  grid-template-columns: var(--bio-prefix-width) var(--bio-input-width);
  gap: 6px;
  align-items: center;
  min-width: 0;
}
.metric-prefix {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-label);
  font-style: italic;
  white-space: nowrap;
}
.metric-prefix--spacer {
  visibility: hidden;
}
.metric-field :deep(.bio-cell) {
  width: var(--bio-input-width);
  min-width: var(--bio-input-width);
  max-width: var(--bio-input-width);
  box-sizing: border-box;
}
.th-title {
  line-height: 1.1;
}
.tol-hint {
  min-height: 14px;
  margin-top: 2px;
  font-size: 10px;
  font-weight: 500;
  color: #6b7280;
  line-height: 1.2;
}
.tol-hint.alert {
  color: #b91c1c;
}
.alert-cell :deep(.bio-cell) {
  border-color: #fca5a5;
  background: #fff1f2;
}
</style>
