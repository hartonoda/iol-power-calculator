<template>
  <div class="admin-list-panel">
    <div class="panel-header no-print">
      <h2>Lista per amministrazione</h2>
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
            ref="operationDateInput"
            v-model="operationDate"
            type="date"
            @click="openDatePicker"
          />
          <button
            type="button"
            class="calendar-btn"
            title="Seleziona data"
            @click="openDatePicker"
          >
            <SvgIcon name="calendar" :size="16" />
          </button>
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

    <div class="list-meta no-print">
      <span v-if="operationDate"><strong>Data intervento:</strong> {{ formatFilterDate(operationDate) }}</span>
      <span v-if="search.trim()"><strong>Paziente:</strong> {{ search.trim() }}</span>
      <span><strong>Interventi:</strong> {{ filteredOperations.length }}</span>
      <button type="button" class="sort-btn" @click="toggleSort">
        {{ sortBy === 'name' ? 'Ordina per data' : 'Ordina per paziente' }}
      </button>
    </div>

    <div class="list-container no-print">
      <div v-if="filteredOperations.length === 0" class="empty-list">
        <SvgIcon name="calendar" :size="40" :stroke-width="1.5" />
        <p>Nessun intervento trovato</p>
      </div>

      <AdministrationListTable
        v-else
        :operations="filteredOperations"
        :patients="patients"
        show-open-action
        unknown-patient-label="Paziente sconosciuto"
        @open-operation="$emit('open-operation', $event)"
      />
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
import { ref, computed, watch } from 'vue';
import SvgIcon from '@/components/atoms/SvgIcon.vue';
import AdministrationListTable from '@/components/molecules/AdministrationListTable.vue';
import AdministrationListPrintView from '@/components/organisms/AdministrationListPrintView.vue';
import { printAsPdf } from '@/utils/exportUtils';

const ADMIN_LIST_DATE_KEY = 'adminListOperationDate';

function readStoredOperationDate() {
  try {
    return localStorage.getItem(ADMIN_LIST_DATE_KEY) || '';
  } catch {
    return '';
  }
}

function storeOperationDate(value) {
  try {
    if (value) {
      localStorage.setItem(ADMIN_LIST_DATE_KEY, value);
    } else {
      localStorage.removeItem(ADMIN_LIST_DATE_KEY);
    }
  } catch {
    // ignore storage errors
  }
}

const props = defineProps({
  operations: { type: Array, default: () => [] },
  patients: { type: Array, default: () => [] },
});

defineEmits(['open-operation']);

const operationDate = ref(readStoredOperationDate());
const operationDateInput = ref(null);
const search = ref('');
/** @type {import('vue').Ref<'name' | 'date'>} */
const sortBy = ref('name');

watch(operationDate, (value) => {
  storeOperationDate(value);
});

const filteredOperations = computed(() => {
  let ops = [...props.operations];

  if (operationDate.value) {
    ops = ops.filter((op) => op.operationDate === operationDate.value);
  }

  const query = search.value.trim().toLowerCase();
  if (query) {
    ops = ops.filter((op) => getPatientName(op.patientId).toLowerCase().includes(query));
  }

  if (sortBy.value === 'date') {
    return ops.sort((a, b) => {
      const byDate = (b.operationDate || '').localeCompare(a.operationDate || '');
      if (byDate !== 0) return byDate;
      const byName = getPatientName(a.patientId).localeCompare(
        getPatientName(b.patientId),
        'it',
        { sensitivity: 'base' },
      );
      if (byName !== 0) return byName;
      return (a.eye || '').localeCompare(b.eye || '', 'it', { sensitivity: 'base' });
    });
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

function toggleSort() {
  sortBy.value = sortBy.value === 'name' ? 'date' : 'name';
}

function getPatientName(patientId) {
  const patient = props.patients.find((p) => p.id === patientId);
  return patient?.name || 'Paziente sconosciuto';
}

function formatFilterDate(value) {
  if (!value) return '';
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function openDatePicker() {
  const input = operationDateInput.value;
  if (!input) return;
  input.focus();
  if (typeof input.showPicker === 'function') {
    try {
      input.showPicker();
      return;
    } catch {
      // showPicker can throw if not triggered by user gesture in some builds
    }
  }
  input.click();
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
  border: 1px solid var(--color-accent);
  border-radius: 6px;
  background: var(--color-accent-subtle-bg);
  color: var(--color-label);
  font-size: 13px;
  font-weight: 600;
}

.btn-print:hover:not(:disabled) {
  background: var(--color-accent-muted-bg);
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
  position: relative;
  display: flex;
  align-items: center;
  gap: 6px;
}

.date-input-wrap input {
  flex: 1;
  min-width: 0;
  padding: 6px 72px 6px 8px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 12px;
  background: #fff;
  cursor: pointer;
}

.date-input-wrap input::-webkit-calendar-picker-indicator {
  opacity: 0;
  position: absolute;
  right: 36px;
  width: 28px;
  height: 100%;
  cursor: pointer;
}

.date-input-wrap input:focus {
  outline: none;
  border-color: var(--color-accent-light);
}

.calendar-btn {
  position: absolute;
  right: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  border-radius: 4px;
  color: var(--color-label);
  cursor: pointer;
  flex-shrink: 0;
}

.calendar-btn:hover {
  background: var(--color-accent-muted-bg);
  color: var(--color-accent);
}

.clear-date-btn {
  position: absolute;
  right: 4px;
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
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: #fff;
  align-self: end;
}

.search-box:focus-within {
  border-color: var(--color-accent-light);
  box-shadow: 0 0 0 2px var(--color-accent-ring);
}

.search-box input {
  flex: 1;
  min-width: 0;
  border: none;
  outline: none;
  font-size: 13px;
}

.list-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px 20px;
  padding: 10px 20px;
  border-bottom: 1px solid #e5e7eb;
  background: #f8fafc;
  font-size: 13px;
  color: #374151;
  flex-shrink: 0;
}

.list-meta strong {
  color: var(--color-label);
}

.sort-btn {
  margin-left: auto;
  padding: 4px 10px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  background: #fff;
  color: var(--color-label);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

.sort-btn:hover {
  background: var(--color-accent-subtle-bg);
  border-color: var(--color-accent);
}

.list-container {
  flex: 1;
  overflow: auto;
  min-height: 0;
  padding: 0 20px 16px;
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

@media (max-width: 1100px) {
  .filters {
    grid-template-columns: 1fr;
  }
}
</style>
