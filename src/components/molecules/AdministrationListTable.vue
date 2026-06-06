<template>
  <table class="admin-list-table">
    <colgroup>
      <col class="col-date" />
      <col class="col-patient" />
      <col class="col-eye" />
      <col class="col-type" />
      <col class="col-model" />
      <col class="col-power" />
      <col class="col-tast" />
      <col class="col-cost" />
      <col v-if="showOpenAction" class="col-action" />
    </colgroup>
    <thead>
      <tr>
        <th>Data</th>
        <th>Paziente</th>
        <th>Occhio</th>
        <th>Tipo di intervento</th>
        <th>Modello IOL</th>
        <th>Potere IOL</th>
        <th>T/Ast</th>
        <th>Costo</th>
        <th v-if="showOpenAction" class="col-action"></th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="op in operations" :key="op.id">
        <td>{{ formatDate(op.operationDate) }}</td>
        <td class="col-patient">{{ getPatientName(op.patientId) }}</td>
        <td class="col-eye">
          <span v-if="op.eye" class="eye-badge" :class="op.eye.toLowerCase()">{{ op.eye }}</span>
          <span v-else>—</span>
        </td>
        <td>{{ op.interventoDi || '—' }}</td>
        <td class="col-model">{{ op.iolModelSelected || '—' }}</td>
        <td class="col-power">{{ op.iolPower || '—' }}</td>
        <td class="col-tast">{{ op.iolT || '—' }}</td>
        <td>{{ op.costo || '—' }}</td>
        <td v-if="showOpenAction" class="col-action">
          <button type="button" class="open-op-btn" @click="emit('open-operation', op)">
            Apre intervento
          </button>
        </td>
      </tr>
    </tbody>
  </table>
</template>

<script setup>
const props = defineProps({
  operations: { type: Array, default: () => [] },
  patients: { type: Array, default: () => [] },
  unknownPatientLabel: { type: String, default: '—' },
  showOpenAction: { type: Boolean, default: false },
});

const emit = defineEmits(['open-operation']);

function getPatientName(patientId) {
  const patient = props.patients.find((p) => p.id === patientId);
  return patient?.name || props.unknownPatientLabel;
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
.admin-list-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
  font-size: 13px;
}

.col-date { width: 9%; }
.col-patient { width: 18%; }
.col-eye { width: 5%; }
.col-type { width: 13%; }
.col-model { width: 20%; }
.col-power { width: 7%; }
.col-tast { width: 5%; }
.col-cost { width: 10%; }
.col-action { width: 13%; }

.admin-list-table th,
.admin-list-table td {
  border: 1px solid #cbd5e1;
  padding: 8px 6px;
  text-align: left;
  vertical-align: middle;
  word-break: break-word;
}

.admin-list-table thead th {
  position: sticky;
  top: 0;
  z-index: 1;
  background: #f1f5f9;
  color: var(--color-label);
  font-weight: 600;
  font-size: 12px;
}

.admin-list-table .col-eye,
.admin-list-table .col-power,
.admin-list-table .col-tast {
  text-align: center;
}

.admin-list-table td.col-patient,
.admin-list-table td.col-model {
  font-weight: 600;
}

.eye-badge {
  display: inline-block;
  font-size: 11px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 4px;
}

.eye-badge.od {
  background: var(--color-accent-muted-bg);
  color: var(--color-label);
}

.eye-badge.os {
  background: #dcfce7;
  color: var(--color-brand-dark);
}

.col-action {
  text-align: center;
  white-space: nowrap;
}

.open-op-btn {
  padding: 4px 8px;
  border: 1px solid var(--color-accent);
  border-radius: 6px;
  background: var(--color-accent-subtle-bg);
  color: var(--color-label);
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
}

.open-op-btn:hover {
  background: var(--color-accent-muted-bg);
  border-color: var(--color-accent-light);
}
</style>
