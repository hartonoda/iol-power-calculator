<template>
    <div class="section">
        <div class="section-header">
            <div class="section-title">
                <span v-if="eyeIndicator" class="eye-badge">{{ eyeIndicator }}</span>
                <span>{{ t('endothelial.title') }}</span>
            </div>
            <div class="header-actions">
                <button type="button" class="settings-btn" @click.stop="$emit('open-endothelial-settings')" :title="t('settings.title')">
                    <SvgIcon name="settings" :size="16" />
                </button>
                <span class="section-badge">{{ filledCount }}/{{ totalFields }}</span>
            </div>
        </div>
        <div class="section-content">
            <div class="param-row">
                <ParamField
                    v-model="form.cellEndotelio"
                    :label="t('ocularParams.endothelialCells')"
                    field="cellEndotelio"
                    source="machine"
                    :disabled="disabled"
                    placeholder="cells/mm²"
                    :warning="endothelialWarning"
                />
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed } from 'vue';
import ParamField from '@/components/atoms/ParamField.vue';
import SvgIcon from '@/components/atoms/SvgIcon.vue';
import { useI18n } from '@/composables/useI18n';

const { t } = useI18n();

defineEmits(['open-endothelial-settings']);

const props = defineProps({
    form: { type: Object, required: true },
    disabled: { type: Boolean, default: false },
    eyeIndicator: { type: String, default: '' }
});

// Get warning message for Endothelial cells based on value
const endothelialWarning = computed(() => {
    const value = parseFloat(props.form.cellEndotelio);
    if (isNaN(value)) return null;
    
    if (value < 1500) {
        return 'Reduced Endothelial cell density';
    } else if (value >= 1500 && value < 2000) {
        return 'Mildly reduced Endothelial cell density';
    }
    return null;
});

// Field counting
const totalFields = 1;
const filledCount = computed(() => {
    return props.form.cellEndotelio ? 1 : 0;
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
}

.param-row {
    display: grid;
    grid-template-columns: 1fr;
    gap: 12px;
}

@media (max-width: 600px) {
    .param-row {
        grid-template-columns: 1fr;
    }
}

/* Print styles */
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
    
    .param-row {
        grid-template-columns: 1fr !important;
        gap: 3px !important;
        margin-bottom: 2px !important;
    }
}
</style>
