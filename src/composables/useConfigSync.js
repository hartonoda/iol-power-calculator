/**
 * Composable for handling config synchronization in the renderer process
 * Manages the config sync modal and handles user selection
 */

import { ref, onMounted, onUnmounted } from 'vue';

/**
 * Composable for config sync functionality
 * @returns {Object} Config sync state and methods
 */
export function useConfigSync() {
  const showConfigSyncModal = ref(false);
  const configConflicts = ref([]);

  /**
   * Check for config conflicts by querying the API
   */
  async function checkForConfigConflicts() {
    try {
      if (window.api?.config?.compareConfigs && window.api?.iolRules?.compareConfigs) {
        const ocularParamResult = await window.api.config.compareConfigs();
        const suitabilityRulesResult = await window.api.iolRules.compareConfigs();
        
        const conflicts = [];
        if (!ocularParamResult?.matches) {
          conflicts.push('ocularParameterRules');
        }
        if (!suitabilityRulesResult?.matches) {
          conflicts.push('suitabilityRules');
        }
        
        if (conflicts.length > 0) {
          configConflicts.value = conflicts;
          showConfigSyncModal.value = true;
        }
      }
    } catch (error) {
      console.error('Error checking config conflicts:', error);
    }
  }

  /**
   * Handle IPC message from main process to show sync modal
   */
  function handleConfigSyncMessage(data) {
    configConflicts.value = data.conflicts || [];
    showConfigSyncModal.value = true;
  }

  /**
   * Apply the user's config sync selection
   * @param {string} selection - 'factory' or 'user'
   */
  async function handleConfigSyncConfirm(selection) {
    try {
      // Apply the selection for all conflicts
      for (const conflict of configConflicts.value) {
        if (conflict === 'ocularParameterRules' && window.api?.config?.applySelection) {
          const result = await window.api.config.applySelection(selection);
          if (!result.success) {
            throw new Error(result.error || 'Failed to apply ocular parameter rules');
          }
        } else if (conflict === 'suitabilityRules' && window.api?.iolRules?.applySelection) {
          const result = await window.api.iolRules.applySelection(selection);
          if (!result.success) {
            throw new Error(result.error || 'Failed to apply suitability rules');
          }
        }
      }
      
      showConfigSyncModal.value = false;
      
      // Reload the page to apply new configs
      window.location.reload();
    } catch (error) {
      console.error('Error applying config sync:', error);
      alert('Error applying configuration. Please restart the application.');
    }
  }

  /**
   * Setup IPC listener for config sync modal
   */
  function setupIPCListener() {
    if (window.electronAPI) {
      window.electronAPI.onConfigSyncModal(handleConfigSyncMessage);
    }
  }

  /**
   * Cleanup IPC listener
   */
  function cleanupIPCListener() {
    if (window.electronAPI) {
      window.electronAPI.removeConfigSyncModalListener();
    }
  }

  onMounted(() => {
    setupIPCListener();
    // Also check directly in case message was sent before listener was set up
    checkForConfigConflicts();
  });

  onUnmounted(() => {
    cleanupIPCListener();
  });

  return {
    showConfigSyncModal,
    configConflicts,
    handleConfigSyncConfirm,
    checkForConfigConflicts
  };
}

