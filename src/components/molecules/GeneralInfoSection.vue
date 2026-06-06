<template>
    <div class="section">
        <div class="section-content">
            <!-- View Mode: Simple text summary -->
            <div v-if="disabled" class="info-summary">
                <span class="info-item patient-name">{{ selectedPatient?.name || '—' }}</span>
                <span class="info-separator">•</span>
                <span class="info-item">{{ calculatedAge !== null ? `${calculatedAge} ${t('common.years')}` : '—' }}</span>
                <span class="info-separator">•</span>
                <span class="info-item">{{ form.eye || '—' }}</span>
            </div>
            
            <!-- Edit Mode: Form fields -->
            <div v-else class="form-grid">
                <PatientAutocomplete
                    v-model="form.patientId"
                    :label="t('generalInfo.patient') + ' *'"
                    :patients="patients"
                    :disabled="disabled || isExistingOperation"
                    @add-new="$emit('add-new-patient')"
                    class="patient-field-wide"
                />
                <AgeDisplay
                    :label="t('generalInfo.ageAtSurgery')"
                    :age="calculatedAge"
                    :years-label="t('common.years')"
                    :disabled="disabled"
                />
                <FormInput
                    v-model="form.eye"
                    :label="t('generalInfo.eye') + ' *'"
                    type="select"
                    :placeholder="t('generalInfo.selectEye')"
                    :options="eyeOptions"
                    :disabled="disabled || isExistingOperation"
                />
            </div>

            <!-- Notes Row: 2 columns -->
            <div class="notes-row">
                <!-- Systemic Notes -->
                <div class="note-section">
                    <label class="note-label">{{ t('notes.systemic') }}</label>
                    
                    <!-- View Mode: Show text summary -->
                    <div v-if="disabled" class="note-summary">
                        <p v-if="systemicNoteSummary" class="summary-text">{{ systemicNoteSummary }}</p>
                        <p v-else class="summary-empty">{{ t('notes.noSystemic') }}</p>
                    </div>
                    
                    <!-- Edit Mode: Show checkboxes -->
                    <template v-else>
                        <div class="checkbox-grid">
                            <template v-for="option in systemicConditions" :key="option.value">
                                <!-- Allergy with input field -->
                                <div v-if="option.hasInput" class="checkbox-with-input" :class="{ 'has-input-active': selectedSystemicConditions.includes(option.value) }">
                                    <label 
                                        class="checkbox-item"
                                        :class="{ 'checked': selectedSystemicConditions.includes(option.value) }"
                                    >
                                        <input 
                                            type="checkbox" 
                                            :value="option.value"
                                            v-model="selectedSystemicConditions"
                                            :disabled="disabled || selectedSystemicConditions.includes('nessuna')"
                                            @change="onSystemicChange(option.value)"
                                        />
                                        <span>{{ getOptionLabel(option) }}</span>
                                    </label>
                                    <input 
                                        v-if="selectedSystemicConditions.includes(option.value)"
                                        type="text"
                                        class="allergy-input"
                                        v-model="allergySpecification"
                                        :placeholder="t('common.specify')"
                                        :disabled="disabled"
                                    />
                                </div>
                                <!-- Regular checkbox -->
                                <label 
                                    v-else
                                    class="checkbox-item"
                                    :class="{ 'is-nessuna': option.value === 'nessuna', 'checked': selectedSystemicConditions.includes(option.value) }"
                                >
                                    <input 
                                        type="checkbox" 
                                        :value="option.value"
                                        v-model="selectedSystemicConditions"
                                        :disabled="disabled || (option.value !== 'nessuna' && selectedSystemicConditions.includes('nessuna'))"
                                        @change="onSystemicChange(option.value)"
                                    />
                                    <span>{{ getOptionLabel(option) }}</span>
                                </label>
                            </template>
                        </div>
                        <textarea 
                            v-model="systemicAdditionalNotes"
                            :placeholder="t('notes.additionalSystemic')"
                            :disabled="disabled"
                            class="additional-notes"
                        ></textarea>
                    </template>
                </div>

                <!-- Ocular Notes -->
                <div class="note-section">
                    <label class="note-label">{{ t('notes.ocular') }}</label>
                    
                    <!-- View Mode: Show text summary -->
                    <div v-if="disabled" class="note-summary">
                        <p v-if="ocularNoteSummary" class="summary-text">{{ ocularNoteSummary }}</p>
                        <p v-else class="summary-empty">{{ t('notes.noOcular') }}</p>
                    </div>
                    
                    <!-- Edit Mode: Show checkboxes -->
                    <template v-else>
                        <!-- Previous Ocular Operation -->
                        <div class="prev-operation-section">
                            <label class="sub-label">{{ t('notes.previousOperations') }}</label>
                            <div class="checkbox-grid small">
                                <template v-for="option in previousEyeOperations" :key="option.value">
                                    <!-- Other surgery with input field -->
                                    <div v-if="option.hasInput" class="checkbox-with-input" :class="{ 'has-input-active': selectedPrevOperations.includes(option.value) }">
                                        <label 
                                            class="checkbox-item"
                                            :class="{ 'checked': selectedPrevOperations.includes(option.value) }"
                                        >
                                            <input 
                                                type="checkbox" 
                                                :value="option.value"
                                                v-model="selectedPrevOperations"
                                                :disabled="disabled"
                                            />
                                            <span>{{ getOptionLabel(option) }}</span>
                                        </label>
                                        <input 
                                            v-if="selectedPrevOperations.includes(option.value)"
                                            v-model="otherSurgerySpecification"
                                            type="text"
                                            class="inline-input"
                                            :placeholder="t('common.specify')"
                                            :disabled="disabled"
                                        />
                                    </div>
                                    <!-- Regular checkbox -->
                                    <label 
                                        v-else
                                        class="checkbox-item"
                                        :class="{ checked: selectedPrevOperations.includes(option.value) }"
                                    >
                                        <input 
                                            type="checkbox" 
                                            :value="option.value"
                                            v-model="selectedPrevOperations"
                                            :disabled="disabled"
                                        />
                                        <span>{{ getOptionLabel(option) }}</span>
                                    </label>
                                </template>
                            </div>
                        </div>

                        <!-- Ocular Conditions with Severity -->
                        <div class="eye-conditions-section">
                            <div class="sub-label-row">
                                <label class="sub-label">{{ t('notes.ocularConditions') }}</label>
                                <div class="severity-legend-inline">
                                    <span class="legend-lieve"><strong>+</strong> = {{ t('severity.mild') }}</span>
                                    <span class="legend-moderato"><strong>++</strong> = {{ t('severity.moderate') }}</span>
                                    <span class="legend-severa"><strong>+++</strong> = {{ t('severity.severe') }}</span>
                                </div>
                            </div>
                            <div class="conditions-grid-4col">
                                <div 
                                    v-for="option in eyeConditions" 
                                    :key="option.value" 
                                    class="condition-card"
                                    :class="{ active: eyeConditionSeverity[option.value] }"
                                >
                                    <label class="condition-checkbox">
                                        <input 
                                            type="checkbox" 
                                            :checked="!!eyeConditionSeverity[option.value]"
                                            :disabled="disabled"
                                            @change="toggleEyeCondition(option.value)"
                                        />
                                        <span>{{ getOptionLabel(option) }}</span>
                                    </label>
                                    <div v-if="eyeConditionSeverity[option.value] && !option.noSeverity" class="severity-selector">
                                        <button 
                                            type="button"
                                            class="severity-btn lieve"
                                            :class="{ selected: eyeConditionSeverity[option.value] === 'lieve' }"
                                            :disabled="disabled"
                                            @click="setSeverity(option.value, 'lieve')"
                                        >+</button>
                                        <button 
                                            type="button"
                                            class="severity-btn moderato"
                                            :class="{ selected: eyeConditionSeverity[option.value] === 'moderato' }"
                                            :disabled="disabled"
                                            @click="setSeverity(option.value, 'moderato')"
                                        >++</button>
                                        <button 
                                            type="button"
                                            class="severity-btn grave"
                                            :class="{ selected: eyeConditionSeverity[option.value] === 'grave' }"
                                            :disabled="disabled"
                                            @click="setSeverity(option.value, 'grave')"
                                        >+++</button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <textarea 
                            v-model="eyeAdditionalNotes"
                            :placeholder="t('notes.additionalOcular')"
                            :disabled="disabled"
                            class="additional-notes"
                        ></textarea>
                    </template>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import FormInput from '@/components/atoms/FormInput.vue';
import PatientAutocomplete from '@/components/atoms/PatientAutocomplete.vue';
import AgeDisplay from '@/components/atoms/AgeDisplay.vue';
import noteOptions from '@/config/noteOptions.json';
import { locales } from '@/locales';
import { useI18n } from '@/composables/useI18n';

const { t } = useI18n();

const props = defineProps({
    form: { type: Object, required: true },
    patients: { type: Array, default: () => [] },
    disabled: { type: Boolean, default: false },
    isExistingOperation: { type: Boolean, default: false }
});

defineEmits(['add-new-patient']);

const expanded = ref(true);

const eyeOptions = [
    { value: 'OD', label: 'OD (Right)' },
    { value: 'OS', label: 'OS (Left)' },
    { value: 'OU', label: 'OU (Both)' }
];

// Note options from config
const systemicConditions = noteOptions.systemicConditions;
const previousEyeOperations = noteOptions.previousEyeOperations;
const eyeConditions = noteOptions.eyeConditions;

const getNestedValue = (obj, path) => path.split('.').reduce((acc, part) => acc?.[part], obj);
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const getOptionLabel = (option) => {
    if (!option?.labelKey) return option?.value || '';
    const translated = t(option.labelKey);
    return translated === option.labelKey ? option.value : translated;
};

const getOptionLabelsForParsing = (option) => {
    if (!option?.labelKey) return [];
    const labels = new Set();
    Object.values(locales).forEach((localeData) => {
        const value = getNestedValue(localeData, option.labelKey);
        if (typeof value === 'string' && value.trim()) {
            labels.add(value.trim());
        }
    });
    return [...labels];
};

// Reactive state for checkboxes and additional notes
const selectedSystemicConditions = ref([]);
const systemicAdditionalNotes = ref('');
const allergySpecification = ref(''); // For specifying allergy type
const selectedPrevOperations = ref([]);
const otherSurgerySpecification = ref(''); // For specifying other surgery type
// Eye conditions with severity: { condition_value: 'lieve' | 'moderato' | 'grave' }
const eyeConditionSeverity = ref({});
const eyeAdditionalNotes = ref('');

// Severity labels for display
const severityLabels = {
    lieve: 'lieve',
    moderato: 'moderato',
    grave: 'grave'
};

// Toggle eye condition on/off
const toggleEyeCondition = (conditionValue) => {
    if (eyeConditionSeverity.value[conditionValue]) {
        // Remove the condition
        const newObj = { ...eyeConditionSeverity.value };
        delete newObj[conditionValue];
        eyeConditionSeverity.value = newObj;
    } else {
        // Add with default severity 'lieve'
        eyeConditionSeverity.value = { ...eyeConditionSeverity.value, [conditionValue]: 'lieve' };
    }
};

// Set severity level for a condition
const setSeverity = (conditionValue, severity) => {
    eyeConditionSeverity.value = { ...eyeConditionSeverity.value, [conditionValue]: severity };
};

// Helper to parse stored note value
const parseNoteValue = (value, conditionsList) => {
    if (!value) return { selected: [], additional: '' };
    
    const parts = value.split(' | Notes: ');
    const additionalNotes = parts.length > 1 ? parts[1] : '';
    const conditionsPart = parts[0];
    
    const selected = [];
    conditionsList.forEach(condition => {
        const labels = getOptionLabelsForParsing(condition);
        if (labels.some(label => conditionsPart.includes(label))) {
            selected.push(condition.value);
        }
    });
    
    if (selected.length === 0 && conditionsPart && !parts[1]) {
        return { selected: [], additional: conditionsPart };
    }
    
    return { selected, additional: additionalNotes };
};

// Helper to build note value from selections
const buildNoteValue = (selectedValues, conditionsList, additionalNotes, allergySpec = '') => {
    const labels = selectedValues
        .map(v => {
            const condition = conditionsList.find(c => c.value === v);
            if (!condition) return null;
            // Add allergy specification if present
            if (condition.hasInput && allergySpec.trim()) {
                return `${getOptionLabel(condition)}: ${allergySpec.trim()}`;
            }
            return getOptionLabel(condition);
        })
        .filter(Boolean);
    
    let result = labels.join('; ');
    if (additionalNotes.trim()) {
        result = result ? `${result} | Notes: ${additionalNotes.trim()}` : additionalNotes.trim();
    }
    return result;
};

// Handle "Nessuna" checkbox logic
const onSystemicChange = (value) => {
    if (value === 'nessuna' && selectedSystemicConditions.value.includes('nessuna')) {
        selectedSystemicConditions.value = ['nessuna'];
    } else if (value !== 'nessuna' && selectedSystemicConditions.value.includes(value)) {
        const idx = selectedSystemicConditions.value.indexOf('nessuna');
        if (idx > -1) {
            selectedSystemicConditions.value.splice(idx, 1);
        }
    }
};

// Flag to prevent infinite loop between watchers when parsing notes
let isParsingNotes = false;

// Watch and update form values (only when user is editing, not when parsing)
watch([selectedSystemicConditions, systemicAdditionalNotes, allergySpecification], () => {
    if (isParsingNotes) return;
    props.form.noteSistemic = buildNoteValue(
        selectedSystemicConditions.value, 
        systemicConditions, 
        systemicAdditionalNotes.value,
        allergySpecification.value
    );
}, { deep: true });

watch([selectedPrevOperations, eyeConditionSeverity, eyeAdditionalNotes, otherSurgerySpecification], () => {
    if (isParsingNotes) return;
    const prevOpsLabels = selectedPrevOperations.value
        .map(v => {
            const op = previousEyeOperations.find(c => c.value === v);
            if (!op) return null;
            // Add specification for "other" surgery
            if (op.hasInput && otherSurgerySpecification.value.trim()) {
                return `${getOptionLabel(op)}: ${otherSurgerySpecification.value.trim()}`;
            }
            return getOptionLabel(op);
        })
        .filter(Boolean);
    
    // Build eye conditions with severity (or without for noSeverity items)
    const eyeCondLabels = Object.entries(eyeConditionSeverity.value)
        .map(([condValue, severity]) => {
            const cond = eyeConditions.find(c => c.value === condValue);
            if (cond) {
                // Don't add severity for conditions with noSeverity flag
                if (cond.noSeverity) {
                    return getOptionLabel(cond);
                }
                // Convert severity to translated label
                const severityLabel = severity === 'lieve' ? t('severity.mild') : 
                                     severity === 'moderato' ? t('severity.moderate') : 
                                     t('severity.severe');
                return `${getOptionLabel(cond)} (${severityLabel})`;
            }
            return null;
        })
        .filter(Boolean);
    
    let result = '';
    if (prevOpsLabels.length > 0) {
        result = 'Prev Op: ' + prevOpsLabels.join(', ');
    }
    if (eyeCondLabels.length > 0) {
        result = result ? `${result}; ${eyeCondLabels.join('; ')}` : eyeCondLabels.join('; ');
    }
    if (eyeAdditionalNotes.value.trim()) {
        result = result ? `${result} | Notes: ${eyeAdditionalNotes.value.trim()}` : eyeAdditionalNotes.value.trim();
    }
    props.form.noteEye = result;
}, { deep: true });

// Function to parse systemic notes from form value
const parseSystemicNotes = () => {
    if (props.form.noteSistemic) {
        const parsed = parseNoteValue(props.form.noteSistemic, systemicConditions);
        selectedSystemicConditions.value = parsed.selected;
        systemicAdditionalNotes.value = parsed.additional;
        
        // Parse allergy specification if present
        const allergyOption = systemicConditions.find(c => c.hasInput);
        const allergyLabels = allergyOption ? getOptionLabelsForParsing(allergyOption) : [];
        allergySpecification.value = '';
        for (const label of allergyLabels) {
            const match = props.form.noteSistemic.match(new RegExp(`${escapeRegex(label)}:\\s*([^;|]+)`, 'i'));
            if (match) {
                allergySpecification.value = match[1].trim();
                break;
            }
        }
    } else {
        selectedSystemicConditions.value = [];
        systemicAdditionalNotes.value = '';
        allergySpecification.value = '';
    }
};

// Function to parse ocular notes from form value
const parseOcularNotes = () => {
    if (props.form.noteEye) {
        const value = props.form.noteEye;
        const parts = value.split(' | Notes: ');
        const additionalNotes = parts.length > 1 ? parts[1] : '';
        const mainPart = parts[0];
        
        const prevOps = [];
        let otherSurgerySpec = '';
        previousEyeOperations.forEach(op => {
            if (op.hasInput) {
                // Check for "Other: specification" pattern
                const labels = getOptionLabelsForParsing(op);
                let matched = false;
                for (const label of labels) {
                    const specPattern = new RegExp(`${escapeRegex(label)}:\\s*([^,;]+)`, 'i');
                    const specMatch = mainPart.match(specPattern);
                    if (specMatch) {
                        prevOps.push(op.value);
                        otherSurgerySpec = specMatch[1].trim();
                        matched = true;
                        break;
                    }
                    if (mainPart.includes(label)) {
                        prevOps.push(op.value);
                        matched = true;
                        break;
                    }
                }
                if (!matched && labels.length === 0) {
                    return;
                }
            } else {
                const labels = getOptionLabelsForParsing(op);
                if (labels.some(label => mainPart.includes(label))) {
                    prevOps.push(op.value);
                }
            }
        });
        selectedPrevOperations.value = prevOps;
        otherSurgerySpecification.value = otherSurgerySpec;
        
        // Parse eye conditions with severity
        const eyeCondSeverity = {};
        eyeConditions.forEach(cond => {
            // Look for pattern: "Condition label (severity)" - support both Italian and English
            const mildLabel = escapeRegex(t('severity.mild'));
            const moderateLabel = escapeRegex(t('severity.moderate'));
            const severeLabel = escapeRegex(t('severity.severe'));
            const labels = getOptionLabelsForParsing(cond);
            let matched = false;
            for (const label of labels) {
                const severityPattern = new RegExp(`${escapeRegex(label)}\\s*\\((lieve|moderato|grave|${mildLabel}|${moderateLabel}|${severeLabel})\\)`, 'i');
                const match = mainPart.match(severityPattern);
                if (match) {
                    const severityValue = match[1].toLowerCase();
                    if (severityValue === t('severity.mild').toLowerCase()) {
                        eyeCondSeverity[cond.value] = 'lieve';
                    } else if (severityValue === t('severity.moderate').toLowerCase()) {
                        eyeCondSeverity[cond.value] = 'moderato';
                    } else if (severityValue === t('severity.severe').toLowerCase()) {
                        eyeCondSeverity[cond.value] = 'grave';
                    } else {
                        eyeCondSeverity[cond.value] = severityValue;
                    }
                    matched = true;
                    break;
                }
            }
            if (!matched && labels.some(label => mainPart.includes(label))) {
                eyeCondSeverity[cond.value] = 'lieve';
            }
        });
        eyeConditionSeverity.value = eyeCondSeverity;
        
        if (prevOps.length === 0 && Object.keys(eyeCondSeverity).length === 0 && !parts[1]) {
            eyeAdditionalNotes.value = mainPart;
        } else {
            eyeAdditionalNotes.value = additionalNotes;
        }
    } else {
        selectedPrevOperations.value = [];
        otherSurgerySpecification.value = '';
        eyeConditionSeverity.value = {};
        eyeAdditionalNotes.value = '';
    }
};

// Watch for form changes (when switching operations) to re-parse notes
watch(() => props.form.patientId, () => {
    // When patient/operation changes, re-parse notes from form
    isParsingNotes = true;
    parseSystemicNotes();
    parseOcularNotes();
    isParsingNotes = false;
});

// Parse existing values on mount
onMounted(() => {
    parseSystemicNotes();
    parseOcularNotes();
});

// Get selected patient
const selectedPatient = computed(() => 
    props.patients.find(p => p.id === props.form.patientId)
);

// Format date for display
const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

// Text summaries for view mode
const systemicNoteSummary = computed(() => {
    const parts = [];
    
    // Get selected conditions
    const conditionLabels = selectedSystemicConditions.value
        .filter(v => v !== 'nessuna')
        .map(v => {
            const condition = systemicConditions.find(c => c.value === v);
            if (!condition) return null;
            // Add allergy specification if present
            if (condition.hasInput && allergySpecification.value.trim()) {
                return `${getOptionLabel(condition)}: ${allergySpecification.value.trim()}`;
            }
            return getOptionLabel(condition);
        })
        .filter(Boolean);
    
    if (selectedSystemicConditions.value.includes('nessuna')) {
        parts.push('Nessuna');
    } else if (conditionLabels.length > 0) {
        parts.push(conditionLabels.join(', '));
    }
    
    if (systemicAdditionalNotes.value.trim()) {
        parts.push(systemicAdditionalNotes.value.trim());
    }
    
    return parts.join(' — ');
});

const ocularNoteSummary = computed(() => {
    const parts = [];
    
    // Previous operations
    const prevOpsLabels = selectedPrevOperations.value
        .map(v => {
            const op = previousEyeOperations.find(c => c.value === v);
            if (!op) return null;
            // Add specification for "other" surgery
            if (op.hasInput && otherSurgerySpecification.value.trim()) {
                return `${getOptionLabel(op)}: ${otherSurgerySpecification.value.trim()}`;
            }
            return getOptionLabel(op);
        })
        .filter(Boolean);
    
    if (prevOpsLabels.length > 0) {
        parts.push('Previous: ' + prevOpsLabels.join(', '));
    }
    
    // Eye conditions with severity (or without for noSeverity items)
    const eyeCondLabels = Object.entries(eyeConditionSeverity.value)
        .map(([condValue, severity]) => {
            const cond = eyeConditions.find(c => c.value === condValue);
            if (cond) {
                // Don't show severity for conditions with noSeverity flag
                if (cond.noSeverity) {
                    return getOptionLabel(cond);
                }
                const severityDisplay = severity === 'lieve' ? '+' : severity === 'moderato' ? '++' : '+++';
                return `${getOptionLabel(cond)} (${severityDisplay})`;
            }
            return null;
        })
        .filter(Boolean);
    
    if (eyeCondLabels.length > 0) {
        parts.push(eyeCondLabels.join(', '));
    }
    
    if (eyeAdditionalNotes.value.trim()) {
        parts.push(eyeAdditionalNotes.value.trim());
    }
    
    return parts.join(' — ');
});

// Calculate age from patient DOB and operation date
const calculatedAge = computed(() => {
    if (!selectedPatient.value?.dateOfBirth || !props.form.operationDate) {
        return null;
    }
    
    const dob = new Date(selectedPatient.value.dateOfBirth);
    const opDate = new Date(props.form.operationDate);
    
    if (isNaN(dob.getTime()) || isNaN(opDate.getTime())) {
        return null;
    }
    
    let age = opDate.getFullYear() - dob.getFullYear();
    const monthDiff = opDate.getMonth() - dob.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && opDate.getDate() < dob.getDate())) {
        age--;
    }
    
    return age >= 0 ? age : null;
});

// Auto-update form.age when calculated
watch(calculatedAge, (newAge) => {
    if (newAge !== null) {
        props.form.age = newAge;
    }
}, { immediate: true });

defineExpose({ expanded });
</script>

<style scoped>
.section {
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    background: white;
    flex-shrink: 0;
}

.section-content {
    padding: 20px;
    border-top: 1px solid #e5e7eb;
}

/* View mode: Simple text summary */
.info-summary {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
    font-size: 14px;
    color: #374151;
}

.info-item {
    font-weight: 500;
}

.info-item.patient-name {
    font-weight: 600;
    color: #1f2937;
}

.info-separator {
    color: #9ca3af;
    font-size: 12px;
}

.form-grid {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 12px;
}

.form-grid :deep(.patient-field-wide) {
    grid-column: span 2;
}

.age-field {
    display: flex;
    flex-direction: column;
}

.age-field label {
    font-size: 11px;
    font-weight: 600;
    color: #6b7280;
    margin-bottom: 6px;
    text-transform: capitalize;
    letter-spacing: 0.03em;
}

.age-value {
    font-size: 14px;
    color: #1f2937;
    padding: 10px 0;
    font-weight: 500;
}

.age-hint {
    color: #9ca3af;
}

@media (max-width: 1200px) {
    .form-grid {
        grid-template-columns: repeat(4, 1fr);
    }
}

@media (max-width: 900px) {
    .form-grid {
        grid-template-columns: repeat(2, 1fr);
    }
    
    .form-grid :deep(.patient-field-wide) {
        grid-column: span 2;
    }
}

/* Notes rows - stacked vertically */
.notes-row {
    display: flex;
    flex-direction: column;
    gap: 20px;
    margin-top: 20px;
    padding-top: 16px;
    border-top: 1px solid #e5e7eb;
}

.note-section {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

/* Note summary for view mode - plain text */
.note-summary {
    padding: 4px 0;
}

.note-summary .summary-text {
    margin: 0;
    font-size: 14px;
    color: #1f2937;
    line-height: 1.6;
}

.note-summary .summary-empty {
    margin: 0;
    font-size: 13px;
    color: #9ca3af;
    font-style: italic;
}

.note-label {
    font-size: 11px;
    font-weight: 600;
    color: #374151;
    text-transform: capitalize;
    letter-spacing: 0.03em;
}

.sub-label {
    font-size: 10px;
    font-weight: 600;
    color: #6b7280;
    margin-bottom: 4px;
}

.sub-label-row .sub-label {
    margin-bottom: 0;
}

.checkbox-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
}

.checkbox-grid.small {
    margin-bottom: 8px;
}

.checkbox-item {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px 8px;
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 4px;
    font-size: 0.75rem;
    color: #4b5563;
    cursor: pointer;
    transition: all 0.15s;
    user-select: none;
}

.checkbox-item:hover {
    background: #f3f4f6;
    border-color: #d1d5db;
}

.checkbox-item.checked {
    background: #bbf7d0;
    border-color: #dc2626;
    color: #166534;
}

.checkbox-item.is-nessuna.checked {
    background: #dcfce7;
    border-color: #22c55e;
    color: #166534;
}

.checkbox-item input[type="checkbox"] {
    width: 12px;
    height: 12px;
    margin: 0;
    cursor: pointer;
    accent-color: #dc2626;
}

.checkbox-item input[type="checkbox"]:disabled {
    cursor: not-allowed;
    opacity: 0.5;
}

.checkbox-item span {
    white-space: nowrap;
}

/* Allergy checkbox with input */
.checkbox-with-input {
    display: flex;
    align-items: center;
    gap: 8px;
}

.checkbox-with-input.has-input-active {
    flex-basis: 100%;
    max-width: 350px;
}

.allergy-input {
    flex: 1;
    min-width: 100px;
    max-width: 180px;
    padding: 4px 8px;
    border: 1px solid #c7d2fe;
    border-radius: 4px;
    font-size: 11px;
    background: white;
}

.allergy-input:focus {
    outline: none;
    border-color: #16a34a;
    background: #f5f3ff;
}

.allergy-input:disabled {
    background: #f9fafb;
    cursor: not-allowed;
}

.prev-operation-section,
.eye-conditions-section {
    display: flex;
    flex-direction: column;
}

.additional-notes {
    width: 100%;
    min-height: 50px;
    padding: 8px;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    font-size: 12px;
    resize: vertical;
    font-family: inherit;
}

.additional-notes:focus {
    outline: none;
    border-color: #16a34a;
}

.additional-notes:disabled {
    background: #f9fafb;
    color: #374151;
}

/* Conditions with Severity - 4 Column Grid */
.conditions-grid-4col {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
    margin-bottom: 8px;
}

.condition-card {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 6px 8px;
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    transition: all 0.15s;
}

.condition-card.active {
    background: #fafafa;
    border-color: #9ca3af;
}

.condition-checkbox {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 0.75rem;
    color: #374151;
    cursor: pointer;
    flex: 1;
    min-width: 0;
}

.condition-checkbox input[type="checkbox"] {
    width: 13px;
    height: 13px;
    flex-shrink: 0;
    cursor: pointer;
    accent-color: #16a34a;
}

.condition-checkbox span {
    user-select: none;
    line-height: 1.2;
    overflow: hidden;
    text-overflow: ellipsis;
}

.severity-selector {
    display: flex;
    gap: 2px;
    flex-shrink: 0;
}

.severity-btn {
    width: 20px;
    height: 20px;
    border: 1px solid #d1d5db;
    border-radius: 3px;
    background: white;
    font-size: 9px;
    font-weight: 700;
    color: #6b7280;
    cursor: pointer;
    transition: all 0.15s;
}

.severity-btn:hover:not(:disabled) {
    transform: scale(1.05);
}

/* Green for Lieve */
.severity-btn.lieve {
    border-color: #86efac;
    color: #166534;
}
.severity-btn.lieve:hover:not(:disabled) {
    background: #dcfce7;
}
.severity-btn.lieve.selected {
    background: #22c55e;
    border-color: #22c55e;
    color: white;
}

/* Yellow for Moderato */
.severity-btn.moderato {
    border-color: #fde047;
    color: #854d0e;
}
.severity-btn.moderato:hover:not(:disabled) {
    background: #fef9c3;
}
.severity-btn.moderato.selected {
    background: #eab308;
    border-color: #eab308;
    color: white;
}

/* Red for Grave */
.severity-btn.grave {
    border-color: #fca5a5;
    color: #166534;
}
.severity-btn.grave:hover:not(:disabled) {
    background: #fee2e2;
}
.severity-btn.grave.selected {
    background: #ef4444;
    border-color: #ef4444;
    color: white;
}

.severity-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

/* Severity legend inline with sub-label */
.sub-label-row {
    display: flex;
    align-items: center;
    gap: 16px;
    flex-wrap: wrap;
    margin-bottom: 8px;
}

.severity-legend-inline {
    display: flex;
    gap: 12px;
    font-size: 10px;
    color: #6b7280;
}

.severity-legend-inline .legend-lieve strong {
    color: #22c55e;
}

.severity-legend-inline .legend-moderato strong {
    color: #eab308;
}

.severity-legend-inline .legend-severa strong {
    color: #ef4444;
}

@media (max-width: 900px) {
    .conditions-grid-4col {
        grid-template-columns: repeat(2, 1fr);
    }
}

/* Print styles - Compact layout */
@media print {
    .section-content {
        padding: 4px !important;
    }
    
    .info-summary {
        font-size: 9px !important;
        gap: 4px !important;
    }
    
    .info-separator {
        font-size: 8px !important;
    }
    
    .form-grid {
        display: grid !important;
        grid-template-columns: repeat(4, 1fr) !important;
        gap: 4px !important;
    }
    
    .patient-field-wide {
        grid-column: span 1 !important;
    }
    
    .notes-row {
        display: grid !important;
        grid-template-columns: 1fr 1fr !important;
        gap: 6px !important;
        margin-top: 4px !important;
    }
    
    .note-section {
        padding: 4px !important;
        background: #f9fafb !important;
        border-radius: 3px !important;
    }
    
    .note-label {
        font-size: 8px !important;
        margin-bottom: 2px !important;
    }
    
    .note-summary {
        padding: 2px 0 !important;
    }
    
    .summary-text {
        font-size: 8px !important;
        line-height: 1.3 !important;
    }
    
    .summary-empty {
        font-size: 7px !important;
    }
    
    .age-field label {
        font-size: 8px !important;
    }
    
    .age-value {
        padding: 2px 4px !important;
        font-size: 9px !important;
    }
}
</style>
