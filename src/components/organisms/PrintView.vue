<template>
  <div class="print-view">
    <div class="print-row print-row-3">
      <span><strong>Data intervento:</strong> {{ formatDate(form.operationDate) }}</span>
      <span><strong>Paziente:</strong> {{ patientName }}</span>
      <span><strong>Età:</strong> {{ patientAge }}</span>
    </div>

    <div class="print-section print-highlight-section print-eye-section">
      <div class="print-highlight-grid print-highlight-grid-eye">
        <div class="highlight-field highlight-field-hero">
          <span class="highlight-label">Occhio</span>
          <span class="highlight-value-hero">{{ form.eye || '—' }}</span>
        </div>
        <div class="highlight-field">
          <span class="highlight-label">Intervento di</span>
          <span class="highlight-value highlight-value-intervento">{{ form.interventoDi || '—' }}</span>
        </div>
      </div>
    </div>

    <div v-if="form.noteIntervento" class="print-row print-row-emphasis">
      <span><strong>Note intervento:</strong> {{ form.noteIntervento }}</span>
    </div>

    <div class="print-section print-highlight-section">
      <div class="print-highlight-grid print-highlight-grid-refraction">
        <div class="highlight-field">
          <span class="highlight-label">Sfera</span>
          <span class="highlight-value">{{ form.bcdva_sph || '—' }}</span>
        </div>
        <div class="highlight-field">
          <span class="highlight-label">Cilindro</span>
          <span class="highlight-value">{{ form.bcdva_cyl || '—' }}</span>
        </div>
        <div class="highlight-field">
          <span class="highlight-label">Asse</span>
          <span class="highlight-value">{{ form.bcdva_ax ? form.bcdva_ax + '°' : '—' }}</span>
        </div>
        <div class="highlight-field highlight-field-primary">
          <span class="highlight-label">Visus</span>
          <span class="highlight-value-primary">{{ form.bcdva_va || '—' }}</span>
        </div>
        <div class="highlight-field">
          <span class="highlight-label">Target</span>
          <span class="highlight-value">{{ form.target || '—' }}</span>
        </div>
      </div>
    </div>

    <div class="print-row">
      <span><strong>Occhio controlaterale:</strong> {{ form.contralateralEye || '—' }}</span>
    </div>

    <div v-if="systemicItems.length" class="print-row print-row-notes print-row-emphasis">
      <span class="print-label">Note sistemiche:</span>
      <span class="note-list">{{ systemicItems.join(' · ') }}</span>
    </div>

    <div v-if="ocularItems.length" class="print-row print-row-notes print-row-emphasis">
      <span class="print-label">Note oculari:</span>
      <span class="note-list">{{ ocularItems.join(' · ') }}</span>
    </div>

    <div class="print-section print-highlight-section print-endothelial-section">
      <div class="print-highlight-grid print-highlight-grid-endothelial">
        <div class="highlight-field highlight-field-hero">
          <span class="highlight-label">Endotelio corneale</span>
          <span class="highlight-value-hero">
            {{ form.cellEndotelio || '—' }}
            <span class="endothelial-unit">cell/mm²</span>
          </span>
        </div>
        <div v-if="form.cellEndotelioNote" class="highlight-field">
          <span class="highlight-label">Note endotelio</span>
          <span class="highlight-value highlight-value-endothelial-note">{{ form.cellEndotelioNote }}</span>
        </div>
      </div>
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

    <div class="print-section print-highlight-section">
      <div class="print-highlight-grid print-highlight-grid-compat">
        <div v-for="c in compatScores" :key="c.key" class="highlight-field">
          <span class="highlight-label">{{ c.label }}</span>
          <span class="highlight-value">{{ formatCompatPercent(form[c.key]) }}</span>
        </div>
      </div>
    </div>

    <div class="print-section print-highlight-section print-iol-model-section">
      <div class="print-highlight-grid print-highlight-grid-iol-model">
        <div class="highlight-field">
          <span class="highlight-label">Modello IOL</span>
          <span class="highlight-value highlight-value-model">{{ form.iolModelSelected || '—' }}</span>
        </div>
        <div class="highlight-field highlight-field-hero">
          <span class="highlight-label">Potere IOL</span>
          <span class="highlight-value-hero">{{ form.iolPower || '—' }}</span>
        </div>
        <div class="highlight-field">
          <span class="highlight-label">T/Ast</span>
          <span class="highlight-value">{{ form.iolT || '—' }}</span>
        </div>
        <div class="highlight-field">
          <span class="highlight-label">AX IOL</span>
          <span class="highlight-value">{{ form.iolAx ? form.iolAx + '°' : '—' }}</span>
        </div>
        <div class="highlight-field">
          <span class="highlight-label">Tunnel</span>
          <span class="highlight-value">{{ form.tunnel || '—' }}</span>
        </div>
      </div>
    </div>

    <div v-if="showAnyIolPanel" class="print-section iol-residuals">
      <div v-if="showSfericaPanel" class="iol-res-block">
        <div class="iol-res-title">IOL sferica</div>
        <table class="print-table iol-res-table iol-res-table-columns">
          <thead>
            <tr>
              <th v-for="row in sfericaRows" :key="row.resKey">{{ row.shortLabel }}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td v-for="row in sfericaRows" :key="row.resKey">{{ form[row.resKey] || '—' }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="showToricaPanel" class="iol-res-block">
        <div class="iol-res-title">IOL torica</div>
        <table class="print-table iol-res-table iol-res-table-columns">
          <thead>
            <tr>
              <th class="col-metric"></th>
              <th v-for="row in toricaRows" :key="row.resKey">{{ row.shortLabel }}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="col-metric">Res.</td>
              <td v-for="row in toricaRows" :key="row.resKey + '-res'">{{ form[row.resKey] || '—' }}</td>
            </tr>
            <tr>
              <td class="col-metric">T</td>
              <td v-for="row in toricaRows" :key="row.resKey + '-t'">{{ form[row.tKey] || '—' }}</td>
            </tr>
            <tr>
              <td class="col-metric">Asse</td>
              <td v-for="row in toricaRows" :key="row.resKey + '-ax'">{{ formatAxis(form[row.axisKey]) }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="showPostLvcPanel" class="iol-res-block">
        <div class="iol-res-title">IOL post LVC</div>
        <table class="print-table iol-res-table iol-res-table-columns">
          <thead>
            <tr>
              <th v-for="row in postLvcRows" :key="row.resKey">{{ row.shortLabel }}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td v-for="row in postLvcRows" :key="row.resKey">{{ form[row.resKey] || '—' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { shouldShowIolPanel } from '@/utils/iolCalculationPanels.js';

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
  { label: 'Argos Barrett UII', shortLabel: 'Argos', resKey: 'iol_argos_barrett_res' },
  { label: 'Tomey Barrett UII', shortLabel: 'Tomey', resKey: 'iol_tomey_barrett_res' },
  { label: 'CSO Evo 2.0', shortLabel: 'Evo 2.0', resKey: 'iol_evo2_res' },
  { label: 'CSO Hoffer QST', shortLabel: 'Hoffer', resKey: 'iol_hoffer_qst_res' },
  { label: 'CSO Kane', shortLabel: 'Kane', resKey: 'iol_kane_res' },
  { label: 'CSO Pearl DGS', shortLabel: 'Pearl', resKey: 'iol_pearl_dgs_res' },
];

const toricaRows = [
  { label: 'Argos Barrett T', shortLabel: 'Argos', resKey: 'iol_argos_barrett_toric_res', tKey: 'iol_argos_barrett_toric_t', axisKey: 'iol_argos_barrett_toric_axis' },
  { label: 'Tomey Barrett T', shortLabel: 'Tomey', resKey: 'iol_tomey_barrett_toric_res', tKey: 'iol_tomey_barrett_toric_t', axisKey: 'iol_tomey_barrett_toric_axis' },
  { label: 'CSO Evo T', shortLabel: 'Evo', resKey: 'iol_evo_toric_res', tKey: 'iol_evo_toric', axisKey: 'iol_evo_toric_rescyl' },
  { label: 'CSO Hoffer QST T', shortLabel: 'Hoffer', resKey: 'iol_hoffer_qst_toric_res', tKey: 'iol_hoffer_qst_toric', axisKey: 'iol_hoffer_qst_toric_rescyl' },
  { label: 'CSO Kane T', shortLabel: 'Kane', resKey: 'iol_kane_toric_res', tKey: 'iol_kane_toric', axisKey: 'iol_kane_toric_rescyl' },
];

const postLvcRows = [
  { label: 'Argos Barrett TK', shortLabel: 'Argos TK', resKey: 'iol_argos_barrett_tk_res' },
  { label: 'Tomey Barrett TK', shortLabel: 'Tomey TK', resKey: 'iol_tomey_barrett_tk_res' },
  { label: 'Tomey Oculix', shortLabel: 'Oculix', resKey: 'iol_tomey_oculix_res' },
  { label: 'CSO Ray tracing', shortLabel: 'Ray tr.', resKey: 'iol_ray_tracing_res' },
  { label: 'CSO Evo 2.0', shortLabel: 'Evo 2.0', resKey: 'iol_evo2_post_res' },
  { label: 'CSO Pearl DGS', shortLabel: 'Pearl', resKey: 'iol_pearl_dgs_post_res' },
];

const showSfericaPanel = computed(() => shouldShowIolPanel(props.form, 'sferica'));
const showToricaPanel = computed(() => shouldShowIolPanel(props.form, 'torica'));
const showPostLvcPanel = computed(() => shouldShowIolPanel(props.form, 'postLvc'));
const showAnyIolPanel = computed(
  () => showSfericaPanel.value || showToricaPanel.value || showPostLvcPanel.value,
);

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

function formatNoteItemForPrint(item) {
  const trimmed = String(item || '').trim();
  const altroMatch = trimmed.match(/^Altro:\s*(.*)$/i);
  if (altroMatch) {
    return altroMatch[1].trim();
  }
  return trimmed;
}

function parseNoteItems(text) {
  const raw = String(text || '').trim();
  if (!raw) return [];
  if (raw === 'Nessuna') return ['Nessuna'];
  return raw
    .split(';')
    .map((s) => formatNoteItemForPrint(s))
    .filter(Boolean);
}

const systemicItems = computed(() => parseNoteItems(props.form.noteSistemic));
const ocularItems = computed(() => parseNoteItems(props.form.noteEye));

function formatAxis(val) {
  const t = String(val || '').trim();
  if (!t) return '—';
  return t.includes('°') ? t : `${t}°`;
}

function formatCompatPercent(value) {
  const t = String(value ?? '').trim();
  if (!t) return '—';
  return t.includes('%') ? t : `${t}%`;
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

.print-row-notes .print-label {
  font-weight: 600;
  color: var(--color-label);
  flex: 0 0 auto;
}

.note-list {
  flex: 1 1 auto;
  min-width: 0;
}

.print-row-emphasis {
  font-size: 12pt;
  line-height: 1.45;
  padding: 6px 0;
}

.print-row-emphasis .print-label,
.print-row-emphasis strong {
  font-size: 12pt;
}

.print-row-emphasis .note-list {
  font-size: 12pt;
}

.print-highlight-section {
  width: 100%;
  padding: 8px 12px;
  background: #f8fafc;
  border-top: 2px solid var(--color-section-divider);
  border-bottom: 2px solid var(--color-section-divider);
}

.print-highlight-grid {
  display: grid;
  width: 100%;
  gap: 8px 16px;
  align-items: end;
}

.print-highlight-grid-refraction {
  grid-template-columns: repeat(5, minmax(0, 1fr));
}

.print-highlight-grid-eye {
  grid-template-columns: minmax(0, 1fr) minmax(0, 2.5fr);
  align-items: end;
}

.print-highlight-grid-endothelial {
  grid-template-columns: minmax(0, 1fr) minmax(0, 2fr);
  align-items: end;
}

.print-highlight-grid-compat {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.print-highlight-grid-iol-model {
  grid-template-columns: minmax(0, 1.8fr) minmax(0, 1.4fr) repeat(3, minmax(0, 1fr));
}

.highlight-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.highlight-label {
  font-size: 9pt;
  font-weight: 600;
  color: var(--color-label);
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.highlight-value {
  font-size: 12pt;
  font-weight: 600;
  color: #111;
  line-height: 1.2;
}

.highlight-value-primary {
  font-size: 16pt;
  font-weight: 700;
  color: #111;
  line-height: 1.2;
  word-break: break-word;
}

.highlight-value-hero {
  font-size: 28pt;
  font-weight: 800;
  color: #111;
  line-height: 1.1;
}

.print-eye-section .highlight-value-hero {
  font-size: 34pt;
  letter-spacing: 0.06em;
}

.print-eye-section .highlight-value-intervento {
  font-size: 14pt;
  font-weight: 600;
}

.print-endothelial-section .highlight-value-hero {
  font-size: 24pt;
}

.print-endothelial-section .endothelial-unit {
  font-size: 12pt;
  font-weight: 600;
  margin-left: 4px;
}

.print-endothelial-section .highlight-value-endothelial-note {
  font-size: 14pt;
}

.print-iol-model-section .highlight-label {
  font-size: 10pt;
}

.print-iol-model-section .highlight-value-model {
  font-size: 18pt;
  font-weight: 700;
  line-height: 1.2;
  word-break: break-word;
}

.print-iol-model-section .highlight-value {
  font-size: 14pt;
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
  color: var(--color-label);
  font-size: 8.5pt;
}

.col-device {
  text-align: left !important;
  font-weight: 600;
  color: var(--color-label);
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
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.iol-res-block {
  width: 100%;
}

.iol-res-title {
  font-weight: 600;
  color: var(--color-label);
  font-size: 9.5pt;
  margin-bottom: 4px;
}

.iol-res-table-columns .col-metric {
  text-align: left !important;
  font-weight: 600;
  color: var(--color-label);
  width: 8%;
  white-space: nowrap;
  font-size: 8.5pt;
}

.iol-res-table-columns th {
  font-size: 8pt;
  line-height: 1.2;
  padding: 3px 4px;
}

.iol-res-table-columns td {
  padding: 3px 4px;
  font-size: 8.5pt;
}

@media print {
  .print-row,
  .print-section,
  .iol-res-block,
  .print-highlight-section {
    page-break-inside: avoid;
  }
}
</style>
