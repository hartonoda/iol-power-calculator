<template>
  <input
    :value="modelValue"
    type="text"
    class="bio-cell"
    :disabled="disabled"
    @input="$emit('update:modelValue', normalizeDecimal($event.target.value))"
    @focus="$emit('focus')"
  />
</template>

<script setup>
import { normalizeDecimal } from '@/utils/numberUtils';

defineProps({
  modelValue: { type: [String, Number], default: '' },
  disabled: { type: Boolean, default: false },
});
defineEmits(['update:modelValue', 'focus']);
</script>

<style scoped>
.bio-cell {
  width: 100%;
  min-width: 78px;
  padding: 6px 10px;
  border: 1px solid #d1d5db;
  text-align: center;
  font-size: 14px;
  border-radius: 6px;
  background: #ffffff;
}
</style>
