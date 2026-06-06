<template>
  <div class="endothelial-block">
    <div class="section-label">Endotelio corneale</div>
    <div class="endothelial-row">
      <label class="field-count">
        <span class="field-lbl">Cell./mm²</span>
        <input
          :value="form.cellEndotelio"
          type="text"
          class="count-input"
          inputmode="decimal"
          placeholder="—"
          :disabled="disabled"
          @input="form.cellEndotelio = normalizeDecimal($event.target.value)"
        />
      </label>
      <label class="field-note">
        <span class="field-lbl">Note</span>
        <input
          v-model="form.cellEndotelioNote"
          type="text"
          class="note-input"
          placeholder="—"
          :disabled="disabled"
        />
      </label>
      <p v-if="endothelialWarning" class="warning-hint">{{ endothelialWarning }}</p>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { normalizeDecimal } from '@/utils/numberUtils';

const props = defineProps({
  form: { type: Object, required: true },
  disabled: { type: Boolean, default: false },
});

const endothelialWarning = computed(() => {
  const value = parseFloat(props.form.cellEndotelio);
  if (Number.isNaN(value)) return null;
  if (value < 1500) return 'Densità endoteliocitaria ridotta';
  if (value < 2000) return 'Densità endoteliocitaria lievemente ridotta';
  return null;
});
</script>

<style scoped>
.endothelial-block {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 2px solid #2563eb;
}

.section-label {
  font-weight: 600;
  color: #1e40af;
  margin-bottom: 8px;
  font-size: 13px;
}

.endothelial-row {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 12px 16px;
}

.field-count,
.field-note {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.field-count {
  flex: 0 0 auto;
}

.field-note {
  flex: 1;
  min-width: 160px;
}

.field-lbl {
  font-size: 12px;
  font-weight: 600;
  color: #475569;
}

.count-input {
  width: 6.5rem;
  padding: 6px 8px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 13px;
  text-align: center;
}

.note-input {
  width: 100%;
  padding: 6px 8px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 13px;
}

.warning-hint {
  margin: 0;
  flex: 1 1 100%;
  font-size: 12px;
  color: #b45309;
  font-weight: 500;
}

@media (max-width: 700px) {
  .field-note {
    flex: 1 1 100%;
  }
}
</style>
