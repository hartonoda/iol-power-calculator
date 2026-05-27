<template>
    <!-- IOL Calculator Section - Currently hidden, reserved for future use -->
    <div v-if="visible" class="iol-calculator-section">
        <div class="iol-columns">
            <!-- IOL Spherical Column -->
            <div class="iol-column">
                <div class="column-header sferica">
                    <SvgIcon name="circle" :size="16" />
                    <span>{{ t('iol.spherical') }}</span>
                    <span class="column-count">{{ getSfericaFilledCount }}/{{ sfericaCalculators.length * 2 }}</span>
                </div>
                <table class="iol-table">
                    <thead>
                        <tr>
                            <th class="calc-name-col">Calculator</th>
                            <th class="value-col">{{ t('iol.power') }}</th>
                            <th class="value-col">{{ t('iol.residual') }}</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="calc in sfericaCalculators" :key="calc.key">
                            <td class="calc-name">{{ calc.label }}</td>
                            <td class="input-cell">
                                <input 
                                    :value="form[calc.key]" 
                                    @input="handleNumericInput(calc.key, $event)"
                                    :disabled="disabled"
                                    placeholder="D"
                                />
                            </td>
                            <td class="input-cell">
                                <input 
                                    :value="form[calc.key + '_res']" 
                                    @input="handleNumericInput(calc.key + '_res', $event)"
                                    :disabled="disabled"
                                    placeholder="D"
                                    class="residual-input"
                                />
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <!-- IOL Toric Column -->
            <div class="iol-column">
                <div class="column-header torica">
                    <SvgIcon name="ellipse" :size="16" />
                    <span>{{ t('iol.toric') }}</span>
                    <span class="column-count">{{ getToricaFilledCount }}/{{ toricaCalculators.length * 4 }}</span>
                </div>
                <table class="iol-table toric-table">
                    <thead>
                        <tr>
                            <th class="calc-name-col">Calculator</th>
                            <th class="value-col">{{ t('iol.power') }}</th>
                            <th class="value-col">{{ t('iol.residual') }}</th>
                            <th class="value-col">{{ t('iol.tModel') }}</th>
                            <th class="value-col">{{ t('iol.residualCyl') }}</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="calc in toricaCalculators" :key="calc.key">
                            <td class="calc-name">{{ calc.label }}</td>
                            <td class="input-cell">
                                <input 
                                    :value="form[calc.key + '_pwr']" 
                                    @input="handleNumericInput(calc.key + '_pwr', $event)"
                                    :disabled="disabled"
                                    placeholder="D"
                                />
                            </td>
                            <td class="input-cell">
                                <input 
                                    :value="form[calc.key + '_res']" 
                                    @input="handleNumericInput(calc.key + '_res', $event)"
                                    :disabled="disabled"
                                    placeholder="D"
                                    class="residual-input"
                                />
                            </td>
                            <td class="input-cell">
                                <input 
                                    :value="form[calc.key]" 
                                    @input="handleNumericInput(calc.key, $event)"
                                    :disabled="disabled"
                                    placeholder="T"
                                    class="toric-input"
                                />
                            </td>
                            <td class="input-cell">
                                <input 
                                    :value="form[calc.key + '_rescyl']" 
                                    @input="handleNumericInput(calc.key + '_rescyl', $event)"
                                    :disabled="disabled"
                                    placeholder="D"
                                    class="residual-input"
                                />
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <!-- IOL Post LVC Column -->
            <div class="iol-column">
                <div class="column-header postlvc">
                    <SvgIcon name="eye-postlvc" :size="16" />
                    <span>{{ t('iol.postLVC') }}</span>
                    <span class="column-count">{{ getPostLVCFilledCount }}/{{ postLVCCalculators.length * 2 }}</span>
                </div>
                <table class="iol-table">
                    <thead>
                        <tr>
                            <th class="calc-name-col">Calculator</th>
                            <th class="value-col">{{ t('iol.power') }}</th>
                            <th class="value-col">{{ t('iol.residual') }}</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="calc in postLVCCalculators" :key="calc.key">
                            <td class="calc-name">{{ calc.label }}</td>
                            <td class="input-cell">
                                <input 
                                    :value="form[calc.key]" 
                                    @input="handleNumericInput(calc.key, $event)"
                                    :disabled="disabled"
                                    placeholder="D"
                                />
                            </td>
                            <td class="input-cell">
                                <input 
                                    :value="form[calc.key + '_res']" 
                                    @input="handleNumericInput(calc.key + '_res', $event)"
                                    :disabled="disabled"
                                    placeholder="D"
                                    class="residual-input"
                                />
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed } from 'vue';
import { useI18n } from '@/composables/useI18n';
import { normalizeDecimal } from '@/utils/numberUtils';
import SvgIcon from '@/components/atoms/SvgIcon.vue';

const { t } = useI18n();

const props = defineProps({
    form: { type: Object, required: true },
    disabled: { type: Boolean, default: false },
    visible: { type: Boolean, default: false }
});

// Handle numeric input with decimal normalization
const handleNumericInput = (key, event) => {
    props.form[key] = normalizeDecimal(event.target.value);
};

// Define calculators with their display labels
const sfericaCalculators = [
    { key: 'iol_evo2', label: 'EVO 2.0' },
    { key: 'iol_hoffer_qst', label: 'Hoffer QST' },
    { key: 'iol_kane', label: 'Kane' },
    { key: 'iol_pearl_dgs', label: 'PEARL-DGS' }
];

const toricaCalculators = [
    { key: 'iol_evo_toric', label: 'EVO Toric' },
    { key: 'iol_hoffer_qst_toric', label: 'Hoffer QST Toric' },
    { key: 'iol_kane_toric', label: 'Kane Toric' }
];

const postLVCCalculators = [
    { key: 'iol_evo2_post', label: 'EVO 2.0' },
    { key: 'iol_pearl_dgs_post', label: 'PEARL-DGS' },
    { key: 'iol_ray_tracing', label: 'Ray Tracing' }
];

// Count filled fields (both IOL and residual)
const getSfericaFilledCount = computed(() => {
    let count = 0;
    sfericaCalculators.forEach(c => {
        if (props.form[c.key]) count++;
        if (props.form[c.key + '_res']) count++;
    });
    return count;
});

const getToricaFilledCount = computed(() => {
    let count = 0;
    toricaCalculators.forEach(c => {
        if (props.form[c.key]) count++;
        if (props.form[c.key + '_pwr']) count++;
        if (props.form[c.key + '_res']) count++;
        if (props.form[c.key + '_rescyl']) count++;
    });
    return count;
});

const getPostLVCFilledCount = computed(() => {
    let count = 0;
    postLVCCalculators.forEach(c => {
        if (props.form[c.key]) count++;
        if (props.form[c.key + '_res']) count++;
    });
    return count;
});

// Export field counts for parent component
const totalFields = (sfericaCalculators.length * 2) + (toricaCalculators.length * 4) + (postLVCCalculators.length * 2);
const totalFilledCount = computed(() => getSfericaFilledCount.value + getToricaFilledCount.value + getPostLVCFilledCount.value);

defineExpose({ totalFields, totalFilledCount });
</script>

<style scoped>
.iol-calculator-section {
    border-top: 1px solid #e5e7eb;
    padding: 16px;
}

.iol-columns {
    display: grid;
    grid-template-columns: 1fr 1.5fr 1fr;
    gap: 16px;
}

.iol-column {
    background: #fafbfc;
    border-radius: 8px;
    border: 1px solid #e5e7eb;
    overflow: hidden;
}

.column-header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 12px;
    font-size: 13px;
    font-weight: 600;
    border-bottom: 1px solid #e5e7eb;
}

.column-header.sferica {
    background: linear-gradient(135deg, #dbeafe 0%, #eff6ff 100%);
    color: #1e40af;
}

.column-header.torica {
    background: linear-gradient(135deg, #dcfce7 0%, #f0fdf4 100%);
    color: #166534;
}

.column-header.postlvc {
    background: linear-gradient(135deg, #fef3c7 0%, #fffbeb 100%);
    color: #92400e;
}

.column-header svg {
    flex-shrink: 0;
}

.column-header span:first-of-type {
    flex: 1;
}

.column-count {
    font-size: 11px;
    font-weight: 500;
    opacity: 0.7;
}

/* IOL Table */
.iol-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
}

.iol-table th {
    padding: 8px 6px;
    text-align: center;
    font-size: 10px;
    font-weight: 600;
    color: #6b7280;
    text-transform: capitalize;
    background: #f3f4f6;
    border-bottom: 1px solid #e5e7eb;
}

.iol-table th.calc-name-col {
    text-align: left;
    padding-left: 12px;
    width: 50%;
}

.iol-table th.value-col {
    width: 25%;
}

.iol-table td {
    padding: 4px 6px;
    border-bottom: 1px solid #f3f4f6;
}

.iol-table tr:last-child td {
    border-bottom: none;
}

.calc-name {
    font-weight: 500;
    color: #374151;
    padding-left: 12px !important;
    font-size: 12px;
}

.input-cell {
    text-align: center;
}

.input-cell input {
    width: 60px;
    padding: 6px 4px;
    border: 1px solid #e5e7eb;
    border-radius: 4px;
    font-size: 13px;
    text-align: center;
    transition: border-color 0.2s, background 0.2s;
}

.input-cell input:focus {
    outline: none;
    border-color: #6366f1;
    background: #f5f3ff;
}

.input-cell input:disabled {
    background: #f9fafb;
    color: #374151;
}

.input-cell input::placeholder {
    color: #d1d5db;
    font-size: 11px;
}

/* Toric table has narrower columns (5 columns total) */
.toric-table th.calc-name-col {
    width: 30%;
}

.toric-table th.value-col {
    width: 17.5%;
}

/* Toric T input has a different style */
.toric-input {
    background: #ecfdf5 !important;
    border-color: #6ee7b7 !important;
}

.toric-input:focus {
    background: #d1fae5 !important;
    border-color: #34d399 !important;
}

/* Residual input has a different style */
.residual-input {
    background: #fefce8 !important;
    border-color: #fde047 !important;
}

.residual-input:focus {
    background: #fef9c3 !important;
    border-color: #facc15 !important;
}

@media (max-width: 900px) {
    .iol-columns {
        grid-template-columns: 1fr;
    }
}
</style>
