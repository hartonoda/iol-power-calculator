<template>
  <div class="print-view admin-list-print">
    <h1 class="print-title">Lista amministrazioni</h1>

    <div class="print-meta">
      <span v-if="operationDate">
        <strong>Data intervento:</strong> {{ formatDate(operationDate) }}
      </span>
      <span v-if="search.trim()"><strong>Paziente:</strong> {{ search.trim() }}</span>
      <span><strong>Interventi:</strong> {{ operations.length }}</span>
      <span><strong>Stampa:</strong> {{ printedAt }}</span>
    </div>

    <table class="print-table">
      <colgroup>
        <col class="col-date" />
        <col class="col-patient" />
        <col class="col-eye" />
        <col class="col-type" />
        <col class="col-model" />
        <col class="col-power" />
        <col class="col-tast" />
        <col class="col-cost" />
      </colgroup>
      <thead>
        <tr>
          <th>Data</th>
          <th>Paziente</th>
          <th>Occhio</th>
          <th>Tipo di intervento</th>
          <th>Modello IOL</th>
          <th>Potere IOL</th>
          <th>T/ast</th>
          <th>Costo</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="op in operations" :key="op.id">
          <td>{{ formatDate(op.operationDate) }}</td>
          <td class="col-patient">{{ getPatientName(op.patientId) }}</td>
          <td class="col-eye">{{ op.eye || '—' }}</td>
          <td>{{ op.interventoDi || '—' }}</td>
          <td class="col-model">{{ op.iolModelSelected || '—' }}</td>
          <td class="col-power">{{ op.iolPower || '—' }}</td>
          <td class="col-tast">{{ op.iolT || '—' }}</td>
          <td>{{ op.costo || '—' }}</td>
        </tr>
      </tbody>
    </table>

    <p v-if="!operations.length" class="print-empty">Nessun intervento da stampare.</p>
  </div>
</template>

<script setup>
const props = defineProps({
  operations: { type: Array, default: () => [] },
  patients: { type: Array, default: () => [] },
  operationDate: { type: String, default: '' },
  search: { type: String, default: '' },
});

const printedAt = new Date().toLocaleString('it-IT', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

function getPatientName(patientId) {
  const patient = props.patients.find((p) => p.id === patientId);
  return patient?.name || '—';
}

function formatDate(dateString) {
  if (!dateString) return '—';
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}
</script>

<style scoped>
.admin-list-print {
  display: none;
  font-family: 'Segoe UI', system-ui, sans-serif;
  font-size: 13pt;
  line-height: 1.35;
  color: #111;
  width: 100%;
  max-width: 281mm;
}

@media print {
  .admin-list-print {
    display: block !important;
  }
}

.print-title {
  font-size: 18pt;
  color: #1e40af;
  margin: 0 0 8px;
}

.print-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 20px;
  margin-bottom: 10px;
  font-size: 13pt;
  color: #374151;
}

.print-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
  font-size: 12.5pt;
}

.col-date { width: 10%; }
.col-patient { width: 20%; }
.col-eye { width: 5%; }
.col-type { width: 14%; }
.col-model { width: 22%; }
.col-power { width: 7%; }
.col-tast { width: 6%; }
.col-cost { width: 16%; }

.print-table th,
.print-table td {
  border: 1px solid #cbd5e1;
  padding: 5px 6px;
  text-align: left;
  vertical-align: top;
  word-break: break-word;
}

.print-table .col-eye,
.print-table .col-power,
.print-table .col-tast {
  text-align: center;
}

.print-table th {
  background: #f1f5f9;
  color: #1e40af;
  font-weight: 600;
}

.print-table td.col-patient,
.print-table td.col-model {
  font-weight: 600;
}

.print-empty {
  margin-top: 12px;
  color: #6b7280;
  font-size: 13pt;
}
</style>
