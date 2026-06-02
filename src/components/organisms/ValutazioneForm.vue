<template>
  <div class="valutazione-form">
    <!-- Header -->
    <div class="header-grid">
      <label class="field">
        <span class="lbl">Data intervento:</span>
        <input v-model="form.operationDate" type="date" :disabled="disabled" />
      </label>
      <div class="field patient-field">
        <PatientAutocomplete
          v-model="form.patientId"
          label="Paziente:"
          :patients="patients"
          :disabled="disabled || isExisting"
          @add-new="$emit('add-new-patient')"
        />
      </div>
      <label class="field narrow">
        <span class="lbl">Età:</span>
        <input :value="displayAge" type="text" disabled class="readonly" />
      </label>
      <label class="field narrow">
        <span class="lbl">Occhio:</span>
        <select v-model="form.eye" :disabled="disabled || isExisting">
          <option value="">—</option>
          <option value="OD">OD</option>
          <option value="OS">OS</option>
        </select>
      </label>
      <label class="field intervento-field">
        <span class="lbl">Intervento di:</span>
        <FmSelect
          v-model="form.interventoDi"
          :options="dropdownOptions.interventoDi"
          :disabled="disabled"
          placeholder="—"
        />
      </label>
      <label class="field costo-field">
        <span class="lbl">Costo:</span>
        <input v-model="form.costo" type="text" :disabled="disabled" />
      </label>
    </div>

    <label class="full-row">
      <span class="lbl">Note intervento:</span>
      <input v-model="form.noteIntervento" type="text" class="full-input" :disabled="disabled" />
    </label>

    <!-- Refrazione -->
    <div class="refraction-row">
      <span class="section-label">Refrazione e visus:</span>
      <label class="inline"><span class="lbl">sf.:</span>
        <input
          :value="form.bcdva_sph"
          type="text"
          class="mini"
          :disabled="disabled"
          inputmode="decimal"
          @input="form.bcdva_sph = normalizeDecimal($event.target.value)"
          @blur="form.bcdva_sph = formatDiopter(form.bcdva_sph)"
        />
      </label>
      <label class="inline"><span class="lbl">cil.:</span>
        <input
          :value="form.bcdva_cyl"
          type="text"
          class="mini"
          :disabled="disabled"
          inputmode="decimal"
          @input="form.bcdva_cyl = normalizeDecimal($event.target.value)"
          @blur="form.bcdva_cyl = formatDiopter(form.bcdva_cyl)"
        />
      </label>
      <label class="inline"><span class="lbl">ax:</span>
        <input v-model="form.bcdva_ax" type="text" class="mini" :disabled="disabled" />
      </label>
      <span class="eq">=</span>
      <label class="inline va-field">
        <div class="va-input-wrap">
          <select v-model="form.bcdva_va" class="mini va-select" :disabled="disabled">
            <option value="">—</option>
            <option v-for="opt in visusOptions" :key="opt" :value="opt">
              {{ visusOptionLabel(opt) }}
            </option>
          </select>
          <span class="va-suffix">/10</span>
        </div>
      </label>
      <label class="inline"><span class="lbl">Target:</span>
        <input
          :value="form.target"
          type="text"
          class="mini"
          :disabled="disabled"
          inputmode="decimal"
          @input="form.target = normalizeDecimal($event.target.value)"
          @blur="form.target = formatDiopter(form.target)"
        />
      </label>
      <label class="inline grow contralateral-field">
        <span class="lbl">Occhio controlaterale:</span>
        <FmSelect
          v-model="form.contralateralEye"
          :options="dropdownOptions.contralateralEye"
          :disabled="disabled"
          placeholder="—"
        />
      </label>
    </div>

    <ValutazioneNotesSection :form="form" :disabled="disabled" />
    <BiometryDeviceTable :form="form" :disabled="disabled" />
    <ValutazioneIOLSection :form="form" :disabled="disabled" />

    <!-- Footer -->
    <div class="footer-row">
      <label class="footer-field tunnel-field">
        <span class="lbl">Tunnel:</span>
        <input v-model="form.tunnel" type="text" :disabled="disabled" />
      </label>
      <label class="footer-field model-field">
        <span class="lbl">Modello IOL:</span>
        <FmSelect
          v-model="form.iolModelSelected"
          :options="iolModelOptions"
          :disabled="disabled"
          placeholder="—"
        />
      </label>
      <label class="footer-field narrow">
        <span class="lbl">T:</span>
        <input v-model="form.iolT" type="text" :disabled="disabled" />
      </label>
      <label class="footer-field narrow">
        <span class="lbl">AX IOL:</span>
        <input v-model="form.iolAx" type="text" :disabled="disabled" />
      </label>
      <label class="footer-field power-field">
        <span class="lbl">Potere IOL:</span>
        <input v-model="form.iolPower" type="text" class="power-input" :disabled="disabled" />
      </label>
    </div>
  </div>
</template>

<script setup>
import { computed, watch } from 'vue';
import PatientAutocomplete from '@/components/atoms/PatientAutocomplete.vue';
import {
  normalizeDecimal,
  formatDiopter,
  formatDiopterFields,
  formatVisusFields,
  VISUS_VA_OPTIONS,
} from '@/utils/numberUtils';
import FmSelect from '@/components/atoms/FmSelect.vue';
import ValutazioneNotesSection from '@/components/molecules/ValutazioneNotesSection.vue';
import BiometryDeviceTable from '@/components/molecules/BiometryDeviceTable.vue';
import ValutazioneIOLSection from '@/components/molecules/ValutazioneIOLSection.vue';
import dropdownOptions from '@/config/dropdownOptions.json';

const props = defineProps({
  form: { type: Object, required: true },
  patients: { type: Array, default: () => [] },
  iolModels: { type: Array, default: () => [] },
  disabled: { type: Boolean, default: false },
  isExisting: { type: Boolean, default: false },
});

const iolModelOptions = computed(() => {
  const fromDb = props.iolModels.map((m) => m.name);
  const merged = [...dropdownOptions.iolModels];
  fromDb.forEach((name) => {
    if (name && !merged.includes(name)) merged.push(name);
  });
  return merged;
});

defineEmits(['add-new-patient']);

watch(
  () => props.form.id,
  () => {
    formatDiopterFields(props.form);
    formatVisusFields(props.form);
  },
  { immediate: true },
);

const visusOptions = VISUS_VA_OPTIONS;

function visusOptionLabel(opt) {
  if (opt === 'PL' || opt === 'CD') return opt;
  return opt.replace('/10', '');
}

const displayAge = computed(() => {
  const patient = props.patients.find((p) => p.id === Number(props.form.patientId));
  if (!patient?.dateOfBirth || !props.form.operationDate) return '';
  const birth = new Date(patient.dateOfBirth);
  const op = new Date(props.form.operationDate);
  let age = op.getFullYear() - birth.getFullYear();
  const m = op.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && op.getDate() < birth.getDate())) age--;
  if (age >= 0) {
    props.form.age = age;
    return String(age);
  }
  return '';
});

</script>

<style scoped>
.valutazione-form {
  display: flex;
  flex-direction: column;
  gap: 10px;
  font-size: 13px;
}
.lbl {
  color: #1e40af;
  font-weight: 600;
  margin-right: 4px;
  white-space: nowrap;
}
.section-label {
  color: #1e40af;
  font-weight: 600;
}
.header-grid {
  display: grid;
  grid-template-columns: 140px 1fr 60px 70px minmax(130px, 11rem) minmax(100px, 8.5rem);
  gap: 10px 12px;
  align-items: end;
  border-bottom: 2px solid #2563eb;
  padding-bottom: 10px;
}
.intervento-field {
  min-width: 0;
}
.intervento-field :deep(.fm-select) {
  max-width: 11rem;
}
.costo-field input {
  min-width: 6.5rem;
}
.field {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.field input,
.field select {
  padding: 4px 6px;
  border: 1px solid #cbd5e1;
  font-size: 13px;
}
.patient-field {
  min-width: 0;
}
.readonly {
  background: #f8fafc;
}
.full-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.full-input {
  flex: 1;
  padding: 4px 8px;
  border: 1px solid #cbd5e1;
}
.refraction-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 12px;
  padding: 8px 0;
  border-bottom: 1px solid #e5e7eb;
}
.inline {
  display: flex;
  align-items: center;
  gap: 4px;
}
.mini {
  width: 56px;
  padding: 4px;
  border: 1px solid #cbd5e1;
  text-align: center;
}
.va-input-wrap {
  display: inline-flex;
  align-items: center;
  gap: 2px;
}
.va-select {
  min-width: 52px;
  max-width: 64px;
}
.va-suffix {
  color: #374151;
  font-size: 12px;
  font-weight: 600;
}
.eq {
  font-weight: 600;
  color: #374151;
}
.grow {
  flex: 1;
  min-width: 160px;
}
.contralateral-field {
  display: flex;
  align-items: center;
  gap: 8px;
}
.contralateral-field .fm-select {
  min-width: 140px;
}
.footer-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: end;
  border-top: 2px solid #2563eb;
  padding-top: 12px;
  margin-top: 4px;
}
.footer-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.footer-field input,
.footer-field select {
  padding: 6px 8px;
  border: 1px solid #cbd5e1;
}
.tunnel-field input {
  background: #fce7f3;
  max-width: 80px;
}
.model-field select {
  min-width: 180px;
  font-weight: 700;
  color: #b91c1c;
}
.power-field .power-input {
  font-weight: 700;
  color: #b91c1c;
  font-size: 15px;
  width: 72px;
}
.narrow {
  max-width: 90px;
}
@media (max-width: 1200px) {
  .header-grid {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
