<template>
    <div class="section">
        <div class="section-header">
            <div class="section-title">
                <span v-if="eyeIndicator" class="eye-badge">{{ eyeIndicator }}</span>
                <span>{{ t('sections.ocularParameters') }}</span>
            </div>
            <div class="header-actions">
                <span class="section-badge">{{ filledCount }}/{{ totalFields }}</span>
            </div>
        </div>
        <div class="section-content">
            <!-- Row 1: Offset Limbus, Offset Pupil -->
            <div class="param-row two-col">
                <ParamField
                    v-model="form.offsetLimbus"
                    :label="t('ocularParams.offsetLimbus')"
                    :info-tooltip="t('parameterInfo.offsetLimbus')"
                    field="offsetLimbus"
                    source="eyeInfo"
                    :disabled="disabled"
                    :label-width="firstRowLabelWidth"
                    :warning="getFieldWarning('offsetLimbus', 'eyeInfo')"
                    :max-deduction="getMaxDeduction('offsetLimbus')"
                    :threshold-range="getThresholdRange('offsetLimbus')"
                    :is-out-of-normal-limit="isOutOfNormalLimit('offsetLimbus')"
                />
                <ParamField
                    v-model="form.offsetPupilla"
                    :label="t('ocularParams.offsetPupil')"
                    :info-tooltip="t('parameterInfo.offsetPupil')"
                    field="offsetPupilla"
                    source="eyeInfo"
                    :disabled="disabled"
                    :label-width="firstRowLabelWidth"
                    :warning="getFieldWarning('offsetPupilla', 'eyeInfo')"
                    :max-deduction="getMaxDeduction('offsetPupilla')"
                    :threshold-range="getThresholdRange('offsetPupilla')"
                    :is-out-of-normal-limit="isOutOfNormalLimit('offsetPupilla')"
                />
            </div>

            <!-- Subtitle: Corneal -->
            <div class="section-subtitle">{{ t('ocularParams.corneal') }}</div>

            <!-- Row: AbSph, Coma, HOA -->
            <div class="param-row">
                <ParamField
                    v-model="form.SRI"
                    label="SRI"
                    :info-tooltip="t('parameterInfo.sri')"
                    field="SRI"
                    source="eyeInfo"
                    :disabled="disabled"
                    :label-width="labelWidth"
                    :warning="getFieldWarning('SRI', 'eyeInfo')"
                    :max-deduction="getMaxDeduction('SRI')"
                    :threshold-range="getThresholdRange('SRI')"
                    :is-out-of-normal-limit="isOutOfNormalLimit('SRI')"
                />
                <ParamField
                    v-model="form.SAI"
                    label="SAI"
                    :info-tooltip="t('parameterInfo.sai')"
                    field="SAI"
                    source="eyeInfo"
                    :disabled="disabled"
                    :label-width="labelWidth"
                    :warning="getFieldWarning('SAI', 'eyeInfo')"
                    :max-deduction="getMaxDeduction('SAI')"
                    :threshold-range="getThresholdRange('SAI')"
                    :is-out-of-normal-limit="isOutOfNormalLimit('SAI')"
                />
                
                
            </div>

            <!-- Row: SDP, SRI, SAI (Surface indices) -->
            <div class="param-row">
                <!--<ParamField
                    v-model="form.SDP"
                    label="SDP"
                    field="SDP"
                    source="eyeInfo"
                    :disabled="disabled"
                    :label-width="labelWidth"
                />-->
                <ParamField
                    v-model="form.AbS"
                    label="SA 4mm"
                    :info-tooltip="t('parameterInfo.cornealSa')"
                    field="AbS"
                    source="eyeInfo"
                    :disabled="disabled"
                    :label-width="labelWidth"
                    :warning="getFieldWarning('AbS', 'eyeInfo')"
                    :max-deduction="getMaxDeduction('AbS')"
                    :threshold-range="getThresholdRange('AbS')"
                    :is-out-of-normal-limit="isOutOfNormalLimit('AbS')"
                />
                <ParamField
                    v-model="form.Coma"
                    label="Coma 4mm"
                    :info-tooltip="t('parameterInfo.cornealComa')"
                    field="Coma"
                    source="eyeInfo"
                    :disabled="disabled"
                    :label-width="labelWidth"
                    :warning="getFieldWarning('Coma', 'eyeInfo')"
                    :max-deduction="getMaxDeduction('Coma')"
                    :threshold-range="getThresholdRange('Coma')"
                    :is-out-of-normal-limit="isOutOfNormalLimit('Coma')"
                />
                <ParamField
                    v-model="form.HOA"
                    label="HOA 4mm"
                    :info-tooltip="t('parameterInfo.cornealHoa')"
                    field="HOA"
                    source="eyeInfo"
                    :disabled="disabled"
                    :label-width="labelWidth"
                    :warning="getFieldWarning('HOA', 'eyeInfo')"
                    :max-deduction="getMaxDeduction('HOA')"
                    :threshold-range="getThresholdRange('HOA')"
                    :is-out-of-normal-limit="isOutOfNormalLimit('HOA')"
                />
                
            </div>

            <!-- Subtitle: Pupil -->
            <div class="section-subtitle">{{ t('ocularParams.pupil') }}</div>

            <!-- Row: photopic, mesopic, scotopic -->
            <div class="param-row">
                <ParamField
                    v-model="form.pupillaPhotopic"
                    label="Photopic"
                    :info-tooltip="t('parameterInfo.pupilPhotopic')"
                    field="pupillaPhotopic"
                    source="eyeInfo"
                    :disabled="disabled"
                    placeholder="mm"
                    :label-width="labelWidth"
                    :warning="getFieldWarning('pupillaPhotopic', 'eyeInfo')"
                    :max-deduction="getMaxDeduction('pupillaPhotopic')"
                    :threshold-range="getThresholdRange('pupillaPhotopic')"
                    :is-out-of-normal-limit="isOutOfNormalLimit('pupillaPhotopic')"
                />
                <ParamField
                    v-model="form.pupillaMesopica"
                    label="Mesopic"
                    :info-tooltip="t('parameterInfo.pupilMesopic')"
                    field="pupillaMesopica"
                    source="eyeInfo"
                    :disabled="disabled"
                    placeholder="mm"
                    :label-width="labelWidth"
                    :warning="getFieldWarning('pupillaMesopica', 'eyeInfo')"
                    :max-deduction="getMaxDeduction('pupillaMesopica')"
                    :threshold-range="getThresholdRange('pupillaMesopica')"
                    :is-out-of-normal-limit="isOutOfNormalLimit('pupillaMesopica')"
                />
                <ParamField
                    v-model="form.pupillaScotopic"
                    label="Scotopic"
                    :info-tooltip="t('parameterInfo.pupilScotopic')"
                    field="pupillaScotopic"
                    source="eyeInfo"
                    :disabled="disabled"
                    placeholder="mm"
                    :label-width="labelWidth"
                    :warning="getFieldWarning('pupillaScotopic', 'eyeInfo')"
                    :max-deduction="getMaxDeduction('pupillaScotopic')"
                    :threshold-range="getThresholdRange('pupillaScotopic')"
                    :is-out-of-normal-limit="isOutOfNormalLimit('pupillaScotopic')"
                />
            </div>

            <!-- Subtitle: Biometry (CSO) -->
            <div class="section-subtitle machine-subtitle">{{ t('biometry.title') }}</div>

            <!-- AXL, ACD, LT row -->
            <div class="param-row">
                <ParamField
                    v-model="form.cso_AXL"
                    :label="t('biometry.axialLength')"
                    :info-tooltip="t('parameterInfo.axialLength')"
                    field="AXL"
                    source="machine"
                    :disabled="disabled"
                    placeholder="mm"
                    :label-width="labelWidth"
                    :warning="getFieldWarning('cso_AXL', 'machine')"
                    :max-deduction="getMaxDeduction('cso_AXL')"
                    :threshold-range="getThresholdRange('cso_AXL')"
                    :is-out-of-normal-limit="isOutOfNormalLimit('cso_AXL')"
                />
                <ParamField
                    v-model="form.cso_ACD"
                    :label="t('biometry.acDepth')"
                    :info-tooltip="t('parameterInfo.acDepth')"
                    field="ACD"
                    source="machine"
                    :disabled="disabled"
                    placeholder="mm"
                    :label-width="labelWidth"
                    :warning="getFieldWarning('cso_ACD', 'machine')"
                    :max-deduction="getMaxDeduction('cso_ACD')"
                    :threshold-range="getThresholdRange('cso_ACD')"
                    :is-out-of-normal-limit="isOutOfNormalLimit('cso_ACD')"
                />
                <ParamField
                    v-model="form.cso_LT"
                    :label="t('biometry.lensThickness')"
                    :info-tooltip="t('parameterInfo.lensThickness')"
                    field="LT"
                    source="machine"
                    :disabled="disabled"
                    placeholder="mm"
                    :label-width="labelWidth"
                    :warning="getFieldWarning('cso_LT', 'machine')"
                    :max-deduction="getMaxDeduction('cso_LT')"
                    :threshold-range="getThresholdRange('cso_LT')"
                    :is-out-of-normal-limit="isOutOfNormalLimit('cso_LT')"
                />
            </div>

        </div>
    </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import ParamField from '@/components/atoms/ParamField.vue';
import { useI18n } from '@/composables/useI18n';
import { useIOLRules } from '@/composables/useIOLRules';
import iolSuitabilityRules from '@/config/iolSuitabilityRules.json';
import { deriveAllParameterRanges } from '@/utils/iolRangeUtils';

const { t } = useI18n();
const { iolRules } = useIOLRules();

const props = defineProps({
    form: { type: Object, required: true },
    disabled: { type: Boolean, default: false },
    eyeIndicator: { type: String, default: '' }
});

const expanded = ref(true);

// Fixed label widths for consistent alignment
const labelWidth = '100px';      // General parameters
const firstRowLabelWidth = '122px'; // Wider to fit help badge on offset fields

// Get IOL suitability rules (use loaded rules or fallback to defaults)
const suitabilityRules = computed(() => iolRules.value || iolSuitabilityRules);
const scoreDeductions = computed(() => suitabilityRules.value.scoreDeductions || iolSuitabilityRules.scoreDeductions);
// Derive parameter ranges from score deductions (deduction <= 40 = normal range)
const parameterRanges = computed(() => deriveAllParameterRanges(scoreDeductions.value));
const formFieldMap = iolSuitabilityRules.formFieldMapping || {};

// Field mapping: form field name -> parameter name in IOL rules
const fieldToParamMap = {
    'offsetLimbus': 'OffsetLimbus',
    'offsetPupilla': 'OffsetPupil',
    'SRI': 'SRI',
    'SAI': 'SAI',
    'AbS': 'AbSph',
    'Coma': 'Coma',
    'HOA': 'HOA',
    'pupillaPhotopic': 'PupilPhotopic',
    'pupillaMesopica': 'PupilMesopic',
    'pupillaScotopic': 'PupilScotopic',
    'cso_AXL': 'AxialLength',
    'cso_ACD': 'ACDepth',
    'cso_LT': 'LensThickness'
};

// Check condition helper (same logic as IOLTypeSuggestionSection)
const NUM_PATTERN = '(-?\\d+\\.?\\d*)';
const checkCondition = (condition, value) => {
    if (!condition || typeof condition !== 'string') return false;
    if (value === null || value === undefined) return false;
    const num = parseFloat(value);
    if (isNaN(num)) return false;
    
    // "greater than X"
    let match = condition.match(new RegExp(`^greater than ${NUM_PATTERN}$`));
    if (match) return num > parseFloat(match[1]);
    
    // "less than X"
    match = condition.match(new RegExp(`^less than ${NUM_PATTERN}$`));
    if (match) return num < parseFloat(match[1]);
    
    // "abs greater than X"
    match = condition.match(new RegExp(`^abs greater than ${NUM_PATTERN}$`));
    if (match) return Math.abs(num) > parseFloat(match[1]);
    
    // "between X and Y"
    match = condition.match(new RegExp(`^between ${NUM_PATTERN} and ${NUM_PATTERN}$`));
    if (match) {
        const min = parseFloat(match[1]);
        const max = parseFloat(match[2]);
        return num >= min && num <= max;
    }
    
    // "outside X and Y"
    match = condition.match(new RegExp(`^outside ${NUM_PATTERN} and ${NUM_PATTERN}$`));
    if (match) {
        const min = parseFloat(match[1]);
        const max = parseFloat(match[2]);
        return num < min || num > max;
    }
    
    // Legacy format support: "between X-Y" and "outside X-Y"
    match = condition.match(/^between (\d+\.?\d*)-(\d+\.?\d*)$/);
    if (match) {
        const min = parseFloat(match[1]);
        const max = parseFloat(match[2]);
        return num >= min && num <= max;
    }
    
    match = condition.match(/^outside (\d+\.?\d*)-(\d+\.?\d*)$/);
    if (match) {
        const min = parseFloat(match[1]);
        const max = parseFloat(match[2]);
        return num < min || num > max;
    }
    
    return false;
};

// Helper to calculate deduction value (supports both discrete and progressive)
const getDeductionValue = (threshold, iolType, value, deductionOverride = null) => {
    // Use override if provided (for reconstructed breakpoint deductions)
    const deduction = deductionOverride !== null ? deductionOverride : threshold[iolType];
    
    // If deduction is a number, use it directly
    if (typeof deduction === 'number') {
        return deduction;
    }
    
    // If deduction is an object with min/max, calculate linear interpolation
    if (deduction && typeof deduction === 'object' && 'min' in deduction && 'max' in deduction) {
        // Extract range from condition (use reconstructed condition string)
        const conditionStr = threshold.condition || '';
        if (!conditionStr) return deduction.max;
        
        const NUM_PATTERN = '(-?\\d+\\.?\\d*)';
        let match = conditionStr.match(new RegExp(`^between ${NUM_PATTERN} and ${NUM_PATTERN}$`));
        if (match) {
            const rangeMin = parseFloat(match[1]);
            const rangeMax = parseFloat(match[2]);
            if (rangeMax === rangeMin) return deduction.max; // Single point: use the breakpoint deduction
            
            // Calculate position within range (0 to 1)
            const position = (value - rangeMin) / (rangeMax - rangeMin);
            
            // Linear interpolation
            const interpolated = deduction.min + (deduction.max - deduction.min) * position;
            
            // Round to nearest integer
            return Math.round(interpolated);
        }
        // Fallback to max if we can't extract range
        return deduction.max;
    }
    
    return 0;
};

// Get maximum deduction for a parameter across all IOL types
const getMaxDeduction = (fieldName) => {
    const paramName = fieldToParamMap[fieldName];
    if (!paramName) return 0;
    
    const value = props.form[fieldName];
    if (!value || value === '') return 0;
    
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return 0;
    
    const paramConfig = scoreDeductions.value[paramName];
    if (!paramConfig || !paramConfig.thresholds) return 0;
    
    // Check if value is outside limits (simple comparison)
    const minimumLimit = paramConfig.minimumLimit;
    const maximumLimit = paramConfig.maximumLimit;
    if (minimumLimit !== null && minimumLimit !== undefined && numValue < minimumLimit) {
        return 0; // Outside minimum limit - no deduction (will show as "out of normal limit")
    }
    if (maximumLimit !== null && maximumLimit !== undefined && numValue > maximumLimit) {
        return 0; // Outside maximum limit - no deduction (will show as "out of normal limit")
    }
    
    // Find matching threshold and get maximum deduction (with progressive deduction support)
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
        
        if (checkCondition(conditionStr, numValue)) {
            // Pass reconstructed condition string to getDeductionValue
            const thresholdWithCondition = { ...threshold, condition: conditionStr };
            // Reconstruct min/max for breakpoints if needed
            const getDeductionForType = (iolType) => {
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
                    deduction = { min: prevMax, max: deduction };
                }
                return getDeductionValue(thresholdWithCondition, iolType, numValue, deduction);
            };
            
            const deductions = [
                Math.abs(getDeductionForType('monofocaleStandard')),
                Math.abs(getDeductionForType('monofocalePlus')),
                Math.abs(getDeductionForType('edof')),
                Math.abs(getDeductionForType('multifocal'))
            ];
            return Math.max(...deductions);
        }
    }
    
    return 0;
};

// Get warning message for a field based on IOL suitability rules
const getFieldWarning = (fieldName, source) => {
    const paramName = fieldToParamMap[fieldName];
    if (!paramName) return null;
    
    const value = props.form[fieldName];
    if (!value || value === '') return null;
    
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return null;
    
    // Check if deduction is > 70 points
    const maxDeduction = getMaxDeduction(fieldName);
    if (maxDeduction <= 70) return null;
    
    // Get warning message from scoreDeductions
    const paramConfig = scoreDeductions.value[paramName];
    if (!paramConfig) return null;
    
    // Check if value is outside limits (simple comparison)
    const minimumLimit = paramConfig.minimumLimit;
    const maximumLimit = paramConfig.maximumLimit;
    if (minimumLimit !== null && minimumLimit !== undefined && numValue < minimumLimit) {
        return null; // Outside minimum limit - no warning (will show as "out of normal limit")
    }
    if (maximumLimit !== null && maximumLimit !== undefined && numValue > maximumLimit) {
        return null; // Outside maximum limit - no warning (will show as "out of normal limit")
    }
    
    // Find matching threshold
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
        
        if (checkCondition(conditionStr, numValue)) {
            // For breakpoints, deductions are stored as numbers (max), need to reconstruct min/max object
            const getDeductionForType = (iolType) => {
                const deduction = threshold[iolType];
                if (typeof deduction === 'number') {
                    // For breakpoints, need to get min from previous threshold
                    let prevMax = 0;
                    if (i > 0) {
                        const prevThreshold = paramConfig.thresholds[i - 1];
                        if (typeof prevThreshold[iolType] === 'number') {
                            prevMax = prevThreshold[iolType];
                        } else if (prevThreshold[iolType] && typeof prevThreshold[iolType] === 'object' && 'max' in prevThreshold[iolType]) {
                            prevMax = prevThreshold[iolType].max;
                        }
                    }
                    // Return max deduction (for warning, we use max)
                    return Math.abs(deduction);
                }
                if (deduction && typeof deduction === 'object' && 'max' in deduction) {
                    return Math.abs(deduction.max);
                }
                return Math.abs(deduction || 0);
            };
            
            // Find which IOL type(s) have > 70 deduction
            const affectedTypes = [];
            if (getDeductionForType('monofocaleStandard') > 70) affectedTypes.push(t('iolType.monofocaleStandard'));
            if (getDeductionForType('monofocalePlus') > 70) affectedTypes.push(t('iolType.monofocalePlus'));
            if (getDeductionForType('edof') > 70) affectedTypes.push(t('iolType.edof'));
            if (getDeductionForType('multifocal') > 70) affectedTypes.push(t('iolType.multifocal'));
            
            if (affectedTypes.length > 0) {
                const description = paramConfig.description || paramName;
                const unit = parameterRanges.value?.multifocal?.[paramName]?.unit || '';
                const unitStr = unit ? ` ${unit}` : '';
                const typesStr = affectedTypes.join(', ');
                return `${description}: ${maxDeduction} point deduction for ${typesStr}`;
            }
            break;
        }
    }
    
    return null;
};

// Get min/max threshold values for a parameter (from minimumLimit and maximumLimit)
const getThresholdRange = (fieldName) => {
    const paramName = fieldToParamMap[fieldName];
    if (!paramName) return null;
    
    const paramConfig = scoreDeductions.value[paramName];
    if (!paramConfig) return null;
    
    // Get limits directly from minimumLimit and maximumLimit properties
    const minValue = paramConfig.minimumLimit !== null && paramConfig.minimumLimit !== undefined ? paramConfig.minimumLimit : null;
    const maxValue = paramConfig.maximumLimit !== null && paramConfig.maximumLimit !== undefined ? paramConfig.maximumLimit : null;
    
    // Get unit from parameter ranges if available
    const unit = parameterRanges.value?.monofocaleStandard?.[paramName]?.unit || '';
    
    return { minValue, maxValue, unit };
};

// Check if a field value is outside the normal limit (below minimum or above maximum)
const isOutOfNormalLimit = (fieldName) => {
    const paramName = fieldToParamMap[fieldName];
    if (!paramName) return false;
    
    const value = props.form[fieldName];
    if (!value || value === '') return false;
    
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return false;
    
    const paramConfig = scoreDeductions.value[paramName];
    if (!paramConfig) return false;
    
    const minimumLimit = paramConfig.minimumLimit;
    const maximumLimit = paramConfig.maximumLimit;
    
    // Check if below minimum limit (simple < comparison)
    if (minimumLimit !== null && minimumLimit !== undefined && numValue < minimumLimit) return true;
    
    // Check if above maximum limit (simple > comparison)
    if (maximumLimit !== null && maximumLimit !== undefined && numValue > maximumLimit) return true;
    
    return false;
};

// All fields for counting (removed cil - corneal astigmatism)
const ocularFields = ['offsetLimbus', 'offsetPupilla', 'SDP', 'SRI', 'SAI', 
    'AbS', 'Coma', 'HOA', 'pupillaPhotopic', 'pupillaMesopica', 'pupillaScotopic'];
const csoFields = ['cso_AXL', 'cso_ACD', 'cso_LT'];

const totalFields = ocularFields.length + csoFields.length;

const filledCount = computed(() => {
    const allFields = [...ocularFields, ...csoFields];
    return allFields.filter(f => props.form[f]).length;
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
    background: linear-gradient(135deg, #1a1a2e 0%, #2d2d44 100%);
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

.section-subtitle {
    font-size: 10px;
    font-weight: 600;
    color: #6366f1;
    text-transform: capitalize;
    letter-spacing: 0.05em;
    margin-top: 4px;
    padding-bottom: 2px;
    border-bottom: 1px solid #e0e7ff;
}

.section-subtitle.machine-subtitle {
    color: #7c3aed;
    border-bottom-color: #ddd6fe;
    margin-top: 12px;
}

.param-row {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
    min-width: 0;
}

.param-row > * {
    min-width: 0; /* Allow grid items to shrink */
}

.param-row.two-col {
    grid-template-columns: repeat(2, 1fr);
}

.param-row.single {
    grid-template-columns: 1fr;
}

.wide-field {
    max-width: 350px;
}

@media (max-width: 900px) {
    .param-row:not(.single) {
        grid-template-columns: repeat(2, 1fr);
    }
}

@media (max-width: 600px) {
    .param-row,
    .param-row.two-col {
        grid-template-columns: 1fr;
    }
}

/* Print styles - Compact grid layout */
@media print {
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
    
    .section-subtitle {
        font-size: 7px !important;
        padding: 2px 4px !important;
        margin: 3px 0 2px 0 !important;
    }
    
    .param-row {
        grid-template-columns: repeat(4, 1fr) !important;
        gap: 3px !important;
        margin-bottom: 2px !important;
    }
    
    .param-row.two-col {
        grid-template-columns: repeat(4, 1fr) !important;
    }
    
}
</style>
