<template>
    <div class="checkbox-item-wrapper" :class="{ 'has-input': hasInput && isChecked }">
        <label 
            class="checkbox-item"
            :class="{ 
                'is-nessuna': isNessuna, 
                'checked': isChecked 
            }"
        >
            <input 
                type="checkbox" 
                :checked="isChecked"
                :disabled="disabled"
                @change="handleChange"
            />
            <span>{{ label }}</span>
        </label>
        <input 
            v-if="hasInput && isChecked"
            type="text"
            class="inline-input"
            :value="inputValue"
            :placeholder="inputPlaceholder"
            :disabled="disabled"
            @input="$emit('update:inputValue', $event.target.value)"
        />
    </div>
</template>

<script setup>
const props = defineProps({
    value: { type: String, required: true },
    label: { type: String, required: true },
    isChecked: { type: Boolean, default: false },
    disabled: { type: Boolean, default: false },
    isNessuna: { type: Boolean, default: false },
    hasInput: { type: Boolean, default: false },
    inputValue: { type: String, default: '' },
    inputPlaceholder: { type: String, default: 'Specificare...' }
});

const emit = defineEmits(['change', 'update:inputValue']);

const handleChange = (event) => {
    emit('change', props.value, event.target.checked);
};
</script>

<style scoped>
.checkbox-item-wrapper {
    display: contents;
}

.checkbox-item-wrapper.has-input {
    display: flex;
    align-items: center;
    gap: 8px;
    grid-column: span 2;
}

.checkbox-item {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 10px;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.15s;
    font-size: 12px;
    background: #f9fafb;
    border: 1px solid #e5e7eb;
}

.checkbox-item:hover:not(:has(input:disabled)) {
    background: #f3f4f6;
}

.checkbox-item.checked {
    background: #f0fdf4;
    border-color: #c7d2fe;
}

.checkbox-item.is-nessuna {
    background: #f0fdf4;
    border-color: #bbf7d0;
}

.checkbox-item.is-nessuna.checked {
    background: #dcfce7;
    border-color: #86efac;
}

.checkbox-item input[type="checkbox"] {
    width: 14px;
    height: 14px;
    cursor: pointer;
}

.checkbox-item input[type="checkbox"]:disabled {
    cursor: not-allowed;
}

.checkbox-item span {
    color: #374151;
    white-space: nowrap;
}

.inline-input {
    flex: 1;
    padding: 6px 10px;
    border: 1px solid #c7d2fe;
    border-radius: 6px;
    font-size: 12px;
    background: white;
    min-width: 120px;
    max-width: 200px;
}

.inline-input:focus {
    outline: none;
    border-color: #16a34a;
    background: #f5f3ff;
}

.inline-input:disabled {
    background: #f9fafb;
    cursor: not-allowed;
}
</style>
