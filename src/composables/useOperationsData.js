/**
 * Composable for managing operations and patients data
 * Handles loading, syncing, and real-time updates
 */

import { ref, onMounted } from 'vue';
import { useSync } from './useSync';
import { useFieldRules } from './useFieldRules';
import { useIOLRules } from './useIOLRules';

export function useOperationsData() {
    const operations = ref([]);
    const patients = ref([]);
    
    const { loadFieldRules } = useFieldRules();
    const { loadIOLRules } = useIOLRules();
    const { onDatabaseChange, onConfigChange, onIOLRulesChange } = useSync();
    
    // Data change callbacks (set by consumer)
    let onOperationDeleted = null;
    let onPatientDeleted = null;
    let onOperationUpdated = null;
    let onDatabaseSynced = null;
    
    const loadOperations = async () => {
        operations.value = await window.api.operation.getAll();
    };
    
    const loadPatients = async () => {
        patients.value = await window.api.patient.getAll();
    };
    
    const loadAll = async () => {
        await Promise.all([
            loadOperations(),
            loadPatients(),
        ]);
    };
    
    /**
     * Set up sync event handlers
     * @param {object} callbacks - Callbacks for handling sync events
     */
    const setupSyncHandlers = (callbacks = {}) => {
        onOperationDeleted = callbacks.onOperationDeleted;
        onPatientDeleted = callbacks.onPatientDeleted;
        onOperationUpdated = callbacks.onOperationUpdated;
        onDatabaseSynced = callbacks.onDatabaseSynced;
        
        // Handle database changes
        onDatabaseChange(async (data, eventType) => {
            console.log('[Sync] Database change:', eventType, data);
            
            // Always refresh the lists - must await so handlers get fresh data
            await loadOperations();
            await loadPatients();
            
            // Full DB sync from peer - reload and refresh form
            if (eventType === 'database:synced') {
                if (onDatabaseSynced) onDatabaseSynced();
                else if (onOperationUpdated) onOperationUpdated(null);
                return;
            }
            
            // Notify about specific changes (now using refreshed data)
            if (eventType === 'operation:deleted' && onOperationDeleted) {
                onOperationDeleted(data.id);
            }
            if (eventType === 'patient:deleted' && onPatientDeleted) {
                onPatientDeleted(data.id);
            }
            if (eventType === 'operation:updated' && onOperationUpdated) {
                onOperationUpdated(data.id);
            }
        });
        
        // Handle config/rules changes
        onConfigChange(() => {
            console.log('[Sync] Config changed, reloading...');
            loadFieldRules();
        });
        
        onIOLRulesChange(() => {
            console.log('[Sync] IOL rules changed, reloading...');
            loadIOLRules();
        });
    };
    
    return {
        operations,
        patients,
        loadOperations,
        loadPatients,
        loadAll,
        setupSyncHandlers
    };
}
