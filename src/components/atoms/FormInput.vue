<template>
    <div class="form-input" :class="[colorClass, { disabled }]">
        <label v-if="label">{{ label }}</label>
        <div class="input-wrapper">
            <input
                v-if="type !== 'select' && type !== 'textarea'"
                :type="type"
                :value="modelValue"
                :placeholder="placeholder"
                :disabled="disabled"
                :step="step"
                @input="handleInput"
            />
            <select
                v-else-if="type === 'select'"
                :value="modelValue"
                :disabled="disabled"
                @change="$emit('update:modelValue', $event.target.value)"
            >
                <option v-if="placeholder" value="" disabled>{{ placeholder }}</option>
                <option v-for="opt in options" :key="opt.value" :value="opt.value">
                    {{ opt.label }}
                </option>
            </select>
            <textarea
                v-else
                :value="modelValue"
                :placeholder="placeholder"
                :disabled="disabled"
                :rows="rows"
                @input="emit('update:modelValue', $event.target.value)"
            ></textarea>
            <span v-if="showIndicator && colorClass" class="color-indicator"></span>
        </div>
    </div>
</template>

<script setup>
import { computed } from 'vue';
import { normalizeDecimal } from '@/utils/numberUtils';

const props = defineProps({
    modelValue: { type: [String, Number], default: '' },
    label: { type: String, default: '' },
    type: { type: String, default: 'text' },
    placeholder: { type: String, default: '' },
    disabled: { type: Boolean, default: false },
    options: { type: Array, default: () => [] },
    rows: { type: Number, default: 2 },
    step: { type: String, default: undefined },
    // Color coding props
    minGreen: { type: Number, default: null },
    maxGreen: { type: Number, default: null },
    minYellow: { type: Number, default: null },
    maxYellow: { type: Number, default: null },
    showIndicator: { type: Boolean, default: true }
});

const emit = defineEmits(['update:modelValue']);

// Handle input with decimal normalization for numeric types
const handleInput = (event) => {
    const value = event.target.value;
    // Normalize decimals for text/number inputs (not for date, etc.)
    const normalizedValue = (props.type === 'text' || props.type === 'number') 
        ? normalizeDecimal(value) 
        : value;
    emit('update:modelValue', normalizedValue);
};

const colorClass = computed(() => {
    if (props.minGreen === null && props.maxGreen === null) return '';
    
    const value = parseFloat(props.modelValue);
    if (isNaN(value) || props.modelValue === '') return '';
    
    // Check if within green range
    const inGreenRange = 
        (props.minGreen === null || value >= props.minGreen) &&
        (props.maxGreen === null || value <= props.maxGreen);
    
    if (inGreenRange) return 'status-green';
    
    // Check if within yellow range (warning)
    const inYellowRange = 
        (props.minYellow === null || value >= props.minYellow) &&
        (props.maxYellow === null || value <= props.maxYellow);
    
    if (inYellowRange) return 'status-yellow';
    
    // Outside all ranges = red
    return 'status-red';
});
</script>

<style scoped>
.form-input {
    display: flex;
    flex-direction: column;
}

.form-input label {
    font-size: 11px;
    font-weight: 600;
    color: #6b7280;
    margin-bottom: 6px;
    text-transform: capitalize;
    letter-spacing: 0.03em;
}

.input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
}

.form-input input,
.form-input select,
.form-input textarea {
    width: 100%;
    padding: 10px 12px;
    border: 2px solid #e5e7eb;
    border-radius: 6px;
    font-size: 14px;
    transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
    background: white;
}

.form-input textarea {
    resize: vertical;
    min-height: 60px;
}

.form-input.disabled input,
.form-input.disabled select,
.form-input.disabled textarea {
    background: #f9fafb;
    color: #374151;
    cursor: default;
}

/* Hide dropdown arrow in view mode */
.form-input.disabled select {
    -webkit-appearance: none;
    -moz-appearance: none;
    appearance: none;
    background-image: none;
}

.form-input input:focus:not(:disabled),
.form-input select:focus:not(:disabled),
.form-input textarea:focus:not(:disabled) {
    outline: none;
    border-color: #4361ee;
    box-shadow: 0 0 0 3px rgba(67, 97, 238, 0.1);
}

/* Color status styles */
.form-input.status-green input,
.form-input.status-green select {
    border-color: #22c55e;
    background: #f0fdf4;
}

.form-input.status-yellow input,
.form-input.status-yellow select {
    border-color: #eab308;
    background: #fefce8;
}

.form-input.status-red input,
.form-input.status-red select {
    border-color: #ef4444;
    background: #fef2f2;
}

.color-indicator {
    position: absolute;
    right: 10px;
    width: 8px;
    height: 8px;
    border-radius: 50%;
}

.status-green .color-indicator {
    background: #22c55e;
}

.status-yellow .color-indicator {
    background: #eab308;
}

.status-red .color-indicator {
    background: #ef4444;
}
</style>

