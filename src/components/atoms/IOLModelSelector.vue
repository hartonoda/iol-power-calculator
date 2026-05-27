<template>
    <div class="iol-model-selector">
        <label class="model-label">{{ t('iol.modelBrand') }}:</label>
        <div class="model-dropdown-wrapper">
            <!-- View mode: show text -->
            <span v-if="disabled" class="model-display">
                {{ selectedModelLabel || t('iol.notSelected') }}
            </span>
            <!-- Edit mode: show select -->
            <template v-else>
                <select 
                    v-model="selectedModel" 
                    class="model-select"
                    @change="onModelChange"
                >
                    <option value="">{{ t('iol.selectModel') }}</option>
                    <option 
                        v-for="model in availableModels" 
                        :key="model.id" 
                        :value="model.name"
                    >{{ model.name }}</option>
                </select>
                <button 
                    class="manage-models-btn"
                    @click="showManageModels = true"
                    title="Manage IOL Models"
                >
                    <SvgIcon name="settings" :size="14" />
                </button>
            </template>
        </div>
        
        <!-- Manage Models Modal -->
        <Teleport to="body">
            <div v-if="showManageModels" class="modal-overlay" @click.self="showManageModels = false">
                <div class="manage-models-dialog">
                    <div class="dialog-header">
                        <h3>{{ t('iol.manageModels') }}</h3>
                        <button class="close-btn" @click="showManageModels = false">
                            <SvgIcon name="close" :size="20" />
                        </button>
                    </div>
                    <div class="dialog-body">
                        <!-- Add New Model Input -->
                        <div class="add-model-form">
                            <input 
                                type="text"
                                v-model="newModelInput"
                                :placeholder="t('iol.addNewModelPlaceholder')"
                                class="add-model-input"
                                @keyup.enter="addNewModel"
                            />
                            <button 
                                class="add-model-btn"
                                @click="addNewModel"
                                :disabled="!newModelInput.trim()"
                                title="Add model"
                            >
                                <SvgIcon name="plus" :size="18" />
                            </button>
                        </div>
                        
                        <!-- Models List -->
                        <div class="models-list">
                            <div 
                                v-for="model in availableModels" 
                                :key="model.id" 
                                class="model-item"
                            >
                                <span class="model-name">{{ model.name }}</span>
                                <button 
                                    class="delete-model-btn"
                                    @click="confirmDeleteModel(model)"
                                    title="Delete model"
                                >
                                    <SvgIcon name="trash" :size="14" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Teleport>
        
        <!-- Delete Model Confirmation -->
        <ConfirmModal
            :show="showDeleteModelConfirm"
            title="Delete IOL Model"
            :message="'Are you sure you want to delete <strong>' + (modelToDelete?.name || '') + '</strong>?'"
            warning="This will not affect existing operations that use this model."
            confirm-text="Delete"
            @confirm="deleteModel"
            @cancel="showDeleteModelConfirm = false"
        />
    </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useI18n } from '@/composables/useI18n';
import ConfirmModal from '@/components/atoms/ConfirmModal.vue';
import SvgIcon from '@/components/atoms/SvgIcon.vue';

const { t } = useI18n();

const props = defineProps({
    modelValue: { type: String, default: '' },
    disabled: { type: Boolean, default: false }
});

const emit = defineEmits(['update:modelValue']);

// IOL Model Selection
const selectedModel = ref('');
const newModelInput = ref('');
const availableModels = ref([]);
const showManageModels = ref(false);
const showDeleteModelConfirm = ref(false);
const modelToDelete = ref(null);

// Load models from database
const loadModels = async () => {
    try {
        availableModels.value = await window.api.iolModel.getAll();
    } catch (err) {
        console.error('Failed to load IOL models:', err);
        availableModels.value = [];
    }
};

// Migrate localStorage models to database (one-time migration)
const migrateLocalStorageModels = async () => {
    const stored = localStorage.getItem('customIolModels');
    if (stored) {
        try {
            const localModels = JSON.parse(stored);
            if (localModels && localModels.length > 0) {
                // Extract model names and import to database
                const modelNames = localModels.map(m => m.label || m.value);
                await window.api.iolModel.importFromLocalStorage(modelNames);
                // Clear localStorage after successful migration
                localStorage.removeItem('customIolModels');
                console.log('Migrated localStorage IOL models to database');
                // Reload models
                await loadModels();
            }
        } catch (e) {
            console.error('Failed to migrate localStorage models:', e);
        }
    }
};

// Load models on mount
onMounted(async () => {
    await loadModels();
    // Try to migrate localStorage models
    await migrateLocalStorageModels();
    // Initialize selected model from prop
    if (props.modelValue) {
        selectedModel.value = props.modelValue;
    }
});

// Get selected model label for view mode
const selectedModelLabel = computed(() => {
    if (!selectedModel.value) return '';
    const model = availableModels.value.find(m => m.name === selectedModel.value);
    return model ? model.name : selectedModel.value;
});

// Handle model selection change
const onModelChange = () => {
    emit('update:modelValue', selectedModel.value);
};

// Add new model from modal
const addNewModel = async () => {
    if (newModelInput.value.trim()) {
        const modelName = newModelInput.value.trim();
        try {
            const result = await window.api.iolModel.add(modelName);
            if (!result.exists) {
                await loadModels();
            }
        } catch (err) {
            console.error('Failed to add IOL model:', err);
        }
        newModelInput.value = '';
    }
};

// Delete model
const confirmDeleteModel = (model) => {
    modelToDelete.value = model;
    showDeleteModelConfirm.value = true;
};

const deleteModel = async () => {
    if (modelToDelete.value) {
        try {
            const result = await window.api.iolModel.delete(modelToDelete.value.id);
            if (result.success) {
                await loadModels();
                // If the deleted model was selected, clear selection
                if (selectedModel.value === modelToDelete.value.name) {
                    selectedModel.value = '';
                    emit('update:modelValue', '');
                }
            } else {
                console.error('Failed to delete model:', result.error);
            }
        } catch (err) {
            console.error('Failed to delete IOL model:', err);
        }
    }
    modelToDelete.value = null;
    showDeleteModelConfirm.value = false;
};

// Watch for prop changes (when switching operations)
watch(() => props.modelValue, (newVal) => {
    if (newVal !== selectedModel.value) {
        selectedModel.value = newVal || '';
    }
});
</script>

<style scoped>
.iol-model-selector {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1;
    margin-left: 20px;
}

.model-label {
    font-size: 12px;
    font-weight: 500;
    color: #6b7280;
    white-space: nowrap;
}

.model-dropdown-wrapper {
    display: flex;
    align-items: center;
    gap: 8px;
}

.model-select {
    padding: 6px 10px;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    font-size: 13px;
    background: white;
    min-width: 200px;
    cursor: pointer;
}

.model-select:focus {
    outline: none;
    border-color: #6366f1;
}

.model-select:disabled {
    background: #f9fafb;
    cursor: not-allowed;
    -webkit-appearance: none;
    -moz-appearance: none;
    appearance: none;
    background-image: none;
}

/* View mode display for IOL model */
.model-display {
    font-size: 13px;
    color: #374151;
    font-weight: 500;
}

.model-display:empty::before {
    content: attr(data-empty);
    color: #9ca3af;
    font-style: italic;
}

/* Manage Models Button */
.manage-models-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 6px;
    border: 1px solid #e5e7eb;
    background: white;
    border-radius: 6px;
    cursor: pointer;
    color: #6b7280;
    transition: all 0.15s;
}

.manage-models-btn:hover {
    background: #f3f4f6;
    color: #374151;
    border-color: #d1d5db;
}

/* Manage Models Modal */
.modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
}

.manage-models-dialog {
    background: white;
    border-radius: 12px;
    width: 90%;
    max-width: 500px;
    max-height: 80vh;
    display: flex;
    flex-direction: column;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.manage-models-dialog .dialog-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    border-bottom: 1px solid #e5e7eb;
}

.manage-models-dialog .dialog-header h3 {
    margin: 0;
    font-size: 18px;
    color: #1a1a2e;
}

.close-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 4px;
    border: none;
    background: transparent;
    color: #6b7280;
    border-radius: 4px;
    cursor: pointer;
}

.close-btn:hover {
    background: #f3f4f6;
    color: #374151;
}

.manage-models-dialog .dialog-body {
    padding: 16px 20px;
    overflow-y: auto;
    flex: 1;
}

/* Add Model Form */
.add-model-form {
    display: flex;
    gap: 8px;
    margin-bottom: 16px;
    padding-bottom: 16px;
    border-bottom: 1px solid #e5e7eb;
}

.add-model-input {
    flex: 1;
    padding: 10px 12px;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    font-size: 14px;
    transition: border-color 0.15s;
}

.add-model-input:focus {
    outline: none;
    border-color: #6366f1;
}

.add-model-input::placeholder {
    color: #9ca3af;
}

.add-model-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 10px 14px;
    border: none;
    background: #22c55e;
    color: white;
    border-radius: 8px;
    cursor: pointer;
    transition: background 0.15s;
}

.add-model-btn:hover:not(:disabled) {
    background: #16a34a;
}

.add-model-btn:disabled {
    background: #d1d5db;
    cursor: not-allowed;
}

.models-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.model-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 12px;
    background: #f9fafb;
    border-radius: 8px;
    border: 1px solid #e5e7eb;
}

.model-name {
    flex: 1;
    font-size: 14px;
    color: #374151;
}

.delete-model-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 6px;
    border: none;
    background: transparent;
    color: #9ca3af;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.15s;
}

.delete-model-btn:hover {
    background: #fee2e2;
    color: #dc2626;
}
</style>
