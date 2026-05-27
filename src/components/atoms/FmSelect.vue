<template>
  <select
    :value="modelValue"
    :disabled="disabled"
    class="fm-select"
    @change="$emit('update:modelValue', $event.target.value)"
  >
    <option value="">{{ placeholder }}</option>
    <option v-for="opt in options" :key="opt" :value="opt">{{ opt }}</option>
    <option v-if="modelValue && !options.includes(modelValue)" :value="modelValue">
      {{ modelValue }}
    </option>
  </select>
</template>

<script setup>
defineProps({
  modelValue: { type: String, default: '' },
  options: { type: Array, default: () => [] },
  disabled: { type: Boolean, default: false },
  placeholder: { type: String, default: '' },
});
defineEmits(['update:modelValue']);
</script>

<style scoped>
.fm-select {
  flex: 1;
  min-width: 140px;
  padding: 3px 4px;
  border: 1px solid #1f2937;
  font-size: 12px;
  background: white;
}
</style>
