<template>
  <div class="notes-block">
    <div class="notes-columns">
      <div class="note-col">
        <div class="section-label">Note sistemiche</div>
        <div class="checkbox-grid">
          <template v-for="opt in systemicConditions" :key="opt.value">
            <div v-if="opt.hasInput" class="problem-row">
              <label class="checkbox-item">
                <input
                  type="checkbox"
                  :value="opt.value"
                  v-model="selectedSystemic"
                  :disabled="disabled"
                  @change="onSystemicChange(opt.value)"
                />
                <span class="cb-box" :class="{ checked: selectedSystemic.includes(opt.value) }"></span>
                <span>{{ opt.label }}</span>
              </label>
              <input
                v-if="selectedSystemic.includes(opt.value)"
                v-model="systemicInputs[opt.value]"
                type="text"
                class="inline-input"
                :disabled="disabled"
              />
            </div>
            <label v-else class="checkbox-item">
              <input
                type="checkbox"
                :value="opt.value"
                v-model="selectedSystemic"
                :disabled="disabled"
                @change="onSystemicChange(opt.value)"
              />
              <span class="cb-box" :class="{ checked: selectedSystemic.includes(opt.value) }"></span>
              <span>{{ opt.label }}</span>
            </label>
          </template>
        </div>
      </div>

      <div class="note-col">
        <div class="section-label">Note oculari</div>
        <div class="checkbox-grid">
          <template v-for="opt in previousEyeOperations" :key="'p-' + opt.value">
            <label class="checkbox-item">
              <input type="checkbox" :value="opt.value" v-model="selectedPrev" :disabled="disabled" />
              <span class="cb-box" :class="{ checked: selectedPrev.includes(opt.value) }"></span>
              <span>{{ opt.label }}</span>
            </label>
          </template>

          <template v-for="opt in eyeConditions" :key="opt.value">
            <div v-if="opt.optionsKey" class="problem-row">
              <label class="checkbox-item">
                <input type="checkbox" :value="opt.value" v-model="selectedEye" :disabled="disabled" />
                <span class="cb-box" :class="{ checked: selectedEye.includes(opt.value) }"></span>
                <span class="problem-label">{{ opt.label }}</span>
              </label>
              <FmSelect
                v-if="selectedEye.includes(opt.value)"
                v-model="eyeDropdowns[opt.value]"
                :options="dropdownLists[opt.optionsKey]"
                :disabled="disabled"
                placeholder="—"
              />
            </div>
            <label v-else class="checkbox-item">
              <input type="checkbox" :value="opt.value" v-model="selectedEye" :disabled="disabled" />
              <span class="cb-box" :class="{ checked: selectedEye.includes(opt.value) }"></span>
              <span>{{ opt.label }}</span>
            </label>
          </template>
        </div>
        <label class="endothelial-label">
          Endotelio corneale cell/mm²
          <input v-model="form.cellEndotelio" type="text" class="endothelial-input" :disabled="disabled" />
        </label>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, reactive } from 'vue';
import noteOptions from '@/config/noteOptions.json';
import dropdownOptions from '@/config/dropdownOptions.json';
import FmSelect from '@/components/atoms/FmSelect.vue';

const props = defineProps({
  form: { type: Object, required: true },
  disabled: { type: Boolean, default: false },
});

const systemicConditions = noteOptions.systemicConditions;
const previousEyeOperations = noteOptions.previousEyeOperations;
const eyeConditions = noteOptions.eyeConditions;
const dropdownLists = dropdownOptions;

const selectedSystemic = ref([]);
const selectedPrev = ref([]);
const selectedEye = ref([]);
const systemicInputs = reactive({});
const eyeDropdowns = reactive({
  motility: '',
  eyelid: '',
  corneal: '',
  iris_pupil: '',
  lens: '',
  retinal: '',
});

let parsing = false;

function resetParsedState() {
  selectedSystemic.value = [];
  selectedPrev.value = [];
  selectedEye.value = [];
  Object.keys(systemicInputs).forEach((k) => {
    systemicInputs[k] = '';
  });
  Object.keys(eyeDropdowns).forEach((k) => {
    eyeDropdowns[k] = '';
  });
}

function buildSystemic() {
  if (selectedSystemic.value.includes('nessuna')) return 'Nessuna';
  const parts = selectedSystemic.value
    .filter((v) => v !== 'nessuna')
    .map((v) => {
      const opt = systemicConditions.find((c) => c.value === v);
      if (!opt) return null;
      const spec = systemicInputs[v]?.trim();
      if (opt.hasInput && spec) return `${opt.label} ${spec}`;
      return opt.label;
    })
    .filter(Boolean);
  return parts.join('; ');
}

function buildEye() {
  const parts = [];

  if (selectedPrev.value.includes('nessuna')) {
    parts.push('Nessuna');
  } else {
    selectedPrev.value
      .filter((v) => v !== 'nessuna')
      .forEach((v) => {
        const label = previousEyeOperations.find((c) => c.value === v)?.label;
        if (label) parts.push(label);
      });
  }

  eyeConditions.forEach((opt) => {
    if (!selectedEye.value.includes(opt.value)) return;
    if (opt.optionsKey) {
      const val = eyeDropdowns[opt.value]?.trim();
      parts.push(val ? `${opt.label} ${val}` : opt.label);
    } else {
      parts.push(opt.label);
    }
  });

  return parts.join('; ');
}

function parseEyeNote(stored) {
  if (!stored) return;
  eyeConditions.forEach((opt) => {
    if (!opt.optionsKey) return;
    const labelBase = opt.label.replace(':', '').trim();
    const re = new RegExp(`${escapeRegex(opt.label)}\\s*([^;]+)?`, 'i');
    const m = stored.match(re);
    if (m) {
      selectedEye.value.push(opt.value);
      const val = (m[1] || '').trim();
      if (val) eyeDropdowns[opt.value] = val;
    }
  });
  eyeConditions.filter((o) => !o.optionsKey).forEach((opt) => {
    if (stored.includes(opt.label)) selectedEye.value.push(opt.value);
  });
  previousEyeOperations.forEach((opt) => {
    if (stored.includes(opt.label)) selectedPrev.value.push(opt.value);
  });
}

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function parseSystemic(stored) {
  if (!stored) return;
  if (stored === 'Nessuna') {
    selectedSystemic.value = ['nessuna'];
    return;
  }
  systemicConditions.forEach((opt) => {
    if (stored.includes(opt.label.replace(':', '')) || stored.includes(opt.label)) {
      selectedSystemic.value.push(opt.value);
      if (opt.hasInput) {
        const m = stored.match(new RegExp(`${escapeRegex(opt.label)}\\s*([^;]+)`, 'i'));
        if (m) systemicInputs[opt.value] = m[1].trim();
      }
    }
  });
}

watch([selectedSystemic, selectedPrev, selectedEye, systemicInputs, eyeDropdowns], () => {
  if (parsing) return;
  props.form.noteSistemic = buildSystemic();
  props.form.noteEye = buildEye();
}, { deep: true });

function hydrateFromForm() {
  parsing = true;
  resetParsedState();
  parseSystemic(props.form.noteSistemic);
  if (!selectedSystemic.value.length && !props.form.noteSistemic) {
    selectedSystemic.value = ['nessuna'];
  }
  parseEyeNote(props.form.noteEye || '');
  if (!selectedPrev.value.length && !(props.form.noteEye || '').includes('Pregresso')) {
    selectedPrev.value = ['nessuna'];
  }
  parsing = false;
}

onMounted(() => {
  hydrateFromForm();
});

watch(
  () => [props.form.id, props.form.noteSistemic, props.form.noteEye],
  () => {
    hydrateFromForm();
  },
);

function onSystemicChange(value) {
  if (value === 'nessuna' && selectedSystemic.value.includes('nessuna')) {
    selectedSystemic.value = ['nessuna'];
  } else {
    const i = selectedSystemic.value.indexOf('nessuna');
    if (i > -1) selectedSystemic.value.splice(i, 1);
  }
}
</script>

<style scoped>
.notes-block {
  border-top: 2px solid #2563eb;
  padding-top: 10px;
}
.notes-columns {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
.section-label {
  font-weight: 600;
  color: #1e40af;
  margin-bottom: 8px;
  font-size: 13px;
}
.checkbox-grid {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.checkbox-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  cursor: pointer;
}
.checkbox-item input[type='checkbox'] {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}
.cb-box {
  width: 14px;
  height: 14px;
  border: 2px solid #2563eb;
  flex-shrink: 0;
  background: white;
}
.cb-box.checked {
  border-color: #c41e3a;
  background: #c41e3a;
  position: relative;
}
.cb-box.checked::after {
  content: '✕';
  color: white;
  font-size: 11px;
  font-weight: bold;
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}
.problem-row {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 8px;
  align-items: center;
}
.problem-label {
  white-space: nowrap;
}
.inline-input {
  padding: 3px 6px;
  border: 1px solid #1f2937;
  font-size: 12px;
}
.endothelial-label {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  font-size: 12px;
  color: #1e40af;
  font-weight: 600;
}
.endothelial-input {
  width: 100px;
  padding: 4px 6px;
  border: 1px solid #1f2937;
}
</style>
