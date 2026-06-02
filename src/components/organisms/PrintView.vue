<template>
  <div class="print-view">
    <div class="print-row print-row-3">
      <span><strong>Data intervento:</strong> {{ formatDate(form.operationDate) }}</span>
      <span><strong>Paziente:</strong> {{ patientName }}</span>
      <span><strong>Età:</strong> {{ patientAge }}</span>
    </div>

    <div class="print-row print-row-2">
      <span><strong>Occhio:</strong> {{ form.eye || '—' }}</span>
      <span><strong>Intervento di:</strong> {{ form.interventoDi || '—' }}</span>
    </div>

    <div v-if="form.noteIntervento" class="print-row">
      <span><strong>Note intervento:</strong> {{ form.noteIntervento }}</span>
    </div>

    <div class="print-row print-row-refraction">
      <span class="print-label">Refrazione e visus:</span>
      <span>sf. {{ form.bcdva_sph || '—' }}</span>
      <span>cil. {{ form.bcdva_cyl || '—' }}</span>
      <span>ax {{ form.bcdva_ax ? form.bcdva_ax + '°' : '—' }}</span>
      <span>= {{ form.bcdva_va || '—' }}</span>
      <span><strong>Target:</strong> {{ form.target || '—' }}</span>
    </div>

    <div class="print-row">
      <span><strong>Occhio controlaterale:</strong> {{ form.contralateralEye || '—' }}</span>
    </div>

    <div v-if="systemicItems.length" class="print-row print-row-notes">
      <span class="print-label">Note sistemiche:</span>
      <span class="note-list">{{ systemicItems.join(' · ') }}</span>
    </div>

    <div v-if="ocularItems.length" class="print-row print-row-notes">
      <span class="print-label">Note oculari:</span>
      <span class="note-list">{{ ocularItems.join(' · ') }}</span>
    </div>

    <div class="print-row">
      <span><strong>Endotelio corneale:</strong> {{ form.cellEndotelio || '—' }} cell/mm²</span>
      <span v-if="form.cellEndotelioNote"><strong>Note:</strong> {{ form.cellEndotelioNote }}</span>
    </div>

    <div class="print-section">
      <table class="print-table bio-table">
        <thead>
          <tr>
            <th class="col-device"></th>
            <th>Avg Km</th>
            <th>cil.</th>
            <th>Ax</th>
            <th>CCT</th>
            <th>AXL</th>
            <th>ACD</th>
            <th>LT</th>
          </tr>
        </thead>
        <tbody>
          <tr class="ciltot-row">
            <td class="col-device">CSO tot.</td>
            <td></td>
            <td>{{ form.cilTotal || '—' }}</td>
            <td>{{ form.axConclusion ? form.axConclusion + '°' : '—' }}</td>
            <td colspan="4"></td>
          </tr>
          <tr v-for="d in biometryDevices" :key="d.key">
            <td class="col-device">{{ d.label }}</td>
            <td>{{ form[d.avgKm] || '—' }}</td>
            <td>{{ form[d.cil] || '—' }}</td>
            <td>{{ form[d.ax] ? form[d.ax] + '°' : '—' }}</td>
            <td>{{ form[d.cct] || '—' }}</td>
            <td>{{ form[d.axl] || '—' }}</td>
            <td>{{ form[d.acd] || '—' }}</td>
            <td>{{ form[d.lt] || '—' }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="print-row print-row-compat">
      <span class="print-label">SmartIOL:</span>
      <span v-for="c in compatScores" :key="c.key">
        <strong>{{ c.label }}</strong> {{ form[c.key] || '—' }}
      </span>
    </div>

    <div class="print-row print-row-iol-model">
      <span><strong>Modello IOL:</strong> {{ form.iolModelSelected || '—' }}</span>
      <span><strong>T/ast:</strong> {{ form.iolT || '—' }}</span>
      <span><strong>AX IOL:</strong> {{ form.iolAx ? form.iolAx + '°' : '—' }}</span>
      <span><strong>Potere IOL:</strong> {{ form.iolPower || '—' }}</span>
      <span><strong>Tunnel:</strong> {{ form.tunnel || '—' }}</span>
    </div>

    <div class="print-section iol-residuals">
      <div class="iol-residuals-grid">
        <div class="iol-res-block">
          <div class="iol-res-title">IOL sferica</div>
          <table class="print-table iol-res-table">
            <thead>
              <tr>
                <th></th>
                <th>Res.</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in sfericaRows" :key="row.resKey">
                <td class="col-formula">{{ row.label }}</td>
                <td>{{ form[row.resKey] || '—' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="iol-res-block">
          <div class="iol-res-title">IOL torica</div>
          <table class="print-table iol-res-table">
            <thead>
              <tr>
                <th></th>
                <th>Res.</th>
                <th>T</th>
                <th>Asse</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in toricaRows" :key="row.resKey">
                <td class="col-formula">{{ row.label }}</td>
                <td>{{ form[row.resKey] || '—' }}</td>
                <td>{{ row.tKey ? (form[row.tKey] || '—') : '—' }}</td>
                <td>{{ row.axisKey ? formatAxis(form[row.axisKey]) : '—' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="iol-res-block">
          <div class="iol-res-title">IOL post LVC</div>
          <table class="print-table iol-res-table">
            <thead>
              <tr>
                <th></th>
                <th>Res.</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in postLvcRows" :key="row.resKey">
                <td class="col-formula">{{ row.label }}</td>
                <td>{{ form[row.resKey] || '—' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  form: { type: Object, required: true },
  patients: { type: Array, default: () => [] },
});

const biometryDevices = [
  { key: 'cso', label: 'CSO', avgKm: 'cso_avgKm', cil: 'cso_cil', ax: 'cso_ax', cct: 'cso_CCT', axl: 'cso_AXL', acd: 'cso_ACD', lt: 'cso_LT' },
  { key: 'tomey', label: 'Tomey', avgKm: 'tomey_avgKm', cil: 'tomey_cil', ax: 'tomey_ax', cct: 'tomey_CCT', axl: 'tomey_AXL', acd: 'tomey_ACD', lt: 'tomey_LT' },
  { key: 'argos', label: 'Argos', avgKm: 'argos_avgKm', cil: 'argos_cil', ax: 'argos_ax', cct: 'argos_CCT', axl: 'argos_AXL', acd: 'argos_ACD', lt: 'argos_LT' },
];

const compatScores = [
  { label: 'Monof. std.', key: 'compat_monofocale_standard' },
  { label: 'Monof. plus', key: 'compat_monofocale_plus' },
  { label: 'EDOF', key: 'compat_edof' },
  { label: 'Multif.', key: 'compat_multifocal' },
];

const sfericaRows = [
  { label: 'Argos Barrett UII', resKey: 'iol_argos_barrett_res' },
  { label: 'Tomey Barrett UII', resKey: 'iol_tomey_barrett_res' },
  { label: 'CSO Evo 2.0', resKey: 'iol_evo2_res' },
  { label: 'CSO Hoffer QST', resKey: 'iol_hoffer_qst_res' },
  { label: 'CSO Kane', resKey: 'iol_kane_res' },
  { label: 'CSO Pearl DGS', resKey: 'iol_pearl_dgs_res' },
];

const toricaRows = [
  { label: 'Argos Barrett T', resKey: 'iol_argos_barrett_toric_res', tKey: 'iol_argos_barrett_toric_t', axisKey: 'iol_argos_barrett_toric_axis' },
  { label: 'Tomey Barrett T', resKey: 'iol_tomey_barrett_toric_res', tKey: 'iol_tomey_barrett_toric_t', axisKey: 'iol_tomey_barrett_toric_axis' },
  { label: 'CSO Evo T', resKey: 'iol_evo_toric_res', tKey: 'iol_evo_toric', axisKey: 'iol_evo_toric_rescyl' },
  { label: 'CSO Hoffer QST T', resKey: 'iol_hoffer_qst_toric_res', tKey: 'iol_hoffer_qst_toric', axisKey: 'iol_hoffer_qst_toric_rescyl' },
  { label: 'CSO Kane T', resKey: 'iol_kane_toric_res', tKey: 'iol_kane_toric', axisKey: 'iol_kane_toric_rescyl' },
];

const postLvcRows = [
  { label: 'Argos Barrett TK', resKey: 'iol_argos_barrett_tk_res' },
  { label: 'Tomey Barrett TK', resKey: 'iol_tomey_barrett_tk_res' },
  { label: 'Tomey Oculix', resKey: 'iol_tomey_oculix_res' },
  { label: 'CSO Ray tracing', resKey: 'iol_ray_tracing_res' },
  { label: 'CSO Evo 2.0', resKey: 'iol_evo2_post_res' },
  { label: 'CSO Pearl DGS', resKey: 'iol_pearl_dgs_post_res' },
];

const patientName = computed(() => {
  const patient = props.patients.find((p) => p.id == props.form.patientId);
  return patient?.name || '—';
});

const patientAge = computed(() => {
  if (props.form.age !== '' && props.form.age != null) return String(props.form.age);
  const patient = props.patients.find((p) => p.id == props.form.patientId);
  if (!patient?.dateOfBirth || !props.form.operationDate) return '—';
  const birth = new Date(patient.dateOfBirth);
  const op = new Date(props.form.operationDate);
  let years = op.getFullYear() - birth.getFullYear();
  const m = op.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && op.getDate() < birth.getDate())) years -= 1;
  return years >= 0 ? String(years) : '—';
});

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function parseNoteItems(text) {
  const raw = String(text || '').trim();
  if (!raw) return [];
  if (raw === 'Nessuna') return ['Nessuna'];
  return raw.split(';').map((s) => s.trim()).filter(Boolean);
}

const systemicItems = computed(() => parseNoteItems(props.form.noteSistemic));
const ocularItems = computed(() => parseNoteItems(props.form.noteEye));

function formatAxis(val) {
  const t = String(val || '').trim();
  if (!t) return '—';
  return t.includes('°') ? t : `${t}°`;
}
</script>

<style scoped>
.print-view {
  display: none;
  font-family: 'Segoe UI', system-ui, sans-serif;
  font-size: 10pt;
  line-height: 1.35;
  color: #111;
  width: 100%;
  max-width: 281mm;
}

@media print {
  .print-view {
    display: block !important;
  }
}

.print-row {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 6px 20px;
  padding: 4px 0;
  border-bottom: 1px solid #e5e7eb;
}

.print-row-3 > span {
  flex: 1 1 auto;
  min-width: 0;
}

.print-row-2 > span {
  flex: 1 1 40%;
}

.print-row-refraction {
  gap: 4px 10px;
}

.print-row-refraction .print-label {
  font-weight: 600;
  color: #1e40af;
  margin-right: 4px;
}

.print-row-notes .print-label {
  font-weight: 600;
  color: #1e40af;
  flex: 0 0 auto;
}

.note-list {
  flex: 1 1 auto;
  min-width: 0;
}

.print-row-compat {
  gap: 4px 12px;
}

.print-row-compat .print-label {
  font-weight: 600;
  color: #1e40af;
}

.print-row-iol-model {
  gap: 4px 10px;
}

.print-section {
  padding: 5px 0;
  border-bottom: 1px solid #e5e7eb;
}

.print-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 9pt;
  table-layout: fixed;
}

.print-table th,
.print-table td {
  border: 1px solid #cbd5e1;
  padding: 4px 6px;
  text-align: center;
  vertical-align: middle;
}

.print-table th {
  background: #f1f5f9;
  font-weight: 600;
  color: #1e40af;
  font-size: 8.5pt;
}

.col-device {
  text-align: left !important;
  font-weight: 600;
  color: #1e40af;
  width: 14%;
  white-space: nowrap;
}

.ciltot-row td {
  font-style: italic;
  background: #fafafa;
}

.iol-residuals {
  border-bottom: none;
  padding-bottom: 0;
}

.iol-residuals-grid {
  display: grid;
  grid-template-columns: 1fr 1.2fr 1fr;
  gap: 12px;
  align-items: start;
}

.iol-res-title {
  font-weight: 600;
  color: #1e40af;
  font-size: 9.5pt;
  margin-bottom: 4px;
}

.iol-res-table .col-formula {
  text-align: left !important;
  font-size: 8.5pt;
  line-height: 1.25;
  word-break: break-word;
}

@media print {
  .print-row,
  .print-section,
  .iol-res-block {
    page-break-inside: avoid;
  }
}
</style>
