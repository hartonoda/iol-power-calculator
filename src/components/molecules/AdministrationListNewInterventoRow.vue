<template>
  <tr class="new-intervento-label">
    <td :colspan="columnCount">Nuovo intervento</td>
  </tr>
  <tr class="new-intervento-row">
    <td class="col-order"></td>
    <td class="col-date">{{ formattedDate }}</td>
    <td class="col-patient">
      <PatientAutocomplete
        v-model="draft.patientId"
        :patients="patients"
        placeholder="Cerca paziente..."
        class="patient-compact"
        @add-new="$emit('add-new-patient')"
      />
    </td>
    <td class="col-eye">
      <select v-model="draft.eye" class="cell-input cell-select">
        <option value="">—</option>
        <option value="OD">OD</option>
        <option value="OS">OS</option>
      </select>
    </td>
    <td>
      <FmSelect
        v-model="draft.interventoDi"
        :options="interventoDiOptions"
        placeholder="—"
      />
    </td>
    <td class="col-model">
      <FmSelect
        v-model="draft.iolModelSelected"
        :options="iolModelOptions"
        placeholder="—"
      />
    </td>
    <td class="col-power">
      <input v-model="draft.iolPower" type="text" class="cell-input" />
    </td>
    <td class="col-tast">
      <input v-model="draft.iolT" type="text" class="cell-input" />
    </td>
    <td>
      <FmComboBox
        v-model="draft.costo"
        :options="costoOptionsList"
        placeholder="—"
      />
    </td>
    <td v-if="showOpenAction" class="col-action">
      <button
        type="button"
        class="save-btn"
        :disabled="isSaving"
        @click="save"
      >
        {{ isSaving ? '...' : 'Aggiungi' }}
      </button>
    </td>
  </tr>
  <tr v-if="errorMessage" class="new-intervento-error">
    <td :colspan="columnCount">{{ errorMessage }}</td>
  </tr>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue';
import PatientAutocomplete from '@/components/atoms/PatientAutocomplete.vue';
import FmComboBox from '@/components/atoms/FmComboBox.vue';
import FmSelect from '@/components/atoms/FmSelect.vue';
import dropdownOptions from '@/config/dropdownOptions.json';
import { costoOptions, interventoDiOptions } from '@/config/valutazioneDropdowns';

const props = defineProps({
  operationDate: { type: String, required: true },
  patients: { type: Array, default: () => [] },
  iolModels: { type: Array, default: () => [] },
  showOpenAction: { type: Boolean, default: true },
  selectPatientId: { type: [Number, String], default: null },
});

const emit = defineEmits(['add-new-patient', 'created', 'patient-selected']);

const costoOptionsList = costoOptions;

const isSaving = ref(false);
const errorMessage = ref('');

const draft = reactive({
  patientId: '',
  eye: '',
  interventoDi: 'Faco + IOL',
  iolModelSelected: '',
  iolPower: '',
  iolT: '',
  costo: '',
});

const columnCount = computed(() => (props.showOpenAction ? 10 : 9));

const iolModelOptions = computed(() => {
  const fromDb = props.iolModels.map((m) => m.name);
  const merged = [...dropdownOptions.iolModels];
  fromDb.forEach((name) => {
    if (name && !merged.includes(name)) merged.push(name);
  });
  return merged.sort((a, b) => a.localeCompare(b, 'it', { sensitivity: 'base' }));
});

const formattedDate = computed(() => {
  if (!props.operationDate) return '—';
  const [year, month, day] = props.operationDate.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
});

watch(
  () => props.selectPatientId,
  (id) => {
    if (id) {
      draft.patientId = id;
      emit('patient-selected');
    }
  },
);

watch(
  () => props.operationDate,
  () => {
    resetDraft();
  },
);

function resetDraft() {
  draft.patientId = '';
  draft.eye = '';
  draft.interventoDi = 'Faco + IOL';
  draft.iolModelSelected = '';
  draft.iolPower = '';
  draft.iolT = '';
  draft.costo = '';
  errorMessage.value = '';
}

function computeAge(patientId) {
  const patient = props.patients.find((p) => p.id === patientId);
  if (!patient?.dateOfBirth || !props.operationDate) return null;
  const birth = new Date(patient.dateOfBirth);
  const op = new Date(props.operationDate);
  let years = op.getFullYear() - birth.getFullYear();
  const monthDiff = op.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && op.getDate() < birth.getDate())) {
    years -= 1;
  }
  return years >= 0 ? String(years) : null;
}

async function save() {
  errorMessage.value = '';

  if (!draft.patientId) {
    errorMessage.value = 'Selezionare un paziente.';
    return;
  }
  if (!draft.eye) {
    errorMessage.value = "Selezionare l'occhio (OD/OS).";
    return;
  }

  isSaving.value = true;
  try {
    const result = await window.api.operation.add({
      operationDate: props.operationDate,
      patientId: draft.patientId,
      age: computeAge(draft.patientId),
      eye: draft.eye,
      interventoDi: draft.interventoDi || 'Faco + IOL',
      iolModelSelected: draft.iolModelSelected || null,
      iolPower: draft.iolPower || null,
      iolT: draft.iolT || null,
      costo: draft.costo || null,
    });

    if (!result.success) {
      errorMessage.value = result.error || 'Impossibile aggiungere l\'intervento.';
      return;
    }

    emit('created', result.id);
    resetDraft();
  } catch {
    errorMessage.value = 'Impossibile aggiungere l\'intervento.';
  } finally {
    isSaving.value = false;
  }
}
</script>

<style scoped>
.new-intervento-label td {
  border: 1px solid #cbd5e1;
  border-top: 2px solid var(--color-section-divider);
  background: #f8fafc;
  color: var(--color-label);
  font-weight: 600;
  font-size: 12px;
  padding: 8px 6px;
  text-align: left;
}

.new-intervento-row td {
  border: 1px solid #cbd5e1;
  padding: 6px;
  vertical-align: middle;
  background: #fff;
}

.new-intervento-error td {
  border: 1px solid #fecaca;
  background: #fef2f2;
  color: #b91c1c;
  font-size: 12px;
  padding: 6px;
}

.col-date {
  text-align: center;
  white-space: nowrap;
  color: var(--color-label);
  font-weight: 600;
}

.cell-input {
  width: 100%;
  min-width: 0;
  padding: 6px 4px;
  border: 1px solid #cbd5e1;
  border-radius: 4px;
  font-size: 12px;
  box-sizing: border-box;
}

.cell-input:focus {
  outline: none;
  border-color: var(--color-accent-light);
  box-shadow: 0 0 0 2px var(--color-accent-ring);
}

.cell-select {
  text-align: center;
}

.col-eye,
.col-power,
.col-tast {
  text-align: center;
}

.patient-compact :deep(label) {
  display: none;
}

.patient-compact :deep(input) {
  padding: 6px 28px 6px 8px;
  border: 1px solid #cbd5e1;
  border-radius: 4px;
  font-size: 12px;
}

.patient-compact :deep(input:focus) {
  border-color: var(--color-accent-light);
  box-shadow: 0 0 0 2px var(--color-accent-ring);
}

.new-intervento-row :deep(.fm-combobox),
.new-intervento-row :deep(.fm-select) {
  width: 100%;
  min-width: 0;
  padding: 6px 4px;
  border: 1px solid #cbd5e1;
  border-radius: 4px;
  font-size: 12px;
  box-sizing: border-box;
}

.col-action {
  text-align: center;
  white-space: nowrap;
}

.save-btn {
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

.save-btn:hover:not(:disabled) {
  background: var(--color-accent-muted-bg);
}

.save-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
