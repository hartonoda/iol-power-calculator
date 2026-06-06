<template>
  <input
    :id="inputId"
    :value="modelValue"
    :list="listId"
    :disabled="disabled"
    :placeholder="placeholder"
    type="text"
    class="fm-combobox"
    autocomplete="off"
    @input="onInput"
  />
  <datalist :id="listId">
    <option v-for="opt in options" :key="opt" :value="opt" />
  </datalist>
</template>

<script setup>
import { useId } from 'vue';

defineProps({
  modelValue: { type: String, default: '' },
  options: { type: Array, default: () => [] },
  disabled: { type: Boolean, default: false },
  placeholder: { type: String, default: '' },
});

const emit = defineEmits(['update:modelValue']);

const inputId = useId();
const listId = useId();

function onInput(event) {
  emit('update:modelValue', event.target.value);
}
</script>

<style scoped>
.fm-combobox {
  flex: 1;
  width: 100%;
  min-width: 140px;
  padding: 3px 4px;
  border: 1px solid #1f2937;
  font-size: 12px;
  background: white;
  box-sizing: border-box;
}

.fm-combobox:disabled {
  background: #f8fafc;
  color: #6b7280;
  cursor: not-allowed;
}
</style>
