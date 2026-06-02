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

    <AdministrationListTable
      v-if="operations.length"
      class="print-table-wrap"
      :operations="operations"
      :patients="patients"
    />

    <p v-else class="print-empty">Nessun intervento da stampare.</p>
  </div>
</template>

<script setup>
import AdministrationListTable from '@/components/molecules/AdministrationListTable.vue';

defineProps({
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

.print-empty {
  margin-top: 12px;
  color: #6b7280;
  font-size: 13pt;
}

.print-table-wrap :deep(.admin-list-table) {
  font-size: 12.5pt;
}

.print-table-wrap :deep(.admin-list-table thead th) {
  font-size: 12.5pt;
  position: static;
}

.print-table-wrap :deep(.admin-list-table th),
.print-table-wrap :deep(.admin-list-table td) {
  padding: 5px 6px;
}

.print-table-wrap :deep(.eye-badge) {
  font-size: 10pt;
  padding: 1px 6px;
}
</style>
