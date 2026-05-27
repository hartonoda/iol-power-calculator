<template>
  <div v-if="show" class="overlay" @click.self="$emit('close')">
    <div class="modal">
      <div class="header">
        <h3>Importa paziente da SmartIOL</h3>
        <button type="button" class="close-btn" @click="$emit('close')">✕</button>
      </div>

      <div class="search-row">
        <input
          v-model="search"
          type="text"
          placeholder="Cerca per nome..."
          @keydown.enter.prevent="loadPatients"
        />
        <button type="button" class="action-btn" :disabled="loadingPatients" @click="loadPatients">
          Cerca
        </button>
      </div>

      <p v-if="error" class="error">{{ error }}</p>

      <div class="content">
        <section class="panel">
          <h4>Pazienti SmartIOL</h4>
          <div class="list">
            <SmartIolPatientItem
              v-for="(patient, idx) in patients"
              :key="patient.id ?? `${patient.name}-${patient.dateOfBirth}-${idx}`"
              :patient="patient"
              :selected="selectedIndex === idx"
              @select="selectPatient(patient, idx)"
            />
            <div v-if="!loadingPatients && patients.length === 0" class="empty">Nessun paziente trovato</div>
          </div>
        </section>

        <section class="panel">
          <div class="operations-header">
            <h4>Interventi SmartIOL</h4>
            <div class="ops-actions">
              <button type="button" class="mini-btn" :disabled="loadingOperations" @click="selectAllOperations">
                Seleziona tutti
              </button>
              <button type="button" class="mini-btn" :disabled="loadingOperations" @click="clearOperationsSelection">
                Deseleziona
              </button>
            </div>
          </div>
          <div class="operations-meta">
            Selezionati: {{ selectedOperationKeys.length }} / {{ selectableOperationsCount }}
          </div>
          <div class="list operations-list">
            <div v-if="!selected" class="empty">Seleziona prima un paziente</div>
            <div v-else-if="loadingOperations" class="empty">Caricamento interventi...</div>
            <label
              v-for="operation in operations"
              :key="operation.key"
              class="operation-row"
              :class="{ duplicate: operation.duplicate }"
            >
              <input
                type="checkbox"
                :checked="selectedOperationKeys.includes(operation.key)"
                :disabled="operation.duplicate"
                @change="toggleOperationSelection(operation.key, $event.target.checked)"
              />
              <span class="op-main">{{ operation.operationDate }} - {{ operation.eye }}</span>
              <span class="op-note">{{ operation.noteIntervento || 'Intervento senza note' }}</span>
              <span v-if="operation.duplicate" class="dup-badge">Gia presente</span>
            </label>
            <div v-if="selected && !loadingOperations && operations.length === 0" class="empty">
              Nessun intervento disponibile
            </div>
          </div>
        </section>
      </div>

      <div class="footer">
        <button type="button" class="secondary-btn" @click="$emit('close')">Chiudi</button>
        <button type="button" class="primary-btn" :disabled="!canImport" @click="importSelected">
          {{ importing ? 'Importazione...' : 'Importa paziente + interventi selezionati' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import SmartIolPatientItem from '@/components/atoms/SmartIolPatientItem.vue';

const props = defineProps({
  show: { type: Boolean, default: false },
});

const emit = defineEmits(['close', 'imported']);

const search = ref('');
const patients = ref([]);
const selected = ref(null);
const selectedIndex = ref(-1);
const operations = ref([]);
const selectedOperationKeys = ref([]);
const loadingPatients = ref(false);
const loadingOperations = ref(false);
const importing = ref(false);
const error = ref('');

const selectableOperationsCount = computed(
  () => operations.value.filter((item) => !item.duplicate).length,
);
const canImport = computed(() => !!selected.value && !importing.value && !loadingOperations.value);

watch(
  () => props.show,
  async (isOpen) => {
    if (!isOpen) return;
    search.value = '';
    selected.value = null;
    selectedIndex.value = -1;
    operations.value = [];
    selectedOperationKeys.value = [];
    error.value = '';
    await loadPatients();
  },
);

async function loadPatients() {
  if (!window.api?.patient?.listFromSmartiol) return;
  loadingPatients.value = true;
  error.value = '';
  try {
    patients.value = await window.api.patient.listFromSmartiol(search.value || '');
  } catch (err) {
    error.value = err?.message || 'Errore nel caricamento pazienti SmartIOL';
  } finally {
    loadingPatients.value = false;
  }
}

async function loadOperationsForPatient(patient) {
  if (!window.api?.patient?.listOperationsFromSmartiol) return;
  loadingOperations.value = true;
  error.value = '';
  try {
    const response = await window.api.patient.listOperationsFromSmartiol({
      id: Number(patient.id),
      name: String(patient.name || '').trim(),
      dateOfBirth: String(patient.dateOfBirth || '').trim(),
    });
    if (!response?.success) {
      error.value = response?.error || 'Errore nel caricamento interventi SmartIOL';
      operations.value = [];
      selectedOperationKeys.value = [];
      return;
    }
    operations.value = response.operations || [];
    selectedOperationKeys.value = operations.value
      .filter((item) => !item.duplicate)
      .map((item) => item.key);
  } catch (err) {
    error.value = err?.message || 'Errore nel caricamento interventi SmartIOL';
    operations.value = [];
    selectedOperationKeys.value = [];
  } finally {
    loadingOperations.value = false;
  }
}

async function selectPatient(patient, idx) {
  selected.value = patient;
  selectedIndex.value = idx;
  await loadOperationsForPatient(patient);
}

function toggleOperationSelection(key, checked) {
  const current = new Set(selectedOperationKeys.value);
  if (checked) current.add(key);
  else current.delete(key);
  selectedOperationKeys.value = Array.from(current);
}

function selectAllOperations() {
  selectedOperationKeys.value = operations.value
    .filter((item) => !item.duplicate)
    .map((item) => item.key);
}

function clearOperationsSelection() {
  selectedOperationKeys.value = [];
}

async function importSelected() {
  if (!selected.value || !window.api?.patient?.importFromSmartiol) return;
  importing.value = true;
  error.value = '';
  try {
    const selectedKeys = Array.from(selectedOperationKeys.value || []).map((key) => String(key));
    const payload = {
      id: Number(selected.value.id),
      name: String(selected.value.name || '').trim(),
      dateOfBirth: String(selected.value.dateOfBirth || '').trim(),
      gender: String(selected.value.gender || '').trim(),
      selectedOperationKeys: selectedKeys,
    };
    const result = await window.api.patient.importFromSmartiol(payload);
    if (!result.success) {
      error.value = result.error || 'Importazione non riuscita';
      return;
    }
    emit('imported', result);
    emit('close');
  } catch (err) {
    error.value = err?.message || 'Importazione non riuscita';
  } finally {
    importing.value = false;
  }
}
</script>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(17, 24, 39, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.modal {
  width: min(980px, 95vw);
  max-height: 82vh;
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 24px 56px rgba(0, 0, 0, 0.25);
  display: flex;
  flex-direction: column;
}
.header {
  padding: 12px 16px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.header h3 {
  margin: 0;
  font-size: 16px;
  color: #1f2937;
}
.close-btn {
  border: none;
  background: transparent;
  font-size: 16px;
  cursor: pointer;
  color: #6b7280;
}
.search-row {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 8px;
  padding: 12px 16px 8px;
}
.search-row input {
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  padding: 8px 10px;
}
.content {
  display: grid;
  grid-template-columns: 1fr 1.2fr;
  gap: 12px;
  padding: 0 16px 8px;
  min-height: 360px;
}
.panel {
  min-height: 0;
  display: flex;
  flex-direction: column;
}
.panel h4 {
  margin: 8px 0 6px;
  font-size: 13px;
  color: #1f2937;
}
.action-btn {
  border: 1px solid #2563eb;
  background: #eff6ff;
  color: #1d4ed8;
  border-radius: 6px;
  padding: 8px 12px;
  font-weight: 600;
  cursor: pointer;
}
.list {
  padding: 8px 2px;
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 260px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}
.operations-list {
  padding: 8px;
}
.empty {
  color: #6b7280;
  font-size: 13px;
  padding: 10px 2px;
}
.operations-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}
.ops-actions {
  display: flex;
  gap: 6px;
}
.mini-btn {
  border: 1px solid #cbd5e1;
  background: #fff;
  border-radius: 6px;
  font-size: 11px;
  color: #334155;
  padding: 5px 8px;
  cursor: pointer;
}
.mini-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.operations-meta {
  font-size: 11px;
  color: #64748b;
  margin-bottom: 6px;
}
.operation-row {
  display: grid;
  grid-template-columns: auto 120px 1fr auto;
  align-items: center;
  gap: 8px;
  padding: 7px 8px;
  border: 1px solid #e5e7eb;
  border-radius: 7px;
  background: #fff;
}
.operation-row.duplicate {
  background: #f8fafc;
}
.op-main {
  font-size: 12px;
  font-weight: 600;
  color: #0f172a;
}
.op-note {
  font-size: 11px;
  color: #475569;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.dup-badge {
  font-size: 10px;
  color: #92400e;
  background: #fef3c7;
  border: 1px solid #fcd34d;
  border-radius: 999px;
  padding: 2px 7px;
}
.error {
  margin: 0 16px;
  color: #b91c1c;
  font-size: 12px;
}
.footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px 16px;
  border-top: 1px solid #e5e7eb;
}
.secondary-btn,
.primary-btn {
  border-radius: 6px;
  padding: 8px 12px;
  font-weight: 600;
  cursor: pointer;
}
.secondary-btn {
  border: 1px solid #cbd5e1;
  background: #fff;
}
.primary-btn {
  border: 1px solid #2563eb;
  background: #2563eb;
  color: #fff;
}
.primary-btn:disabled,
.action-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
@media (max-width: 980px) {
  .content {
    grid-template-columns: 1fr;
  }
}
</style>
