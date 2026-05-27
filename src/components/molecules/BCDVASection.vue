<template>
    <div class="section">
        <div class="section-header-inline">
            <span class="section-title">
                <span v-if="eyeIndicator" class="eye-badge">{{ eyeIndicator }}</span>
                {{ t('sections.bcdva') }}
            </span>
            <div class="bcdva-fields">
                <div class="bcdva-field">
                    <label>{{ t('bcdva.sph') }}</label>
                    <div class="combo-input" :class="{ disabled }">
                        <input 
                            :value="form.bcdva_sph" 
                            @input="form.bcdva_sph = normalizeDecimal($event.target.value)"
                            :disabled="disabled"
                            placeholder="-"
                        />
                        <select 
                            :value="form.bcdva_sph || '0.00'"
                            :disabled="disabled"
                            @change="form.bcdva_sph = $event.target.value"
                            class="combo-select"
                        >
                            <option v-for="val in sphOptions" :key="val" :value="val">{{ val }}</option>
                        </select>
                    </div>
                </div>
                <div class="bcdva-field">
                    <label>{{ t('bcdva.cyl') }}</label>
                    <div class="combo-input" :class="{ disabled }">
                        <input 
                            :value="form.bcdva_cyl" 
                            @input="form.bcdva_cyl = normalizeDecimal($event.target.value)"
                            :disabled="disabled"
                            placeholder="-"
                        />
                        <select 
                            :value="form.bcdva_cyl || '0.00'"
                            :disabled="disabled"
                            @change="form.bcdva_cyl = $event.target.value"
                            class="combo-select"
                        >
                            <option v-for="val in cylOptions" :key="val" :value="val">{{ val }}</option>
                        </select>
                    </div>
                </div>
                <div class="bcdva-field">
                    <label>{{ t('bcdva.ax') }}</label>
                    <input 
                        :value="form.bcdva_ax" 
                        @input="form.bcdva_ax = normalizeDecimal($event.target.value)"
                        :disabled="disabled" 
                        placeholder="°" 
                        type="text"
                        inputmode="numeric"
                    />
                </div>
                <div class="bcdva-field">
                    <label>{{ t('bcdva.va') }}</label>
                    <select v-model="form.bcdva_va" :disabled="disabled">
                        <option value="">-</option>
                        <option v-for="val in vaOptions" :key="val" :value="val">{{ val }}</option>
                    </select>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useI18n } from '@/composables/useI18n';
import { normalizeDecimal } from '@/utils/numberUtils';

const { t } = useI18n();

const props = defineProps({
    form: { type: Object, required: true },
    disabled: { type: Boolean, default: false },
    eyeIndicator: { type: String, default: '' }
});

// Generate Sph options: positive (+10.00 to +0.25), then 0.00, then negative (-0.25 to -20.00)
const sphOptions = computed(() => {
    const options = [];
    // Positive values: +10.00 down to +0.25
    for (let i = 10; i >= 0.25; i -= 0.25) {
        options.push(`+${i.toFixed(2)}`);
    }
    // Zero
    options.push('0.00');
    // Negative values: -0.25 to -20.00
    for (let i = -0.25; i >= -20; i -= 0.25) {
        options.push(i.toFixed(2));
    }
    return options;
});

// Generate Cyl options: positive (+6.00 to +0.25), then 0.00, then negative (-0.25 to -6.00)
const cylOptions = computed(() => {
    const options = [];
    // Positive values: +6.00 down to +0.25
    for (let i = 6; i >= 0.25; i -= 0.25) {
        options.push(`+${i.toFixed(2)}`);
    }
    // Zero
    options.push('0.00');
    // Negative values: -0.25 to -6.00
    for (let i = -0.25; i >= -6; i -= 0.25) {
        options.push(i.toFixed(2));
    }
    return options;
});

// VA options: NPL, PL, CD, then 0.5/10 to 10/10
const vaOptions = [
    'NPL',
    'PL',
    'CD',
    '0.5/10',
    '1/10',
    '2/10',
    '3/10',
    '4/10',
    '5/10',
    '6/10',
    '7/10',
    '8/10',
    '9/10',
    '10/10'
];

const expanded = ref(true);
defineExpose({ expanded });
</script>

<style scoped>
.section {
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    background: white;
    flex-shrink: 0;
}

.section-header-inline {
    display: flex;
    align-items: center;
    gap: 20px;
    padding: 12px 16px;
    background: #f9fafb;
}

.section-title {
    display: flex;
    align-items: center;
    gap: 6px;
    font-weight: 600;
    color: #1f2937;
    font-size: 14px;
    min-width: 60px;
}

.eye-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 4px 10px;
    background: linear-gradient(135deg, #1a1a2e 0%, #2d2d44 100%);
    color: white;
    border-radius: 12px;
    font-size: 11px;
    font-weight: 700;
    box-shadow: 0 2px 4px rgba(26, 26, 46, 0.3);
    white-space: nowrap;
}

.bcdva-fields {
    display: flex;
    gap: 16px;
    flex: 1;
}

.bcdva-field {
    display: flex;
    align-items: center;
    gap: 6px;
}

.bcdva-field label {
    font-size: 11px;
    font-weight: 600;
    color: #6b7280;
    text-transform: capitalize;
    letter-spacing: 0.03em;
}

/* Combo input: editable text + dropdown */
.combo-input {
    position: relative;
    display: flex;
    width: 100px;
}

.combo-input input {
    padding: 6px 24px 6px 10px;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    font-size: 13px;
    text-align: center;
    width: 100%;
    transition: border-color 0.2s, background 0.2s;
}

.combo-input input:focus {
    outline: none;
    border-color: #6366f1;
    background: #f5f3ff;
}

.combo-input .combo-select {
    position: absolute;
    right: 0;
    top: 0;
    width: 24px;
    height: 100%;
    opacity: 0;
    cursor: pointer;
}

.combo-input::after {
    content: '';
    position: absolute;
    right: 8px;
    top: 50%;
    transform: translateY(-50%);
    width: 0;
    height: 0;
    border-left: 4px solid transparent;
    border-right: 4px solid transparent;
    border-top: 5px solid #6b7280;
    pointer-events: none;
}

.combo-input.disabled::after {
    display: none;
}

.combo-input.disabled input {
    background: #f9fafb;
    color: #374151;
    cursor: not-allowed;
    border: none;
    padding-right: 10px;
}

.bcdva-field > input,
.bcdva-field > select {
    padding: 6px 10px;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    font-size: 13px;
    text-align: center;
    transition: border-color 0.2s, background 0.2s;
    width: 90px;
}

.bcdva-field > select {
    width: 100px;
    cursor: pointer;
}

.bcdva-field > input:focus,
.bcdva-field > select:focus {
    outline: none;
    border-color: #6366f1;
    background: #f5f3ff;
}

.bcdva-field > input:disabled,
.bcdva-field > select:disabled {
    background: #f9fafb;
    color: #374151;
    cursor: not-allowed;
}

/* Hide dropdown arrow in view mode */
.bcdva-field > select:disabled {
    -webkit-appearance: none;
    -moz-appearance: none;
    appearance: none;
    background-image: none;
    border: none;
}

.bcdva-field > input:disabled {
    border: none;
}

.bcdva-field input::placeholder {
    color: #d1d5db;
    font-size: 12px;
}

@media (max-width: 768px) {
    .section-header-inline {
        flex-direction: column;
        align-items: flex-start;
    }
    
    .bcdva-fields {
        flex-wrap: wrap;
    }
}

/* Print styles - Compact inline layout */
@media print {
    .section {
        padding: 4px 8px !important;
    }
    
    .section-header-inline {
        gap: 8px !important;
        padding: 0 !important;
    }
    
    .section-title {
        font-size: 9px !important;
    }
    
    .bcdva-fields {
        gap: 8px !important;
    }
    
    .bcdva-field {
        gap: 2px !important;
    }
    
    .bcdva-field label {
        font-size: 7px !important;
    }
    
    .bcdva-field input,
    .bcdva-field select,
    .combo-input input {
        width: 50px !important;
        padding: 2px 4px !important;
        font-size: 9px !important;
    }
    
    .combo-input {
        width: 50px !important;
    }
    
    .combo-input::after {
        display: none !important;
    }
    
    .combo-input .combo-select {
        display: none !important;
    }
}
</style>
