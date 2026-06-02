<template>
  <div class="admin-list-panel">
    <div class="panel-header no-print">
      <h2>Lista amministrazioni</h2>
      <button type="button" class="btn-print" :disabled="!filteredOperations.length" @click="handlePrint">
        <SvgIcon name="print" :size="14" />
        <span>Stampa</span>
      </button>
    </div>

    <div class="filters no-print">
      <div class="date-field">
        <label for="admin-op-date">Data intervento</label>
        <div class="date-input-wrap">
          <input
            id="admin-op-date"
            v-model="operationDate"
            type="date"
          />
          <button
            v-if="operationDate"
            type="button"
            class="clear-date-btn"
            title="Cancella data"
            @click="operationDate = ''"
          >
            <SvgIcon name="close" :size="14" />
          </button>
        </div>
      </div>
      <div class="search-box">
        <SvgIcon name="search" :size="16" />
        <input v-model="search" type="text" placeholder="Cerca paziente..." />
      </div>
    </div>

    <div class="list-container no-print">
      <div v-if="filteredOperations.length === 0" class="empty-list">
        <SvgIcon name="calendar" :size="40" :stroke-width="1.5" />
        <p>Nessun intervento trovato</p>
      </div>

      <div v-for="op in filteredOperations" :key="op.id" class="admin-row">
        <div class="admin-row-line admin-row-line-1">
          <span class="field"><strong>Data intervento:</strong> {{ formatDate(op.operationDate) }}</span>
          <span class="field eye-field">
            <strong>Occhio:</strong>
            <span class="eye-badge" :class="op.eye?.toLowerCase()">{{ op.eye || '—' }}</span>
          </span>
          <span class="field"><strong>Intervento di:</strong> {{ op.interventoDi || '—' }}</span>
          <span class="field"><strong>Costo:</strong> {{ op.costo || '—' }}</span>
        </div>
        <div class="admin-row-line admin-row-line-2">
          <span class="field"><strong>Paziente:</strong> {{ getPatientName(op.patientId) }}</span>
          <span class="field"><strong>Modello IOL:</strong> {{ op.iolModelSelected || '—' }}</span>
          <span class="field"><strong>T/ast:</strong> {{ op.iolT || '—' }}</span>
          <span class="field"><strong>Potere IOL:</strong> {{ op.iolPower || '—' }}</span>
        </div>
      </div>
    </div>

    <Teleport to="body">
      <AdministrationListPrintView
        :operations="filteredOperations"
        :patients="patients"
        :operation-date="operationDate"
        :search="search"
      />
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import SvgIcon from '@/components/atoms/SvgIcon.vue';
import AdministrationListPrintView from '@/components/organisms/AdministrationListPrintView.vue';
import { printAsPdf } from '@/utils/exportUtils';

const props = defineProps({
  operations: { type: Array, default: () => [] },
  patients: { type: Array, default: () => [] },
});

const operationDate = ref('');
const search = ref('');

const filteredOperations = computed(() => {
  let ops = [...props.operations];

  if (operationDate.value) {
    ops = ops.filter((op) => op.operationDate === operationDate.value);
  }

  const query = search.value.trim().toLowerCase();
  if (query) {
    ops = ops.filter((op) => getPatientName(op.patientId).toLowerCase().includes(query));
  }

  return ops.sort((a, b) => {
    const byName = getPatientName(a.patientId).localeCompare(
      getPatientName(b.patientId),
      'it',
      { sensitivity: 'base' },
    );
    if (byName !== 0) return byName;
    return (a.eye || '').localeCompare(b.eye || '', 'it', { sensitivity: 'base' });
  });
});

function getPatientName(patientId) {
  const patient = props.patients.find((p) => p.id === patientId);
  return patient?.name || 'Paziente sconosciuto';
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

async function handlePrint() {
  if (window.api?.print?.preview) {
    await window.api.print.preview();
  } else {
    await printAsPdf();
  }
}
</script>

<style scoped>
.admin-list-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #fff;
  overflow: hidden;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  border-bottom: 1px solid #e5e7eb;
  flex-shrink: 0;
}

.panel-header h2 {
  margin: 0;
  font-size: 17px;
  color: #1f2937;
}

.btn-print {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border: 1px solid #2563eb;
  border-radius: 6px;
  background: #eff6ff;
  color: #1e40af;
  font-size: 13px;
  font-weight: 600;
}

.btn-print:hover:not(:disabled) {
  background: #dbeafe;
}

.btn-print:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.filters {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  padding: 16px 20px;
  border-bottom: 1px solid #e5e7eb;
  background: #fafbfc;
  flex-shrink: 0;
}

.date-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.date-field label {
  font-size: 11px;
  font-weight: 500;
  color: #6b7280;
}

.date-input-wrap {
  display: flex;
  align-items: center;
  gap: 6px;
}

.date-input-wrap input {
  flex: 1;
  min-width: 0;
  padding: 6px 8px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 12px;
  background: #fff;
}

.date-input-wrap input:focus {
  outline: none;
  border-color: #4361ee;
}

.clear-date-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: none;
  background: #f3f4f6;
  border-radius: 4px;
  color: #6b7280;
  cursor: pointer;
  flex-shrink: 0;
}

.clear-date-btn:hover {
  background: #e5e7eb;
  color: #374151;
}

.search-box {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: #fff;
  align-self: end;
}

.search-box input {
  flex: 1;
  min-width: 0;
  border: none;
  outline: none;
  font-size: 13px;
}

.list-container {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
  padding: 8px 0 16px;
}

.empty-list {
  padding: 40px 20px;
  text-align: center;
  color: #9ca3af;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.empty-list p {
  margin: 0;
  font-weight: 500;
  color: #6b7280;
}

.admin-row {
  padding: 12px 20px;
  border-bottom: 1px solid #e5e7eb;
}

.admin-row-line {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px 16px;
  font-size: 13px;
  color: #374151;
}

.admin-row-line-2 {
  margin-top: 6px;
  color: #1f2937;
}

.field {
  min-width: 0;
  word-break: break-word;
}

.field strong {
  color: #1e40af;
  font-weight: 600;
  margin-right: 4px;
}

.eye-field {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.eye-badge {
  font-size: 11px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 4px;
}

.eye-badge.od {
  background: #dbeafe;
  color: #1e40af;
}

.eye-badge.os {
  background: #dcfce7;
  color: #166534;
}

@media (max-width: 1100px) {
  .filters {
    grid-template-columns: 1fr;
  }

  .admin-row-line {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
