<template>
  <button
    type="button"
    class="patient-item"
    :class="{ selected }"
    @click="$emit('select')"
  >
    <div class="name">{{ patient.name }}</div>
    <div class="meta">
      {{ patient.dateOfBirth || 'Data nascita n/d' }}
      <span v-if="patient.gender"> • {{ patient.gender }}</span>
    </div>
  </button>
</template>

<script setup>
defineProps({
  patient: { type: Object, required: true },
  selected: { type: Boolean, default: false },
});

defineEmits(['select']);
</script>

<style scoped>
.patient-item {
  width: 100%;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fff;
  text-align: left;
  padding: 8px 10px;
  cursor: pointer;
  transition: all 0.12s;
}
.patient-item:hover {
  border-color: #86efac;
  background: #f8fbff;
}
.patient-item.selected {
  border-color: #15803d;
  background: #ecfdf5;
}
.name {
  font-size: 13px;
  font-weight: 600;
  color: #111827;
}
.meta {
  margin-top: 2px;
  font-size: 11px;
  color: #6b7280;
}
</style>
