import { ipcMain } from 'electron';
import { broadcast } from './index.js';

export function registerIOLRulesHandlers(iolRulesRepo) {
    // Get the full IOL rules config
    ipcMain.handle('iolRules:get', async () => {
        try {
            return { success: true, data: iolRulesRepo.getConfig() };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });
    
    // Get only score deductions
    ipcMain.handle('iolRules:getScoreDeductions', async () => {
        try {
            return { success: true, data: iolRulesRepo.getScoreDeductions() };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });
    
    // Update a parameter's thresholds
    ipcMain.handle('iolRules:updateParamThresholds', async (event, { paramName, thresholds }) => {
        try {
            const result = iolRulesRepo.updateParamThresholds(paramName, thresholds);
            broadcast('iolRules:updated', { paramName });
            return result;
        } catch (error) {
            return { success: false, error: error.message };
        }
    });
    
    // Update a single threshold deduction value
    ipcMain.handle('iolRules:updateThresholdDeduction', async (event, { paramName, thresholdIndex, iolType, value }) => {
        try {
            const result = iolRulesRepo.updateThresholdDeduction(paramName, thresholdIndex, iolType, value);
            broadcast('iolRules:updated', { paramName, thresholdIndex, iolType });
            return result;
        } catch (error) {
            return { success: false, error: error.message };
        }
    });
    
    // Update full scoreDeductions config
    ipcMain.handle('iolRules:updateFullConfig', async (event, scoreDeductions) => {
        try {
            const result = iolRulesRepo.updateFullConfig(scoreDeductions);
            broadcast('iolRules:updated', {});
            return result;
        } catch (error) {
            return { success: false, error: error.message };
        }
    });
    
    // Reset all IOL rules to defaults
    ipcMain.handle('iolRules:resetToDefaults', async () => {
        try {
            const result = iolRulesRepo.resetToDefaults();
            broadcast('iolRules:reset', {});
            return result;
        } catch (error) {
            return { success: false, error: error.message };
        }
    });
    
    // Reset a specific parameter to default
    ipcMain.handle('iolRules:resetParamToDefault', async (event, { paramName }) => {
        try {
            const result = iolRulesRepo.resetParamToDefault(paramName);
            broadcast('iolRules:updated', { paramName });
            return result;
        } catch (error) {
            return { success: false, error: error.message };
        }
    });
    
    // Check if factory and user configs match
    ipcMain.handle('iolRules:compareConfigs', async () => {
        try {
            const matches = iolRulesRepo.compareConfigs();
            return { success: true, matches };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });
    
    // Apply config selection (factory or user)
    ipcMain.handle('iolRules:applySelection', async (event, { option }) => {
        try {
            let result;
            if (option === 'factory') {
                result = iolRulesRepo.useFactoryConfig();
            } else if (option === 'user') {
                result = iolRulesRepo.mergeKeepUserValues();
            } else {
                return { success: false, error: 'Invalid option' };
            }
            
            if (result.success) {
                broadcast('iolRules:updated', {});
            }
            return result;
        } catch (error) {
            return { success: false, error: error.message };
        }
    });
    
    console.log('IOL Rules IPC handlers registered');
}
