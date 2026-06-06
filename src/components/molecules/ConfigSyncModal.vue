<template>
    <Teleport to="body">
        <div v-if="show" class="modal-overlay" @click.self="handleCancel">
            <div class="config-sync-modal">
                <div class="modal-header">
                    <h2>Configuration Synchronization</h2>
                </div>
                
                <div class="modal-body">
                    <div class="info-section">
                        <p class="info-text">
                            The factory settings for the normal ocular parameters and suitability rules differ from the settings that you have saved.
                            Please choose which configuration to use:
                        </p>
                    </div>
                    
                    <div class="config-comparison">
                        <div class="config-option" :class="{ selected: selectedOption === 'factory' }" @click="selectedOption = 'factory'">
                            <div class="option-header">
                                <input type="radio" :checked="selectedOption === 'factory'" @change="selectedOption = 'factory'" />
                                <h3>Factory Settings</h3>
                            </div>
                            <p class="option-description">
                                Use the default settings for the normal ocular parameters and suitability rules.
                                This will replace your current custom settings.
                            </p>
                        </div>
                        
                        <div class="config-option" :class="{ selected: selectedOption === 'user' }" @click="selectedOption = 'user'">
                            <div class="option-header">
                                <input type="radio" :checked="selectedOption === 'user'" @change="selectedOption = 'user'" />
                                <h3>Your Saved Settings</h3>
                            </div>
                            <p class="option-description">
                                Keep your current custom ocular parameter and suitability rule settings.
                            </p>
                        </div>
                    </div>
                    
                    <div v-if="conflicts.length > 0" class="conflicts-section">
                        <h4>Configuration Files with Differences:</h4>
                        <ul class="conflicts-list">
                            <li v-for="conflict in conflicts" :key="conflict">{{ conflict }}</li>
                        </ul>
                    </div>
                </div>
                
                <div class="modal-footer">
                    <button class="btn-confirm" @click="handleConfirm">
                        Apply Selection
                    </button>
                </div>
            </div>
        </div>
    </Teleport>
</template>

<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
    show: { type: Boolean, default: false },
    conflicts: { type: Array, default: () => [] } // Array of conflict names, e.g., ['ocularParameterRules', 'suitabilityRules']
});

const emit = defineEmits(['close', 'confirm']);

const selectedOption = ref('user'); // Default to keeping user settings

watch(() => props.show, (newVal) => {
    if (newVal) {
        selectedOption.value = 'user'; // Reset to default when modal opens
    }
});

function handleConfirm() {
    emit('confirm', selectedOption.value);
}

function handleCancel() {
    // Don't allow closing without selection - user must choose
    // emit('close');
}
</script>

<style scoped>
.modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2000;
    backdrop-filter: blur(4px);
}

.config-sync-modal {
    background: white;
    border-radius: 12px;
    width: 100%;
    max-width: 700px;
    max-height: 85vh;
    display: flex;
    flex-direction: column;
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
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
    padding: 24px;
    border-bottom: 1px solid #e5e7eb;
    flex-shrink: 0;
}

.modal-header h2 {
    margin: 0;
    font-size: 20px;
    font-weight: 600;
    color: #1f2937;
}

.modal-body {
    flex: 1;
    overflow-y: auto;
    padding: 24px;
}

.info-section {
    margin-bottom: 24px;
}

.info-text {
    color: #374151;
    font-size: 14px;
    line-height: 1.6;
    margin: 0;
}

.config-comparison {
    display: flex;
    flex-direction: column;
    gap: 16px;
    margin-bottom: 24px;
}

.config-option {
    border: 2px solid #e5e7eb;
    border-radius: 8px;
    padding: 16px;
    cursor: pointer;
    transition: all 0.2s;
    background: #f9fafb;
}

.config-option:hover {
    border-color: #16a34a;
    background: #f0f4ff;
}

.config-option.selected {
    border-color: #16a34a;
    background: #ecfdf5;
    box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.1);
}

.option-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 8px;
}

.option-header input[type="radio"] {
    width: 18px;
    height: 18px;
    cursor: pointer;
}

.option-header h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: #1f2937;
}

.option-description {
    margin: 0;
    padding-left: 30px;
    color: #6b7280;
    font-size: 13px;
    line-height: 1.5;
}

.conflicts-section {
    margin-top: 24px;
    padding-top: 24px;
    border-top: 1px solid #e5e7eb;
}

.conflicts-section h4 {
    margin: 0 0 12px 0;
    font-size: 14px;
    font-weight: 600;
    color: #374151;
}

.conflicts-list {
    margin: 0;
    padding-left: 20px;
    color: #6b7280;
    font-size: 13px;
}

.conflicts-list li {
    margin-bottom: 4px;
}

.modal-footer {
    padding: 20px 24px;
    border-top: 1px solid #e5e7eb;
    display: flex;
    justify-content: flex-end;
    flex-shrink: 0;
}

.btn-confirm {
    padding: 10px 24px;
    background: #16a34a;
    color: white;
    border: none;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.2s;
}

.btn-confirm:hover {
    background: #3a56d4;
}
</style>

