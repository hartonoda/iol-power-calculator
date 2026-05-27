<template>
    <Teleport to="body">
        <div v-if="show" class="modal-overlay" @click.self="$emit('close')">
            <div class="settings-modal">
                <div class="modal-header">
                    <h2>{{ t('settings.title') }}</h2>
                    <button type="button" class="close-btn" @click="$emit('close')">
                        <SvgIcon name="close" :size="20" />
                    </button>
                </div>
                
                <div class="modal-body">
                    <div v-if="loading" class="loading-state">
                        {{ t('common.loading') }}...
                    </div>
                    
                    <template v-else>
                        <!-- Fields List -->
                        <div class="fields-list" :key="configKey">
                            <!-- Ocular Parameters Section -->
                            <div v-if="config && config.eyeInfo" class="section-group">
                                <h3 class="section-title">{{ sections.find(s => s.key === 'eyeInfo')?.label }}</h3>
                                <div 
                                    v-for="(fieldConfig, fieldKey) in config.eyeInfo" 
                                    :key="`eyeInfo-${configKey}-${fieldKey}`"
                                    class="field-item"
                                >
                                    <div class="field-row">
                                        <div class="field-name-group">
                                            <span class="field-name">{{ fieldConfig.label || fieldKey }}</span>
                                            <button 
                                                class="reset-btn" 
                                                @click="resetField('eyeInfo', fieldKey)"
                                                :title="t('settings.resetToDefault')"
                                            >
                                                <SvgIcon name="arrow-left" :size="12" />
                                            </button>
                                        </div>
                                        
                                        <!-- Normal Range -->
                                        <div class="range-group green">
                                            <span class="range-label">{{ t('settings.normalRange') }}</span>
                                            <div class="range-values">
                                                <input 
                                                    type="number" 
                                                    step="any"
                                                    :value="fieldConfig.green?.min"
                                                    @input="updateGreenMin('eyeInfo', fieldKey, $event.target.value)"
                                                    @blur="updateGreenMin('eyeInfo', fieldKey, $event.target.value)"
                                                    :placeholder="t('settings.noLimit')"
                                                    class="range-input"
                                                />
                                                <span class="range-separator">—</span>
                                                <input 
                                                    type="number" 
                                                    step="any"
                                                    :value="fieldConfig.green?.max"
                                                    @input="updateGreenMax('eyeInfo', fieldKey, $event.target.value)"
                                                    @blur="updateGreenMax('eyeInfo', fieldKey, $event.target.value)"
                                                    :placeholder="t('settings.noLimit')"
                                                    class="range-input"
                                                />
                                            </div>
                                        </div>
                                        
                                        <!-- Warning Range -->
                                        <div class="range-group yellow" v-if="fieldConfig.yellow">
                                            <span class="range-label">{{ t('settings.warningRange') }}</span>
                                            <div 
                                                v-for="(yellowRange, idx) in fieldConfig.yellow" 
                                                :key="idx"
                                                class="range-values"
                                            >
                                                <input 
                                                    type="number" 
                                                    step="any"
                                                    :value="yellowRange.min"
                                                    @input="updateYellowMin('eyeInfo', fieldKey, idx, $event.target.value)"
                                                    @blur="updateYellowMin('eyeInfo', fieldKey, idx, $event.target.value)"
                                                    class="range-input"
                                                />
                                                <span class="range-separator">—</span>
                                                <input 
                                                    type="number" 
                                                    step="any"
                                                    :value="yellowRange.max"
                                                    @input="updateYellowMax('eyeInfo', fieldKey, idx, $event.target.value)"
                                                    @blur="updateYellowMax('eyeInfo', fieldKey, idx, $event.target.value)"
                                                    class="range-input"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Biometry Section -->
                            <div v-if="config && config.machine" class="section-group">
                                <h3 class="section-title">{{ sections.find(s => s.key === 'machine')?.label }}</h3>
                                <div 
                                    v-for="(fieldConfig, fieldKey) in config.machine" 
                                    :key="`machine-${configKey}-${fieldKey}`"
                                    class="field-item"
                                >
                                    <div class="field-row">
                                        <div class="field-name-group">
                                            <span class="field-name">{{ fieldConfig.label || fieldKey }}</span>
                                            <button 
                                                class="reset-btn" 
                                                @click="resetField('machine', fieldKey)"
                                                :title="t('settings.resetToDefault')"
                                            >
                                                <SvgIcon name="arrow-left" :size="12" />
                                            </button>
                                        </div>
                                        
                                        <!-- Normal Range -->
                                        <div class="range-group green">
                                            <span class="range-label">{{ t('settings.normalRange') }}</span>
                                            <div class="range-values">
                                                <input 
                                                    type="number" 
                                                    step="any"
                                                    :value="fieldConfig.green?.min"
                                                    @input="updateGreenMin('machine', fieldKey, $event.target.value)"
                                                    @blur="updateGreenMin('machine', fieldKey, $event.target.value)"
                                                    :placeholder="t('settings.noLimit')"
                                                    class="range-input"
                                                />
                                                <span class="range-separator">—</span>
                                                <input 
                                                    type="number" 
                                                    step="any"
                                                    :value="fieldConfig.green?.max"
                                                    @input="updateGreenMax('machine', fieldKey, $event.target.value)"
                                                    @blur="updateGreenMax('machine', fieldKey, $event.target.value)"
                                                    :placeholder="t('settings.noLimit')"
                                                    class="range-input"
                                                />
                                            </div>
                                        </div>
                                        
                                        <!-- Warning Range -->
                                        <div class="range-group yellow" v-if="fieldConfig.yellow">
                                            <span class="range-label">{{ t('settings.warningRange') }}</span>
                                            <div 
                                                v-for="(yellowRange, idx) in fieldConfig.yellow" 
                                                :key="idx"
                                                class="range-values"
                                            >
                                                <input 
                                                    type="number" 
                                                    step="any"
                                                    :value="yellowRange.min"
                                                    @input="updateYellowMin('machine', fieldKey, idx, $event.target.value)"
                                                    @blur="updateYellowMin('machine', fieldKey, idx, $event.target.value)"
                                                    class="range-input"
                                                />
                                                <span class="range-separator">—</span>
                                                <input 
                                                    type="number" 
                                                    step="any"
                                                    :value="yellowRange.max"
                                                    @input="updateYellowMax('machine', fieldKey, idx, $event.target.value)"
                                                    @blur="updateYellowMax('machine', fieldKey, idx, $event.target.value)"
                                                    class="range-input"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </template>
                </div>
                
                <div class="modal-footer">
                    <div class="footer-left">
                        <button class="btn-reset-all" @click="resetAllToDefaults">
                            {{ t('settings.resetAll') }}
                        </button>
                    </div>
                    <div class="footer-actions">
                        <button 
                            class="btn-export" 
                            @click="exportConfig" 
                            :disabled="!config || loading"
                        >
                            {{ t('actions.exportJson') }}
                        </button>
                        <button class="btn-cancel" @click="$emit('close')">
                            {{ t('common.cancel') }}
                        </button>
                        <button class="btn-save" @click="saveChanges" :disabled="saving">
                            {{ saving ? t('common.loading') : t('common.save') }}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </Teleport>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue';
import SvgIcon from '@/components/atoms/SvgIcon.vue';
import { useI18n } from '@/composables/useI18n';
import { useFieldRules } from '@/composables/useFieldRules';

const { t } = useI18n();
const { loadFieldRules } = useFieldRules();

const props = defineProps({
    show: { type: Boolean, default: false }
});

const emit = defineEmits(['close', 'saved']);

const loading = ref(true);
const saving = ref(false);
const config = ref(null);
const configKey = ref(0); // Force re-render when config changes

const sections = [
    { key: 'eyeInfo', label: 'Ocular Parameters' },
    { key: 'machine', label: 'Biometry' }
];

// Load config when modal opens
watch(() => props.show, async (newVal) => {
    if (newVal) {
        await loadConfig();
    }
});

async function loadConfig(showLoading = true) {
    if (showLoading) {
        loading.value = true;
    }
    try {
        const result = await window.api.config.get();
        if (result.success) {
            config.value = JSON.parse(JSON.stringify(result.data)); // Deep clone
            configKey.value++; // Force re-render
        }
    } catch (error) {
        console.error('Error loading config:', error);
    } finally {
        loading.value = false;
    }
}

function updateGreenMin(section, field, value) {
    if (!config.value || !config.value[section] || !config.value[section][field]) {
        console.warn(`Cannot update ${section}.${field}: field not found`);
        return;
    }
    
    if (!config.value[section][field].green) {
        config.value[section][field].green = {};
    }
    
    const trimmedValue = String(value || '').trim();
    if (trimmedValue === '' || trimmedValue === null || trimmedValue === undefined) {
        // Remove the property if empty
        if (config.value[section][field].green.min !== undefined) {
            delete config.value[section][field].green.min;
        }
    } else {
        const numValue = parseFloat(trimmedValue);
        if (!isNaN(numValue)) {
            config.value[section][field].green.min = numValue;
        }
    }
}

function updateGreenMax(section, field, value) {
    if (!config.value || !config.value[section] || !config.value[section][field]) {
        console.warn(`Cannot update ${section}.${field}: field not found`);
        return;
    }
    
    if (!config.value[section][field].green) {
        config.value[section][field].green = {};
    }
    
    const trimmedValue = String(value || '').trim();
    if (trimmedValue === '' || trimmedValue === null || trimmedValue === undefined) {
        // Remove the property if empty
        if (config.value[section][field].green.max !== undefined) {
            delete config.value[section][field].green.max;
        }
    } else {
        const numValue = parseFloat(trimmedValue);
        if (!isNaN(numValue)) {
            config.value[section][field].green.max = numValue;
        }
    }
}

function updateYellowMin(section, field, idx, value) {
    if (!config.value || !config.value[section] || !config.value[section][field]) {
        return;
    }
    
    if (!config.value[section][field].yellow || !Array.isArray(config.value[section][field].yellow)) {
        return;
    }
    
    if (idx >= 0 && idx < config.value[section][field].yellow.length) {
        const numValue = parseFloat(value);
        if (!isNaN(numValue)) {
            config.value[section][field].yellow[idx].min = numValue;
        }
    }
}

function updateYellowMax(section, field, idx, value) {
    if (!config.value || !config.value[section] || !config.value[section][field]) {
        return;
    }
    
    if (!config.value[section][field].yellow || !Array.isArray(config.value[section][field].yellow)) {
        return;
    }
    
    if (idx >= 0 && idx < config.value[section][field].yellow.length) {
        const numValue = parseFloat(value);
        if (!isNaN(numValue)) {
            config.value[section][field].yellow[idx].max = numValue;
        }
    }
}

async function resetField(section, field) {
    try {
        const result = await window.api.config.resetFieldToDefault(section, field);
        if (result.success) {
            await loadConfig(false); // Don't show loading during reset
            // Wait for Vue to update, then reload field rules
            await nextTick();
            await loadFieldRules();
        }
    } catch (error) {
        console.error('Error resetting field:', error);
    }
}

async function resetAllToDefaults() {
    // Note: Removed native confirm() as it causes focus issues in Electron
    try {
        const result = await window.api.config.resetToDefaults();
        if (result.success) {
            await loadConfig(false); // Don't show loading during reset
            await nextTick();
            await loadFieldRules();
        }
    } catch (error) {
        console.error('Error resetting config:', error);
    }
}

function exportConfig() {
    if (!config.value) return;
    
    const exportData = JSON.stringify(config.value, null, 2);
    const filename = `ocular-parameters-${new Date().toISOString().split('T')[0]}.json`;
    const blob = new Blob([exportData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
}

async function saveChanges() {
    saving.value = true;
    try {
        // Save each field's range
        // Deep clone to convert reactive proxies to plain objects for IPC
        const plainConfig = JSON.parse(JSON.stringify(config.value));
        
        for (const section of Object.keys(plainConfig)) {
            for (const field of Object.keys(plainConfig[section])) {
                const fieldConfig = plainConfig[section][field];
                await window.api.config.updateFieldRange(
                    section, 
                    field, 
                    fieldConfig.green || null, 
                    fieldConfig.yellow || null
                );
            }
        }
        // Wait for Vue to update, then reload field rules
        await nextTick();
        await loadFieldRules();
        emit('saved');
        emit('close');
    } catch (error) {
        console.error('Error saving config:', error);
    } finally {
        saving.value = false;
    }
}
</script>

<style scoped>
.modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    backdrop-filter: blur(2px);
}

.settings-modal {
    background: white;
    border-radius: 12px;
    width: 100%;
    max-width: 1000px;
    max-height: 85vh;
    display: flex;
    flex-direction: column;
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.2);
    animation: modalIn 0.2s ease-out;
}

@keyframes modalIn {
    from {
        opacity: 0;
        transform: scale(0.95) translateY(-10px);
    }
    to {
        opacity: 1;
        transform: scale(1) translateY(0);
    }
}

.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 24px;
    border-bottom: 1px solid #e5e7eb;
    flex-shrink: 0;
}

.modal-header h2 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: #1f2937;
}

.close-btn {
    background: none;
    border: none;
    cursor: pointer;
    color: #9ca3af;
    padding: 4px;
    border-radius: 6px;
    transition: color 0.2s, background 0.2s;
}

.close-btn:hover {
    color: #374151;
    background: #f3f4f6;
}

.modal-body {
    flex: 1;
    overflow-y: auto;
    padding: 0;
}

.loading-state {
    padding: 40px;
    text-align: center;
    color: #6b7280;
}

.fields-list {
    padding: 20px 24px;
}

.section-group {
    margin-bottom: 32px;
}

.section-group:last-child {
    margin-bottom: 0;
}

.section-title {
    font-size: 16px;
    font-weight: 600;
    color: #1f2937;
    margin: 0 0 16px 0;
    padding-bottom: 8px;
    border-bottom: 2px solid #e5e7eb;
}

.field-item {
    padding: 12px 16px;
    background: #f9fafb;
    border-radius: 8px;
    margin-bottom: 8px;
}

.field-row {
    display: flex;
    align-items: center;
    gap: 16px;
}

.field-name-group {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 180px;
    flex-shrink: 0;
}

.field-name {
    font-weight: 600;
    font-size: 13px;
    color: #374151;
}

.reset-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 4px 8px;
    border: none;
    background: #e5e7eb;
    border-radius: 4px;
    color: #6b7280;
    cursor: pointer;
    font-size: 10px;
    transition: all 0.15s;
    flex-shrink: 0;
}

.reset-btn:hover {
    background: #d1d5db;
    color: #374151;
}

.range-group {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 8px 12px;
    border-radius: 6px;
    flex: 1;
}

.range-group.green {
    background: #eff6ff;
    border: 1px solid #93c5fd;
}

.range-group.yellow {
    background: #fffbeb;
    border: 1px solid #fde68a;
}

.range-label {
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    line-height: 1.2;
}

.range-group.green .range-label {
    color: #1d4ed8;
}

.range-group.yellow .range-label {
    color: #b45309;
}

.range-values {
    display: flex;
    align-items: center;
    gap: 6px;
}

.range-values + .range-values {
    margin-top: 6px;
}

.range-input {
    width: 70px;
    padding: 6px 8px;
    border: 1px solid #d1d5db;
    border-radius: 4px;
    font-size: 13px;
    text-align: center;
}

.range-input:focus {
    outline: none;
    border-color: #4361ee;
    box-shadow: 0 0 0 2px rgba(67, 97, 238, 0.1);
}

.range-separator {
    color: #9ca3af;
    font-size: 12px;
    flex-shrink: 0;
}

.modal-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 24px;
    border-top: 1px solid #e5e7eb;
    flex-shrink: 0;
}

.footer-left {
    display: flex;
    align-items: center;
}

.footer-actions {
    display: flex;
    gap: 12px;
}

.btn-reset-all {
    padding: 8px 16px;
    border: 1px solid #fca5a5;
    background: #fef2f2;
    color: #dc2626;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s;
}

.btn-reset-all:hover {
    background: #fee2e2;
}

.btn-export {
    padding: 10px 20px;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    background: white;
    border: 1px solid #10b981;
    color: #10b981;
}

.btn-export:hover:not(:disabled) {
    background: #ecfdf5;
    border-color: #059669;
    color: #059669;
}

.btn-export:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.btn-cancel,
.btn-save {
    padding: 10px 20px;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
}

.btn-cancel {
    background: white;
    border: 1px solid #d1d5db;
    color: #374151;
}

.btn-cancel:hover {
    background: #f9fafb;
}

.btn-save {
    background: #4361ee;
    border: none;
    color: white;
}

.btn-save:hover:not(:disabled) {
    background: #3a56d4;
}

.btn-save:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}
</style>
