<template>
  <div class="iol-block">
    <SmartIolCompatibilitySection :form="form" :disabled="disabled" />
    <div class="iol-panels">
      <div class="iol-panel">
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
              <td><BioCell v-model="form[row.resKey]" :disabled="disabled" /></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="iol-panel">
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
              <td><BioCell v-model="form[row.resKey]" :disabled="disabled" /></td>
              <td><BioCell v-model="form[row.tKey]" :disabled="disabled" /></td>
              <td><BioCell v-model="form[row.axisKey]" :disabled="disabled" /></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="iol-panel">
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
              <td><BioCell v-model="form[row.resKey]" :disabled="disabled" /></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import BioCell from '@/components/atoms/BioCell.vue';
import SmartIolCompatibilitySection from '@/components/molecules/SmartIolCompatibilitySection.vue';

defineProps({
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
</script>

<style scoped>
.iol-block {
  border-top: 2px solid #2563eb;
  padding-top: 10px;
  margin-top: 10px;
}
.iol-panels {
  display: grid;
  grid-template-columns: 1fr 1.2fr 1fr;
  gap: 18px;
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
