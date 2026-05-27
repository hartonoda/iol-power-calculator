<template>
  <input
    :value="modelValue"
    :placeholder="placeholder"
    :disabled="disabled"
    :class="inputClass"
    @input="onInput"
  />
</template>

<script setup>
import { normalizeDecimal } from '@/utils/numberUtils';

defineProps({
  modelValue: { type: [String, Number], default: '' },
  placeholder: { type: String, default: '' },
  disabled: { type: Boolean, default: false },
  inputClass: { type: String, default: '' },
});

const emit = defineEmits(['update:modelValue']);

function onInput(e) {
  emit('update:modelValue', normalizeDecimal(e.target.value));
}
</script>

<style scoped>
input {
  width: 100%;
  padding: 6px 8px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  text-align: center;
}
input:focus {
  outline: none;
  border-color: #4f46e5;
  background: #f5f3ff;
}
input:disabled {
  background: #f3f4f6;
}
</style>
