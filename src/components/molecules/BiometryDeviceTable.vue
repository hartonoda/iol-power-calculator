<template>
  <div class="biometry-block">
    <div class="top-meta-row">
      <label class="meta-field">
        <span class="meta-label">Endotelio corneale cell/mm²</span>
        <BioCell v-model="form.cellEndotelio" :disabled="disabled" />
      </label>
    </div>
    <table class="bio-table">
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
          <th>AXL</th>
          <th>ACD</th>
          <th>LT</th>
        </tr>
      </thead>
      <tbody>
        <tr class="ciltot-row">
          <td class="row-label">cil. tot. (CSO)</td>
          <td class="ciltot-spacer"></td>
          <td>
            <BioCell v-model="form.cilTotal" :disabled="disabled" />
          </td>
          <td class="ciltot-spacer" colspan="4"></td>
        </tr>
        <tr v-for="device in deviceRows" :key="device.key">
          <td class="row-label">{{ device.label }}</td>
          <td :class="{ 'alert-cell': metricWarnings.avgKm.alert }">
            <BioCell v-model="form[device.avgKm]" :disabled="disabled" />
          </td>
          <td :class="{ 'alert-cell': metricWarnings.cil.alert }">
            <BioCell v-model="form[device.cil]" :disabled="disabled" />
          </td>
          <td :class="{ 'alert-cell': metricWarnings.ax.alert }">
            <BioCell v-model="form[device.ax]" :disabled="disabled" />
          </td>
          <td><BioCell v-model="form[device.axl]" :disabled="disabled" /></td>
          <td><BioCell v-model="form[device.acd]" :disabled="disabled" /></td>
          <td><BioCell v-model="form[device.lt]" :disabled="disabled" /></td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import BioCell from '@/components/atoms/BioCell.vue';
import { deviceDiff, toleranceLabel } from '@/utils/biometryTolerance';

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
    axl: 'argos_AXL',
    acd: 'argos_ACD',
    lt: 'argos_LT',
  },
];

function maxDeviceDiff(a, b, c) {
  return Math.max(
    deviceDiff(props.form[a], props.form[b]) ?? 0,
    deviceDiff(props.form[b], props.form[c]) ?? 0,
    deviceDiff(props.form[a], props.form[c]) ?? 0,
  ) || null;
}

const metricWarnings = computed(() => {
  const avgKmDiff = maxDeviceDiff('cso_avgKm', 'tomey_avgKm', 'argos_avgKm');
  const cilDiff = maxDeviceDiff('cso_cil', 'tomey_cil', 'argos_cil');
  const axDiff = maxDeviceDiff('cso_ax', 'tomey_ax', 'argos_ax');

  return {
    avgKm: {
      label: toleranceLabel(avgKmDiff, 0.3),
      alert: avgKmDiff !== null && avgKmDiff > 0.3,
    },
    cil: {
      label: toleranceLabel(cilDiff, 0.3),
      alert: cilDiff !== null && cilDiff > 0.3,
    },
    ax: {
      label: toleranceLabel(axDiff, 0.1, '°'),
      alert: axDiff !== null && axDiff > 0.1,
    },
  };
});
</script>

<style scoped>
.biometry-block {
  border-top: 2px solid #2563eb;
  padding-top: 10px;
  margin-top: 10px;
}
.top-meta-row {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  margin-bottom: 8px;
  padding: 0 2px 2px;
}
.meta-field {
  display: flex;
  align-items: center;
  gap: 8px;
}
.meta-label {
  color: #1e40af;
  font-weight: 600;
  font-size: 12px;
  white-space: nowrap;
}
.bio-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 10px 8px;
  font-size: 13px;
}
.bio-table th {
  color: #1e40af;
  font-weight: 600;
  padding: 4px 6px;
  text-align: center;
  border-bottom: 1px solid #e5e7eb;
  vertical-align: top;
}
.row-label {
  color: #1e40af;
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
  border-bottom: 1px dashed #bfdbfe;
}
.ciltot-spacer {
  border-bottom: 1px dashed #bfdbfe;
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
