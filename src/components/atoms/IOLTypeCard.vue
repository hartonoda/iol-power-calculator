<template>
    <div class="iol-type-card">
        <div class="card-header" :class="typeClass">
            <div class="iol-type-name">
                <slot name="icon">
                    <SvgIcon name="eye-standard" :size="18" />
                </slot>
                <span>{{ title }}</span>
            </div>
            <div class="suitability-score" :class="scoreClass">
                <span v-if="score === null">{{ t('iolType.notEvaluable') }}</span>
                <span v-else>{{ t('iolType.score') }} {{ score }}%</span>
            </div>
        </div>
        <div class="card-body">
            <div class="parameters-chart">
                <div v-for="param in parameters" :key="param.shortName" class="param-row" :class="{ 'affects-scoring': param.affectsScoring || param.isOutOfNormalLimit }">
                    <div class="param-content">
                        <div class="param-header">
                            <span class="param-name" :class="{ 'highlight': param.affectsScoring || param.isOutOfNormalLimit, 'has-deduction': param.hasDeduction && !param.affectsScoring && !param.isOutOfNormalLimit }">{{ param.name }}</span>
                            <span class="param-value" :class="[param.status, { 'highlight': param.affectsScoring || param.isOutOfNormalLimit, 'has-deduction': param.hasDeduction && !param.affectsScoring && !param.isOutOfNormalLimit }]">{{ param.displayValue }}</span>
                        </div>
                        <RangeChart
                            :segments="param.segments"
                            :breakpoints="param.breakpoints"
                            :min-pos="param.minPos"
                            :max-pos="param.maxPos"
                            :min-label="param.minLabel"
                            :max-label="param.maxLabel"
                            :range-text="param.valueRangeText || param.rangeText"
                            :marker-style="param.markerStyle"
                            :show-marker="param.showMarker"
                            :status="param.status"
                            :highlight="param.affectsScoring || param.isOutOfNormalLimit"
                            :has-deduction="param.hasDeduction && !param.affectsScoring && !param.isOutOfNormalLimit"
                        />
                    </div>
                    <div class="deduction-cell">
                        <div v-if="param.isOutOfNormalLimit" class="out-of-limit-text">
                            <span>{{ t('iolType.outside') }}</span>
                            <span>{{ t('iolType.range') }}</span>
                        </div>
                        <span v-else class="deduction-value" :class="{ 'highlight': param.affectsScoring, 'has-deduction': param.hasDeduction && !param.affectsScoring }">-{{ param.actualDeduction !== undefined ? param.actualDeduction : 0 }}%</span>
                    </div>
                </div>
            </div>
            <div class="incompatibility-summary" v-if="affectedParams.length > 0 && score !== null">
                <div class="incompatibility-header">
                    <span class="incompatibility-label">{{ t('iolType.totalDeduction') }}</span>
                    <span class="total-deduction">{{ totalDeduction >= 0 ? '+' : '' }}{{ totalDeduction }}%</span>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed } from 'vue';
import { useI18n } from '@/composables/useI18n';
import SvgIcon from '@/components/atoms/SvgIcon.vue';
import RangeChart from '@/components/atoms/RangeChart.vue';

const { t } = useI18n();

const props = defineProps({
    title: { type: String, required: true },
    typeClass: { type: String, default: 'standard' }, // 'standard', 'plus', 'edof', 'multifocal'
    score: { type: [Number, null], default: 100 },
    affectedParams: { type: Array, default: () => [] },
    parameters: { type: Array, default: () => [] }
});

const scoreClass = computed(() => {
    if (props.score === null) return 'not-evaluable';
    if (props.score >= 90) return 'excellent';
    if (props.score >= 75) return 'good';
    if (props.score >= 50) return 'moderate';
    return 'poor';
});

// Calculate total deduction from all affected parameters
const totalDeduction = computed(() => {
    return props.affectedParams.reduce((sum, p) => sum + (p.deduction || 0), 0);
});
</script>

<style scoped>
.iol-type-card {
    background: white;
    border-radius: 10px;
    overflow: hidden;
    border: 1px solid #e5e7eb;
    box-shadow: 0 1px 3px rgba(0,0,0,0.08);
}

.card-header {
    padding: 12px 14px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 10px;
}

.card-header.standard { background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); }
.card-header.plus { background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); }
.card-header.edof { background: linear-gradient(135deg, #fefce8 0%, #fef3c7 100%); }
.card-header.multifocal { background: linear-gradient(135deg, #fdf4ff 0%, #fae8ff 100%); }

.iol-type-name {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 600;
    font-size: 1rem;
    color: #1f2937;
}

.card-header.standard .iol-type-name { color: #0369a1; }
.card-header.plus .iol-type-name { color: #15803d; }
.card-header.edof .iol-type-name { color: #a16207; }
.card-header.multifocal .iol-type-name { color: #7e22ce; }

.card-header.standard svg { stroke: #0284c7; }
.card-header.plus svg { stroke: #16a34a; }
.card-header.edof svg { stroke: #ca8a04; }
.card-header.multifocal svg { stroke: #9333ea; }

.suitability-score {
    font-size: 0.875rem;
    font-weight: 600;
    padding: 0.25rem 0.625rem;
    border-radius: 0.75rem;
    white-space: nowrap;
}

.suitability-score.excellent { background: #dbeafe; color: #1d4ed8; }
.suitability-score.good { background: #e0f2fe; color: #0369a1; }
.suitability-score.moderate { background: #fef3c7; color: #b45309; }
.suitability-score.poor { background: #ffedd5; color: #c2410c; }
.suitability-score.not-evaluable { background: #f3f4f6; color: #6b7280; }

.card-body {
    padding: 12px 14px;
    border-top: 1px solid #f3f4f6;
}

.incompatibility-summary {
    margin-top: 0.625rem;
    padding: 0.5rem 0.625rem;
    background: #fef3c7;
    border-radius: 0.375rem;
    font-size: 0.8125rem;
}

.incompatibility-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.incompatibility-label {
    color: #92400e;
    font-weight: 600;
}

.total-deduction {
    font-weight: 700;
    color: #dc2626;
    font-size: 0.75rem;
}

.total-deduction.positive {
    color: #16a34a;
}

.parameters-chart {
    display: flex;
    flex-direction: column;
    gap: 8px;
    overflow-x: hidden;
    max-width: 100%;
}

.param-row {
    display: flex;
    flex-direction: row;
    gap: 12px;
    align-items: center;
    padding: 4px 6px;
    border-radius: 4px;
    border-left: 3px solid transparent;
    min-height: 44px;
}

.param-content {
    display: flex;
    flex-direction: column;
    gap: 3px;
    flex: 1;
    min-width: 0;
}

.deduction-cell {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 52px;
    min-width: 52px;
    flex-shrink: 0;
    gap: 2px;
}

.deduction-value {
    font-weight: 600;
    color: #6b7280;
    font-size: 0.8125rem;
    line-height: 1.4;
}

.deduction-value.highlight {
    color: #ea580c;
    font-weight: 700;
}

.deduction-value.has-deduction {
    color: #ea580c;
    font-weight: 600;
}

.out-of-limit-text {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    font-size: 0.625rem;
    color: #dc2626;
    font-weight: 600;
    text-transform: uppercase;
    line-height: 1.1;
    letter-spacing: 0.02em;
}


.param-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.8125rem;
}

.param-name {
    color: #6b7280;
    font-weight: 500;
}

.param-name.highlight {
    color: #ea580c;
    font-weight: 700;
}

.param-name.has-deduction {
    color: #ea580c;
    font-weight: 600;
}

.param-value {
    font-weight: 600;
    padding: 1px 6px;
    border-radius: 4px;
    border: 1px solid transparent;
}

.param-value.in-range {
    color: #1d4ed8;
    background: #eff6ff;
}

.param-value.out-range {
    color: #c2410c;
    background: #fff7ed;
}

.param-value.highlight {
    color: #ea580c;
    background: #fff7ed;
    border-color: #fb923c;
    font-weight: 700;
}

.param-value.has-deduction {
    color: #ea580c;
    font-weight: 600;
}

.param-row.affects-scoring {
    background: #fff7ed;
    border-left-color: #fb923c;
}

/* At 1500px viewport, reduce value sizes and deduction column to fit better */
@media (max-width: 1500px) {
    .suitability-score {
        font-size: 0.75rem;
        padding: 0.2rem 0.5rem;
    }
    .iol-type-name {
        font-size: 0.75rem;
    }
    .param-header {
        font-size: 0.75rem;
    }
    .param-name {
        font-size: 0.625rem;
    }
    .param-value {
        font-size: 0.625rem;
        padding: 1px 4px;
    }
    .deduction-cell {
        width: 34px;
        min-width: 34px;
        gap: 1px;
    }
    .deduction-value {
        font-size: 0.625rem;
    }
    .out-of-limit-text {
        font-size: 0.5rem;
    }
    .incompatibility-summary {
        font-size: 0.6875rem;
    }
    .incompatibility-label {
        font-size: 0.625rem;
    }
    .total-deduction {
        font-size: 0.625rem;
    }
}

/* Print styles */
@media print {
    .iol-type-card {
        padding: 4px !important;
        border-radius: 4px !important;
    }
    
    .card-header {
        padding: 4px 6px !important;
    }
    
    .iol-type-name {
        font-size: 8px !important;
        gap: 4px !important;
    }
    
    .iol-type-name svg {
        width: 12px !important;
        height: 12px !important;
    }
    
    .suitability-score {
        font-size: 8px !important;
        padding: 2px 6px !important;
    }
    
    .card-body {
        padding: 4px 6px !important;
    }
    
    .incompatibility-summary {
        padding: 3px 6px !important;
        font-size: 7px !important;
        margin-bottom: 4px !important;
    }
    
    .parameters-chart {
        gap: 3px !important;
    }
    
    .param-row {
        gap: 6px !important;
    }
    
    .deduction-cell {
        min-width: 30px !important;
    }
    
    .deduction-value {
        font-size: 7px !important;
    }
    
    .param-header {
        font-size: 7px !important;
    }
    
    .param-value {
        padding: 0 3px !important;
        font-size: 7px !important;
    }
    
}
</style>
