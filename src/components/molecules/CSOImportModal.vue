<template>
    <Teleport to="body">
        <div v-if="show" class="modal-overlay" @click.self="handleCancel">
            <div class="modal-container">
                <div class="modal-header">
                    <h2>{{ t('csoImport.title') }}</h2>
                    <button type="button" class="close-btn" @click="handleCancel">
                        <SvgIcon name="close" :size="20" />
                    </button>
                </div>
                <div class="modal-body">
                    <p class="cso-message">{{ t('csoImport.message') }}</p>
                    <div v-if="preview" class="preview-box">
                        <div class="preview-row">
                            <span class="preview-label">{{ t('patients.name') }}:</span>
                            <span class="preview-value">{{ preview.patientName }}</span>
                        </div>
                        <div class="preview-row">
                            <span class="preview-label">{{ t('patients.dateOfBirth') }}:</span>
                            <span class="preview-value">{{ preview.dateOfBirth }}</span>
                        </div>
                        <div class="preview-row">
                            <span class="preview-label">{{ t('generalInfo.eye') }}:</span>
                            <span class="preview-value">{{ preview.eye }}</span>
                        </div>
                        <div class="preview-row">
                            <span class="preview-label">{{ t('generalInfo.operationDate') }}:</span>
                            <span class="preview-value">{{ preview.operationDate }}</span>
                        </div>
                    </div>
                    <div v-if="error" class="error-message">{{ error }}</div>
                    <div class="modal-actions">
                        <button type="button" class="btn-cancel" @click="handleCancel">{{ t('common.cancel') }}</button>
                        <button type="button" class="btn-submit" :disabled="loading" @click="handleConfirm">
                            {{ loading ? t('common.loading') : t('csoImport.import') }}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </Teleport>
</template>

<script setup>
import { ref, watch } from 'vue';
import SvgIcon from '@/components/atoms/SvgIcon.vue';
import { useI18n } from '@/composables/useI18n';
import { parseCsoImportJson } from '@/utils/csoImportUtils';

const { t } = useI18n();

const props = defineProps({
    show: { type: Boolean, default: false },
    jsonData: { type: Object, default: null },
    loading: { type: Boolean, default: false }
});

const emit = defineEmits(['close', 'confirm', 'cancel']);

const error = ref('');
const preview = ref(null);

watch(() => [props.show, props.jsonData], ([show, data]) => {
    if (show && data) {
        const p = parseCsoImportJson(data);
        if (p) {
            preview.value = {
                patientName: p.patient.name,
                dateOfBirth: p.patient.dateOfBirth,
                eye: p.operation.eye || 'OD',
                operationDate: p.operation.operationDate || ''
            };
        } else {
            preview.value = null;
        }
        error.value = '';
    }
});

const handleCancel = () => {
    emit('cancel');
    emit('close');
};

const handleConfirm = () => {
    emit('confirm', props.jsonData);
};
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

.modal-container {
    background: white;
    border-radius: 12px;
    width: 100%;
    max-width: 450px;
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
}

.close-btn:hover {
    color: #374151;
    background: #f3f4f6;
}

.modal-body {
    padding: 24px;
}

.cso-message {
    margin: 0 0 16px;
    font-size: 14px;
    color: #374151;
    line-height: 1.5;
}

.preview-box {
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 16px;
    margin-bottom: 16px;
}

.preview-row {
    display: flex;
    gap: 8px;
    margin-bottom: 8px;
    font-size: 14px;
}

.preview-row:last-child {
    margin-bottom: 0;
}

.preview-label {
    font-weight: 600;
    color: #6b7280;
    min-width: 120px;
}

.preview-value {
    color: #1f2937;
}

.error-message {
    background: #fef2f2;
    color: #dc2626;
    padding: 10px 12px;
    border-radius: 6px;
    font-size: 13px;
    margin-bottom: 16px;
}

.modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    padding-top: 8px;
}

.btn-cancel,
.btn-submit {
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

.btn-submit {
    background: #4361ee;
    border: none;
    color: white;
}

.btn-submit:hover:not(:disabled) {
    background: #3a56d4;
}

.btn-submit:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}
</style>
