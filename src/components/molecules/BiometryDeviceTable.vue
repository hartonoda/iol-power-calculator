<template>
  <div class="biometry-block">
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
          <th title="Central corneal thickness">CCT</th>
          <th>AXL</th>
          <th>ACD</th>
          <th>LT</th>
        </tr>
      </thead>
      <tbody>
        <tr class="ciltot-row">
          <td class="row-label">tot. (CSO)</td>
          <td class="ciltot-spacer"></td>
          <td>
            <BioCell v-model="form.cilTotal" :disabled="disabled" />
          </td>
          <td>
            <BioCell v-model="form.axConclusion" :disabled="disabled" />
          </td>
          <td class="ciltot-spacer"></td>
          <td class="ciltot-spacer" colspan="3"></td>
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
          <td><BioCell v-model="form[device.cct]" :disabled="disabled" /></td>
          <td><BioCell v-model="form[device.axl]" :disabled="disabled" /></td>
          <td><BioCell v-model="form[device.acd]" :disabled="disabled" /></td>
          <td><BioCell v-model="form[device.lt]" :disabled="disabled" /></td>
        </tr>
        <tr class="mean-row">
          <td class="row-label">Media</td>
          <td>
            <BioCell v-model="form.mean_avgKm" :disabled="disabled" />
          </td>
          <td>
            <BioCell v-model="form.mean_cil" :disabled="disabled" />
          </td>
          <td>
            <BioCell v-model="form.mean_ax" :disabled="disabled" />
          </td>
          <td>
            <BioCell v-model="form.mean_CCT" :disabled="disabled" />
          </td>
          <td>
            <BioCell v-model="form.mean_AXL" :disabled="disabled" />
          </td>
          <td>
            <BioCell v-model="form.mean_ACD" :disabled="disabled" />
          </td>
          <td>
            <BioCell v-model="form.mean_LT" :disabled="disabled" />
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { computed, watch, onMounted } from 'vue';
import BioCell from '@/components/atoms/BioCell.vue';
import { deviceDiff, axisDiff, toleranceLabel, AX_TOLERANCE_DEG } from '@/utils/biometryTolerance';
import { meanNumeric, meanAxisDeg, formatBiometryMean } from '@/utils/biometryMeanUtils';

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

const meanMetrics = [
  { deviceKey: 'avgKm', meanKey: 'mean_avgKm', kind: 'decimal', digits: 2 },
  { deviceKey: 'cil', meanKey: 'mean_cil', kind: 'decimal', digits: 2 },
  { deviceKey: 'ax', meanKey: 'mean_ax', kind: 'axis' },
  { deviceKey: 'cct', meanKey: 'mean_CCT', kind: 'integer' },
  { deviceKey: 'axl', meanKey: 'mean_AXL', kind: 'decimal', digits: 2 },
  { deviceKey: 'acd', meanKey: 'mean_ACD', kind: 'decimal', digits: 2 },
  { deviceKey: 'lt', meanKey: 'mean_LT', kind: 'decimal', digits: 2 },
];

const deviceSourceSnapshot = computed(() =>
  deviceRows.flatMap((device) =>
    meanMetrics.map((m) => props.form[device[m.deviceKey]]),
  ),
);

function recalcMeans() {
  for (const metric of meanMetrics) {
    const values = deviceRows.map((device) => props.form[device[metric.deviceKey]]);
    const hasAny = values.some((v) => v !== '' && v != null);
    if (!hasAny) {
      props.form[metric.meanKey] = '';
      continue;
    }

    let raw;
    if (metric.deviceKey === 'ax') {
      raw = meanAxisDeg(values);
    } else {
      raw = meanNumeric(values);
    }

    props.form[metric.meanKey] = formatBiometryMean(raw, {
      kind: metric.kind,
      digits: metric.digits,
    });
  }
}

onMounted(() => {
  const hasSavedMeans = meanMetrics.some((m) => {
    const v = props.form[m.meanKey];
    return v !== '' && v != null;
  });
  if (!hasSavedMeans) recalcMeans();
});

watch(deviceSourceSnapshot, recalcMeans);

function maxDeviceDiff(a, b, c) {
  return Math.max(
    deviceDiff(props.form[a], props.form[b]) ?? 0,
    deviceDiff(props.form[b], props.form[c]) ?? 0,
    deviceDiff(props.form[a], props.form[c]) ?? 0,
  ) || null;
}

function maxAxisDiff(a, b, c) {
  const diffs = [
    axisDiff(props.form[a], props.form[b]),
    axisDiff(props.form[b], props.form[c]),
    axisDiff(props.form[a], props.form[c]),
  ].filter((d) => d !== null);
  return diffs.length ? Math.max(...diffs) : null;
}

const metricWarnings = computed(() => {
  const avgKmDiff = maxDeviceDiff('cso_avgKm', 'tomey_avgKm', 'argos_avgKm');
  const cilDiff = maxDeviceDiff('cso_cil', 'tomey_cil', 'argos_cil');
  const axDiff = maxAxisDiff('cso_ax', 'tomey_ax', 'argos_ax');

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
      label: toleranceLabel(axDiff, AX_TOLERANCE_DEG, '°'),
      alert: axDiff !== null && axDiff > AX_TOLERANCE_DEG,
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
.ciltot-row .row-label,
.mean-row .row-label {
  font-size: 12px;
  font-style: italic;
}
.ciltot-row td {
  vertical-align: bottom;
  padding-bottom: 2px;
  border-bottom: 1px dashed #bfdbfe;
}
.mean-row td {
  vertical-align: top;
  padding-top: 4px;
  border-top: 2px solid #93c5fd;
  background: #f8fafc;
}
.mean-row :deep(.bio-cell) {
  background: #fffbeb;
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
