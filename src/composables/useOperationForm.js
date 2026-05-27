/**
 * Composable for managing operation form state and actions
 */

import { ref, computed } from 'vue';
import { getEmptyForm, getTodayDate } from '@/config/formSchema';
import { useBothEyesMode } from './useBothEyesMode';

export function useOperationForm() {
    // Form state
    const form = ref(getEmptyForm());
    const originalFormJson = ref('');
    const selectedId = ref(null);
    const linkedOperation = ref(null);
    const isSubmitting = ref(false);
    const errorMessage = ref('');
    
    // Both eyes mode
    const {
        activeEye,
        eyeDataOD,
        eyeDataOS,
        isBothEyesMode,
        saveCurrentEyeData,
        handleEyeSwitch,
        resetBothEyesMode
    } = useBothEyesMode(form);
    
    // Track if form has changes
    const hasChanges = computed(() => {
        if (!selectedId.value) return true; // New operation always has "changes"
        return JSON.stringify(form.value) !== originalFormJson.value;
    });
    
    // Reset form to new operation state
    const resetForm = (patientId = null) => {
        selectedId.value = null;
        form.value = getEmptyForm();
        if (patientId) {
            form.value.patientId = patientId;
        }
        originalFormJson.value = '';
        errorMessage.value = '';
        linkedOperation.value = null;
        resetBothEyesMode();
    };
    
    // Load form from operation data
    const loadFromOperation = (op) => {
        const emptyForm = getEmptyForm();
        form.value = { ...emptyForm };
        
        Object.keys(op).forEach(key => {
            if (key in form.value) {
                if (key === 'iolManualEdits') {
                    try {
                        form.value[key] = op[key] ? JSON.parse(op[key]) : [];
                    } catch {
                        form.value[key] = [];
                    }
                } else {
                    form.value[key] = op[key] ?? '';
                }
            }
        });
    };
    
    // Select an operation
    const selectOperation = async (op) => {
        selectedId.value = op.id;
        loadFromOperation(op);
        originalFormJson.value = JSON.stringify(form.value);
        errorMessage.value = '';
        
        // Load linked operation
        try {
            linkedOperation.value = await window.api.operation.getOtherEye(op.id);
        } catch {
            linkedOperation.value = null;
        }
    };
    
    // Switch to linked operation
    const switchToLinkedOperation = async () => {
        if (!linkedOperation.value) return;
        
        const targetOp = linkedOperation.value;
        selectedId.value = targetOp.id;
        loadFromOperation(targetOp);
        
        try {
            linkedOperation.value = await window.api.operation.getOtherEye(targetOp.id);
        } catch {
            linkedOperation.value = null;
        }
    };
    
    // Prepare form data for saving
    const prepareFormData = () => {
        const data = { ...form.value };
        if (Array.isArray(data.iolManualEdits)) {
            data.iolManualEdits = JSON.stringify(data.iolManualEdits);
        }
        return data;
    };
    
    // Submit form (create or update)
    const submitForm = async (onSuccess) => {
        errorMessage.value = '';
        isSubmitting.value = true;
        
        try {
            // Validate
            if (!form.value.patientId) {
                errorMessage.value = 'Please select a patient';
                return false;
            }
            if (!form.value.eye) {
                errorMessage.value = 'Please select an eye';
                return false;
            }
            
            let result;
            
            if (selectedId.value) {
                // Update existing
                const data = prepareFormData();
                data.id = selectedId.value;
                result = await window.api.operation.update(data);
            } else if (form.value.eye === 'OU') {
                // Create both eyes
                return await createBothEyesOperation(onSuccess);
            } else {
                // Create single
                result = await window.api.operation.add(prepareFormData());
            }
            
            if (!result.success) {
                errorMessage.value = result.error || 'Failed to save operation';
                return false;
            }
            
            if (!selectedId.value) {
                selectedId.value = result.id;
            }
            
            originalFormJson.value = JSON.stringify(form.value);
            if (onSuccess) onSuccess();
            return true;
            
        } catch (err) {
            errorMessage.value = err.message || 'An error occurred';
            return false;
        } finally {
            isSubmitting.value = false;
        }
    };
    
    // Create both eyes operation (OU)
    const createBothEyesOperation = async (onSuccess) => {
        saveCurrentEyeData();
        
        const sharedFields = {
            patientId: form.value.patientId,
            operationDate: form.value.operationDate || getTodayDate(),
            age: form.value.age || null,
            noteSistemic: form.value.noteSistemic || null,
            interventoDi: form.value.interventoDi || null,
            costo: form.value.costo || null,
            noteIntervento: form.value.noteIntervento || null,
        };
        
        // Create OD
        const odResult = await window.api.operation.add({ ...sharedFields, eye: 'OD', ...eyeDataOD.value });
        if (!odResult.success) {
            errorMessage.value = odResult.error || 'Failed to create OD operation';
            return false;
        }
        
        // Create OS
        const osResult = await window.api.operation.add({ ...sharedFields, eye: 'OS', ...eyeDataOS.value });
        if (!osResult.success) {
            await window.api.operation.delete(odResult.id);
            errorMessage.value = osResult.error || 'Failed to create OS operation';
            return false;
        }
        
        // Link them
        await window.api.operation.updateLinkedId(odResult.id, osResult.id);
        await window.api.operation.updateLinkedId(osResult.id, odResult.id);
        
        // Select OD
        selectedId.value = odResult.id;
        linkedOperation.value = await window.api.operation.getOtherEye(odResult.id);
        resetBothEyesMode();
        originalFormJson.value = JSON.stringify(form.value);
        
        if (onSuccess) onSuccess();
        return true;
    };
    
    // Clear validation error for a field
    const clearFieldError = (field, expectedError) => {
        if (errorMessage.value === expectedError) {
            errorMessage.value = '';
        }
    };
    
    return {
        // State
        form,
        selectedId,
        linkedOperation,
        isSubmitting,
        errorMessage,
        hasChanges,
        
        // Both eyes
        activeEye,
        isBothEyesMode,
        handleEyeSwitch,
        
        // Actions
        resetForm,
        loadFromOperation,
        selectOperation,
        switchToLinkedOperation,
        submitForm,
        clearFieldError
    };
}
