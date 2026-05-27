<template>
    <div 
        class="param-field" 
        :class="{ 
            'has-range': hasRange, 
            'out-of-range': isValueOutOfRange,
            'warning-range': isInWarningRange,
            'total-field': isTotal,
            'calculated': isCalculated,
            'view-mode': disabled,
            'has-warning': warning
        }"
    >
        <label :style="labelStyle">
            <span>{{ label }}<span v-if="disabled" class="colon">:</span></span>
            <span v-if="infoTooltip" class="info-badge" :title="infoTooltip" aria-label="Parameter help">
                ?
            </span>
        </label>
        
        <div v-if="isCalculated" class="calculated-value" :class="{ 'warning-range': isInWarningRange, 'out-of-range': isValueOutOfRange }">
            {{ displayValue || '-' }}
        </div>
        <template v-else>
            <div v-if="disabled" class="display-value" :class="{ 'warning-range': isInWarningRange, 'out-of-range': isValueOutOfRange }">
                {{ modelValue || '-' }}
            </div>
            <input 
                v-else
                :value="modelValue" 
                @input="handleInput"
                :disabled="disabled" 
                :placeholder="placeholder"
                :class="{ 'warning-range': isInWarningRange, 'out-of-range': isValueOutOfRange }"
            />
        </template>
        
        <div 
            class="range-indicator" 
            :class="{ inactive: !modelValue && !displayValue }" 
            v-if="hasRange"
        >
            <div class="range-bar">
                <div class="range-normal"></div>
                <div 
                    v-if="modelValue || displayValue"
                    class="range-marker" 
                    :class="markerClass"
                    :style="markerStyle"
                ></div>
            </div>
        </div>
        
        <!-- Threshold range display -->
        <div v-if="thresholdRange && (thresholdRange.minValue !== null || thresholdRange.maxValue !== null)" class="threshold-range-text">
            <template v-if="thresholdRange.minValue !== null && thresholdRange.maxValue !== null">
                <span class="range-min">min: {{ thresholdRange.minValue }}{{ thresholdRange.unit ? ' ' + thresholdRange.unit : '' }}</span>
                <span class="range-max">max: {{ thresholdRange.maxValue }}{{ thresholdRange.unit ? ' ' + thresholdRange.unit : '' }}</span>
            </template>
            <span v-else-if="thresholdRange.minValue !== null">
                min: {{ thresholdRange.minValue }}{{ thresholdRange.unit ? ' ' + thresholdRange.unit : '' }}
            </span>
            <span v-else-if="thresholdRange.maxValue !== null">
                max: {{ thresholdRange.maxValue }}{{ thresholdRange.unit ? ' ' + thresholdRange.unit : '' }}
            </span>
        </div>
        
        <div v-if="warning" class="warning-badge" :title="warning">
            <SvgIcon name="warning" :size="14" />
        </div>
    </div>
</template>

<script setup>
import { computed } from 'vue';
import { useFieldRules } from '@/composables/useFieldRules';
import { normalizeDecimal } from '@/utils/numberUtils';
import SvgIcon from '@/components/atoms/SvgIcon.vue';

const { fieldRules } = useFieldRules();

const props = defineProps({
    modelValue: { type: [String, Number], default: '' },
    displayValue: { type: [String, Number], default: null }, // For calculated fields
    label: { type: String, required: true },
    field: { type: String, required: true },
    source: { type: String, required: true }, // 'eyeInfo' or 'machine'
    disabled: { type: Boolean, default: false },
    placeholder: { type: String, default: '' },
    isTotal: { type: Boolean, default: false },
    isCalculated: { type: Boolean, default: false },
    labelWidth: { type: String, default: null }, // e.g., '120px'
    warning: { type: String, default: null }, // Warning message to display
    maxDeduction: { type: Number, default: null }, // Maximum deduction across all IOL types (null = not provided)
    thresholdRange: { type: Object, default: null }, // { minValue, maxValue, unit } - threshold range to display
    isOutOfNormalLimit: { type: Boolean, default: false }, // Whether value is outside normal limit (below min or above max threshold)
    infoTooltip: { type: String, default: '' } // Localized help text shown in info icon tooltip
});

const emit = defineEmits(['update:modelValue']);

// Handle input with decimal normalization (accepts both , and . as decimal separator)
const handleInput = (event) => {
    const normalizedValue = normalizeDecimal(event.target.value);
    emit('update:modelValue', normalizedValue);
};

// Get config from fieldRules (reactive)
// For calculated fields, use the field prop; for regular fields, use the field prop directly
const fieldConfig = computed(() => {
    if (!props.field) return null;
    const config = fieldRules.value[props.source]?.[props.field];
    return config;
});

// Check if field has a range defined
const hasRange = computed(() => !!fieldConfig.value?.green);

// Helper to get the full display range (combines green and all yellow ranges)
const getDisplayRange = () => {
    if (!fieldConfig.value?.green) return null;
    
    const { green, yellow } = fieldConfig.value;
    // Use -Infinity/Infinity as defaults for unbounded ranges
    let min = green.min ?? -Infinity;
    let max = green.max ?? Infinity;
    
    // Yellow can be an array of ranges or null
    if (Array.isArray(yellow)) {
        yellow.forEach(range => {
            if (range.min !== undefined && range.min < min) min = range.min;
            if (range.max !== undefined && range.max > max) max = range.max;
        });
    }
    
    // For display purposes, if still unbounded, use green bounds or reasonable defaults
    if (min === -Infinity) min = 0;
    if (max === Infinity) max = green.max ? green.max * 2 : 100;
    
    return { min, max };
};

// Helper to check if a value is in any yellow range
const isInYellowRange = (num) => {
    const { yellow } = fieldConfig.value;
    if (!yellow) return false;
    
    if (Array.isArray(yellow)) {
        return yellow.some(range => num >= range.min && num <= range.max);
    }
    return false;
};

// Check if value should be highlighted
// For IOL parameters: highlight if deduction >= 20 or outside normal limit
// For keratometry: highlight if outside both green and yellow ranges
const isValueOutOfRange = computed(() => {
    // Priority 0: Check if explicitly marked as outside normal limit (for ocular parameters)
    if (props.isOutOfNormalLimit) {
        return true;
    }
    
    const val = props.isCalculated ? props.displayValue : props.modelValue;
    if (!val || val === '' || val === null) return false;
    
    // Convert to number if it's a string
    const num = typeof val === 'string' ? parseFloat(val) : val;
    if (isNaN(num)) return false;
    
    // Priority 1: For IOL parameters (maxDeduction explicitly provided)
    // Use deduction-based logic when maxDeduction prop is passed (even if 0)
    if (props.maxDeduction !== null && props.maxDeduction !== undefined) {
        return Math.abs(props.maxDeduction) >= 20;
    }
    
    // Priority 2: For keratometry fields (no maxDeduction, use fieldConfig with green/yellow ranges)
    // Check if outside both green and yellow ranges
    if (fieldConfig.value && fieldConfig.value.green) {
        const { green, yellow } = fieldConfig.value;
        const hasMin = green.min !== undefined;
        const hasMax = green.max !== undefined;
        
        // Check if in green range
        const inGreen = (!hasMin || num >= green.min) && (!hasMax || num <= green.max);
        if (inGreen) return false; // In green = no highlight
        
        // Check if in yellow range
        if (yellow && Array.isArray(yellow)) {
            const inYellow = yellow.some(range => {
                const aboveMin = range.min === undefined || num >= range.min;
                const belowMax = range.max === undefined || num <= range.max;
                return aboveMin && belowMax;
            });
            if (inYellow) return false; // In yellow = no highlight (but will show orange dot/text)
        }
        
        // Outside both green and yellow = highlight
        return true;
    }
    
    return false;
});

// Check if value is in warning (yellow) range (for keratometry orange dot/text)
const isInWarningRange = computed(() => {
    const val = props.isCalculated ? props.displayValue : props.modelValue;
    if (!val || val === '' || val === null) return false;
    
    // Convert to number if it's a string
    const num = typeof val === 'string' ? parseFloat(val) : val;
    if (isNaN(num)) return false;
    
    // Priority 1: For IOL parameters (maxDeduction explicitly provided)
    // Ocular parameters: Only show orange text/dot if deduction >= 20 (handled by isValueOutOfRange)
    // So return false here - no warning range for ocular parameters
    if (props.maxDeduction !== null && props.maxDeduction !== undefined) {
        return false;
    }
    
    // Priority 2: For keratometry fields (no maxDeduction, use fieldConfig with yellow ranges)
    if (fieldConfig.value && fieldConfig.value.yellow && Array.isArray(fieldConfig.value.yellow)) {
        return fieldConfig.value.yellow.some(range => {
            const aboveMin = range.min === undefined || num >= range.min;
            const belowMax = range.max === undefined || num <= range.max;
            return aboveMin && belowMax;
        });
    }
    
    return false;
});

// Get the position of the marker on the range bar (0-100%)
const markerStyle = computed(() => {
    const displayRange = getDisplayRange();
    if (!displayRange) return { left: '50%' };
    
    const val = props.isCalculated ? props.displayValue : props.modelValue;
    const num = parseFloat(val);
    if (isNaN(num)) return { left: '50%' };
    
    const range = displayRange.max - displayRange.min;
    const position = ((num - displayRange.min) / range) * 100;
    
    // Clamp between 0 and 100
    const clampedPosition = Math.max(0, Math.min(100, position));
    return { left: `${clampedPosition}%` };
});

// Get marker class based on value status
const markerClass = computed(() => {
    const val = props.isCalculated ? props.displayValue : props.modelValue;
    if (!val || val === '' || val === null) return 'in-range';
    
    // Convert to number if it's a string
    const num = typeof val === 'string' ? parseFloat(val) : val;
    if (isNaN(num)) return 'in-range';
    
    // Priority 1: For IOL parameters (maxDeduction explicitly provided)
    // Use deduction-based logic when maxDeduction prop is passed (even if 0)
    if (props.maxDeduction !== null && props.maxDeduction !== undefined) {
        return Math.abs(props.maxDeduction) >= 20 ? 'out-range' : 'in-range';
    }
    
    // Priority 2: For keratometry fields (no maxDeduction, use fieldConfig with green/yellow ranges)
    if (fieldConfig.value && fieldConfig.value.green) {
        const { green, yellow } = fieldConfig.value;
        const hasMin = green.min !== undefined;
        const hasMax = green.max !== undefined;
        
        // Check if in green range
        const inGreen = (!hasMin || num >= green.min) && (!hasMax || num <= green.max);
        if (inGreen) return 'in-range';
        
        // Check if in yellow range (warning)
        if (yellow && Array.isArray(yellow)) {
            const inYellow = yellow.some(range => {
                const aboveMin = range.min === undefined || num >= range.min;
                const belowMax = range.max === undefined || num <= range.max;
                return aboveMin && belowMax;
            });
            if (inYellow) return 'yellow-range'; // Orange dot/text
        }
        
        // Outside both green and yellow = red/orange
        return 'out-range';
    }
    
    return 'in-range';
});

// Label style with optional fixed width
const labelStyle = computed(() => {
    if (props.labelWidth) {
        return { width: props.labelWidth, minWidth: props.labelWidth, flexShrink: 0 };
    }
    return {};
});
</script>

<style scoped>
.param-field {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 10px;
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
}

.param-field.total-field {
    background: #faf5ff;
    border-color: #e9d5ff;
}

.param-field.total-field input {
    font-weight: 600;
    color: #7c3aed;
}

.param-field.calculated {
    background: #f9fafb;
}

.param-field.out-of-range {
    background: #fff7ed;
    border-color: #f97316;
}

.param-field.out-of-range input {
    border-color: #f97316;
    color: #9a3412;
}

.param-field.warning-range input,
.param-field .warning-range {
    color: #ea580c;
    font-weight: 600;
}

.param-field .calculated-value.warning-range,
.param-field .display-value.warning-range {
    color: #ea580c;
}

.threshold-range-text {
    font-size: 0.625rem;
    color: #6b7280;
    white-space: nowrap;
    margin-left: 4px;
    font-style: italic;
}

.threshold-range-text .range-min,
.threshold-range-text .range-max {
    display: block;
    white-space: nowrap;
}

.param-field .calculated-value.out-of-range,
.param-field .display-value.out-of-range {
    color: #9a3412;
    font-weight: 700;
}

.param-field label {
    font-size: 12px;
    font-weight: 600;
    color: #6b7280;
    text-transform: capitalize;
    letter-spacing: 0.02em;
    white-space: nowrap;
    display: flex;
    align-items: center;
    flex-shrink: 0;
}

.info-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    margin-left: 6px;
    width: 16px;
    height: 16px;
    border-radius: 999px;
    border: 1px solid #d1d5db;
    background: #f9fafb;
    color: #4b5563;
    font-size: 11px;
    font-weight: 700;
    line-height: 1;
    cursor: help;
    user-select: none;
}

.info-badge:hover {
    background: #f3f4f6;
    color: #111827;
    border-color: #9ca3af;
}

.param-field label .colon {
    margin-left: 2px;
}

/* Display value in view mode */
.display-value {
    min-width: 50px;
    text-align: center;
    font-size: 13px;
    font-weight: 500;
    color: #374151;
}

/* View mode styles */
.param-field.view-mode {
    background: transparent;
    border-color: transparent;
    padding: 4px 8px;
    padding-right: 12px;
    border-right: 1px solid #d1d5db;
}

.param-field.view-mode:last-child {
    border-right: none;
}

.param-field.view-mode.total-field {
    background: #faf5ff;
    border-color: #e9d5ff;
}

.param-field.view-mode.total-field .display-value {
    color: #7c3aed;
    font-weight: 600;
}

.param-field.view-mode.out-of-range {
    background: #fff7ed;
    border-color: #fed7aa;
}

.param-field.view-mode.out-of-range .display-value {
    color: #9a3412;
}


.param-field input {
    width: 60px;
    min-width: 60px;
    padding: 6px 8px;
    border: 1px solid #e5e7eb;
    border-radius: 4px;
    font-size: 13px;
    text-align: center;
    transition: border-color 0.2s, background 0.2s;
    background: white;
    flex-shrink: 0;
}

.param-field input[style*="margin-left: auto"] {
    margin-left: auto !important;
}

.param-field input:focus {
    outline: none;
    border-color: #6366f1;
    background: #f5f3ff;
}

.param-field input:disabled {
    background: #f9fafb;
    color: #374151;
}

.param-field input::placeholder {
    color: #d1d5db;
    font-size: 11px;
}

/* Calculated value display */
.calculated-value {
    width: 60px;
    min-width: 60px;
    padding: 6px 8px;
    border: 1px solid #d1d5db;
    border-radius: 4px;
    font-size: 13px;
    text-align: center;
    background: #f3f4f6;
    color: #374151;
    font-weight: 500;
    flex-shrink: 0;
}

/* Range Indicator */
.range-indicator {
    width: 50px;
    flex-shrink: 0;
}

.range-indicator.inactive {
    opacity: 0.4;
}

.range-bar {
    position: relative;
    height: 6px;
    background: #e5e7eb;
    border-radius: 3px;
    overflow: visible;
}

.range-normal {
    position: absolute;
    left: 25%;
    right: 25%;
    top: 0;
    bottom: 0;
    background: #d1d5db;
    border-radius: 3px;
}

.range-marker {
    position: absolute;
    top: -1px;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    transform: translateX(-50%);
    border: 1px solid white;
    box-shadow: 0 1px 2px rgba(0,0,0,0.2);
}

.range-marker.in-range {
    background: #3b82f6;
}

.range-marker.yellow-range {
    background: #eab308;
}

.range-marker.below-range {
    background: #ef4444;
}

.range-marker.above-range {
    background: #ef4444;
}

.range-marker.out-range {
    background: #ea580c;
}

.range-marker.yellow-range {
    background: #ea580c;
}

/* Warning badge */
.param-field.has-warning {
    background: #fef3c7;
    border-color: #f59e0b;
}

.warning-badge {
    display: flex;
    align-items: center;
    justify-content: center;
    color: #d97706;
    cursor: help;
    flex-shrink: 0;
}

.warning-badge svg {
    width: 16px;
    height: 16px;
}

/* Print styles - Very compact */
@media print {
    .param-field {
        padding: 2px 4px !important;
        gap: 3px !important;
        border-radius: 3px !important;
    }
    
    .param-field.view-mode {
        padding-right: 6px !important;
    }
    
    .param-field label {
        font-size: 6px !important;
        min-width: auto !important;
        width: auto !important;
    }
    
    .param-field input,
    .calculated-value,
    .display-value {
        width: 35px !important;
        min-width: 35px !important;
        padding: 1px 2px !important;
        font-size: 8px !important;
    }
    
    .range-indicator {
        width: 25px !important;
    }
    
    .range-bar {
        height: 4px !important;
    }
    
    .range-marker {
        width: 5px !important;
        height: 5px !important;
        top: 0 !important;
    }
}
</style>
