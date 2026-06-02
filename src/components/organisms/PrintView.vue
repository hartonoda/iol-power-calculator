<template>
    <div class="print-view">
        <!-- Header - Single row -->
        <div class="print-header-row">
            <span class="report-title">{{ t('operations.operationReport') }}</span>
            <span class="separator">—</span>
            <span class="patient-name">{{ patientName }}</span>
            <span class="separator">•</span>
            <span>{{ patientAge }} {{ t('common.years') }}</span>
            <span class="separator">•</span>
            <span class="eye-badge-print">{{ form.eye }}</span>
            <span class="separator">•</span>
            <span>{{ formatDate(form.operationDate) }}</span>
        </div>

        <!-- BCDVA Section -->
        <div class="print-section bcdva-section">
            <div class="bcdva-row">
                <span class="bcdva-title">{{ t('sections.bcdva') }}</span>
                <span class="param"><strong>SPH:</strong> {{ form.bcdva_sph || '—' }}</span>
                <span class="param"><strong>CYL:</strong> {{ form.bcdva_cyl || '—' }}</span>
                <span class="param"><strong>AX:</strong> {{ form.bcdva_ax ? form.bcdva_ax + '°' : '—' }}</span>
                <span class="param"><strong>VA:</strong> {{ form.bcdva_va || '—' }}</span>
            </div>
        </div>

        <!-- Notes Summary (inline) -->
        <div v-if="hasNotes" class="print-section notes-section">
            <div class="notes-row">
                <div v-if="form.noteSistemic" class="note-item systemic">
                    <strong>{{ t('notes.systemic') }}:</strong> {{ form.noteSistemic }}
                </div>
                <div v-if="form.noteEye" class="note-item ocular">
                    <strong>{{ t('notes.ocular') }}:</strong> {{ form.noteEye }}
                </div>
            </div>
        </div>

        <!-- Ocular Parameters - 6 columns -->
        <div class="print-section ocular-section">
            <div class="section-title-compact">{{ t('sections.ocularParameters') }}</div>
            
            <!-- Row 1: Offset, Corneal Aberrations, Endothelial -->
            <div class="params-grid six-col">
                <div class="param-cell">
                    <span class="label">Offset Limbus</span>
                    <span class="value" :class="getValueClass('offsetLimbus')">{{ form.offsetLimbus || '—' }}</span>
                </div>
                <div class="param-cell">
                    <span class="label">Offset Pupil</span>
                    <span class="value" :class="getValueClass('offsetPupilla')">{{ form.offsetPupilla || '—' }}</span>
                </div>
                <div class="param-cell">
                    <span class="label">SA 4mm</span>
                    <span class="value" :class="getValueClass('AbS')">{{ form.AbS || '—' }}</span>
                </div>
                <div class="param-cell">
                    <span class="label">Coma 4mm</span>
                    <span class="value" :class="getValueClass('Coma')">{{ form.Coma || '—' }}</span>
                </div>
                <div class="param-cell">
                    <span class="label">HOA 4mm</span>
                    <span class="value" :class="getValueClass('HOA')">{{ form.HOA || '—' }}</span>
                </div>
                <div class="param-cell">
                    <span class="label">Endothelial</span>
                    <span class="value" :class="getValueClass('cellEndotelio')">{{ endothelialDisplay }}</span>
                </div>
            </div>

            <!-- Row 2: Surface indices, Pupil -->
            <div class="params-grid six-col">
                <div class="param-cell">
                    <span class="label">SDP</span>
                    <span class="value" :class="getValueClass('SDP')">{{ form.SDP || '—' }}</span>
                </div>
                <div class="param-cell">
                    <span class="label">SRI</span>
                    <span class="value" :class="getValueClass('SRI')">{{ form.SRI || '—' }}</span>
                </div>
                <div class="param-cell">
                    <span class="label">SAI</span>
                    <span class="value" :class="getValueClass('SAI')">{{ form.SAI || '—' }}</span>
                </div>
                <div class="param-cell">
                    <span class="label">Photopic</span>
                    <span class="value" :class="getValueClass('pupillaPhotopic')">{{ form.pupillaPhotopic || '—' }}</span>
                </div>
                <div class="param-cell">
                    <span class="label">Mesopic</span>
                    <span class="value" :class="getValueClass('pupillaMesopica')">{{ form.pupillaMesopica || '—' }}</span>
                </div>
                <div class="param-cell">
                    <span class="label">Scotopic</span>
                    <span class="value" :class="getValueClass('pupillaScotopic')">{{ form.pupillaScotopic || '—' }}</span>
                </div>
            </div>

            <!-- Keratometry - 8 columns -->
            <div class="subsection-title">{{ t('keratometry.title') }}</div>
            <div class="params-grid eight-col">
                <div class="param-cell">
                    <span class="label">K1 Flat</span>
                    <span class="value" :class="getValueClass('cso_K1')">{{ form.cso_K1 || '—' }}</span>
                </div>
                <div class="param-cell">
                    <span class="label">K1 Axis</span>
                    <span class="value">{{ form.cso_axK1 ? form.cso_axK1 + '°' : '—' }}</span>
                </div>
                <div class="param-cell">
                    <span class="label">K2 Steep</span>
                    <span class="value" :class="getValueClass('cso_K2')">{{ form.cso_K2 || '—' }}</span>
                </div>
                <div class="param-cell">
                    <span class="label">K2 Axis</span>
                    <span class="value">{{ calculatedK2Axis }}</span>
                </div>
                <div class="param-cell">
                    <span class="label">Avg Km</span>
                    <span class="value">{{ calculatedAvgKm }}</span>
                </div>
                <div class="param-cell">
                    <span class="label">Cylinder</span>
                    <span class="value">{{ calculatedCylinder }}</span>
                </div>
                <div class="param-cell">
                    <span class="label">Cyl Tot</span>
                    <span class="value" :class="getValueClass('cilTotal')">{{ form.cilTotal || '—' }}</span>
                </div>
                <div class="param-cell">
                    <span class="label">Ax Tot</span>
                    <span class="value">{{ form.axConclusion ? form.axConclusion + '°' : '—' }}</span>
                </div>
            </div>

            <!-- Biometry -->
            <div class="subsection-title">{{ t('biometry.title') }}</div>
            <div class="params-grid six-col">
                <div class="param-cell">
                    <span class="label">{{ t('biometry.axialLength') }}</span>
                    <span class="value" :class="getValueClass('cso_AXL')">{{ form.cso_AXL || '—' }}</span>
                </div>
                <div class="param-cell">
                    <span class="label">{{ t('biometry.acDepth') }}</span>
                    <span class="value" :class="getValueClass('cso_ACD')">{{ form.cso_ACD || '—' }}</span>
                </div>
                <div class="param-cell">
                    <span class="label">{{ t('biometry.lensThickness') }}</span>
                    <span class="value" :class="getValueClass('cso_LT')">{{ form.cso_LT || '—' }}</span>
                </div>
                <div class="param-cell">
                    <span class="label"></span>
                    <span class="value"></span>
                </div>
                <div class="param-cell">
                    <span class="label"></span>
                    <span class="value"></span>
                </div>
                <div class="param-cell">
                    <span class="label"></span>
                    <span class="value"></span>
                </div>
            </div>
        </div>

        <!-- IOL Type Suggestions with Charts -->
        <div class="print-section iol-type-section">
            <div class="section-title-compact">{{ t('iolType.title') }}</div>
            
            <!-- Warnings Box (Yellow) -->
            <div v-if="hasWarnings" class="warnings-box-print yellow">
                <div class="warnings-header-print">
                    <span>{{ t('warnings.title') }}</span>
                </div>
                <div class="warnings-content-print">
                    <!-- Systemic Note Warning -->
                    <div v-if="allWarnings.systemicNote" class="warning-item-print">
                        <span class="warning-label-print">{{ t('iolType.systemicConditionsNoted') }}:</span>
                        <span class="warning-text-print">{{ allWarnings.systemicNote }}</span>
                    </div>
                    
                    <!-- Ocular Note Warning -->
                    <div v-if="allWarnings.ocularNote" class="warning-item-print">
                        <span class="warning-label-print">{{ t('iolType.ocularConditionsNoted') }}:</span>
                        <span class="warning-text-print">{{ allWarnings.ocularNote }}</span>
                    </div>
                    
                    <!-- Toric IOL Warning -->
                    <div v-if="allWarnings.toricIOL" class="warning-item-print">
                        <span class="warning-label-print">{{ t('iolType.toricIOLIndicated') }}:</span>
                        <span class="warning-text-print">
                            <span v-if="allWarnings.toricIOL.cylinder">
                                {{ t('iolType.toricIOLMessage', { value: allWarnings.toricIOL.cylinder }) }}
                            </span>
                            <span v-if="allWarnings.toricIOL.sri" class="additional-info-print">
                                <strong>SRI:</strong> {{ allWarnings.toricIOL.sri.value }} ({{ t('iolType.normalRange') }}: ≤ {{ allWarnings.toricIOL.sri.max }})
                            </span>
                            <span v-if="allWarnings.toricIOL.sai" class="additional-info-print">
                                <strong>SAI:</strong> {{ allWarnings.toricIOL.sai.value }} ({{ t('iolType.normalRange') }}: ≤ {{ allWarnings.toricIOL.sai.max }})
                            </span>
                        </span>
                    </div>
                    
                    <!-- Spherical IOL Warning -->
                    <div v-if="allWarnings.sphericalIOL" class="warning-item-print">
                        <span class="warning-label-print">{{ t('iolType.monofocaleStandard') }} - {{ t(allWarnings.sphericalIOL.messageKey) }}:</span>
                        <span class="warning-text-print">
                            <strong>AbS:</strong> {{ allWarnings.sphericalIOL.value }} ({{ allWarnings.sphericalIOL.level === 'strong' ? '< -0.3' : '< -0.2' }})
                        </span>
                    </div>
                    
                    <!-- Endothelial Warning -->
                    <div v-if="allWarnings.endothelial" class="warning-item-print">
                        <span class="warning-label-print">{{ t('ocularParams.endothelialCells') }}:</span>
                        <span class="warning-text-print">
                            {{ allWarnings.endothelial.message }}
                            <span v-if="allWarnings.endothelial.value"> ({{ allWarnings.endothelial.value }} cells/mm²)</span>
                        </span>
                    </div>
                    
                    <!-- Keratometry Warnings -->
                    <div v-if="allWarnings.keratometry && allWarnings.keratometry.length > 0" class="warning-item-print">
                        <span class="warning-label-print">{{ t('keratometry.title') }} - {{ t('warnings.outOfNormalRange') }}:</span>
                        <span class="warning-text-print">
                            <span v-for="(warning, idx) in allWarnings.keratometry" :key="warning.field">
                                <span v-if="idx > 0">, </span>
                                <strong>{{ warning.label }}:</strong> {{ warning.value }}{{ warning.unit }}
                                <span v-if="warning.range"> ({{ t('warnings.normalRange') }}: {{ warning.range }})</span>
                            </span>
                        </span>
                    </div>
                </div>
            </div>
            
            <!-- Incompatibility Warnings Box (Red) - hidden -->
            <div v-if="false && allWarnings.zeroCompatibility && allWarnings.zeroCompatibility.length > 0" class="warnings-box-print red">
                <div class="warnings-header-print">
                    <span>{{ t('warnings.incompatibility') }}</span>
                </div>
                <div class="warnings-content-print">
                    <div v-for="warning in allWarnings.zeroCompatibility" :key="warning.type" class="warning-item-print">
                        <span class="warning-label-print">{{ warning.iolTypeName }} {{ t('iolType.notCompatible') }}:</span>
                        <span class="warning-text-print">
                            {{ warning.iolTypeName }} {{ t('iolType.notCompatible') }} because
                            <span v-for="(param, idx) in warning.params" :key="idx">
                                <span v-if="idx > 0 && idx < warning.params.length - 1">, </span>
                                <span v-else-if="idx === warning.params.length - 1 && warning.params.length > 1"> and </span>
                                <span v-else-if="idx === 0"> </span>
                                <strong>{{ param.label }}</strong> is {{ param.value }}{{ param.unit }}
                            </span>.
                        </span>
                    </div>
                </div>
            </div>

            <div class="iol-type-cards-print">
                <div v-for="iol in iolTypeCards" :key="iol.type" class="iol-type-card-print" :class="iol.typeClass">
                    <div class="card-header-print" :class="iol.typeClass">
                        <span class="iol-name-print">{{ iol.title }}</span>
                        <span class="score-badge-print" :class="getScoreClass(iol.score)">
                            <span v-if="iol.score === null">{{ t('iolType.notEvaluable') }}</span>
                            <span v-else>{{ t('iolType.score') }} {{ iol.score }}%</span>
                        </span>
                    </div>
                    <div class="card-body-print">
                        <div class="params-chart-print">
                            <div v-for="param in iol.parameters" :key="param.shortName" class="param-row-print" :class="{ 'affects-scoring-print': param.affectsScoring || param.isOutOfNormalLimit, 'has-deduction-print': param.hasDeduction && !param.affectsScoring && !param.isOutOfNormalLimit }">
                                <div class="param-content-print">
                                    <div class="param-header-print">
                                        <span class="param-name-print" :class="{ 'highlight-print': param.affectsScoring || param.isOutOfNormalLimit, 'has-deduction-print': param.hasDeduction && !param.affectsScoring && !param.isOutOfNormalLimit }">{{ param.name }}</span>
                                        <span class="param-value-print" :class="[param.status, { 'highlight-print': param.affectsScoring || param.isOutOfNormalLimit, 'has-deduction-print': param.hasDeduction && !param.affectsScoring && !param.isOutOfNormalLimit }]">{{ param.displayValue }}</span>
                                    </div>
                                <div class="range-chart-print">
                                            <div class="range-track-print" :class="{ 'highlight-print': param.affectsScoring || param.isOutOfNormalLimit }">
                                                <!-- Deduction segments background -->
                                                <div v-for="(segment, segIdx) in param.segments" :key="segIdx" 
                                                     class="deduction-segment-print" 
                                                     :style="{
                                                         left: `${((segment.start - param.minLabel) / (parseFloat(param.maxLabel) - parseFloat(param.minLabel))) * 100}%`,
                                                         width: `${((segment.end - segment.start) / (parseFloat(param.maxLabel) - parseFloat(param.minLabel))) * 100}%`,
                                                         opacity: segment.deduction > 0 ? Math.min(segment.deduction / 100, 0.3) : 0
                                                     }">
                                                </div>
                                                <!-- Min marker (blue bar) -->
                                                <div class="min-marker-print" style="left: 0%; width: 2px;"></div>
                                                <!-- Breakpoints (vertical lines) -->
                                                <div v-for="(bp, bpIdx) in param.breakpoints" :key="bpIdx" 
                                                     class="breakpoint-marker-print" 
                                                     :style="{ left: `${bp.position}%` }">
                                                </div>
                                                <!-- Value marker -->
                                                <div v-if="param.showMarker" 
                                                     class="value-marker-print" 
                                                     :class="[param.status, { 'highlight-print': param.affectsScoring || param.isOutOfNormalLimit }]" 
                                                     :style="param.markerStyle">
                                                </div>
                                                <!-- Max marker -->
                                                <div class="max-marker-print" style="left: 100%; width: 2px;"></div>
                                            </div>
                                            <div class="range-labels-print">
                                                <span>{{ param.minLabel }}</span>
                                                <span class="range-text-print" :class="{ 'highlight-print': param.affectsScoring || param.isOutOfNormalLimit }">{{ param.valueRangeText || param.rangeText }}</span>
                                                <span>{{ param.maxLabel }}</span>
                                            </div>
                                </div>
                            </div>
                                <div class="deduction-cell-print">
                                    <div v-if="param.isOutOfNormalLimit" class="out-of-limit-text-print">
                                        <span>{{ t('iolType.outside') }}</span>
                                        <span>{{ t('iolType.range') }}</span>
                                    </div>
                                    <span v-else class="deduction-value-print" :class="{ 'highlight-print': param.affectsScoring, 'has-deduction-print': param.hasDeduction && !param.affectsScoring }">
                                        -{{ param.actualDeduction !== undefined ? param.actualDeduction : 0 }}%
                                    </span>
                                </div>
                            </div>
                        </div>
                        <!-- Incompatibility Summary -->
                        <div v-if="iol.affectedParams.length > 0 && iol.score !== null" class="incompatibility-summary-print">
                            <div class="incompatibility-header-print">
                                <span class="incompatibility-label-print">{{ t('iolType.totalDeduction') }}</span>
                                <span class="total-deduction-print">{{ iol.totalDeduction >= 0 ? '+' : '' }}{{ iol.totalDeduction }}%</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- IOL Model & Calculation -->
        <div class="print-section iol-model-section">
            <div class="section-title-compact">{{ t('sections.iolModel') }}: {{ form.iolModelSelected || t('iol.notSelected') }}</div>
            
            <div v-if="hasIolData" class="iol-tables-row">
                <!-- Spherical IOL -->
                <div class="iol-mini-table">
                    <div class="mini-table-title">{{ t('iol.spherical') }}</div>
                    <table class="iol-table-compact">
                        <thead>
                            <tr>
                                <th>Calculator</th>
                                <th>Power</th>
                                <th>Res</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="calc in sfericaCalculators" :key="calc.key">
                                <td>{{ calc.label }}</td>
                                <td>{{ form[calc.key] || '—' }}</td>
                                <td>{{ form[calc.key + '_res'] || '—' }}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                
                <!-- Toric IOL (if has data) -->
                <div v-if="hasToricData" class="iol-mini-table">
                    <div class="mini-table-title">{{ t('iol.toric') }}</div>
                    <table class="iol-table-compact">
                        <thead>
                            <tr>
                                <th>Calculator</th>
                                <th>Power</th>
                                <th>T</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="calc in toricaCalculators" :key="calc.key">
                                <td>{{ calc.label }}</td>
                                <td>{{ form[calc.key + '_pwr'] || '—' }}</td>
                                <td>{{ form[calc.key] || '—' }}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <!-- Additional Notes -->
        <div v-if="form.noteIOLType" class="print-section note-section">
            <div class="section-title-compact">{{ t('sections.note') }}</div>
            <p class="note-text">{{ form.noteIOLType }}</p>
        </div>
    </div>
</template>

<script setup>
import { computed } from 'vue';
import { useI18n } from '@/composables/useI18n';
import { useFieldRules } from '@/composables/useFieldRules';
import { useIOLRules } from '@/composables/useIOLRules';
import { useUnifiedWarnings } from '@/composables/useUnifiedWarnings';
import ocularParameterRules from '@/config/ocularParameterRules.json';
import iolSuitabilityRules from '@/config/iolSuitabilityRules.json';
import { deriveAllParameterRanges } from '@/utils/iolRangeUtils';

const { t } = useI18n();
const { fieldRules } = useFieldRules();
const { iolRules } = useIOLRules();
const { collectWarnings } = useUnifiedWarnings();

const props = defineProps({
    form: { type: Object, required: true },
    patients: { type: Array, default: () => [] }
});

const patientName = computed(() => {
    const patient = props.patients.find(p => p.id == props.form.patientId);
    return patient?.name || '—';
});

const patientAge = computed(() => {
    const patient = props.patients.find(p => p.id == props.form.patientId);
    if (!patient?.birthDate || !props.form.operationDate) return '—';
    
    const birth = new Date(patient.birthDate);
    const op = new Date(props.form.operationDate);
    let years = op.getFullYear() - birth.getFullYear();
    const monthDiff = op.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && op.getDate() < birth.getDate())) {
        years--;
    }
    return years;
});

const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    return date.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const hasNotes = computed(() => props.form.noteSistemic || props.form.noteEye);

const endothelialDisplay = computed(() => {
  const count = props.form.cellEndotelio?.trim();
  const note = props.form.cellEndotelioNote?.trim();
  if (count && note) return `${count} — ${note}`;
  return count || note || '—';
});

// Calculated keratometry values
const calculatedK2Axis = computed(() => {
    const k1Axis = parseFloat(props.form.cso_axK1);
    if (isNaN(k1Axis)) return '—';
    const k2Axis = k1Axis >= 90 ? k1Axis - 90 : k1Axis + 90;
    return k2Axis + '°';
});

const calculatedAvgKm = computed(() => {
    const k1 = parseFloat(props.form.cso_K1);
    const k2 = parseFloat(props.form.cso_K2);
    if (isNaN(k1) || isNaN(k2)) return '—';
    return ((k1 + k2) / 2).toFixed(2);
});

const calculatedCylinder = computed(() => {
    const k1 = parseFloat(props.form.cso_K1);
    const k2 = parseFloat(props.form.cso_K2);
    if (isNaN(k1) || isNaN(k2)) return '—';
    return (k2 - k1).toFixed(2);
});

// Map cso_ prefixed fields to machine field rules
const fieldToRuleKey = {
    'cso_K1': 'K1',
    'cso_K2': 'K2',
    'cso_axK1': 'axK1',
    'cso_AXL': 'AXL',
    'cso_ACD': 'ACD',
    'cso_LT': 'LT'
};

// Get value class based on field rules (green/yellow structure)
const getValueClass = (field) => {
    const value = parseFloat(props.form[field]);
    if (isNaN(value)) return '';
    
    // Check if field needs mapping to rule key
    const ruleKey = fieldToRuleKey[field] || field;
    const rules = ocularParameterRules.eyeInfo?.[ruleKey] || ocularParameterRules.machine?.[ruleKey];
    if (!rules) return '';
    
    // Check if value is in green range (normal)
    // min and max are optional - if not specified, that bound is not checked
    if (rules.green) {
        const { min, max } = rules.green;
        const aboveMin = min === undefined || value >= min;
        const belowMax = max === undefined || value <= max;
        if (aboveMin && belowMax) {
            return 'in-range';
        }
    }
    
    // Check if value is in yellow range (warning/out of range)
    if (rules.yellow) {
        for (const range of rules.yellow) {
            const aboveMin = range.min === undefined || value >= range.min;
            const belowMax = range.max === undefined || value <= range.max;
            if (aboveMin && belowMax) {
                return 'out-of-range';
            }
        }
    }
    
    // If value is outside both green and yellow, it's out of range
    if (rules.green) {
        return 'out-of-range';
    }
    
    return '';
};

// Collect all warnings using unified system
const allWarnings = computed(() => {
    // Calculate zero compatibility warnings first
    const zeroCompatibilityWarnings = [];
    const scores = calculateScoresAndRules.value;
    
    for (const iolType of ['monofocaleStandard', 'monofocalePlus', 'edof', 'multifocal']) {
        if (scores.scores[iolType] === 0 && scores.rawScores[iolType] <= 0) {
            const contributingParams = [];
            for (const rule of scores.appliedRules) {
                const deduction = rule.deductions[iolType] || 0;
                if (deduction < 0) {
                    const unit = getParamUnit(rule.param);
                    contributingParams.push({
                        label: rule.label,
                        value: rule.value,
                        unit: unit ? ` ${unit}` : ''
                    });
                }
            }
            if (contributingParams.length > 0) {
                const iolTypeNames = {
                    monofocaleStandard: t('iolType.monofocaleStandard'),
                    monofocalePlus: t('iolType.monofocalePlus'),
                    edof: t('iolType.edof'),
                    multifocal: t('iolType.multifocal')
                };
                zeroCompatibilityWarnings.push({
                    type: iolType,
                    iolTypeName: iolTypeNames[iolType],
                    params: contributingParams
                });
            }
        }
    }
    
    return collectWarnings(props.form, zeroCompatibilityWarnings);
});

// Check if there are any warnings (excluding zero compatibility)
const hasWarnings = computed(() => {
    const w = allWarnings.value;
    return w.systemicNote || 
           w.ocularNote || 
           w.toricIOL || 
           w.sphericalIOL || 
           w.endothelial ||
           (w.keratometry && w.keratometry.length > 0);
});

// =============================================
// IOL Type Scoring - Same logic as IOLTypeSuggestionSection
// =============================================

const getNumericValue = (value) => {
    const num = parseFloat(value);
    return isNaN(num) ? null : num;
};

// Derive parameter ranges from score deductions (deduction <= 40 = normal range)
const scoreDeductions = computed(() => iolRules.value?.scoreDeductions || iolSuitabilityRules.scoreDeductions);
const parameterRanges = computed(() => deriveAllParameterRanges(scoreDeductions.value));
const formFieldMap = iolSuitabilityRules.formFieldMapping;

// Define the order of parameters to match Ocular Parameters section
const parameterOrder = [
    // Row 1: Offset Limbus, Offset Pupil
    'OffsetLimbus', 'OffsetPupil',
    // Row 2: SDP, SRI, SAI
    'SDP', 'SRI', 'SAI',
    // Row 3 (Corneal): AbSph, Coma, HOA
    'AbSph', 'Coma', 'HOA',
    // Row 4 (Pupil): Photopic, Mesopic, Scotopic
    'PupilPhotopic', 'PupilMesopic', 'PupilScotopic',
    // Biometry: Axial Length, AC Depth, Lens Thickness
    'AxialLength', 'ACDepth', 'LensThickness'
];

// Parse condition string and check if value matches
// Number pattern: optional minus, digits, optional decimal part
const NUM_PATTERN = '(-?\\d+\\.?\\d*)';

const checkCondition = (condition, value) => {
    if (!condition || typeof condition !== 'string') return false;
    if (value === null) return false;
    
    // "greater than X"
    let match = condition.match(new RegExp(`^greater than ${NUM_PATTERN}$`));
    if (match) {
        return value > parseFloat(match[1]);
    }
    
    // "less than X"
    match = condition.match(new RegExp(`^less than ${NUM_PATTERN}$`));
    if (match) {
        return value < parseFloat(match[1]);
    }
    
    // "abs greater than X"
    match = condition.match(new RegExp(`^abs greater than ${NUM_PATTERN}$`));
    if (match) {
        return Math.abs(value) > parseFloat(match[1]);
    }
    
    // "between X and Y" (inclusive, value >= min AND value <= max)
    // Supports: "between -0.1 and 0.1" or "between 0.3 and 0.5"
    match = condition.match(new RegExp(`^between ${NUM_PATTERN} and ${NUM_PATTERN}$`));
    if (match) {
        const min = parseFloat(match[1]);
        const max = parseFloat(match[2]);
        return value >= min && value <= max;
    }
    
    // "outside X and Y" (value < min OR value > max)
    // Supports: "outside 21 and 26" or "outside -0.3 and 0.3"
    match = condition.match(new RegExp(`^outside ${NUM_PATTERN} and ${NUM_PATTERN}$`));
    if (match) {
        const min = parseFloat(match[1]);
        const max = parseFloat(match[2]);
        return value < min || value > max;
    }
    
    // Legacy format support: "between X-Y" and "outside X-Y" (only for positive numbers)
    match = condition.match(/^between (\d+\.?\d*)-(\d+\.?\d*)$/);
    if (match) {
        const min = parseFloat(match[1]);
        const max = parseFloat(match[2]);
        return value >= min && value <= max;
    }
    
    match = condition.match(/^outside (\d+\.?\d*)-(\d+\.?\d*)$/);
    if (match) {
        const min = parseFloat(match[1]);
        const max = parseFloat(match[2]);
        return value < min || value > max;
    }
    
    return false;
};

// Get parameter label from config or use parameter name
const getParamLabel = (paramName) => {
    const paramConfig = scoreDeductions.value[paramName];
    return paramConfig?.label || paramName;
};

/**
 * Calculate linear interpolation deduction for a value within a range
 * @param {number} value - The actual parameter value
 * @param {number} rangeMin - Minimum value of the range
 * @param {number} rangeMax - Maximum value of the range
 * @param {number} deductionMin - Deduction at rangeMin
 * @param {number} deductionMax - Deduction at rangeMax
 * @returns {number} - Interpolated deduction value
 */
const calculateLinearDeduction = (value, rangeMin, rangeMax, deductionMin, deductionMax) => {
    if (rangeMax === rangeMin) return deductionMax; // Single point: use the breakpoint deduction
    
    // Calculate position within range (0 to 1)
    const position = (value - rangeMin) / (rangeMax - rangeMin);
    
    // Linear interpolation
    const interpolated = deductionMin + (deductionMax - deductionMin) * position;
    
    // Round to nearest integer for display (deductions are typically whole numbers)
    return Math.round(interpolated);
};

/**
 * Extract range values from a condition string
 * @param {string} condition - Condition string like "between 0 and 0.5"
 * @returns {Object|null} - {min, max} or null if not a between condition
 */
const extractRangeFromCondition = (condition) => {
    const NUM_PATTERN = '(-?\\d+\\.?\\d*)';
    const match = condition.match(new RegExp(`^between ${NUM_PATTERN} and ${NUM_PATTERN}$`));
    if (match) {
        return {
            min: parseFloat(match[1]),
            max: parseFloat(match[2])
        };
    }
    // Legacy format: "between X-Y"
    const legacyMatch = condition.match(/^between (\d+\.?\d*)-(\d+\.?\d*)$/);
    if (legacyMatch) {
        return {
            min: parseFloat(legacyMatch[1]),
            max: parseFloat(legacyMatch[2])
        };
    }
    return null;
};

/**
 * Get deduction value, supporting both discrete and linear modes
 * @param {Object} threshold - Threshold configuration
 * @param {string} iolType - IOL type name
 * @param {number} value - Parameter value
 * @returns {number} - Calculated deduction
 */
const getDeductionValue = (threshold, iolType, value, paramConfig = null, thresholdIndex = -1) => {
    let deduction = threshold[iolType];
    
    // For breakpoints, if deduction is stored as number (max), reconstruct min/max object
    // For breakpoints, if deduction is stored as number (max), reconstruct min/max object
    // Exception: if this is the first breakpoint (thresholdIndex === 0), use the deduction as-is (discrete)
    if (threshold.conditionType === 'breakpoint' && typeof deduction === 'number' && paramConfig && thresholdIndex > 0) {
        // Get previous threshold's max deduction to use as min
        let prevMax = 0;
        const prevThreshold = paramConfig.thresholds[thresholdIndex - 1];
        const prevDeduction = prevThreshold[iolType];
        if (typeof prevDeduction === 'number') {
            prevMax = prevDeduction;
        } else if (prevDeduction && typeof prevDeduction === 'object' && 'max' in prevDeduction) {
            prevMax = prevDeduction.max;
        }
        // Reconstruct progressive deduction object: min from previous, max from current
        deduction = {
            min: prevMax,
            max: deduction
        };
    }
    
    // If deduction is a number, use it directly (backward compatible)
    if (typeof deduction === 'number') {
        return deduction;
    }
    
    // If deduction is an object with min/max, calculate linear interpolation
    if (deduction && typeof deduction === 'object' && 'min' in deduction && 'max' in deduction) {
        // Use condition from threshold (may be reconstructed for breakpoint format)
        const conditionStr = threshold.condition || '';
        const range = extractRangeFromCondition(conditionStr);
        if (range) {
            return calculateLinearDeduction(
                value,
                range.min,
                range.max,
                deduction.min,
                deduction.max
            );
        }
        // Fallback to max if we can't extract range
        return deduction.max;
    }
    
    return 0;
};

// Apply deductions for a parameter and track which rules were applied
const applyDeductions = (paramName, value, scores, appliedRules) => {
    const paramConfig = scoreDeductions.value[paramName];
    if (!paramConfig || !paramConfig.thresholds || value === null) return;
    
    // Check if value is outside limits (simple comparison)
    const minimumLimit = paramConfig.minimumLimit;
    const maximumLimit = paramConfig.maximumLimit;
    if (minimumLimit !== null && minimumLimit !== undefined && value < minimumLimit) {
        return; // Outside minimum limit - no deduction (will show as "out of normal limit")
    }
    if (maximumLimit !== null && maximumLimit !== undefined && value > maximumLimit) {
        return; // Outside maximum limit - no deduction (will show as "out of normal limit")
    }
    
    // Thresholds are sorted by strictness (most strict first), apply first matching
    for (let i = 0; i < paramConfig.thresholds.length; i++) {
        const threshold = paramConfig.thresholds[i];
        
        // Handle breakpoint format: reconstruct "between X and Y" from breakpoint
        let conditionStr = threshold.condition;
        if (threshold.conditionType === 'breakpoint' && threshold.conditionMax !== undefined) {
            // Reconstruct min from previous threshold or minimumLimit
            let minValue = '';
            if (i > 0) {
                const prevThreshold = paramConfig.thresholds[i - 1];
                if (prevThreshold.conditionType === 'breakpoint' && prevThreshold.conditionMax !== undefined) {
                    minValue = prevThreshold.conditionMax.toString();
                }
            } else {
                // First breakpoint: use minimumLimit
                if (minimumLimit !== null && minimumLimit !== undefined) {
                    minValue = minimumLimit.toString();
                }
            }
            if (minValue) {
                conditionStr = `between ${minValue} and ${threshold.conditionMax}`;
            } else {
                conditionStr = threshold.condition || '';
            }
        }
        
        if (checkCondition(conditionStr, value)) {
            // Calculate deductions for each IOL type (supports both discrete and linear)
            // Pass reconstructed condition string to getDeductionValue
            const thresholdWithCondition = { ...threshold, condition: conditionStr };
            const deductions = {
                monofocaleStandard: getDeductionValue(thresholdWithCondition, 'monofocaleStandard', value, paramConfig, i),
                monofocalePlus: getDeductionValue(thresholdWithCondition, 'monofocalePlus', value, paramConfig, i),
                edof: getDeductionValue(thresholdWithCondition, 'edof', value, paramConfig, i),
                multifocal: getDeductionValue(thresholdWithCondition, 'multifocal', value, paramConfig, i)
            };
            
            scores.monofocaleStandard += deductions.monofocaleStandard;
            scores.monofocalePlus += deductions.monofocalePlus;
            scores.edof += deductions.edof;
            scores.multifocal += deductions.multifocal;
            
            // Track applied rule for each IOL type that has a non-zero deduction
            const ruleInfo = {
                param: paramName,
                label: getParamLabel(paramName),
                value: value,
                condition: conditionStr, // Use reconstructed condition string
                deductions: deductions
            };
            
            appliedRules.push(ruleInfo);
            break; // Only apply first matching threshold
        }
    }
};

// Copy the full getParameterCharts logic from IOLTypeSuggestionSection
const getParameterCharts = (iolType) => {
    const ranges = parameterRanges.value[iolType];
    // Get overall ranges (same for all IOL types) from monofocaleStandard as reference
    const overallRanges = parameterRanges.value.monofocaleStandard || ranges;
    const charts = [];

    // Iterate in defined order - show ALL parameters
    for (const paramName of parameterOrder) {
        const range = ranges[paramName];
        const overallRange = overallRanges[paramName];
        const formField = formFieldMap[paramName];
        if (!formField) continue; // Skip if no form field mapping
        
        const value = getNumericValue(props.form[formField]);
        
        // Use overall min/max (consistent across IOL types) but IOL-specific acceptable range
        const { min, max } = overallRange || range || { min: 0, max: 100 };
        const { acceptableMin, acceptableMax, unit, label } = range || {
            acceptableMin: min || 0,
            acceptableMax: max || 100,
            unit: '',
            label: paramName
        };
        
        // Get minimum and maximum limits directly from parameter config
        const paramConfig = scoreDeductions.value[paramName];
        const minimumLimit = paramConfig?.minimumLimit;
        const maximumLimit = paramConfig?.maximumLimit;
        
        // Check if value is below minimum limit or exceeds maximum limit (simple comparisons)
        const isOutOfNormalLimit = value !== null && (
            (minimumLimit !== null && minimumLimit !== undefined && value < minimumLimit) ||
            (maximumLimit !== null && maximumLimit !== undefined && value > maximumLimit)
        );
        
        // Calculate actual deduction for this parameter and IOL type
        let actualDeduction = 0;
        let matchingThresholdCondition = null;
        if (paramConfig && paramConfig.thresholds && value !== null) {
            for (let i = 0; i < paramConfig.thresholds.length; i++) {
                const threshold = paramConfig.thresholds[i];
                
                // Handle breakpoint format: reconstruct "between X and Y" from breakpoint
                let conditionStr = threshold.condition;
                if (threshold.conditionType === 'breakpoint' && threshold.conditionMax !== undefined) {
                    // Reconstruct min from previous threshold or minimumLimit
                    let minValue = '';
                    if (i > 0) {
                        const prevThreshold = paramConfig.thresholds[i - 1];
                        if (prevThreshold.conditionType === 'breakpoint' && prevThreshold.conditionMax !== undefined) {
                            minValue = prevThreshold.conditionMax.toString();
                        }
                    } else {
                        // First breakpoint: use minimumLimit
                        if (minimumLimit !== null && minimumLimit !== undefined) {
                            minValue = minimumLimit.toString();
                        }
                    }
                    if (minValue) {
                        conditionStr = `between ${minValue} and ${threshold.conditionMax}`;
                    } else {
                        conditionStr = threshold.condition || '';
                    }
                }
                
                if (checkCondition(conditionStr, value)) {
                    matchingThresholdCondition = conditionStr;
                    // Get deduction value (supports both discrete and progressive)
                    let deduction = threshold[iolType];
                    
                    // For breakpoints, if deduction is stored as number (max), reconstruct min/max object
                    // For breakpoints, if deduction is stored as number (max), reconstruct min/max object
                    // Exception: if this is the first breakpoint (i=0), use the deduction as-is (discrete)
                    if (threshold.conditionType === 'breakpoint' && typeof deduction === 'number' && i > 0) {
                        // Get previous threshold's max deduction to use as min
                        let prevMax = 0;
                        const prevThreshold = paramConfig.thresholds[i - 1];
                        const prevDeduction = prevThreshold[iolType];
                        if (typeof prevDeduction === 'number') {
                            prevMax = prevDeduction;
                        } else if (prevDeduction && typeof prevDeduction === 'object' && 'max' in prevDeduction) {
                            prevMax = prevDeduction.max;
                        }
                        // Reconstruct progressive deduction object: min from previous, max from current
                        deduction = {
                            min: prevMax,
                            max: deduction
                        };
                    }
                    
                    if (typeof deduction === 'number') {
                        actualDeduction = Math.abs(deduction);
                    } else if (deduction && typeof deduction === 'object' && 'min' in deduction && 'max' in deduction) {
                        // Progressive deduction - calculate interpolated value
                        // Use reconstructed condition string
                        const range = extractRangeFromCondition(conditionStr);
                        if (range) {
                            const interpolated = calculateLinearDeduction(
                                value,
                                range.min,
                                range.max,
                                deduction.min,
                                deduction.max
                            );
                            actualDeduction = Math.abs(interpolated);
                        } else {
                            actualDeduction = Math.abs(deduction.max);
                        }
                    }
                    break; // Only use first matching threshold
                }
            }
        }
        
        // Format threshold condition as readable range text
        const formatThresholdRange = (condition) => {
            if (!condition) return null;
            
            // "less than X" - convert to minimum limit
            const lessThanMatch = condition.match(/^less than (-?\d+\.?\d*)$/);
            if (lessThanMatch) {
                return `min: ${lessThanMatch[1]}${unit ? ' ' + unit : ''}`;
            }
            
            // "greater than X" - convert to maximum limit
            const greaterThanMatch = condition.match(/^greater than (-?\d+\.?\d*)$/);
            if (greaterThanMatch) {
                return `max: ${greaterThanMatch[1]}${unit ? ' ' + unit : ''}`;
            }
            
            // "between X and Y"
            const betweenMatch = condition.match(/^between (-?\d+\.?\d*) and (-?\d+\.?\d*)$/);
            if (betweenMatch) {
                return `${betweenMatch[1]}-${betweenMatch[2]}${unit ? ' ' + unit : ''}`;
            }
            
            // "abs greater than X"
            const absGreaterMatch = condition.match(/^abs greater than (-?\d+\.?\d*)$/);
            if (absGreaterMatch) {
                return `|value| > ${absGreaterMatch[1]}${unit ? ' ' + unit : ''}`;
            }
            
            // Fallback: return condition as-is
            return condition;
        };
        
        // Find the range the value falls into (for cases where value doesn't match any threshold)
        let valueRangeText = null;
        if (matchingThresholdCondition) {
            valueRangeText = formatThresholdRange(matchingThresholdCondition);
        } else if (value !== null && paramConfig && paramConfig.thresholds) {
            // Value doesn't match any threshold - find the range it falls into
            const NUM_PATTERN = '(-?\\d+\\.?\\d*)';
            const lessThanValues = [];
            const greaterThanValues = [];
            
            // Extract threshold values
            for (let i = 0; i < paramConfig.thresholds.length; i++) {
                const threshold = paramConfig.thresholds[i];
                
                // Handle breakpoint format
                let conditionStr = threshold.condition;
                if (threshold.conditionType === 'breakpoint' && threshold.conditionMax !== undefined) {
                    // Reconstruct min from previous threshold
                    let minValue = '';
                    if (i > 0) {
                        const prevThreshold = paramConfig.thresholds[i - 1];
                        if (prevThreshold.conditionType === 'breakpoint' && prevThreshold.conditionMax !== undefined) {
                            minValue = prevThreshold.conditionMax.toString();
                        } else if (prevThreshold.conditionType === 'less than' && prevThreshold.conditionValue) {
                            minValue = prevThreshold.conditionValue.toString();
                        } else if (prevThreshold.condition) {
                            const prevMatch = prevThreshold.condition.match(/between (.+) and (.+)/);
                            if (prevMatch) {
                                minValue = prevMatch[2];
                            } else {
                                const prevLessMatch = prevThreshold.condition.match(/less than (.+)/);
                                if (prevLessMatch) {
                                    minValue = prevLessMatch[1];
                                }
                            }
                        }
                    }
                    if (minValue) {
                        conditionStr = `between ${minValue} and ${threshold.conditionMax}`;
                    } else {
                        conditionStr = threshold.condition || '';
                    }
                }
                
                // "less than X" - value falls in range if value >= X (not less than)
                let match = conditionStr?.match(new RegExp(`^less than ${NUM_PATTERN}$`));
                if (match) {
                    const thresholdValue = parseFloat(match[1]);
                    if (value >= thresholdValue) {
                        lessThanValues.push(thresholdValue);
                    }
                }
                
                // "greater than X" - value falls in range if value <= X (not greater than)
                match = conditionStr?.match(new RegExp(`^greater than ${NUM_PATTERN}$`));
                if (match) {
                    const thresholdValue = parseFloat(match[1]);
                    if (value <= thresholdValue) {
                        greaterThanValues.push(thresholdValue);
                    }
                }
                
                // "between X and Y" - check if value is in this range
                match = conditionStr?.match(new RegExp(`^between ${NUM_PATTERN} and ${NUM_PATTERN}$`));
                if (match) {
                    const minVal = parseFloat(match[1]);
                    const maxVal = parseFloat(match[2]);
                    if (value >= minVal && value <= maxVal) {
                        valueRangeText = `${minVal}-${maxVal}${unit ? ' ' + unit : ''}`;
                        break;
                    }
                }
            }
            
            // If we haven't found a range yet, use lessThan and greaterThan values
            if (!valueRangeText) {
                const rangeMin = lessThanValues.length > 0 ? Math.max(...lessThanValues) : null;
                const rangeMax = greaterThanValues.length > 0 ? Math.min(...greaterThanValues) : null;
                
                if (rangeMin !== null && rangeMax !== null) {
                    valueRangeText = `${rangeMin}-${rangeMax}${unit ? ' ' + unit : ''}`;
                } else if (rangeMin !== null) {
                    valueRangeText = `> ${rangeMin}${unit ? ' ' + unit : ''}`;
                } else if (rangeMax !== null) {
                    valueRangeText = `< ${rangeMax}${unit ? ' ' + unit : ''}`;
                }
            }
        }
        
        // Fallback to acceptable range if no range found
        if (!valueRangeText) {
            valueRangeText = `${acceptableMin}-${acceptableMax}${unit ? ' ' + unit : ''}`;
        }
        
        // Highlighting logic:
        // - If deduction > 10: orange text and dots
        // - If deduction >= 20: full highlight (orange background, etc.)
        // - If outside normal limit: always highlight (orange background, etc.)
        const hasDeduction = actualDeduction > 10;
        const shouldHighlight = actualDeduction >= 20 || isOutOfNormalLimit;
        
        // Status: 
        // - If deduction > 10 or outside normal limit: use 'out-range' (orange) for text/dots
        // - If deduction >= 20 or outside normal limit: use 'out-range' for full highlighting
        // - If deduction <= 10 and not outside normal limit: use 'in-range' (blue)
        const status = (hasDeduction || isOutOfNormalLimit) ? 'out-range' : 'in-range';
        
        // Handle case where value is null (show parameter but with default display)
        const displayValue = value !== null ? `${value}${unit ? ' ' + unit : ''}` : '-';
        
        // Display range
        let displayMin = min;
        let displayMax = max;
        
        const totalRange = displayMax - displayMin;
        
        // Extract breakpoints from thresholds for this IOL type
        const breakpoints = [];
        if (paramConfig && paramConfig.thresholds) {
            for (let i = 0; i < paramConfig.thresholds.length; i++) {
                const threshold = paramConfig.thresholds[i];
                const deduction = threshold[iolType];
                let maxDeduction = 0;
                
                if (typeof deduction === 'number') {
                    maxDeduction = Math.abs(deduction);
                } else if (deduction && typeof deduction === 'object' && 'min' in deduction && 'max' in deduction) {
                    maxDeduction = Math.max(Math.abs(deduction.min), Math.abs(deduction.max));
                }
                
                // Handle breakpoint format
                if (threshold.conditionType === 'breakpoint' && threshold.conditionMax !== undefined) {
                    breakpoints.push({
                        value: parseFloat(threshold.conditionMax),
                        deduction: maxDeduction,
                        type: 'max'
                    });
                    continue;
                }
                
                // Handle legacy format (condition string)
                const NUM_PATTERN = '(-?\\d+\\.?\\d*)';
                let breakpointValue = null;
                
                // "less than X"
                let match = threshold.condition?.match(new RegExp(`^less than ${NUM_PATTERN}$`));
                if (match) {
                    breakpointValue = parseFloat(match[1]);
                }
                
                // "greater than X"
                match = threshold.condition?.match(new RegExp(`^greater than ${NUM_PATTERN}$`));
                if (match) {
                    breakpointValue = parseFloat(match[1]);
                }
                
                // "between X and Y" - use both min and max
                match = threshold.condition?.match(new RegExp(`^between ${NUM_PATTERN} and ${NUM_PATTERN}$`));
                if (match) {
                    breakpoints.push({
                        value: parseFloat(match[1]),
                        deduction: maxDeduction,
                        type: 'min'
                    });
                    breakpoints.push({
                        value: parseFloat(match[2]),
                        deduction: maxDeduction,
                        type: 'max'
                    });
                    continue;
                }
                
                if (breakpointValue !== null) {
                    breakpoints.push({
                        value: breakpointValue,
                        deduction: maxDeduction,
                        type: threshold.condition?.startsWith('less than') ? 'max' : 'min'
                    });
                }
            }
        }
        
        // Sort breakpoints by value
        breakpoints.sort((a, b) => a.value - b.value);
        
        // Calculate deduction segments for greyscale background
        // Create segments between breakpoints, each with its deduction level
        const segments = [];
        const sortedBreakpoints = breakpoints
            .filter(bp => bp.value >= displayMin && bp.value <= displayMax)
            .sort((a, b) => a.value - b.value);
        
        if (sortedBreakpoints.length > 0) {
            let currentPos = displayMin;
            for (let i = 0; i <= sortedBreakpoints.length; i++) {
                const segmentStart = currentPos;
                const segmentEnd = i < sortedBreakpoints.length ? sortedBreakpoints[i].value : displayMax;
                
                // Get deduction for this segment (use the breakpoint's deduction or calculate from threshold)
                let segmentDeduction = 0;
                if (i > 0 && sortedBreakpoints[i - 1]) {
                    segmentDeduction = sortedBreakpoints[i - 1].deduction;
                } else if (i < sortedBreakpoints.length && sortedBreakpoints[i]) {
                    // For first segment, check if there's a "less than" threshold
                    segmentDeduction = sortedBreakpoints[i].deduction;
                }
                
                segments.push({
                    start: segmentStart,
                    end: segmentEnd,
                    deduction: segmentDeduction
                });
                
                if (i < sortedBreakpoints.length) {
                    currentPos = sortedBreakpoints[i].value;
                }
            }
        } else {
            // No breakpoints, use single segment with 0 deduction
            segments.push({
                start: displayMin,
                end: displayMax,
                deduction: 0
            });
        }
        
        // Calculate marker position (percentage), clamped to chart bounds
        // If value is null, don't show marker
        const clampedValue = value !== null ? Math.max(displayMin, Math.min(displayMax, value)) : null;
        const markerPos = clampedValue !== null ? ((clampedValue - displayMin) / totalRange) * 100 : 50;
        
        // Calculate breakpoint positions
        const breakpointPositions = sortedBreakpoints.map(bp => ({
            position: ((bp.value - displayMin) / totalRange) * 100,
            deduction: bp.deduction
        }));
        
        const minPos = 0;
        const maxPos = 100;
        
        charts.push({
            name: label || paramName,
            shortName: paramName,
            value: value,
            displayValue: displayValue,
            status: status, // 'out-range' (orange) if deduction > 10 or outside normal limit, 'in-range' (blue) otherwise
            affectsScoring: shouldHighlight, // Full highlight if deduction >= 20 or outside normal limit
            hasDeduction: hasDeduction || isOutOfNormalLimit, // Orange text/dots if deduction > 10 or outside normal limit
            showMarker: value !== null, // Only show marker if value exists
            actualDeduction: actualDeduction, // Deduction percentage (points)
            valueRangeText: valueRangeText, // Range that the value falls into
            segments: segments, // Deduction segments for greyscale background
            breakpoints: breakpointPositions, // Breakpoint positions and deductions
            minPos: minPos, // Min marker position (0%)
            maxPos: maxPos, // Max marker position (100%)
            markerStyle: {
                left: `${markerPos}%`
            },
            minLabel: `${displayMin}`,
            maxLabel: `${displayMax}`,
            rangeText: `${acceptableMin}-${acceptableMax}${unit ? ' ' + unit : ''}`, // Keep for backward compatibility
            isOutOfNormalLimit: isOutOfNormalLimit, // True if value is below minimum or exceeds maximum limit
            minimumLimit: minimumLimit, // Minimum limit value
            maximumLimit: maximumLimit // Maximum limit value
        });
    }

    return charts;
};

// Calculate score for each IOL type based on exam values
const calculateScoresAndRules = computed(() => {
    // Get all parameter values from form
    const paramValues = {
        HOA: getNumericValue(props.form.HOA),
        Coma: getNumericValue(props.form.Coma),
        AbSph: getNumericValue(props.form.AbS),
        OffsetLimbus: getNumericValue(props.form.offsetLimbus),
        OffsetPupil: getNumericValue(props.form.offsetPupilla),
        SDP: getNumericValue(props.form.SDP),
        SRI: getNumericValue(props.form.SRI),
        SAI: getNumericValue(props.form.SAI),
        PupilPhotopic: getNumericValue(props.form.pupillaPhotopic),
        PupilMesopic: getNumericValue(props.form.pupillaMesopica),
        PupilScotopic: getNumericValue(props.form.pupillaScotopic),
        AxialLength: getNumericValue(props.form.cso_AXL),
        ACDepth: getNumericValue(props.form.cso_ACD),
        LensThickness: getNumericValue(props.form.cso_LT)
    };

    // Initialize scores at 100
    const scores = {
        monofocaleStandard: 100,
        monofocalePlus: 100,
        edof: 100,
        multifocal: 100
    };
    
    // Track all applied rules
    const appliedRules = [];

    // Apply deductions for each parameter from JSON config
    for (const [paramName, value] of Object.entries(paramValues)) {
        applyDeductions(paramName, value, scores, appliedRules);
    }

    // Store raw scores before clamping for zero compatibility detection
    const rawScores = { ...scores };

    // Clamp scores between 0 and 100
    return {
        scores: {
            monofocaleStandard: Math.max(0, Math.min(100, scores.monofocaleStandard)),
            monofocalePlus: Math.max(0, Math.min(100, scores.monofocalePlus)),
            edof: Math.max(0, Math.min(100, scores.edof)),
            multifocal: Math.max(0, Math.min(100, scores.multifocal))
        },
        rawScores: rawScores,
        appliedRules: appliedRules
    };
});

// For backwards compatibility
const calculateScores = computed(() => calculateScoresAndRules.value.scores);

const getScore = (type) => {
    // Check if any parameter is out of normal limit for this IOL type
    const parameters = getParameterCharts(type);
    const hasOutOfNormalLimit = parameters.some(param => param.isOutOfNormalLimit === true);
    
    // If any parameter is out of normal limit, return null to indicate "Not Evaluable"
    if (hasOutOfNormalLimit) {
        return null;
    }
    
    return calculateScores.value[type];
};

// Get affected parameters with their deductions for a specific IOL type
const getAffectedParams = (iolType) => {
    const { appliedRules } = calculateScoresAndRules.value;
    
    // Filter rules that have non-zero deduction for this IOL type
    return appliedRules
        .filter(rule => rule.deductions[iolType] !== 0)
        .map(rule => ({
            name: rule.label,
            value: rule.value,
            condition: rule.condition,
            deduction: rule.deductions[iolType]
        }));
};

// Get unit for a parameter from parameterRanges
const getParamUnit = (paramName) => {
    const ranges = parameterRanges.value;
    if (ranges && ranges.multifocal && ranges.multifocal[paramName]) {
        return ranges.multifocal[paramName].unit || '';
    }
    return '';
};

// Build IOL type cards data
const iolTypeCards = computed(() => {
    return [
        {
            type: 'monofocaleStandard',
            typeClass: 'standard',
            title: t('iolType.monofocaleStandard'),
            score: getScore('monofocaleStandard'),
            affectedParams: getAffectedParams('monofocaleStandard'),
            parameters: getParameterCharts('monofocaleStandard'),
            totalDeduction: getAffectedParams('monofocaleStandard').reduce((sum, p) => sum + (p.deduction || 0), 0)
        },
        {
            type: 'monofocalePlus',
            typeClass: 'plus',
            title: t('iolType.monofocalePlus'),
            score: getScore('monofocalePlus'),
            affectedParams: getAffectedParams('monofocalePlus'),
            parameters: getParameterCharts('monofocalePlus'),
            totalDeduction: getAffectedParams('monofocalePlus').reduce((sum, p) => sum + (p.deduction || 0), 0)
        },
        {
            type: 'edof',
            typeClass: 'edof',
            title: t('iolType.edof'),
            score: getScore('edof'),
            affectedParams: getAffectedParams('edof'),
            parameters: getParameterCharts('edof'),
            totalDeduction: getAffectedParams('edof').reduce((sum, p) => sum + (p.deduction || 0), 0)
        },
        {
            type: 'multifocal',
            typeClass: 'multifocal',
            title: t('iolType.multifocal'),
            score: getScore('multifocal'),
            affectedParams: getAffectedParams('multifocal'),
            parameters: getParameterCharts('multifocal'),
            totalDeduction: getAffectedParams('multifocal').reduce((sum, p) => sum + (p.deduction || 0), 0)
        }
    ];
});

const getScoreClass = (score) => {
    if (score === null) return 'not-evaluable';
    if (score >= 90) return 'excellent';
    if (score >= 75) return 'good';
    if (score >= 50) return 'moderate';
    return 'poor';
};

// IOL Calculators
const sfericaCalculators = [
    { key: 'iol_evo2', label: 'EVO 2.0' },
    { key: 'iol_hoffer_qst', label: 'Hoffer QST' },
    { key: 'iol_kane', label: 'Kane' },
    { key: 'iol_pearl_dgs', label: 'PEARL-DGS' }
];

const toricaCalculators = [
    { key: 'iol_evo_toric', label: 'EVO Toric' },
    { key: 'iol_hoffer_qst_toric', label: 'Hoffer QST' },
    { key: 'iol_kane_toric', label: 'Kane Toric' }
];

// Check if has IOL data
const hasIolData = computed(() => {
    return sfericaCalculators.some(c => props.form[c.key] || props.form[c.key + '_res']);
});

const hasToricData = computed(() => {
    return toricaCalculators.some(c => props.form[c.key] || props.form[c.key + '_pwr']);
});
</script>

<style scoped>
.print-view {
    display: none;
    font-family: 'Segoe UI', system-ui, sans-serif;
    font-size: 9pt;
    line-height: 1.3;
    color: #1f2937;
    padding: 10mm;
    max-width: 190mm;
    margin: 0 auto;
}

@media print {
    .print-view {
        display: block !important;
    }
}

/* Header - single row */
.print-header-row {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    margin-bottom: 6px;
    padding-bottom: 4px;
    border-bottom: 2px solid #1a1a2e;
    font-size: 10pt;
    flex-wrap: wrap;
}

.report-title {
    font-size: 12pt;
    font-weight: 700;
    color: #1a1a2e;
}

.print-header-row .patient-name {
    font-weight: 600;
}

.print-header-row .separator {
    color: #9ca3af;
}

.eye-badge-print {
    display: inline-block;
    background: #1a1a2e;
    color: white;
    padding: 1px 8px;
    border-radius: 10px;
    font-weight: 600;
    font-size: 9pt;
}

/* Sections */
.print-section {
    margin-bottom: 6px;
    border: 1px solid #e5e7eb;
    border-radius: 4px;
    overflow: hidden;
}

.section-title-compact {
    background: #f3f4f6;
    padding: 3px 8px;
    font-weight: 600;
    font-size: 9pt;
    color: #1a1a2e;
    border-bottom: 1px solid #e5e7eb;
}

.subsection-title {
    background: #f9fafb;
    padding: 2px 8px;
    font-size: 8pt;
    font-weight: 600;
    color: #4b5563;
    border-top: 1px solid #e5e7eb;
    border-bottom: 1px solid #e5e7eb;
}

/* BCDVA */
.bcdva-row {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 4px 8px;
}

.bcdva-title {
    font-weight: 600;
    font-size: 9pt;
    color: #1a1a2e;
    margin-right: 4px;
}

.bcdva-row .param {
    font-size: 9pt;
}

/* Notes */
.notes-section {
    background: #fffbeb;
}

.notes-row {
    display: flex;
    gap: 16px;
    padding: 4px 8px;
    flex-wrap: wrap;
}

.note-item {
    font-size: 8pt;
}

.note-item.systemic {
    color: #92400e;
}

.note-item.ocular {
    color: #1e40af;
}

/* Ocular Parameters Grid - 6 columns */
.params-grid {
    display: grid;
    padding: 4px 8px;
    gap: 2px 8px;
}

.params-grid.six-col {
    grid-template-columns: repeat(6, 1fr);
}

.params-grid.eight-col {
    grid-template-columns: repeat(8, 1fr);
}

.param-cell {
    display: flex;
    flex-direction: column;
    padding: 2px 4px;
    background: #fafafa;
    border-radius: 2px;
}

.param-cell .label {
    font-size: 6pt;
    color: #6b7280;
    text-transform: uppercase;
}

.param-cell .value {
    font-size: 8pt;
    font-weight: 500;
}

.param-cell .value.in-range {
    color: #2563eb;
}

.param-cell .value.out-of-range {
    color: #ea580c;
    font-weight: 600;
    background: #fff7ed;
    padding: 0 2px;
    border-radius: 2px;
}

/* Warnings Boxes */
.warnings-box-print {
    margin-bottom: 4px;
    padding: 3px 6px;
    border-radius: 4px;
    border: 1px solid;
}

.warnings-box-print.yellow {
    background: #fef3c7;
    border-color: #fcd34d;
}

.warnings-box-print.red {
    background: #fee2e2;
    border-color: #fca5a5;
}

.warnings-header-print {
    font-weight: 600;
    font-size: 7pt;
    margin-bottom: 2px;
}

.warnings-box-print.yellow .warnings-header-print {
    color: #b45309;
}

.warnings-box-print.red .warnings-header-print {
    color: #991b1b;
}

.warnings-content-print {
    display: flex;
    flex-direction: column;
    gap: 2px;
    font-size: 6pt;
}

.warning-item-print {
    display: flex;
    flex-direction: column;
    gap: 1px;
}

.warning-label-print {
    font-weight: 600;
}

.warnings-box-print.yellow .warning-label-print,
.warnings-box-print.yellow .warning-text-print {
    color: #92400e;
}

.warnings-box-print.red .warning-label-print,
.warnings-box-print.red .warning-text-print {
    color: #7f1d1d;
}

.additional-info-print {
    display: block;
    margin-top: 1px;
    padding-top: 1px;
    border-top: 1px dashed;
}

.warnings-box-print.yellow .additional-info-print {
    border-color: #fcd34d;
}

.warnings-box-print.red .additional-info-print {
    border-color: #fca5a5;
}

/* IOL Type Cards Grid - 4 columns */
.iol-type-cards-print {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 4px;
    padding: 4px 8px;
}

.iol-type-card-print {
    border: 1px solid #e5e7eb;
    border-radius: 4px;
    overflow: hidden;
    background: white;
}

.card-header-print {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 3px 4px;
    font-size: 7pt;
}

.card-header-print.standard { background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); }
.card-header-print.plus { background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); }
.card-header-print.edof { background: linear-gradient(135deg, #fefce8 0%, #fef3c7 100%); }
.card-header-print.multifocal { background: linear-gradient(135deg, #fdf4ff 0%, #fae8ff 100%); }

.iol-name-print {
    font-weight: 600;
    font-size: 7pt;
}

.card-header-print.standard .iol-name-print { color: #0369a1; }
.card-header-print.plus .iol-name-print { color: #15803d; }
.card-header-print.edof .iol-name-print { color: #a16207; }
.card-header-print.multifocal .iol-name-print { color: #7e22ce; }

.score-badge-print {
    font-size: 7pt;
    font-weight: 600;
    padding: 1px 4px;
    border-radius: 6px;
}

.score-badge-print.excellent { background: #dbeafe; color: #1d4ed8; }
.score-badge-print.good { background: #e0f2fe; color: #0369a1; }
.score-badge-print.moderate { background: #fef3c7; color: #b45309; }
.score-badge-print.poor { background: #ffedd5; color: #c2410c; }
.score-badge-print.not-evaluable { background: #f3f4f6; color: #6b7280; }

.card-body-print {
    padding: 3px 4px;
    border-top: 1px solid #f3f4f6;
}

.incompatibility-summary-print {
    margin-top: 4px;
    padding: 2px 4px;
    background: #fef3c7;
    border-radius: 2px;
    font-size: 6pt;
}

.incompatibility-header-print {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.incompatibility-label-print {
    font-weight: 600;
    color: #92400e;
}

.total-deduction-print {
    font-weight: 600;
    color: #92400e;
    font-size: 5pt;
}

.params-chart-print {
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.param-row-print {
    display: flex;
    flex-direction: row;
    gap: 4px;
    margin-bottom: 2px;
    padding: 2px 4px;
    border-radius: 2px;
    border-left: 2px solid transparent;
    min-height: 24px;
}

.param-content-print {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0px;
}

.param-header-print {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 6pt;
}

.param-name-print {
    color: #6b7280;
    font-weight: 500;
}

.param-name-print.highlight-print {
    color: #ea580c;
    font-weight: 700;
}

.param-name-print.has-deduction-print {
    color: #ea580c;
    font-weight: 600;
}

.param-value-print {
    font-weight: 600;
    padding: 0 2px;
    border-radius: 2px;
    font-size: 6pt;
    border: 1px solid transparent;
}

.param-value-print.in-range {
    color: #1d4ed8;
    background: #eff6ff;
}

.param-value-print.out-range {
    color: #ea580c;
    background: #fff7ed;
}

.param-value-print.highlight-print {
    color: #ea580c;
    background: #fff7ed;
    border-color: #fb923c;
    font-weight: 700;
}

.param-value-print.has-deduction-print {
    color: #ea580c;
    background: #fff7ed;
    font-weight: 600;
}

.param-row-print.affects-scoring-print {
    background: #fff7ed;
    border-left-color: #fb923c;
}

.param-row-print.has-deduction-print {
    background: #fff7ed;
}

.deduction-cell-print {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 42px;
    min-width: 42px;
    flex-shrink: 0;
    font-size: 6pt;
    font-weight: 600;
}

.deduction-value-print {
    color: #1d4ed8;
}

.deduction-value-print.highlight-print {
    color: #ea580c;
}

.deduction-value-print.has-deduction-print {
    color: #ea580c;
}

.out-of-limit-text-print {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    color: #dc2626;
    font-weight: 600;
    font-size: 4pt;
    line-height: 1.1;
    letter-spacing: 0.02em;
}

.range-chart-print {
    display: flex;
    flex-direction: column;
    gap: 0px;
}

.range-track-print {
    position: relative;
    height: 4px;
    background: #f3f4f6;
    border-radius: 1px;
    border: 1px solid transparent;
}

.range-track-print.highlight-print {
    background: #fed7aa;
    border-color: #fb923c;
}

.deduction-segment-print {
    position: absolute;
    top: 0;
    bottom: 0;
    background: #9ca3af;
    border-radius: 1px;
}

.min-marker-print,
.max-marker-print {
    position: absolute;
    top: 0;
    bottom: 0;
    background: #2563eb;
    border-radius: 1px;
}

.breakpoint-marker-print {
    position: absolute;
    top: 0;
    bottom: 0;
    width: 1px;
    background: #6b7280;
    transform: translateX(-50%);
}

.value-marker-print.highlight-print {
    background: #ea580c !important;
    width: 2px;
    box-shadow: 0 0 2px rgba(234, 88, 12, 0.5);
}

.range-text-print.highlight-print {
    color: #ea580c;
    font-weight: 600;
}

.value-marker-print {
    position: absolute;
    top: -1px;
    width: 2px;
    height: 6px;
    border-radius: 1px;
    transform: translateX(-50%);
}

.value-marker-print.in-range { background: #2563eb; }
.value-marker-print.out-range { background: #ea580c; }

.range-labels-print {
    display: flex;
    justify-content: space-between;
    font-size: 5pt;
    color: #9ca3af;
}

.range-text-print {
    color: #2563eb;
    font-weight: 500;
}

/* IOL Model Tables */
.iol-tables-row {
    display: flex;
    gap: 8px;
    padding: 4px 8px;
}

.iol-mini-table {
    flex: 1;
}

.mini-table-title {
    font-size: 8pt;
    font-weight: 600;
    color: #4b5563;
    margin-bottom: 2px;
}

.iol-table-compact {
    width: 100%;
    border-collapse: collapse;
    font-size: 7pt;
}

.iol-table-compact th,
.iol-table-compact td {
    padding: 2px 4px;
    text-align: left;
    border-bottom: 1px solid #e5e7eb;
}

.iol-table-compact th {
    background: #f9fafb;
    font-weight: 600;
    font-size: 6pt;
}

/* Note Section */
.note-section .note-text {
    padding: 4px 8px;
    font-size: 8pt;
    margin: 0;
    white-space: pre-wrap;
}

/* Print specific */
@media print {
    @page {
        size: A4;
        margin: 10mm;
    }
    
    .print-section {
        break-inside: avoid;
        page-break-inside: avoid;
    }
}
</style>
