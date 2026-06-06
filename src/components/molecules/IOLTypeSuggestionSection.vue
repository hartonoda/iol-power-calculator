<template>
    <div class="section">
        <div class="section-header">
            <div class="section-title">
                <span v-if="eyeIndicator" class="eye-badge">{{ eyeIndicator }}</span>
                <span>{{ t('iolType.title') }}</span>
            </div>
            <div class="header-actions">
                <button class="settings-btn" @click="$emit('open-iol-rules-settings')" :title="t('iolRulesSettings.title')">
                    <span class="settings-label">{{ t('settings.title') }}</span>
                    <SvgIcon name="settings" :size="16" />
                </button>
            </div>
        </div>
        <div class="section-content">
            <div class="suggestion-intro">
                <p>{{ t('iolType.intro') }}</p>
            </div>
            
            <!-- Warnings Box (Yellow) -->
            <div v-if="hasWarnings" class="warnings-box yellow">
                <div class="warnings-header">
                    <SvgIcon name="warning" :size="16" />
                    <span>{{ t('warnings.title') }}</span>
                </div>
                <div class="warnings-content">
                    <!-- Systemic Note Warning -->
                    <div v-if="allWarnings.systemicNote" class="warning-item">
                        <div class="warning-label">{{ t('iolType.systemicConditionsNoted') }}:</div>
                        <div class="warning-text">{{ allWarnings.systemicNote }}</div>
            </div>

            <!-- Ocular Note Warning -->
                    <div v-if="allWarnings.ocularNote" class="warning-item">
                        <div class="warning-label">{{ t('iolType.ocularConditionsNoted') }}:</div>
                        <div class="warning-text">{{ allWarnings.ocularNote }}</div>
                </div>
                    
                    <!-- Toric IOL Warning -->
                    <div v-if="allWarnings.toricIOL" class="warning-item">
                        <div class="warning-label">{{ t('iolType.toricIOLIndicated') }}:</div>
                        <div class="warning-text">
                            <span v-if="allWarnings.toricIOL.cylinder">
                                {{ t('iolType.toricIOLMessage', { value: allWarnings.toricIOL.cylinder }) }}
                            </span>
                            <span v-if="allWarnings.toricIOL.sri" class="additional-info">
                                <strong>SRI:</strong> {{ allWarnings.toricIOL.sri.value }} ({{ t('iolType.normalRange') }}: ≤ {{ allWarnings.toricIOL.sri.max }})
                            </span>
                            <span v-if="allWarnings.toricIOL.sai" class="additional-info">
                                <strong>SAI:</strong> {{ allWarnings.toricIOL.sai.value }} ({{ t('iolType.normalRange') }}: ≤ {{ allWarnings.toricIOL.sai.max }})
                            </span>
                </div>
            </div>
            
                    <!-- Spherical IOL Warning -->
                    <div v-if="allWarnings.sphericalIOL" class="warning-item">
                        <div class="warning-label">{{ t('iolType.monofocaleStandard') }} - {{ t(allWarnings.sphericalIOL.messageKey) }}:</div>
                        <div class="warning-text">
                            <strong>AbS:</strong> {{ allWarnings.sphericalIOL.value }} ({{ allWarnings.sphericalIOL.level === 'strong' ? '< -0.3' : '< -0.2' }})
                </div>
                    </div>
                    
                    <!-- Endothelial Warning -->
                    <div v-if="allWarnings.endothelial" class="warning-item">
                        <div class="warning-label">{{ t('ocularParams.endothelialCells') }}:</div>
                        <div class="warning-text">
                            {{ allWarnings.endothelial.message }}
                            <span v-if="allWarnings.endothelial.value"> ({{ allWarnings.endothelial.value }} cells/mm²)</span>
                        </div>
                    </div>
                    
                    <!-- Keratometry Warnings -->
                    <div v-if="allWarnings.keratometry && allWarnings.keratometry.length > 0" class="warning-item">
                        <div class="warning-label">{{ t('keratometry.title') }} - {{ t('warnings.outOfNormalRange') }}:</div>
                        <div class="warning-text">
                            <span v-for="(warning, idx) in allWarnings.keratometry" :key="warning.field">
                                <span v-if="idx > 0">, </span>
                                <strong>{{ warning.label }}:</strong> {{ warning.value }}{{ warning.unit }}
                                <span v-if="warning.range"> ({{ t('warnings.normalRange') }}: {{ warning.range }})</span>
                            </span>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Incompatibility Warnings Box (Red) - hidden -->
            <div v-if="false && allWarnings.zeroCompatibility && allWarnings.zeroCompatibility.length > 0" class="warnings-box red">
                <div class="warnings-header">
                    <SvgIcon name="warning" :size="16" />
                    <span>{{ t('warnings.incompatibility') }}</span>
                </div>
                <div class="warnings-content">
                    <div v-for="warning in allWarnings.zeroCompatibility" :key="warning.type" class="warning-item">
                        <div class="warning-label">{{ warning.iolTypeName }} {{ t('iolType.notCompatible') }}:</div>
                        <div class="warning-text">
                            {{ warning.iolTypeName }} {{ t('iolType.notCompatible') }} because
                            <span v-for="(param, idx) in warning.params" :key="idx">
                                <span v-if="idx > 0 && idx < warning.params.length - 1">, </span>
                                <span v-else-if="idx === warning.params.length - 1 && warning.params.length > 1"> and </span>
                                <span v-else-if="idx === 0"> </span>
                                <strong>{{ param.label }}</strong> is {{ param.value }}{{ param.unit }}
                            </span>.
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="iol-type-cards">
                <!-- Monofocale Standard -->
                <IOLTypeCard
                    :title="t('iolType.monofocaleStandard')"
                    type-class="standard"
                    :score="getScore('monofocaleStandard')"
                    :affected-params="getAffectedParams('monofocaleStandard')"
                    :parameters="getParameterCharts('monofocaleStandard')"
                >
                    <template #icon>
                        <SvgIcon name="eye-standard" :size="18" />
                    </template>
                </IOLTypeCard>

                <!-- Monofocale Plus -->
                <IOLTypeCard
                    :title="t('iolType.monofocalePlus')"
                    type-class="plus"
                    :score="getScore('monofocalePlus')"
                    :affected-params="getAffectedParams('monofocalePlus')"
                    :parameters="getParameterCharts('monofocalePlus')"
                >
                    <template #icon>
                        <SvgIcon name="eye-plus" :size="18" />
                    </template>
                </IOLTypeCard>

                <!-- EDOF -->
                <IOLTypeCard
                    :title="t('iolType.edof')"
                    type-class="edof"
                    :score="getScore('edof')"
                    :affected-params="getAffectedParams('edof')"
                    :parameters="getParameterCharts('edof')"
                >
                    <template #icon>
                        <SvgIcon name="eye-edof" :size="18" />
                    </template>
                </IOLTypeCard>

                <!-- Multifocal -->
                <IOLTypeCard
                    :title="t('iolType.multifocal')"
                    type-class="multifocal"
                    :score="getScore('multifocal')"
                    :affected-params="getAffectedParams('multifocal')"
                    :parameters="getParameterCharts('multifocal')"
                >
                    <template #icon>
                        <SvgIcon name="eye-multifocal" :size="18" />
                    </template>
                </IOLTypeCard>
            </div>
            
        </div>
    </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import IOLTypeCard from '@/components/atoms/IOLTypeCard.vue';
import iolSuitabilityRules from '@/config/iolSuitabilityRules.json';
import { useI18n } from '@/composables/useI18n';
import { useFieldRules } from '@/composables/useFieldRules';
import { useIOLRules } from '@/composables/useIOLRules';
import { useUnifiedWarnings } from '@/composables/useUnifiedWarnings';
import SvgIcon from '@/components/atoms/SvgIcon.vue';
import { deriveAllParameterRanges } from '@/utils/iolRangeUtils';

const { t } = useI18n();
const { fieldRules } = useFieldRules();
const { iolRules } = useIOLRules();
const { collectWarnings } = useUnifiedWarnings();

const props = defineProps({
    form: { type: Object, required: true },
    disabled: { type: Boolean, default: false },
    eyeIndicator: { type: String, default: '' }
});

defineEmits(['open-iol-rules-settings']);

const expanded = ref(true);

// Check if there are ocular notes
const hasSystemicNote = computed(() => {
    return props.form.noteSistemic && props.form.noteSistemic.trim().length > 0;
});

const hasOcularNote = computed(() => {
    return props.form.noteEye && props.form.noteEye.trim().length > 0;
});

// Check if toric IOL is indicated (cilTotal > 0.75)
const toricIOLIndicated = computed(() => {
    const cilTotal = parseFloat(props.form.cilTotal);
    return !isNaN(cilTotal) && cilTotal > 0.75;
});

// Get SRI normal range max from field rules (default 0.7)
const sriNormalMax = computed(() => {
    return fieldRules.value?.eyeInfo?.SRI?.green?.max ?? 0.7;
});

// Get SAI normal range max from field rules (default 0.55)
const saiNormalMax = computed(() => {
    return fieldRules.value?.eyeInfo?.SAI?.green?.max ?? 0.55;
});

// Check if SRI is out of normal range
const sriOutOfRange = computed(() => {
    const sri = parseFloat(props.form.SRI);
    return !isNaN(sri) && sri > sriNormalMax.value;
});

// Check if SAI is out of normal range
const saiOutOfRange = computed(() => {
    const sai = parseFloat(props.form.SAI);
    return !isNaN(sai) && sai > saiNormalMax.value;
});

// Spherical IOL warning for monofocal standard when AbS is negative
const sphericalIOLWarning = computed(() => {
    const absph = parseFloat(props.form.AbS);
    if (isNaN(absph)) return null;
    
    if (absph < -0.3) {
        return {
            level: 'strong',
            messageKey: 'iolType.sphericalIOLStrong',
            value: absph
        };
    } else if (absph < -0.2) {
        return {
            level: 'moderate',
            messageKey: 'iolType.sphericalIOLConsider',
            value: absph
        };
    }
    return null;
});

const getNumericValue = (value) => {
    const num = parseFloat(value);
    return isNaN(num) ? null : num;
};

// Derive parameter ranges from score deductions (deduction <= 40 = normal range)
// See iolSuitabilityRules.json for detailed documentation on how scoring works
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
        
        // Always show parameters, even if empty - use default range if needed
        
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

// Score deductions already loaded above

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
    if (threshold.conditionType === 'breakpoint' && typeof deduction === 'number' && paramConfig && thresholdIndex >= 0) {
        // Get previous threshold's max deduction to use as min
        let prevMax = 0;
        if (thresholdIndex > 0) {
            const prevThreshold = paramConfig.thresholds[thresholdIndex - 1];
            const prevDeduction = prevThreshold[iolType];
            if (typeof prevDeduction === 'number') {
                prevMax = prevDeduction;
            } else if (prevDeduction && typeof prevDeduction === 'object' && 'max' in prevDeduction) {
                prevMax = prevDeduction.max;
            }
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
    
    // Thresholds are sorted by strictness (most strict first), apply first matching
    for (let i = 0; i < paramConfig.thresholds.length; i++) {
        const threshold = paramConfig.thresholds[i];
        
        // Handle breakpoint format: reconstruct "between X and Y" from breakpoint
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

const getSuitabilityClass = (type) => {
    const score = getScore(type);
    if (score >= 80) return 'high';
    if (score >= 60) return 'medium';
    if (score >= 40) return 'low';
    return 'very-low';
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

// IOL type names mapping (computed for reactivity)
const iolTypeNames = computed(() => ({
    monofocaleStandard: t('iolType.monofocaleStandard'),
    monofocalePlus: t('iolType.monofocalePlus'),
    edof: t('iolType.edof'),
    multifocal: t('iolType.multifocal')
}));

// Get unit for a parameter from parameterRanges
const getParamUnit = (paramName) => {
    const ranges = parameterRanges.value;
    if (ranges && ranges.multifocal && ranges.multifocal[paramName]) {
        return ranges.multifocal[paramName].unit || '';
    }
    return '';
};

// Get zero compatibility warnings
const zeroCompatibilityWarnings = computed(() => {
    const { rawScores, appliedRules, scores } = calculateScoresAndRules.value;
    const warnings = [];
    
    // Check each IOL type
    const iolTypes = ['monofocaleStandard', 'monofocalePlus', 'edof', 'multifocal'];
    
    for (const iolType of iolTypes) {
        // If clamped score is 0 (meaning raw score was 0 or below), this IOL type is not compatible
        if (scores[iolType] === 0 && rawScores[iolType] <= 0) {
            // Find all parameters that have deductions for this IOL type
            const contributingParams = [];
            
            for (const rule of appliedRules) {
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
                warnings.push({
                    type: iolType,
                    iolTypeName: iolTypeNames.value[iolType],
                    params: contributingParams
                });
            }
        }
    }
    
    return warnings;
});

// Collect all warnings for unified modal
const allWarnings = computed(() => {
    return collectWarnings(props.form, zeroCompatibilityWarnings.value);
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

defineExpose({ expanded });
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

.header-actions {
    display: flex;
    align-items: center;
    gap: 8px;
}

.settings-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px 8px;
    background: transparent;
    border: none;
    border-radius: 4px;
    color: #9ca3af;
    cursor: pointer;
    transition: all 0.15s;
}

.settings-label {
    font-size: 0.875rem;
    font-weight: 500;
}

.settings-btn:hover {
    background: #e5e7eb;
    color: #4b5563;
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
    padding: 0.25rem 0.625rem;
    background: linear-gradient(135deg, #052e16 0%, #2d2d44 100%);
    color: white;
    border-radius: 0.75rem;
    font-size: 0.8125rem;
    font-weight: 700;
    box-shadow: 0 0.125rem 0.25rem rgba(26, 26, 46, 0.3);
    white-space: nowrap;
}

.section-content {
    border-top: 1px solid #e5e7eb;
    padding: 16px;
}

.suggestion-intro {
    margin-bottom: 16px;
    padding: 10px 14px;
    background: #f8fafc;
    border-radius: 6px;
    border: 1px solid #e2e8f0;
}

.suggestion-intro p {
    margin: 0;
    color: #475569;
    font-size: 0.875rem;
}

/* Warnings Boxes */
.warnings-box {
    margin-bottom: 16px;
    padding: 12px 14px;
    border-radius: 6px;
    border: 1px solid;
}

.warnings-box.yellow {
    background: #fef3c7;
    border-color: #fcd34d;
}

.warnings-box.red {
    background: #fee2e2;
    border-color: #fca5a5;
}

.warnings-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.625rem;
    font-weight: 600;
    font-size: 0.875rem;
}

.warnings-box.yellow .warnings-header {
    color: #b45309;
}

.warnings-box.yellow .warnings-header svg {
    color: #d97706;
}

.warnings-box.red .warnings-header {
    color: #166534;
}

.warnings-box.red .warnings-header svg {
    color: #dc2626;
}

.warnings-content {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.warning-item {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    font-size: 0.875rem;
    line-height: 1.5;
}

.warning-label {
    font-weight: 600;
    color: inherit;
}

.warning-text {
    color: inherit;
    padding-left: 0;
}

.warnings-box.yellow .warning-label,
.warnings-box.yellow .warning-text {
    color: #92400e;
}

.warnings-box.red .warning-label,
.warnings-box.red .warning-text {
    color: #166534;
}

.additional-info {
    display: block;
    margin-top: 4px;
    padding-top: 4px;
    border-top: 1px dashed;
}

.warnings-box.yellow .additional-info {
    border-color: #fcd34d;
}

.warnings-box.red .additional-info {
    border-color: #fca5a5;
}


.iol-type-cards {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
}

@media (max-width: 1400px) {
    .iol-type-cards {
        grid-template-columns: repeat(2, 1fr);
    }
}

@media (max-width: 768px) {
    .iol-type-cards {
        grid-template-columns: 1fr;
    }
}

/* Print styles */
@media print {
    .section {
        padding: 4px !important;
        page-break-before: auto;
    }
    
    .section-header {
        padding: 3px 6px !important;
    }
    
    .settings-btn {
        display: none !important;
    }
    
    .section-title {
        font-size: 9px !important;
    }
    
    .section-content {
        padding: 4px !important;
    }
    
    .suggestion-intro {
        padding: 4px 8px !important;
        margin-bottom: 6px !important;
    }
    
    .suggestion-intro p {
        font-size: 7px !important;
    }
    
    
    .iol-type-cards {
        grid-template-columns: repeat(4, 1fr) !important;
        gap: 4px !important;
    }
}
</style>
