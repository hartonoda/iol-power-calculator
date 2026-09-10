<template>
  <Teleport to="body">
    <div v-if="show" class="modal-overlay" @click.self="emit('close')">
      <div class="modal-card">
        <div class="modal-header">
          <h3>Prezzi interventi</h3>
          <button type="button" class="icon-btn" @click="emit('close')">
            <SvgIcon name="close" :size="18" />
          </button>
        </div>

        <div class="modal-body">
          <div v-if="loading" class="state-text">Caricamento...</div>
          <div v-else class="rows">
            <div v-for="(value, index) in rows" :key="`costo-${index}`" class="row">
              <input
                v-model="rows[index]"
                type="text"
                class="row-input"
                placeholder="Es. 1500 (600)"
              />
              <button type="button" class="icon-btn danger" @click="removeRow(index)">
                <SvgIcon name="trash" :size="14" />
              </button>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn-secondary" @click="addRow">
            <SvgIcon name="plus" :size="14" />
            Aggiungi prezzo
          </button>
          <div class="actions">
            <button type="button" class="btn-cancel" @click="emit('close')">Annulla</button>
            <button type="button" class="btn-save" :disabled="saving" @click="save">
              {{ saving ? 'Salvataggio...' : 'Salva' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, watch } from 'vue';
import SvgIcon from '@/components/atoms/SvgIcon.vue';
import { costoOptions as fallbackCostoOptions } from '@/config/valutazioneDropdowns';

const props = defineProps({
  show: { type: Boolean, default: false },
});

const emit = defineEmits(['close', 'saved']);

const loading = ref(false);
const saving = ref(false);
const rows = ref([]);

function sanitize(values) {
  const seen = new Set();
  return (values || [])
    .map((v) => String(v ?? '').trim())
    .filter((v) => {
      if (!v || v === 'Edit...' || seen.has(v)) return false;
      seen.add(v);
      return true;
    });
}

function addRow() {
  rows.value.push('');
}

function removeRow(index) {
  rows.value.splice(index, 1);
}

async function load() {
  loading.value = true;
  try {
    const result = await window.api.config.getCostoOptions();
    rows.value = sanitize(result?.success ? result.data : fallbackCostoOptions);
    if (!rows.value.length) rows.value = sanitize(fallbackCostoOptions);
  } catch (error) {
    console.error('Error loading costo options:', error);
    rows.value = sanitize(fallbackCostoOptions);
  } finally {
    loading.value = false;
  }
}

async function save() {
  saving.value = true;
  try {
    const payload = sanitize(rows.value);
    const result = await window.api.config.saveCostoOptions(payload);
    if (result?.success) {
      emit('saved', result.data || payload);
      emit('close');
    }
  } catch (error) {
    console.error('Error saving costo options:', error);
  } finally {
    saving.value = false;
  }
}

watch(
  () => props.show,
  (isOpen) => {
    if (isOpen) load();
  },
);
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1100;
}

.modal-card {
  width: min(560px, calc(100vw - 24px));
  max-height: 85vh;
  background: #fff;
  border-radius: 10px;
  border: 1px solid #dbe4f0;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h3 {
  margin: 0;
  font-size: 15px;
  color: #1f2937;
}

.modal-body {
  padding: 12px 14px;
  overflow: auto;
  min-height: 120px;
}

.state-text {
  color: #6b7280;
  font-size: 13px;
}

.rows {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.row {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 8px;
}

.row-input {
  width: 100%;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  padding: 6px 8px;
  font-size: 13px;
}

.modal-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  border-top: 1px solid #e5e7eb;
}

.actions {
  display: flex;
  gap: 8px;
}

.icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  background: #fff;
  color: #4b5563;
  cursor: pointer;
}

.icon-btn.danger {
  border-color: #fca5a5;
  color: #dc2626;
}

.btn-secondary,
.btn-cancel,
.btn-save {
  border-radius: 6px;
  padding: 6px 10px;
  font-size: 13px;
  border: 1px solid #cbd5e1;
  background: #fff;
  color: #1f2937;
  cursor: pointer;
}

.btn-secondary {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.btn-save {
  background: #2f7ef7;
  border-color: #2f7ef7;
  color: #fff;
}

.btn-save:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
