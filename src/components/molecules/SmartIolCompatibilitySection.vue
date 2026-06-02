<template>
  <div class="compat-block">
    <div class="panel-title">Punteggi compatibilità SmartIOL</div>
    <div class="compat-row">
      <label v-for="row in compatibilityScores" :key="row.key" class="compat-item">
        <span class="compat-label">{{ row.label }}</span>
        <input v-model="form[row.key]" type="text" class="compat-input" :disabled="disabled" />
      </label>
    </div>
  </div>
</template>

<script setup>
defineProps({
  form: { type: Object, required: true },
  disabled: { type: Boolean, default: false },
});

const compatibilityScores = [
  { label: 'Monofocale standard', key: 'compat_monofocale_standard' },
  { label: 'Monofocale plus', key: 'compat_monofocale_plus' },
  { label: 'EDOF', key: 'compat_edof' },
  { label: 'Multifocal', key: 'compat_multifocal' },
];
</script>

<style scoped>
.compat-block {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 2px solid #2563eb;
}
.panel-title {
  font-weight: 600;
  color: #1e40af;
  margin-bottom: 8px;
  font-size: 13px;
}
.compat-row {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px 14px;
}
.compat-item {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}
.compat-label {
  font-size: 12px;
  color: #1f2937;
  white-space: nowrap;
}
.compat-input {
  width: 74px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  padding: 6px 8px;
  font-size: 13px;
  text-align: center;
}
@media (max-width: 1100px) {
  .compat-row {
    grid-template-columns: repeat(2, minmax(120px, 1fr));
  }
}
</style>
