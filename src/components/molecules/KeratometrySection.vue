<template>
    <div class="section">
        <div class="section-header">
            <div class="section-title">
                <span v-if="eyeIndicator" class="eye-badge">{{ eyeIndicator }}</span>
                <span>{{ t('keratometry.title') }}</span>
            </div>
            <div class="header-actions">
                <button class="settings-btn" @click="$emit('open-settings')" :title="t('settings.title')">
                    <SvgIcon name="settings" :size="16" />
                </button>
                <span class="section-badge">{{ filledCount }}/{{ totalFields }}</span>
            </div>
        </div>
        <div class="section-content">
            <!-- K1, K2, Avg Km row -->
            <div class="param-row five-col">
                <ParamField
                    v-model="form.cso_K1"
                    label="K1 Flat"
                    field="K1"
                    source="machine"
                    :disabled="disabled"
                    placeholder="D"
                    :label-width="keratLabelWidth"
                />
                <ParamField
                    v-model="form.cso_axK1"
                    label="K1 Axis"
                    field=""
                    source="machine"
                    :disabled="disabled"
                    placeholder="°"
                    :label-width="keratLabelWidth"
                />
                <ParamField
                    v-model="form.cso_K2"
                    label="K2 Steep"
                    field="K2"
                    source="machine"
                    :disabled="disabled"
                    placeholder="D"
                    :label-width="keratLabelWidth"
                />
                <ParamField
                    :display-value="calculatedK2Axis"
                    label="K2 Axis"
                    field=""
                    source="machine"
                    :disabled="disabled"
                    :is-calculated="true"
                    :label-width="keratLabelWidth"
                />
                <ParamField
                    :display-value="calculatedAvgKm"
                    :label="t('keratometry.avgKm')"
                    field="avgKm"
                    source="machine"
                    :disabled="disabled"
                    :is-calculated="true"
                    :label-width="keratLabelWidth"
                />
            </div>

            <!-- Cylinder, Cyl Axis, Cylinder Total, Axis Total row -->
            <div class="param-row four-col">
                <ParamField
                    :display-value="calculatedCylinder"
                    :label="t('keratometry.cylinder')"
                    field=""
                    source="machine"
                    :disabled="disabled"
                    :is-calculated="true"
                    :label-width="cylLabelWidth"
                />
                <ParamField
                    :display-value="calculatedSimKAxis"
                    :label="t('keratometry.cylinderAxis')"
                    field=""
                    source="machine"
                    :disabled="disabled"
                    :is-calculated="true"
                    :label-width="cylLabelWidth"
                />
                <ParamField
                    v-model="form.cilTotal"
                    :label="t('keratometry.cylinderTotal')"
                    :info-tooltip="t('parameterInfo.cylinderTotal')"
                    field=""
                    source="machine"
                    :disabled="disabled"
                    placeholder="D"
                    :is-total="true"
                    :label-width="totalAstigmatismLabelWidth"
                    :warning="toricWarning ? 'Toric IOL indicated' : null"
                />
                <ParamField
                    v-model="form.axConclusion"
                    :label="t('keratometry.axisTotal')"
                    :info-tooltip="t('parameterInfo.axisTotal')"
                    field=""
                    source="machine"
                    :disabled="disabled"
                    placeholder="°"
                    :is-total="true"
                    :label-width="cylLabelWidth"
                />
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed, watch } from 'vue';
import ParamField from '@/components/atoms/ParamField.vue';
import SvgIcon from '@/components/atoms/SvgIcon.vue';
import { useI18n } from '@/composables/useI18n';

const { t } = useI18n();

defineEmits(['open-settings']);

const props = defineProps({
    form: { type: Object, required: true },
    disabled: { type: Boolean, default: false },
    eyeIndicator: { type: String, default: '' }
});

// Fixed label widths for consistent alignment
const keratLabelWidth = '60px';  // Keratometry row (shorter labels)
const cylLabelWidth = '140px';    // Cylinder row
const totalAstigmatismLabelWidth = '170px'; // Wider to fit long label + help badge

// Auto-calculate Avg Km from K1 and K2
const calculatedAvgKm = computed(() => {
    const k1 = parseFloat(props.form.cso_K1);
    const k2 = parseFloat(props.form.cso_K2);
    if (!isNaN(k1) && !isNaN(k2)) {
        return ((k1 + k2) / 2).toFixed(2);
    }
    return null;
});

// Auto-calculate Cylinder from K1 and K2 (absolute difference)
const calculatedCylinder = computed(() => {
    const k1 = parseFloat(props.form.cso_K1);
    const k2 = parseFloat(props.form.cso_K2);
    if (!isNaN(k1) && !isNaN(k2)) {
        return Math.abs(k1 - k2).toFixed(2);
    }
    return null;
});

// Auto-calculate K2 Axis from K1 Axis (K1 Axis - 90, with wrap-around)
const calculatedK2Axis = computed(() => {
    const k1Axis = parseFloat(props.form.cso_axK1);
    if (!isNaN(k1Axis)) {
        // K2 axis is perpendicular to K1 axis
        let k2Axis = k1Axis - 90;
        // Handle wrap-around: if negative, add 180
        if (k2Axis < 0) {
            k2Axis += 180;
        }
        return Math.round(k2Axis).toString();
    }
    return null;
});

// SimK Axis is the same as K2 Axis
const calculatedSimKAxis = computed(() => calculatedK2Axis.value);

// Check if toric IOL is indicated (cilTotal > 0.75)
const toricWarning = computed(() => {
    const cilTotal = parseFloat(props.form.cilTotal);
    return !isNaN(cilTotal) && cilTotal > 0.75;
});

// Update form.cso_avgKm when calculated value changes
watch(calculatedAvgKm, (newVal) => {
    if (newVal !== null) {
        props.form.cso_avgKm = newVal;
    }
});

// Update form.cso_cil when calculated cylinder changes
watch(calculatedCylinder, (newVal) => {
    if (newVal !== null) {
        props.form.cso_cil = newVal;
    }
});

// Update form.cso_axK2 when calculated K2 axis changes
watch(calculatedK2Axis, (newVal) => {
    if (newVal !== null) {
        props.form.cso_axK2 = newVal;
    }
});

// Update form.cso_ax (SimK Axis) when calculated value changes
watch(calculatedSimKAxis, (newVal) => {
    if (newVal !== null) {
        props.form.cso_ax = newVal;
    }
});

// Keratometry fields for counting
const keratometryFields = ['cso_K1', 'cso_axK1', 'cso_K2', 'cso_axK2', 'cso_avgKm', 'cso_cil', 'cso_ax', 'cilTotal', 'axConclusion'];
const totalFields = keratometryFields.length;

const filledCount = computed(() => {
    return keratometryFields.filter(f => props.form[f]).length;
});
</script>

<style scoped>
.section {
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    background: white;
    flex-shrink: 0;
}

.section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 14px 16px;
    background: #f9fafb;
}

.section-title {
    display: flex;
    align-items: center;
    gap: 10px;
    font-weight: 600;
    color: #1f2937;
}

.eye-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 4px 10px;
    background: linear-gradient(135deg, #052e16 0%, #2d2d44 100%);
    color: white;
    border-radius: 12px;
    font-size: 11px;
    font-weight: 700;
    box-shadow: 0 2px 4px rgba(26, 26, 46, 0.3);
    white-space: nowrap;
}

.header-actions {
    display: flex;
    align-items: center;
    gap: 8px;
}

.settings-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 4px;
    background: transparent;
    border: none;
    border-radius: 4px;
    color: #9ca3af;
    cursor: pointer;
    transition: all 0.15s;
}

.settings-btn:hover {
    background: #f3f4f6;
    color: #4b5563;
}

.section-badge {
    font-size: 12px;
    padding: 2px 8px;
    background: #e5e7eb;
    border-radius: 10px;
    color: #6b7280;
}

.section-content {
    padding: 12px 16px;
    border-top: 1px solid #e5e7eb;
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.param-row {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
    min-width: 0;
}

.param-row > * {
    min-width: 0;
}

.param-row.four-col {
    grid-template-columns: repeat(4, 1fr);
}

.param-row.five-col {
    grid-template-columns: repeat(5, 1fr);
}

/* At 1500px viewport, switch to 2 cols for better fit */
@media (max-width: 1500px) {
    .param-row {
        grid-template-columns: repeat(2, 1fr);
    }
    .param-row.four-col,
    .param-row.five-col {
        grid-template-columns: repeat(2, 1fr);
    }
}

@media (max-width: 900px) {
    .param-row,
    .param-row.four-col,
    .param-row.five-col {
        grid-template-columns: repeat(2, 1fr);
    }
}

@media (max-width: 600px) {
    .param-row, 
    .param-row.four-col, 
    .param-row.five-col {
        grid-template-columns: 1fr;
    }
}

/* Print styles - Compact grid layout */
@media print {
    .settings-btn {
        display: none !important;
    }
    
    .section {
        padding: 4px !important;
    }
    
    .section-header {
        padding: 3px 6px !important;
    }
    
    .section-title {
        font-size: 9px !important;
    }
    
    .section-content {
        padding: 4px !important;
    }
    
    .param-row {
        grid-template-columns: repeat(4, 1fr) !important;
        gap: 3px !important;
        margin-bottom: 2px !important;
    }
    
    .param-row.four-col {
        grid-template-columns: repeat(4, 1fr) !important;
    }
    
    .param-row.five-col {
        grid-template-columns: repeat(5, 1fr) !important;
    }
}
</style>
