<template>
  <Teleport to="body">
    <div v-if="show" class="modal-overlay" @click.self="$emit('close')">
      <div class="settings-dialog">
        <div class="dialog-header">
          <h3>Modelli IOL</h3>
          <button type="button" class="icon-btn" title="Chiudi" @click="$emit('close')">
            <SvgIcon name="close" :size="20" />
          </button>
        </div>

        <div class="dialog-body">
          <div class="toolbar-row">
            <div class="add-row">
              <input
                v-model="newModelName"
                type="text"
                class="text-input"
                placeholder="Nuovo modello IOL…"
                @keyup.enter="addModel"
              />
              <button type="button" class="btn-add" :disabled="!newModelName.trim()" @click="addModel">
                <SvgIcon name="plus" :size="16" />
                Aggiungi
              </button>
            </div>
            <button type="button" class="btn-sort" title="Ordina per nome (A–Z)" @click="sortAlphabetically">
              Ordina A–Z
            </button>
          </div>

          <div class="table-wrap">
            <table class="models-table">
              <thead>
                <tr>
                  <th class="col-name">Modello</th>
                  <th class="col-actions"></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in editableRows" :key="row.id">
                  <td class="col-name">
                    <input v-model="row.name" type="text" class="text-input" />
                  </td>
                  <td class="col-actions">
                    <div class="action-btns">
                      <button
                        type="button"
                        class="icon-btn"
                        title="Duplica modello"
                        :disabled="duplicatingId === row.id"
                        @click="duplicateModel(row)"
                      >
                        <SvgIcon name="plus" :size="14" />
                      </button>
                      <button
                        type="button"
                        class="icon-btn danger"
                        title="Elimina modello"
                        @click="confirmDelete(row)"
                      >
                        <SvgIcon name="trash" :size="14" />
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="dialog-footer">
          <button type="button" class="btn-secondary" @click="$emit('close')">Annulla</button>
          <button type="button" class="btn-primary" :disabled="saving" @click="saveAll">
            {{ saving ? 'Salvataggio…' : 'Salva' }}
          </button>
        </div>
      </div>
    </div>

    <ConfirmModal
      :show="!!modelToDelete"
      title="Elimina modello IOL"
      :message="'Eliminare <strong>' + (modelToDelete?.name || '') + '</strong>?'"
      warning="Le valutazioni esistenti che usano questo modello non vengono modificate."
      confirm-text="Elimina"
      @confirm="deleteModel"
      @cancel="modelToDelete = null"
    />
  </Teleport>
</template>

<script setup>
import { ref, watch } from 'vue';
import ConfirmModal from '@/components/atoms/ConfirmModal.vue';
import SvgIcon from '@/components/atoms/SvgIcon.vue';

const props = defineProps({
  show: { type: Boolean, default: false },
  models: { type: Array, default: () => [] },
});

const emit = defineEmits(['close', 'saved']);

const editableRows = ref([]);
const newModelName = ref('');
const saving = ref(false);
const duplicatingId = ref(null);
const modelToDelete = ref(null);

const localeSort = (a, b) =>
  (a.name || '').localeCompare(b.name || '', 'it', { sensitivity: 'base' });

function syncRows() {
  editableRows.value = props.models
    .map((m) => ({ id: m.id, name: m.name }))
    .sort(localeSort);
}

function sortAlphabetically() {
  editableRows.value = [...editableRows.value].sort(localeSort);
}

watch(
  () => props.show,
  (open) => {
    if (open) syncRows();
  },
);

watch(
  () => props.models,
  () => {
    if (props.show) syncRows();
  },
  { deep: true },
);

const addModel = async () => {
  const name = newModelName.value.trim();
  if (!name) return;
  try {
    await window.api.iolModel.add({ name });
    newModelName.value = '';
    emit('saved');
  } catch (err) {
    console.error('Failed to add IOL model:', err);
  }
};

const duplicateModel = async (row) => {
  duplicatingId.value = row.id;
  try {
    await window.api.iolModel.duplicate(row.id);
    emit('saved');
  } catch (err) {
    console.error('Failed to duplicate IOL model:', err);
  } finally {
    duplicatingId.value = null;
  }
};

const confirmDelete = (row) => {
  modelToDelete.value = row;
};

const deleteModel = async () => {
  if (!modelToDelete.value) return;
  try {
    await window.api.iolModel.delete(modelToDelete.value.id);
    modelToDelete.value = null;
    emit('saved');
  } catch (err) {
    console.error('Failed to delete IOL model:', err);
  }
};

const saveAll = async () => {
  saving.value = true;
  try {
    for (const row of editableRows.value) {
      const name = row.name?.trim();
      if (!name) continue;
      await window.api.iolModel.update(row.id, { name });
    }
    emit('saved');
    emit('close');
  } catch (err) {
    console.error('Failed to save IOL models:', err);
  } finally {
    saving.value = false;
  }
};
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 16px;
}

.settings-dialog {
  background: white;
  border-radius: 12px;
  width: min(560px, 96vw);
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #e5e7eb;
}

.dialog-header h3 {
  margin: 0;
  font-size: 18px;
  color: #1a1a2e;
}

.dialog-body {
  padding: 16px 20px;
  overflow: hidden;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 0;
}

.toolbar-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.add-row {
  display: flex;
  gap: 8px;
  flex: 1;
  min-width: 200px;
}

.btn-sort {
  padding: 8px 14px;
  border: 1px solid #cbd5e1;
  background: white;
  color: #374151;
  border-radius: 8px;
  font-size: 13px;
  cursor: pointer;
  white-space: nowrap;
}

.btn-sort:hover {
  background: #f8fafc;
  border-color: #94a3b8;
}

.table-wrap {
  overflow: auto;
  flex: 1;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.models-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.models-table th,
.models-table td {
  padding: 8px 10px;
  border-bottom: 1px solid #f1f5f9;
  text-align: left;
}

.models-table th {
  background: #f8fafc;
  color: #475569;
  font-weight: 600;
  position: sticky;
  top: 0;
  z-index: 1;
}

.col-name {
  width: 100%;
}

.col-actions {
  width: 72px;
  text-align: center;
}

.action-btns {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.text-input {
  width: 100%;
  box-sizing: border-box;
  padding: 6px 8px;
  border: 1px solid #cbd5e1;
  border-radius: 4px;
  font-size: 13px;
}

.btn-add {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border: none;
  background: #22c55e;
  color: white;
  border-radius: 8px;
  cursor: pointer;
  white-space: nowrap;
  font-size: 13px;
}

.btn-add:disabled {
  background: #d1d5db;
  cursor: not-allowed;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 14px 20px;
  border-top: 1px solid #e5e7eb;
}

.btn-primary,
.btn-secondary {
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 13px;
  cursor: pointer;
  border: 1px solid transparent;
}

.btn-primary {
  background: #2563eb;
  color: white;
}

.btn-primary:disabled {
  background: #94a3b8;
  cursor: not-allowed;
}

.btn-secondary {
  background: white;
  border-color: #d1d5db;
  color: #374151;
}

.icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6px;
  border: 1px solid #e5e7eb;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  color: #6b7280;
}

.icon-btn.danger:hover {
  background: #fee2e2;
  color: #dc2626;
  border-color: #fecaca;
}
</style>
