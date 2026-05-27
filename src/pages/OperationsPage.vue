<template>
    <div class="operations-page">
        <!-- Left Panel: Operations List -->
        <OperationsList
            :operations="operations"
            :patients="patients"
            :selected-id="selectedId"
            @select="handleSelectOperation"
            @add="formActions.resetForm()"
            @add-operation-for-patient="patient => formActions.resetForm(patient.id)"
            @edit-patient="openEditPatientModal"
            @delete-patient="deleteActions.confirmDeletePatient"
            @delete-operation="deleteActions.confirmDeleteOperation"
            @refresh="handleRefreshFromDatabase"
        />

        <!-- Right Panel: Form / Details -->
        <OperationDetail
            :form="form"
            :patients="patients"
            :iol-models="iolModels"
            :selected-id="selectedId"
            :is-submitting="isSubmitting"
            :error-message="errorMessage"
            :is-both-eyes-mode="isBothEyesMode"
            :active-eye="activeEye"
            :has-changes="hasChanges"
            @submit="handleSubmit"
            @delete="deleteActions.confirmDeleteOperation()"
            @add-new-patient="openAddPatientModal"
            @switch-eye="formActions.handleEyeSwitch"
        />

        <!-- Delete Operation Confirmation -->
        <ConfirmModal
            :show="deleteActions.showDeleteConfirm.value"
            title="Delete Operation"
            :message="deleteActions.deleteOperationMessage.value"
            warning="This action cannot be undone."
            confirm-text="Delete"
            @confirm="handleDeleteOperation"
            @cancel="deleteActions.cancelDeleteOperation"
        />

        <!-- Delete Patient Confirmation -->
        <ConfirmModal
            :show="deleteActions.showDeletePatientConfirm.value"
            title="Delete Patient"
            :message="deleteActions.deletePatientMessage.value"
            warning="This action cannot be undone."
            confirm-text="Delete Patient"
            @confirm="handleDeletePatient"
            @cancel="deleteActions.cancelDeletePatient"
        />

        <!-- Add/Edit Patient Modal -->
        <AddPatientModal
            :show="modals.addPatient"
            :patient="modals.patientToEdit"
            @close="closePatientModal"
            @patient-added="handlePatientAdded"
            @patient-updated="handlePatientUpdated"
        />
    </div>
</template>

<script setup>
import { reactive, ref, watch, onMounted } from 'vue';
import OperationsList from '@/components/organisms/OperationsList.vue';
import OperationDetail from '@/components/organisms/OperationDetail.vue';
import AddPatientModal from '@/components/molecules/AddPatientModal.vue';
import ConfirmModal from '@/components/atoms/ConfirmModal.vue';
import { useOperationsData } from '@/composables/useOperationsData';
import { useOperationForm } from '@/composables/useOperationForm';
import { useDeleteConfirmation } from '@/composables/useDeleteConfirmation';

const iolModels = ref([]);

const loadIolModels = async () => {
    iolModels.value = await window.api.iolModel.getAll();
};

// Data management
const { operations, patients, loadOperations, loadPatients, loadAll, setupSyncHandlers } = useOperationsData();

// Form management
const formActions = useOperationForm();
const { form, selectedId, linkedOperation, isSubmitting, errorMessage, hasChanges, activeEye, isBothEyesMode } = formActions;

// Delete confirmations
const deleteActions = useDeleteConfirmation(operations, linkedOperation);

// Modal state
const modals = reactive({
    addPatient: false,
    patientToEdit: null,
});

// Clear form errors on field changes
watch(() => form.value.patientId, (val) => {
    if (val) formActions.clearFieldError('patientId', 'Please select a patient');
});
watch(() => form.value.eye, (val) => {
    if (val) formActions.clearFieldError('eye', 'Please select an eye');
});

// Event handlers
const handleSelectOperation = async (op) => {
    await formActions.selectOperation(op);
};

const handleRefreshFromDatabase = async () => {
    await Promise.all([loadPatients(), loadOperations()]);
};

const handleSubmit = async () => {
    await formActions.submitForm(loadOperations);
};

const handleDeleteOperation = async () => {
    await deleteActions.executeDeleteOperation(selectedId.value, (wasSelected) => {
        loadOperations();
        if (wasSelected) formActions.resetForm();
    });
};

const handleDeletePatient = async () => {
    try {
        await deleteActions.executeDeletePatient((patientId) => {
            loadPatients();
            loadOperations();
            if (form.value.patientId === patientId) {
                formActions.resetForm();
            }
        });
    } catch {
        errorMessage.value = 'Failed to delete patient';
    }
};

const closePatientModal = () => {
    modals.addPatient = false;
    modals.patientToEdit = null;
};

const openAddPatientModal = () => {
    modals.patientToEdit = null;
    modals.addPatient = true;
};

const openEditPatientModal = (patient) => {
    modals.patientToEdit = patient;
    modals.addPatient = true;
};

const handlePatientAdded = async (newPatient) => {
    await loadPatients();
    if (newPatient?.id) {
        form.value.patientId = newPatient.id;
    }
};

const handlePatientUpdated = async () => {
    await loadPatients();
    await loadOperations();
};

onMounted(async () => {
    await loadAll();
    await loadIolModels();

    // Set up sync handlers (no-op in standalone app)
    setupSyncHandlers({
        onOperationDeleted: (id) => {
            if (selectedId.value === id) formActions.resetForm();
        },
        onPatientDeleted: (id) => {
            if (form.value.patientId === id) formActions.resetForm();
        },
        onOperationUpdated: (id) => {
            if (id && selectedId.value === id && !hasChanges.value) {
                const op = operations.value.find(o => o.id === id);
                if (op) formActions.loadFromOperation(op);
            }
        },
        onDatabaseSynced: () => {
            if (selectedId.value) {
                const op = operations.value.find(o => o.id === selectedId.value);
                if (op) formActions.loadFromOperation(op);
            }
        }
    });
});
</script>

<style scoped>
.operations-page {
    display: grid;
    /* Use rem so sidebar scales with --base-font-size (readable at 200% zoom) */
    grid-template-columns: minmax(17.5rem, 22rem) minmax(0, 1fr);
    height: 100vh;
    background: #f5f6fa;
    overflow-x: hidden;
    max-width: 100vw;
    min-width: 0;
}

@media (max-width: 1500px) {
    .operations-page {
        grid-template-columns: minmax(11rem, 14rem) minmax(0, 1fr);
    }
}

@media print {
    .operations-page {
        display: block !important;
        height: auto !important;
    }
    .operations-list-panel {
        display: none !important;
    }
}
</style>
