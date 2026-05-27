/**
 * Composable for managing delete confirmations
 */

import { ref, computed } from 'vue';

export function useDeleteConfirmation(operations, linkedOperation) {
    // State
    const showDeleteConfirm = ref(false);
    const showDeletePatientConfirm = ref(false);
    const operationToDelete = ref(null);
    const patientToDelete = ref(null);
    
    // Computed messages
    const deleteOperationMessage = computed(() => {
        const op = operationToDelete.value;
        if (op?.linkedOperationId || linkedOperation.value) {
            return 'This operation is linked to another eye operation. <strong>Both operations will be deleted.</strong>';
        }
        return 'Are you sure you want to delete this operation?';
    });
    
    const deletePatientMessage = computed(() => {
        if (!patientToDelete.value) return '';
        const opCount = operations.value.filter(op => op.patientId === patientToDelete.value.id).length;
        if (opCount > 0) {
            return `Are you sure you want to delete the patient <strong>${patientToDelete.value.name}</strong>?<br><br>This patient has <strong>${opCount} operation(s)</strong> that will also be deleted.`;
        }
        return `Are you sure you want to delete the patient <strong>${patientToDelete.value.name}</strong>?`;
    });
    
    // Actions
    const confirmDeleteOperation = (operation = null) => {
        operationToDelete.value = operation;
        showDeleteConfirm.value = true;
    };
    
    const confirmDeletePatient = (patient) => {
        patientToDelete.value = patient;
        showDeletePatientConfirm.value = true;
    };
    
    const cancelDeleteOperation = () => {
        operationToDelete.value = null;
        showDeleteConfirm.value = false;
    };
    
    const cancelDeletePatient = () => {
        patientToDelete.value = null;
        showDeletePatientConfirm.value = false;
    };
    
    /**
     * Execute operation deletion
     * @param {number} selectedId - Currently selected operation ID
     * @param {function} onDeleted - Callback after deletion
     */
    const executeDeleteOperation = async (selectedId, onDeleted) => {
        const opToDelete = operationToDelete.value;
        const opId = opToDelete ? opToDelete.id : selectedId;
        
        if (opId) {
            const hasLinked = opToDelete ? opToDelete.linkedOperationId : linkedOperation.value;
            
            if (hasLinked) {
                await window.api.operation.deletePaired(opId);
            } else {
                await window.api.operation.delete(opId);
            }
            
            if (onDeleted) onDeleted(opId === selectedId);
        }
        
        cancelDeleteOperation();
    };
    
    /**
     * Execute patient deletion
     * @param {function} onDeleted - Callback after deletion
     */
    const executeDeletePatient = async (onDeleted) => {
        if (!patientToDelete.value) {
            cancelDeletePatient();
            return;
        }
        
        try {
            const patientId = patientToDelete.value.id;
            
            // Delete all operations for this patient
            const patientOps = operations.value.filter(op => op.patientId === patientId);
            for (const op of patientOps) {
                await window.api.operation.delete(op.id);
            }
            
            // Delete the patient
            await window.api.patient.delete(patientId);
            
            if (onDeleted) onDeleted(patientId);
        } catch (err) {
            console.error('Error deleting patient:', err);
            throw err;
        } finally {
            cancelDeletePatient();
        }
    };
    
    return {
        // State
        showDeleteConfirm,
        showDeletePatientConfirm,
        operationToDelete,
        patientToDelete,
        
        // Computed
        deleteOperationMessage,
        deletePatientMessage,
        
        // Actions
        confirmDeleteOperation,
        confirmDeletePatient,
        cancelDeleteOperation,
        cancelDeletePatient,
        executeDeleteOperation,
        executeDeletePatient
    };
}
