<template>
    <Teleport to="body">
        <div v-if="show" class="modal-overlay" @click.self="$emit('close')">
            <div class="iol-rules-modal">
                <div class="modal-header">
                    <h2>{{ t('iolRulesSettings.title') }}</h2>
                    <button type="button" class="close-btn" @click="$emit('close')">
                        <SvgIcon name="close" :size="20" />
                    </button>
                </div>
                
                <div class="modal-body">
                    <div v-if="loading" class="loading-state">
                        {{ t('common.loading') }}...
                    </div>
                    
                    <template v-else>
                        <!-- No data message -->
                        <div v-if="paramNames.length === 0" class="no-data-state">
                            No IOL rules found. Please restart the application.
                            <br><br>
                            <button @click="loadConfig" class="retry-btn">Retry Load</button>
                        </div>
                        
                        <template v-else>
                        <!-- Parameter Tabs -->
                        <div class="param-tabs">
                            <button 
                                v-for="param in paramNames" 
                                :key="param"
                                class="param-tab"
                                :class="{ active: activeParam === param }"
                                @click="activeParam = param"
                            >
                                {{ getParamLabel(param) }}
                            </button>
                        </div>
                        
                        <!-- Rules Table -->
                        <div class="rules-container" v-if="activeParam">
                            <div class="param-description" v-if="getParamDescription(activeParam)">
                                {{ getParamDescription(activeParam) }}
                            </div>
                            
                            <div class="table-actions-top">
                                <button type="button" class="add-row-btn" @click="addThreshold(activeParam)">
                                    <SvgIcon name="plus" :size="14" />
                                    {{ t('iolRulesSettings.addBreakpoint') }}
                                </button>
                            </div>
                            
                            <div class="rules-table-wrapper">
                                <table class="rules-table">
                                    <thead>
                                        <tr>
                                            <th class="condition-col">{{ t('iolRulesSettings.condition') }}</th>
                                            <th class="iol-col">{{ t('iolType.monofocaleStandard') }}</th>
                                            <th class="iol-col">{{ t('iolType.monofocalePlus') }}</th>
                                            <th class="iol-col">{{ t('iolType.edof') }}</th>
                                            <th class="iol-col">{{ t('iolType.multifocal') }}</th>
                                            <th class="action-col"></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <!-- First row: Always "less than" (minimum limit) -->
                                        <tr v-if="activeParam && firstThreshold" :key="'first'">
                                            <td class="condition-cell">
                                                <span class="condition-label">{{ t('iolRulesSettings.minimumLimit') }}</span>
                                                <input 
                                                    type="text" 
                                                    v-model="firstThreshold.conditionValue"
                                                    class="condition-value"
                                                    placeholder="min value"
                                                    @input="updateConditionString(firstThreshold); markDirty()"
                                                />
                                            </td>
                                            <td class="value-cell" colspan="4">
                                                <span class="no-deduction-note">{{ t('iolRulesSettings.valuesBelowLimit') }}</span>
                                            </td>
                                            <td class="action-cell">
                                                <div class="row-actions">
                                                    <button 
                                                        type="button"
                                                        class="row-action-btn insert-btn" 
                                                        @click="insertThreshold(activeParam, 1)"
                                                        :title="t('iolRulesSettings.insertAbove')"
                                                    >
                                                        <SvgIcon name="plus" :size="12" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                        
                                        <!-- Middle rows: "between" thresholds (range breakpoints) -->
                                        <tr 
                                            v-for="(threshold, idx) in middleThresholds" 
                                            :key="'middle-' + idx"
                                        >
                                            <td class="condition-cell">
                                                <span class="condition-label">{{ t('iolRulesSettings.breakpoint') }}</span>
                                                <div class="range-breakpoint-inputs">
                                                    <input 
                                                        type="text" 
                                                        v-model="threshold.conditionMax"
                                                        class="condition-value-small"
                                                        placeholder="max"
                                                        @input="updateRangeCondition(threshold); markDirty()"
                                                    />
                                                </div>
                                            </td>
                                            <td class="value-cell">
                                                <div class="deduction-input-group">
                                                    <input 
                                                        type="number" 
                                                        v-model.number="threshold.monofocaleStandard.max"
                                                        class="deduction-input-small"
                                                        placeholder="max"
                                                        @input="updateDeductionMin(threshold, 'monofocaleStandard', idx); markDirty()"
                                                    />
                                                </div>
                                            </td>
                                            <td class="value-cell">
                                                <div class="deduction-input-group">
                                                    <input 
                                                        type="number" 
                                                        v-model.number="threshold.monofocalePlus.max"
                                                        class="deduction-input-small"
                                                        placeholder="max"
                                                        @input="updateDeductionMin(threshold, 'monofocalePlus', idx); markDirty()"
                                                    />
                                                </div>
                                            </td>
                                            <td class="value-cell">
                                                <div class="deduction-input-group">
                                                    <input 
                                                        type="number" 
                                                        v-model.number="threshold.edof.max"
                                                        class="deduction-input-small"
                                                        placeholder="max"
                                                        @input="updateDeductionMin(threshold, 'edof', idx); markDirty()"
                                                    />
                                                </div>
                                            </td>
                                            <td class="value-cell">
                                                <div class="deduction-input-group">
                                                    <input 
                                                        type="number" 
                                                        v-model.number="threshold.multifocal.max"
                                                        class="deduction-input-small"
                                                        placeholder="max"
                                                        @input="updateDeductionMin(threshold, 'multifocal', idx); markDirty()"
                                                    />
                                                </div>
                                            </td>
                                            <td class="action-cell">
                                                <div class="row-actions">
                                                    <button 
                                                        type="button"
                                                        class="row-action-btn insert-btn" 
                                                        @click="insertThreshold(activeParam, idx + 1)"
                                                        :title="t('iolRulesSettings.insertAbove')"
                                                    >
                                                        <SvgIcon name="plus" :size="12" />
                                                    </button>
                                                    <button 
                                                        type="button"
                                                        class="row-action-btn delete-btn" 
                                                        @click="deleteThreshold(activeParam, idx + 1)"
                                                        :title="t('iolRulesSettings.deleteRow')"
                                                    >
                                                        <SvgIcon name="trash" :size="12" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                        
                                        <!-- Last row: Always "greater than" (maximum limit) -->
                                        <tr v-if="activeParam && lastThreshold" :key="'last'">
                                            <td class="condition-cell">
                                                <span class="condition-label">{{ t('iolRulesSettings.maximumLimit') }}</span>
                                                <input 
                                                    type="text" 
                                                    v-model="lastThreshold.conditionValue"
                                                    class="condition-value"
                                                    placeholder="max value"
                                                    @input="updateConditionString(lastThreshold); markDirty()"
                                                />
                                            </td>
                                            <td class="value-cell" colspan="4">
                                                <span class="no-deduction-note">{{ t('iolRulesSettings.valuesExceedingLimit') }}</span>
                                            </td>
                                            <td class="action-cell">
                                                <div class="row-actions">
                                                    <button 
                                                        type="button"
                                                        class="row-action-btn insert-btn" 
                                                        @click="insertThreshold(activeParam, getParamThresholds(activeParam).length - 1)"
                                                        :title="t('iolRulesSettings.insertAbove')"
                                                    >
                                                        <SvgIcon name="plus" :size="12" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                            
                            <div class="table-actions">
                                <button type="button" class="add-row-btn" @click="addThreshold(activeParam)">
                                    <SvgIcon name="plus" :size="14" />
                                    {{ t('iolRulesSettings.addBreakpoint') }}
                                </button>
                            </div>
                        </div>
                        </template>
                    </template>
                </div>
                
                <div class="modal-footer">
                    <button type="button" class="reset-all-btn" @click="resetAllToDefaults">
                        {{ t('iolRulesSettings.resetAll') }}
                    </button>
                    <button type="button" class="reset-param-btn" @click="resetParamToDefaults" v-if="activeParam">
                        {{ t('iolRulesSettings.resetParam') }}
                    </button>
                    <button type="button" class="export-btn" @click="exportConfig">
                        <SvgIcon name="download" :size="14" />
                        {{ t('iolRulesSettings.export') }}
                    </button>
                    <div class="footer-spacer"></div>
                    <button type="button" class="cancel-btn" @click="$emit('close')">
                        {{ t('common.cancel') }}
                    </button>
                    <button type="button" class="save-btn" :disabled="!isDirty" @click="saveChanges">
                        {{ t('common.save') }}
                    </button>
                    <button type="button" class="save-close-btn" :disabled="!isDirty" @click="saveAndClose">
                        {{ t('iolRulesSettings.saveAndClose') }}
                    </button>
                </div>
            </div>
        </div>
    </Teleport>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue';
import { useI18n } from '@/composables/useI18n';
import { useIOLRules } from '@/composables/useIOLRules';
import SvgIcon from '@/components/atoms/SvgIcon.vue';
import defaultIOLRules from '@/config/iolSuitabilityRules.json';

const { t } = useI18n();
const { loadIOLRules } = useIOLRules();

const props = defineProps({
    show: { type: Boolean, default: false }
});

const emit = defineEmits(['close', 'saved']);

// State
const config = ref(null);
const loading = ref(true);
const isDirty = ref(false);
const activeParam = ref(null);

// Condition type options for dropdown
const conditionTypes = [
    { type: 'less than', label: 'Minimum limit' },
    { type: 'greater than', label: 'Maximum limit' },
    { type: 'breakpoint', label: 'Breakpoint' }
];

const conditionOptions = computed(() => conditionTypes.map(c => ({
    value: c.type,
    label: c.label
})));

const paramNames = computed(() => {
    if (!config.value?.scoreDeductions) return [];
    return Object.keys(config.value.scoreDeductions).filter(key => key !== 'description');
});

// Computed properties for first and last thresholds (for reactivity)
const firstThreshold = computed(() => {
    if (!activeParam.value) return null;
    const thresholds = getParamThresholds(activeParam.value);
    return thresholds.length > 0 ? thresholds[0] : null;
});

const lastThreshold = computed(() => {
    if (!activeParam.value) return null;
    const thresholds = getParamThresholds(activeParam.value);
    return thresholds.length > 1 ? thresholds[thresholds.length - 1] : null;
});

const middleThresholds = computed(() => {
    if (!activeParam.value) return [];
    return getMiddleThresholds(activeParam.value);
});

// Use the param name directly as label (e.g., HOA, SDP, AbSph)
function getParamLabel(paramName) {
    return paramName;
}

function getParamDescription(paramName) {
    return config.value?.scoreDeductions?.[paramName]?.description || '';
}

function getParamThresholds(paramName) {
    return config.value?.scoreDeductions?.[paramName]?.thresholds || [];
}

// Get first threshold (always "less than")
function getFirstThreshold() {
    if (!activeParam.value) return null;
    const thresholds = getParamThresholds(activeParam.value);
    return thresholds.length > 0 ? thresholds[0] : null;
}

// Get last threshold (always "greater than" / maximum limit)
function getLastThreshold() {
    if (!activeParam.value) return null;
    const thresholds = getParamThresholds(activeParam.value);
    return thresholds.length > 1 ? thresholds[thresholds.length - 1] : null;
}

// Get middle thresholds (all "between" thresholds)
function getMiddleThresholds(paramName) {
    const thresholds = getParamThresholds(paramName);
    if (thresholds.length <= 2) return [];
    return thresholds.slice(1, -1);
}

// Get previous threshold's max value for auto-linking
function getPreviousMax(middleIndex) {
    const thresholds = getParamThresholds(activeParam.value);
    // middleIndex is the index in the middle thresholds array
    // Middle thresholds start at index 1 in the full array
    const actualIndex = middleIndex + 1;
    
    if (actualIndex <= 0) return '';
    
    // Get the threshold before this one
    const prevThreshold = thresholds[actualIndex - 1];
    if (!prevThreshold) return '';
    
    if (isRangeCondition(prevThreshold.conditionType)) {
        // For breakpoints, return conditionMax
        return prevThreshold.conditionMax || '';
    } else if (prevThreshold.conditionType === 'less than') {
        return prevThreshold.conditionValue || '';
    }
    return '';
}

// Get previous threshold's max deduction for auto-linking
function getPreviousMaxDeduction(middleIndex, iolType) {
    const thresholds = getParamThresholds(activeParam.value);
    // middleIndex is the index in the middle thresholds array
    // Middle thresholds start at index 1 in the full array
    const actualIndex = middleIndex + 1;
    
    if (actualIndex <= 0) return null;
    
    // Get the threshold before this one
    const prevThreshold = thresholds[actualIndex - 1];
    if (!prevThreshold) return null;
    
    const prevDeduction = prevThreshold[iolType];
    if (!prevDeduction) return null;
    
    // If previous deduction is progressive (object with min/max), return max
    if (isProgressiveDeduction(prevDeduction)) {
        return prevDeduction.max !== undefined ? prevDeduction.max : prevDeduction.min;
    }
    
    // If previous deduction is discrete (number), return that number
    if (typeof prevDeduction === 'number') {
        return prevDeduction;
    }
    
    return null;
}

// Get deduction min value (auto-linked from previous or stored value)
function getDeductionMinValue(threshold, iolType, middleIndex) {
    // Ensure deduction is in progressive format
    if (!isProgressiveDeduction(threshold[iolType])) {
        const currentValue = typeof threshold[iolType] === 'number' ? threshold[iolType] : 0;
        threshold[iolType] = { min: currentValue, max: currentValue };
    }
    
    // If min is already set, use it
    if (threshold[iolType]?.min !== undefined && threshold[iolType]?.min !== null) {
        return threshold[iolType].min;
    }
    
    // Otherwise, get from previous threshold and set it
    const prevMax = getPreviousMaxDeduction(middleIndex, iolType);
    if (prevMax !== null) {
        threshold[iolType].min = prevMax;
        return prevMax;
    }
    
    return threshold[iolType]?.min ?? 0;
}

// Check if condition type uses a range (min/max)
function isRangeCondition(conditionType) {
    return conditionType === 'breakpoint';
}

// Check if a deduction value is progressive (object with min/max)
function isProgressiveDeduction(deduction) {
    return deduction && typeof deduction === 'object' && 'min' in deduction && 'max' in deduction;
}

// Convert discrete deduction to progressive when condition is a range
function convertToProgressiveIfRange(threshold, iolType) {
    if (isRangeCondition(threshold.conditionType) && typeof threshold[iolType] === 'number') {
        const value = threshold[iolType];
        threshold[iolType] = { min: value, max: value };
    }
}

// Parse condition string into type, value, min, max
function parseCondition(conditionStr) {
    if (!conditionStr) return { type: 'less than', value: '', min: '', max: '' };
    
    // Check for "between X and Y" (legacy format - convert to breakpoint)
    let match = conditionStr.match(/^between (-?[\d.]+) and (-?[\d.]+)$/);
    if (match) {
        return { type: 'breakpoint', value: match[2], min: match[1], max: match[2] };
    }
    
    // Legacy format: "between X-Y"
    match = conditionStr.match(/^between ([\d.]+)-([\d.]+)$/);
    if (match) {
        return { type: 'breakpoint', value: match[2], min: match[1], max: match[2] };
    }
    
    // Check for "greater than X" or "less than X"
    match = conditionStr.match(/^(greater than|less than) (-?[\d.]+)$/);
    if (match) {
        return { type: match[1], value: match[2], min: '', max: '' };
    }
    
    // Legacy support for "abs greater than X"
    match = conditionStr.match(/^(abs greater than) (-?[\d.]+)$/);
    if (match) {
        return { type: 'greater than', value: match[2], min: '', max: '' };
    }
    
    return { type: 'less than', value: '', min: '', max: '' };
}

// Normalize deduction values when loading - preserve progressive format
function normalizeDeduction(deduction) {
    if (deduction && typeof deduction === 'object' && 'min' in deduction && 'max' in deduction) {
        return deduction; // Already progressive
    }
    return typeof deduction === 'number' ? deduction : 0;
}

// Get hint for min value input (shows previous threshold's max if available)
function getMinValueHint(threshold) {
    const thresholds = getParamThresholds(activeParam.value);
    const currentIndex = thresholds.indexOf(threshold);
    if (currentIndex > 0) {
        const prevThreshold = thresholds[currentIndex - 1];
        if (isRangeCondition(prevThreshold.conditionType) && prevThreshold.conditionMax) {
            return `Auto-linked from previous: ${prevThreshold.conditionMax}`;
        }
    }
    return '';
}

// Build condition string from type and value (for single value conditions)
function buildCondition(type, value) {
    if (!value) return '';
    return `${type} ${value}`;
}

// Build condition string from type and max (for breakpoint conditions)
// Breakpoints only store max value, min is auto-linked from previous threshold
function buildRangeCondition(type, min, max) {
    if (type === 'breakpoint') {
        // For breakpoints, reconstruct "between X and Y" where X comes from previous threshold
        if (!max) return '';
        // Min will be filled from previous threshold when saving
        return `between ${min || '?'} and ${max}`;
    }
    if (!min || !max) return '';
    return `${type} ${min} and ${max}`;
}

// Update condition string for single value conditions
function updateConditionString(threshold) {
    threshold.condition = buildCondition(threshold.conditionType, threshold.conditionValue);
}

// Update condition string for breakpoint conditions
function updateRangeCondition(threshold) {
    const thresholds = getParamThresholds(activeParam.value);
    const currentIndex = thresholds.indexOf(threshold);
    
    // Auto-fill min from previous threshold (for display/calculation only, not stored)
    if (currentIndex > 0) {
        const prevThreshold = thresholds[currentIndex - 1];
        if (isRangeCondition(prevThreshold.conditionType)) {
            threshold.conditionMin = prevThreshold.conditionMax || '';
        } else if (prevThreshold.conditionType === 'less than') {
            threshold.conditionMin = prevThreshold.conditionValue || '';
        }
    }
    
    // For breakpoints, only store max value
    threshold.condition = `breakpoint ${threshold.conditionMax || ''}`;
    threshold.conditionValue = threshold.conditionMax || '';
    
    // Smart linking: If max changed, update next threshold's min (for display)
    if (threshold.conditionMax && currentIndex >= 0 && currentIndex < thresholds.length - 1) {
        const nextThreshold = thresholds[currentIndex + 1];
        if (isRangeCondition(nextThreshold.conditionType)) {
            // Auto-update next threshold's min to match this threshold's max
            nextThreshold.conditionMin = threshold.conditionMax;
            updateRangeCondition(nextThreshold);
        }
    }
}

// Update deduction min value from previous threshold and auto-link to next
function updateDeductionMin(threshold, iolType, middleIndex) {
    const thresholds = getParamThresholds(activeParam.value);
    const actualIndex = middleIndex + 1; // Convert middle index to actual index
    
    // Ensure deduction is progressive format
    if (!isProgressiveDeduction(threshold[iolType])) {
        const currentValue = typeof threshold[iolType] === 'number' ? threshold[iolType] : 0;
        threshold[iolType] = { min: currentValue, max: currentValue };
    }
    
    // Auto-fill min from previous threshold's max
    if (actualIndex > 0) {
        const prevThreshold = thresholds[actualIndex - 1];
        const prevMax = getPreviousMaxDeduction(middleIndex, iolType);
        if (prevMax !== null) {
            threshold[iolType].min = prevMax;
        }
    }
    
    // Smart linking: If max changed, update next threshold's min
    if (actualIndex >= 0 && actualIndex < thresholds.length - 1) {
        const nextThreshold = thresholds[actualIndex + 1];
        if (isProgressiveDeduction(nextThreshold[iolType])) {
            // Auto-update next threshold's min to match this threshold's max
            nextThreshold[iolType].min = threshold[iolType].max;
        }
    }
}

// Note: onConditionTypeChange is now defined above with deduction conversion logic

// Process thresholds to add parsed condition parts and normalize deductions
// Also ensures first is "less than" and last is "greater than"
function processThresholds() {
    if (!config.value?.scoreDeductions) return;
    
    for (const paramName of Object.keys(config.value.scoreDeductions)) {
        if (paramName === 'description') continue;
        const param = config.value.scoreDeductions[paramName];
        if (!param.thresholds || param.thresholds.length === 0) continue;
        
        // Read minimumLimit and maximumLimit from parameter, or derive from thresholds
        let minimumLimit = param.minimumLimit;
        let maximumLimit = param.maximumLimit;
        
        // If minimumLimit doesn't exist, derive from first threshold
        if (minimumLimit === null || minimumLimit === undefined) {
            const firstThreshold = param.thresholds[0];
            if (firstThreshold.conditionType === 'breakpoint' && firstThreshold.conditionMax) {
                // First breakpoint's max becomes the minimum limit
                minimumLimit = parseFloat(firstThreshold.conditionMax);
            } else if (firstThreshold.condition) {
                const parsed = parseCondition(firstThreshold.condition);
                if (parsed.type === 'less than') {
                    minimumLimit = parseFloat(parsed.value);
                }
            }
        }
        
        // If maximumLimit doesn't exist, derive from last threshold
        if (maximumLimit === null || maximumLimit === undefined) {
            const lastThreshold = param.thresholds[param.thresholds.length - 1];
            if (lastThreshold.condition) {
                const parsed = parseCondition(lastThreshold.condition);
                if (parsed.type === 'greater than') {
                    maximumLimit = parseFloat(parsed.value);
                }
            }
        }
        
        // Store limits in parameter for later use
        if (minimumLimit !== null && minimumLimit !== undefined) {
            param.minimumLimit = minimumLimit;
        }
        if (maximumLimit !== null && maximumLimit !== undefined) {
            param.maximumLimit = maximumLimit;
        }
        
        // Check if first threshold is already "less than" or last is "greater than"
        // If so, they're synthetic thresholds we added before - remove them
        const firstThreshold = param.thresholds[0];
        const lastThreshold = param.thresholds[param.thresholds.length - 1];
        const hasSyntheticFirst = firstThreshold && firstThreshold.conditionType === 'less than';
        const hasSyntheticLast = lastThreshold && lastThreshold.conditionType === 'greater than';
        
        // Remove synthetic thresholds if they exist (we'll add them back)
        if (hasSyntheticFirst) {
            param.thresholds.shift();
        }
        if (hasSyntheticLast) {
            param.thresholds.pop();
        }
        
        // Store reference to breakpoints array (all thresholds are breakpoints at this point)
        const originalThresholds = param.thresholds;
        
        // Process all breakpoint thresholds (keep them as-is, just normalize)
        for (let i = 0; i < originalThresholds.length; i++) {
            const threshold = originalThresholds[i];
            
            // Handle breakpoint format (conditionType: 'breakpoint')
            if (threshold.conditionType === 'breakpoint' && threshold.conditionMax !== undefined) {
                // Already in breakpoint format - ensure conditionMax is properly set
                threshold.conditionMax = String(threshold.conditionMax); // Ensure it's a string
                // Reconstruct min from previous threshold or minimumLimit
                let minValue = '';
                if (i === 0) {
                    // First breakpoint: use minimumLimit
                    minValue = minimumLimit !== null && minimumLimit !== undefined ? String(minimumLimit) : '';
                } else {
                    // Use previous breakpoint's max
                    const prevThreshold = originalThresholds[i - 1];
                    if (prevThreshold && prevThreshold.conditionType === 'breakpoint' && prevThreshold.conditionMax) {
                        minValue = prevThreshold.conditionMax;
                    }
                }
                threshold.conditionMin = minValue; // For display/calculation
                threshold.conditionValue = threshold.conditionMax;
                threshold.condition = minValue ? `between ${minValue} and ${threshold.conditionMax}` : `breakpoint ${threshold.conditionMax}`;
            }
            // Handle legacy format (condition string) - convert to breakpoint
            else if (threshold.condition) {
                const parsed = parseCondition(threshold.condition);
                if (parsed.type === 'breakpoint' || parsed.type === 'between') {
                    threshold.conditionType = 'breakpoint';
                    threshold.conditionMax = parsed.max || parsed.value || '';
                    let minValue = parsed.min || '';
                    if (!minValue) {
                        if (i === 0) {
                            minValue = minimumLimit !== null && minimumLimit !== undefined ? String(minimumLimit) : '';
                        } else {
                            const prevThreshold = originalThresholds[i - 1];
                            if (prevThreshold && prevThreshold.conditionType === 'breakpoint' && prevThreshold.conditionMax) {
                                minValue = prevThreshold.conditionMax;
                            }
                        }
                    }
                    threshold.conditionMin = minValue;
                    threshold.conditionValue = threshold.conditionMax;
                    threshold.condition = minValue ? `between ${minValue} and ${threshold.conditionMax}` : `breakpoint ${threshold.conditionMax}`;
                }
            }
            
            // Normalize deductions
            const iolTypes = ['monofocaleStandard', 'monofocalePlus', 'edof', 'multifocal'];
            for (const iolType of iolTypes) {
                // For breakpoints, if deduction is stored as just a number (max), reconstruct min/max object
                if (threshold.conditionType === 'breakpoint' && typeof threshold[iolType] === 'number') {
                    // Get previous threshold's max deduction to use as min
                    let prevMax = null;
                    if (i > 0) {
                        const prevThreshold = originalThresholds[i - 1];
                        if (prevThreshold && isProgressiveDeduction(prevThreshold[iolType])) {
                            prevMax = prevThreshold[iolType].max !== undefined ? prevThreshold[iolType].max : prevThreshold[iolType].min;
                        } else if (prevThreshold && typeof prevThreshold[iolType] === 'number') {
                            prevMax = prevThreshold[iolType];
                        }
                    }
                    // Reconstruct progressive deduction object: min from previous, max from current
                    threshold[iolType] = {
                        min: prevMax !== null ? prevMax : 0,
                        max: threshold[iolType]
                    };
                } else {
                    threshold[iolType] = normalizeDeduction(threshold[iolType]);
                    
                    // Auto-link deduction min from previous threshold
                    if (i > 0 && threshold.conditionType === 'breakpoint' && isProgressiveDeduction(threshold[iolType])) {
                        const prevThreshold = originalThresholds[i - 1];
                        let prevMax = null;
                        
                        if (prevThreshold && isProgressiveDeduction(prevThreshold[iolType])) {
                            prevMax = prevThreshold[iolType].max !== undefined ? prevThreshold[iolType].max : prevThreshold[iolType].min;
                        } else if (prevThreshold && typeof prevThreshold[iolType] === 'number') {
                            prevMax = prevThreshold[iolType];
                        }
                        
                        if (prevMax !== null) {
                            threshold[iolType].min = prevMax;
                        }
                    }
                }
            }
        }
        
        // Replace thresholds array with processed breakpoints
        param.thresholds = originalThresholds;
        
        // Now add synthetic first and last thresholds for display
        // Insert synthetic "less than" threshold at the beginning
        const syntheticFirst = {
            conditionType: 'less than',
            conditionValue: minimumLimit !== null && minimumLimit !== undefined ? String(minimumLimit) : '0',
            conditionMin: '',
            conditionMax: '',
            condition: `less than ${minimumLimit !== null && minimumLimit !== undefined ? minimumLimit : '0'}`,
            monofocaleStandard: 0,
            monofocalePlus: 0,
            edof: 0,
            multifocal: 0
        };
        param.thresholds.unshift(syntheticFirst);
        
        // Append synthetic "greater than" threshold at the end
        const syntheticLast = {
            conditionType: 'greater than',
            conditionValue: maximumLimit !== null && maximumLimit !== undefined ? String(maximumLimit) : '0',
            conditionMin: '',
            conditionMax: '',
            condition: `greater than ${maximumLimit !== null && maximumLimit !== undefined ? maximumLimit : '0'}`,
            monofocaleStandard: 0,
            monofocalePlus: 0,
            edof: 0,
            multifocal: 0
        };
        param.thresholds.push(syntheticLast);
    }
}

// Load configuration when modal opens
async function loadConfig() {
    loading.value = true;
    activeParam.value = null;
    
    try {
        let loadedConfig = null;
        
        // Try loading from API first (reads from actual JSON file via Electron)
        if (window.api?.iolRules?.get) {
            const result = await window.api.iolRules.get();
            if (result && result.success && result.data) {
                loadedConfig = result.data;
            }
        }
        
        // Fallback to static import if API not available (shouldn't happen normally)
        if (!loadedConfig) {
            console.warn('IOL Rules API not available, using static import');
            loadedConfig = defaultIOLRules;
        }
        
        config.value = JSON.parse(JSON.stringify(loadedConfig));
        processThresholds();
        
        // Ensure each parameter has at least first (less than) and last (greater than / maximum limit) thresholds
        for (const paramName of paramNames.value) {
            const thresholds = getParamThresholds(paramName);
            if (thresholds.length === 0) {
                // Add default first and last thresholds
                config.value.scoreDeductions[paramName].thresholds = [
                    createNewThreshold('less than'),
                    createNewThreshold('greater than')
                ];
            } else if (thresholds.length === 1) {
                // Add missing last threshold
                thresholds.push(createNewThreshold('greater than'));
            }
        }
        
        // Set first param as active
        const params = paramNames.value;
        if (params.length > 0) {
            activeParam.value = params[0];
        }
    } catch (error) {
        console.error('Error loading IOL rules:', error);
        // Use static import as last resort
        config.value = JSON.parse(JSON.stringify(defaultIOLRules));
        processThresholds();
        const params = paramNames.value;
        if (params.length > 0) {
            activeParam.value = params[0];
        }
    }
    
    loading.value = false;
}

function markDirty() {
    isDirty.value = true;
}

// Create a new empty threshold object
function createNewThreshold(type = 'between') {
    if (type === 'less than') {
        return {
            condition: 'less than 0',
            conditionType: 'less than',
            conditionValue: '0',
            conditionMin: '',
            conditionMax: '',
            monofocaleStandard: 0,
            monofocalePlus: 0,
            edof: 0,
            multifocal: 0
        };
    } else if (type === 'greater than') {
        return {
            condition: 'greater than 0',
            conditionType: 'greater than',
            conditionValue: '0',
            conditionMin: '',
            conditionMax: '',
            monofocaleStandard: 0,
            monofocalePlus: 0,
            edof: 0,
            multifocal: 0
        };
    } else {
        // Breakpoint threshold - only max value, min is auto-linked
        return {
            condition: 'breakpoint 0',
            conditionType: 'breakpoint',
            conditionValue: '0',
            conditionMin: '',
            conditionMax: '0',
            monofocaleStandard: { min: 0, max: 0 },
            monofocalePlus: { min: 0, max: 0 },
            edof: { min: 0, max: 0 },
            multifocal: { min: 0, max: 0 }
        };
    }
}

// Handle condition type change - convert deductions if needed
function onConditionTypeChange(threshold) {
    if (isRangeCondition(threshold.conditionType)) {
        // Switching to breakpoint condition - only store max value
        if (threshold.conditionValue && threshold.conditionValue.includes(' and ')) {
            const parts = threshold.conditionValue.split(' and ');
            threshold.conditionMax = parts[1] || parts[0] || '';
            threshold.conditionMin = ''; // Not stored, auto-linked
        } else {
            // Smart linking: If previous threshold is breakpoint, use its max as min (for display)
            const thresholds = getParamThresholds(activeParam.value);
            const currentIndex = thresholds.indexOf(threshold);
            if (currentIndex > 0) {
                const prevThreshold = thresholds[currentIndex - 1];
                if (isRangeCondition(prevThreshold.conditionType) && prevThreshold.conditionMax) {
                    threshold.conditionMin = prevThreshold.conditionMax; // For display only
                } else {
                    threshold.conditionMin = threshold.conditionValue || '';
                }
            } else {
                threshold.conditionMin = threshold.conditionValue || '';
            }
            threshold.conditionMax = threshold.conditionValue || '';
        }
        updateRangeCondition(threshold);
        
        // Convert discrete deductions to progressive for range conditions
        const iolTypes = ['monofocaleStandard', 'monofocalePlus', 'edof', 'multifocal'];
        for (const iolType of iolTypes) {
            if (typeof threshold[iolType] === 'number') {
                threshold[iolType] = { min: threshold[iolType], max: threshold[iolType] };
            }
        }
    } else {
        // Switching to single value condition
        if (threshold.conditionMin && threshold.conditionMax) {
            threshold.conditionValue = threshold.conditionMin;
        }
        updateConditionString(threshold);
        
        // Convert progressive deductions to discrete for non-range conditions
        const iolTypes = ['monofocaleStandard', 'monofocalePlus', 'edof', 'multifocal'];
        for (const iolType of iolTypes) {
            if (isProgressiveDeduction(threshold[iolType])) {
                threshold[iolType] = threshold[iolType].max || threshold[iolType].min || 0;
            }
        }
    }
}

// Add threshold at the end (before the last "greater than" / maximum limit threshold)
function addThreshold(paramName) {
    const thresholds = config.value?.scoreDeductions?.[paramName]?.thresholds;
    if (thresholds) {
        // Insert before the last threshold (which is always "greater than" / maximum limit)
        const insertIndex = Math.max(1, thresholds.length - 1);
        insertThreshold(paramName, insertIndex);
    }
}

// Insert threshold at specific index (always inserts a "between" threshold)
function insertThreshold(paramName, index) {
    const thresholds = config.value?.scoreDeductions?.[paramName]?.thresholds;
    if (!thresholds) return;
    
    // Can't insert before first (less than) or after last (greater than / maximum limit)
    if (index <= 0 || index >= thresholds.length) return;
    
    const newThreshold = createNewThreshold('between');
    
    // Auto-fill min from previous threshold
    const prevThreshold = thresholds[index - 1];
    if (prevThreshold) {
        if (isRangeCondition(prevThreshold.conditionType)) {
            newThreshold.conditionMin = prevThreshold.conditionMax || '';
        } else if (prevThreshold.conditionType === 'less than') {
            newThreshold.conditionMin = prevThreshold.conditionValue || '';
        }
        updateRangeCondition(newThreshold);
        
        // Auto-link deduction mins from previous threshold
        const iolTypes = ['monofocaleStandard', 'monofocalePlus', 'edof', 'multifocal'];
        for (const iolType of iolTypes) {
            if (isProgressiveDeduction(newThreshold[iolType])) {
                let prevMax = null;
                if (isProgressiveDeduction(prevThreshold[iolType])) {
                    prevMax = prevThreshold[iolType].max !== undefined ? prevThreshold[iolType].max : prevThreshold[iolType].min;
                } else if (typeof prevThreshold[iolType] === 'number') {
                    prevMax = prevThreshold[iolType];
                }
                if (prevMax !== null) {
                    newThreshold[iolType].min = prevMax;
                }
            }
        }
    }
    
    thresholds.splice(index, 0, newThreshold);
    markDirty();
}

// Delete threshold at specific index (can't delete first or last)
function deleteThreshold(paramName, index) {
    const thresholds = config.value?.scoreDeductions?.[paramName]?.thresholds;
    if (!thresholds || thresholds.length <= 2) return; // Must keep at least first and last
    if (index <= 0 || index >= thresholds.length - 1) return; // Can't delete first or last
    
    thresholds.splice(index, 1);
    markDirty();
}

function removeLastThreshold(paramName) {
    const thresholds = config.value?.scoreDeductions?.[paramName]?.thresholds;
    if (thresholds && thresholds.length > 1) {
        thresholds.pop();
        markDirty();
    }
}

async function saveChanges() {
    if (!config.value?.scoreDeductions) return false;
    
    try {
        // Clean up the config - rebuild condition strings and remove extra properties
        const cleanDeductions = {};
        for (const [paramName, param] of Object.entries(config.value.scoreDeductions)) {
            if (paramName === 'description') {
                cleanDeductions[paramName] = param;
                continue;
            }
            
            // Extract minimumLimit and maximumLimit from first/last thresholds
            // Always extract from thresholds since those are what the user edited in the modal
            const firstThreshold = param.thresholds[0];
            const lastThreshold = param.thresholds[param.thresholds.length - 1];
            
            let minimumLimit = null;
            let maximumLimit = null;
            
            // Extract minimumLimit from first threshold (always "less than" in modal)
            if (firstThreshold && firstThreshold.conditionType === 'less than' && firstThreshold.conditionValue) {
                const parsed = parseFloat(firstThreshold.conditionValue);
                if (!isNaN(parsed)) {
                    minimumLimit = parsed;
                }
            } else if (firstThreshold && firstThreshold.conditionType === 'breakpoint' && firstThreshold.conditionMax) {
                const parsed = parseFloat(firstThreshold.conditionMax);
                if (!isNaN(parsed)) {
                    minimumLimit = parsed;
                }
            }
            
            // Extract maximumLimit from last threshold (always "greater than" in modal)
            if (lastThreshold && lastThreshold.conditionType === 'greater than' && lastThreshold.conditionValue) {
                const parsed = parseFloat(lastThreshold.conditionValue);
                if (!isNaN(parsed)) {
                    maximumLimit = parsed;
                }
            } else if (lastThreshold && lastThreshold.condition) {
                const parsed = parseCondition(lastThreshold.condition);
                if (parsed.type === 'greater than' && parsed.value) {
                    const parsedValue = parseFloat(parsed.value);
                    if (!isNaN(parsedValue)) {
                        maximumLimit = parsedValue;
                    }
                }
            }
            
            // Filter out first and last thresholds (they're represented by minimumLimit/maximumLimit)
            // Only save middle breakpoints
            const middleThresholds = param.thresholds.slice(1, -1);
            
            cleanDeductions[paramName] = {
                description: param.description,
                ...(minimumLimit !== null && minimumLimit !== undefined ? { minimumLimit } : {}),
                ...(maximumLimit !== null && maximumLimit !== undefined ? { maximumLimit } : {}),
                thresholds: middleThresholds.map((t, index) => {
                    let condition;
                    if (isRangeCondition(t.conditionType)) {
                        // For breakpoints, reconstruct min from previous threshold or minimumLimit
                        let minValue = t.conditionMin;
                        if (!minValue) {
                            if (index === 0) {
                                // First breakpoint: use minimumLimit
                                minValue = minimumLimit !== null && minimumLimit !== undefined ? String(minimumLimit) : '';
                            } else {
                                // Use previous breakpoint's max
                                const prevThreshold = middleThresholds[index - 1];
                                if (prevThreshold && isRangeCondition(prevThreshold.conditionType)) {
                                    minValue = prevThreshold.conditionMax;
                                }
                            }
                        }
                        condition = buildRangeCondition(t.conditionType, minValue, t.conditionMax);
                    } else {
                        condition = buildCondition(t.conditionType, t.conditionValue);
                    }
                    
                    // For breakpoints, save only max deduction value (min is auto-linked from previous)
                    if (isRangeCondition(t.conditionType)) {
                        // Extract max deduction value from progressive deduction object
                        const getMaxDeduction = (deduction) => {
                            if (isProgressiveDeduction(deduction)) {
                                return deduction.max !== undefined ? deduction.max : deduction.min;
                            }
                            return typeof deduction === 'number' ? deduction : 0;
                        };
                        
                        return {
                            conditionType: 'breakpoint',
                            conditionMax: t.conditionMax,
                            monofocaleStandard: getMaxDeduction(t.monofocaleStandard),
                            monofocalePlus: getMaxDeduction(t.monofocalePlus),
                            edof: getMaxDeduction(t.edof),
                            multifocal: getMaxDeduction(t.multifocal)
                        };
                    }
                    
                    return {
                        condition: condition,
                        monofocaleStandard: isProgressiveDeduction(t.monofocaleStandard) ? t.monofocaleStandard : (t.monofocaleStandard || 0),
                        monofocalePlus: isProgressiveDeduction(t.monofocalePlus) ? t.monofocalePlus : (t.monofocalePlus || 0),
                        edof: isProgressiveDeduction(t.edof) ? t.edof : (t.edof || 0),
                        multifocal: isProgressiveDeduction(t.multifocal) ? t.multifocal : (t.multifocal || 0)
                    };
                })
            };
        }
        
        const result = await window.api.iolRules.updateFullConfig(cleanDeductions);
        if (result.success) {
            isDirty.value = false;
            await nextTick();
            await loadIOLRules();
            emit('saved');
            return true;
        } else {
            console.error('Error saving IOL rules:', result.error);
            return false;
        }
    } catch (error) {
        console.error('Error saving IOL rules:', error);
        return false;
    }
}

async function saveAndClose() {
    const success = await saveChanges();
    if (success) {
        emit('close');
    }
}

async function exportConfig() {
    if (!config.value?.scoreDeductions) return;
    
    // Fetch config directly from API (reads from file) to avoid UI-transformed format
    // and ensure we export canonical JSON without "less than"/"greater than" strings
    let sourceConfig = config.value;
    try {
        const result = await window.api.iolRules.get();
        if (result?.success && result?.data) {
            sourceConfig = result.data;
        }
    } catch (e) {
        console.warn('Export: using current config (API fetch failed)', e);
    }
    
    if (!sourceConfig?.scoreDeductions) return;
    
    // Build canonical export: only breakpoint format, no "less than"/"greater than" condition strings
    const cleanDeductions = {};
    for (const [paramName, param] of Object.entries(sourceConfig.scoreDeductions)) {
        if (paramName === 'description') {
            cleanDeductions[paramName] = param;
            continue;
        }
        
        const thresholds = param.thresholds || [];
        // Exclude synthetic "less than" and "greater than" - only export breakpoint format
        const breakpointThresholds = thresholds.filter(t =>
            t.conditionType === 'breakpoint' && t.conditionMax != null
        );
        
        // Extract minimumLimit/maximumLimit from param or first/last threshold
        let minimumLimit = param.minimumLimit;
        let maximumLimit = param.maximumLimit;
        if (minimumLimit === null || minimumLimit === undefined) {
            const first = thresholds[0];
            if (first?.conditionType === 'less than' && first?.conditionValue) {
                minimumLimit = parseFloat(first.conditionValue);
            } else if (first?.conditionType === 'breakpoint' && first?.conditionMax) {
                minimumLimit = parseFloat(first.conditionMax);
            }
        }
        if (maximumLimit === null || maximumLimit === undefined) {
            const last = thresholds[thresholds.length - 1];
            if (last?.conditionType === 'greater than' && last?.conditionValue) {
                maximumLimit = parseFloat(last.conditionValue);
            } else if (last?.condition) {
                const parsed = parseCondition(last.condition);
                if (parsed.type === 'greater than' && parsed.value) {
                    maximumLimit = parseFloat(parsed.value);
                }
            }
        }
        
        const getMaxDeduction = (deduction) => {
            if (isProgressiveDeduction(deduction)) {
                return deduction.max !== undefined ? deduction.max : deduction.min;
            }
            return typeof deduction === 'number' ? deduction : 0;
        };
        
        cleanDeductions[paramName] = {
            description: param.description,
            ...(minimumLimit !== null && minimumLimit !== undefined ? { minimumLimit } : {}),
            ...(maximumLimit !== null && maximumLimit !== undefined ? { maximumLimit } : {}),
            thresholds: breakpointThresholds.map(t => ({
                    conditionType: 'breakpoint',
                    conditionMax: t.conditionMax,
                    monofocaleStandard: getMaxDeduction(t.monofocaleStandard),
                    monofocalePlus: getMaxDeduction(t.monofocalePlus),
                    edof: getMaxDeduction(t.edof),
                    multifocal: getMaxDeduction(t.multifocal)
                }))
        };
    }
    
    const exportData = {
        ...sourceConfig,
        scoreDeductions: cleanDeductions
    };
    
    // Generate filename with date and time
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10); // YYYY-MM-DD
    const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, '-'); // HH-MM-SS
    const filename = `iolSuitabilityRules_${dateStr}_${timeStr}.json`;
    
    // Create download
    const jsonStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

async function resetAllToDefaults() {
    try {
        const result = await window.api.iolRules.resetToDefaults();
        if (result.success) {
            await loadConfig();
            isDirty.value = false;
            await nextTick();
            await loadIOLRules();
            emit('saved');
        }
    } catch (error) {
        console.error('Error resetting IOL rules:', error);
    }
}

async function resetParamToDefaults() {
    if (!activeParam.value) return;
    
    try {
        const result = await window.api.iolRules.resetParamToDefault(activeParam.value);
        if (result.success) {
            await loadConfig();
            isDirty.value = false;
            await nextTick();
            await loadIOLRules();
            emit('saved');
        }
    } catch (error) {
        console.error('Error resetting parameter:', error);
    }
}

// Watch for modal open
watch(() => props.show, (newVal) => {
    if (newVal) {
        loadConfig();
        isDirty.value = false;
    }
}, { immediate: true });
</script>

<style scoped>
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
}

.iol-rules-modal {
    background: white;
    border-radius: 12px;
    width: 85%;
    max-width: 900px;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
}

.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    border-bottom: 1px solid #e5e7eb;
}

.modal-header h2 {
    margin: 0;
    font-size: 18px;
    color: #1f2937;
}

.close-btn {
    background: none;
    border: none;
    cursor: pointer;
    color: #6b7280;
    padding: 4px;
    border-radius: 4px;
}

.close-btn:hover {
    background: #f3f4f6;
    color: #1f2937;
}

.modal-body {
    flex: 1;
    overflow-y: auto;
    padding: 16px 20px;
}

.loading-state {
    text-align: center;
    padding: 40px;
    color: #6b7280;
}

.no-data-state {
    text-align: center;
    padding: 40px;
    color: #dc2626;
    background: #fef2f2;
    border-radius: 8px;
}

.retry-btn {
    margin-top: 16px;
    padding: 8px 16px;
    background: #dc2626;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
}

.retry-btn:hover {
    background: #b91c1c;
}

.param-tabs {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 1px solid #e5e7eb;
}

.param-tab {
    padding: 6px 12px;
    border: 1px solid #d1d5db;
    background: white;
    border-radius: 6px;
    font-size: 12px;
    cursor: pointer;
    color: #4b5563;
    transition: all 0.15s;
}

.param-tab:hover {
    background: #f9fafb;
    border-color: #9ca3af;
}

.param-tab.active {
    background: #1a1a2e;
    border-color: #1a1a2e;
    color: white;
}

.rules-container {
    background: #f9fafb;
    border-radius: 8px;
    padding: 16px;
}

.param-description {
    font-size: 12px;
    color: #6b7280;
    margin-bottom: 12px;
    padding: 8px 12px;
    background: white;
    border-radius: 6px;
    border-left: 3px solid #3b82f6;
}

.rules-table-wrapper {
    overflow-x: auto;
}

.rules-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 12px;
}

.rules-table th {
    background: #1a1a2e;
    color: white;
    padding: 10px 8px;
    text-align: center;
    font-weight: 600;
    white-space: nowrap;
}

.rules-table th:first-child {
    text-align: left;
    border-radius: 6px 0 0 0;
}

.rules-table th:last-child {
    border-radius: 0 6px 0 0;
}

.rules-table td {
    padding: 8px;
    border-bottom: 1px solid #e5e7eb;
    background: white;
}

.condition-col {
    min-width: 300px;
}

.iol-col {
    width: 100px;
    text-align: center;
}

.action-col {
    width: 70px;
    text-align: center;
}

.action-cell {
    vertical-align: middle;
}

.row-actions {
    display: flex;
    gap: 4px;
    justify-content: center;
}

.row-action-btn {
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.15s ease;
}

.row-action-btn.insert-btn {
    background: #e0f2fe;
    color: #0284c7;
}

.row-action-btn.insert-btn:hover {
    background: #bae6fd;
}

.row-action-btn.delete-btn {
    background: #fee2e2;
    color: #dc2626;
}

.row-action-btn.delete-btn:hover:not(:disabled) {
    background: #fecaca;
}

.row-action-btn.delete-btn:disabled {
    background: #f3f4f6;
    color: #d1d5db;
    cursor: not-allowed;
}

.condition-cell {
    display: flex;
    gap: 8px;
    align-items: center;
    justify-content: center;
}

.condition-select {
    flex: 0 0 140px;
    padding: 6px 8px;
    border: 1px solid #d1d5db;
    border-radius: 4px;
    font-size: 12px;
    background: white;
}

.condition-value {
    width: 60px;
    padding: 6px 8px;
    border: 1px solid #d1d5db;
    border-radius: 4px;
    font-size: 12px;
    text-align: center;
}

.condition-value-small {
    width: 60px;
    padding: 6px 8px;
    border: 1px solid #d1d5db;
    border-radius: 4px;
    font-size: 12px;
    text-align: center;
}

.condition-separator {
    font-size: 11px;
    color: #6b7280;
    padding: 0 4px;
}

.condition-label {
    font-size: 11px;
    font-weight: 600;
    color: #4b5563;
    margin-right: 8px;
    min-width: 100px;
    display: inline-block;
}

.range-breakpoint-inputs {
    display: flex;
    align-items: center;
    gap: 4px;
}

.auto-linked-value {
    font-size: 11px;
    color: #9ca3af;
    font-style: italic;
    padding: 4px 8px;
    background: #f3f4f6;
    border-radius: 4px;
    min-width: 50px;
    text-align: center;
}

.auto-linked-deduction {
    background-color: #f3f4f6 !important;
    color: #9ca3af !important;
    cursor: not-allowed;
    opacity: 0.7;
}

.value-cell {
    text-align: center;
}


.deduction-input-group {
    display: flex;
    align-items: center;
    justify-content: center;
}

.progressive-inputs {
    display: flex;
    align-items: center;
    gap: 4px;
}

.deduction-input-small {
    width: 50px;
    padding: 4px 6px;
    border: 1px solid #d1d5db;
    border-radius: 4px;
    font-size: 11px;
    text-align: center;
}

.deduction-input-small:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}

.deduction-separator {
    font-size: 10px;
    color: #9ca3af;
    font-weight: 600;
}

.deduction-input {
    width: 60px;
    padding: 6px 8px;
    border: 1px solid #d1d5db;
    border-radius: 4px;
    font-size: 12px;
    text-align: center;
}

.deduction-input:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}

.no-deduction-note {
    font-size: 10px;
    color: #6b7280;
    font-style: italic;
    text-align: center;
    padding: 4px 8px;
    line-height: 1.4;
}

.table-actions-top {
    display: flex;
    gap: 8px;
    margin-bottom: 12px;
}

.table-actions {
    display: flex;
    gap: 8px;
    margin-top: 12px;
}

.add-row-btn,
.remove-row-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    border-radius: 6px;
    font-size: 12px;
    cursor: pointer;
    transition: all 0.15s;
}

.add-row-btn {
    background: #dbeafe;
    border: 1px solid #93c5fd;
    color: #1d4ed8;
}

.add-row-btn:hover {
    background: #bfdbfe;
}

.remove-row-btn {
    background: #fee2e2;
    border: 1px solid #fecaca;
    color: #dc2626;
}

.remove-row-btn:hover {
    background: #fecaca;
}

.modal-footer {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 16px 20px;
    border-top: 1px solid #e5e7eb;
}

.footer-spacer {
    flex: 1;
}

.reset-all-btn,
.reset-param-btn {
    padding: 8px 16px;
    border-radius: 6px;
    font-size: 13px;
    cursor: pointer;
    transition: all 0.15s;
}

.reset-all-btn {
    background: #fef3c7;
    border: 1px solid #fcd34d;
    color: #92400e;
}

.reset-all-btn:hover {
    background: #fde68a;
}

.reset-param-btn {
    background: #f3f4f6;
    border: 1px solid #d1d5db;
    color: #4b5563;
}

.reset-param-btn:hover {
    background: #e5e7eb;
}

.export-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px;
    background: #ecfdf5;
    border: 1px solid #6ee7b7;
    border-radius: 6px;
    font-size: 13px;
    color: #047857;
    cursor: pointer;
    transition: all 0.15s;
}

.export-btn:hover {
    background: #d1fae5;
}

.cancel-btn {
    padding: 8px 16px;
    background: white;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 13px;
    cursor: pointer;
    color: #4b5563;
}

.cancel-btn:hover {
    background: #f9fafb;
}

.save-btn {
    padding: 8px 20px;
    background: #1a1a2e;
    border: none;
    border-radius: 6px;
    font-size: 13px;
    cursor: pointer;
    color: white;
}

.save-btn:hover:not(:disabled) {
    background: #2d2d44;
}

.save-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.save-close-btn {
    padding: 8px 20px;
    background: #2563eb;
    border: none;
    border-radius: 6px;
    font-size: 13px;
    cursor: pointer;
    color: white;
}

.save-close-btn:hover:not(:disabled) {
    background: #1d4ed8;
}

.save-close-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}
</style>
