<template>
    <Teleport to="body">
        <div v-if="show" class="modal-overlay" @click.self="$emit('close')">
            <div class="modal-container">
                <div class="modal-header">
                    <h2>{{ editPatient ? t('patients.editPatient') : t('patients.addNew') }}</h2>
                    <button type="button" class="close-btn" @click="$emit('close')">
                        <SvgIcon name="close" :size="20" />
                    </button>
                </div>
                
                <form @submit.prevent="handleSubmit" class="modal-body">
                    <div class="form-row">
                        <div class="form-group">
                            <label>{{ t('patients.name') }} *</label>
                            <input 
                                :value="form.name" 
                                @input="form.name = capitalizeWords($event.target.value)"
                                type="text" 
                                :placeholder="t('patients.name')"
                                required
                                autocapitalize="words"
                            />
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label>{{ t('patients.dateOfBirth') }} *</label>
                            <input 
                                v-model="form.dateOfBirth" 
                                type="date" 
                                required
                            />
                        </div>
                    </div>
                    
                    <div v-if="error" class="error-message">{{ error }}</div>
                    
                    <div class="modal-actions">
                        <button type="button" class="btn-cancel" @click="$emit('close')">{{ t('common.cancel') }}</button>
                        <button type="submit" class="btn-submit" :disabled="loading">
                            {{ loading ? (editPatient ? t('common.update') + '...' : t('patients.addNew') + '...') : (editPatient ? t('common.update') : t('patients.addNew')) }}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </Teleport>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import SvgIcon from '@/components/atoms/SvgIcon.vue';
import { useI18n } from '@/composables/useI18n';

const { t } = useI18n();

const props = defineProps({
    show: { type: Boolean, default: false },
    patient: { type: Object, default: null }
});

const emit = defineEmits(['close', 'patient-added', 'patient-updated']);

const editPatient = computed(() => props.patient != null);

const form = ref({
    name: '',
    dateOfBirth: ''
});

const loading = ref(false);
const error = ref('');

// Capitalize first letter of each word
const capitalizeWords = (str) => {
    return str.replace(/\b\w/g, char => char.toUpperCase());
};

const handleSubmit = async () => {
    loading.value = true;
    error.value = '';
    
    try {
        if (editPatient.value) {
            const result = await window.api.patient.update({
                id: props.patient.id,
                name: form.value.name,
                dateOfBirth: form.value.dateOfBirth,
                gender: props.patient.gender || '-'
            });
            
            if (result.success) {
                emit('patient-updated', { id: props.patient.id });
                emit('close');
            } else {
                error.value = result.error || 'Failed to update patient';
            }
        } else {
            const result = await window.api.patient.add({
                name: form.value.name,
                dateOfBirth: form.value.dateOfBirth,
                gender: '-'
            });
            
            if (result.success) {
                emit('patient-added', { id: result.id });
                emit('close');
            } else {
                error.value = result.error || 'Failed to add patient';
            }
        }
    } catch (err) {
        error.value = editPatient.value
            ? 'An error occurred while updating the patient'
            : 'An error occurred while adding the patient';
        console.error(err);
    } finally {
        loading.value = false;
    }
};

watch(() => props.show, (val) => {
    if (val) {
        if (props.patient) {
            form.value = {
                name: props.patient.name || '',
                dateOfBirth: props.patient.dateOfBirth || ''
            };
        } else {
            form.value = { name: '', dateOfBirth: '' };
        }
        error.value = '';
    }
});
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
    max-height: 90vh;
    overflow-y: auto;
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
    transition: color 0.2s, background 0.2s;
}

.close-btn:hover {
    color: #374151;
    background: #f3f4f6;
}

.modal-body {
    padding: 24px;
}

.form-row {
    margin-bottom: 16px;
}

.form-row.two-cols {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
}

.form-group {
    display: flex;
    flex-direction: column;
}

.form-group label {
    font-size: 12px;
    font-weight: 600;
    color: #6b7280;
    margin-bottom: 6px;
    text-transform: capitalize;
    letter-spacing: 0.03em;
}

.form-group input,
.form-group select {
    padding: 10px 12px;
    border: 2px solid #e5e7eb;
    border-radius: 6px;
    font-size: 14px;
    transition: border-color 0.2s, box-shadow 0.2s;
}

.form-group input:focus,
.form-group select:focus {
    outline: none;
    border-color: #16a34a;
    box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.1);
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
    background: #16a34a;
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




