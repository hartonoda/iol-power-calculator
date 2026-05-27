import { ipcMain } from 'electron';
import { broadcast } from './index.js';

export function registerConfigHandlers(configRepo) {
    // Get the full config
    ipcMain.handle('config:get', async () => {
        try {
            return { success: true, data: configRepo.getConfig() };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });
    
    // Update a specific field's range
    ipcMain.handle('config:updateFieldRange', async (event, { section, field, greenRange, yellowRange }) => {
        try {
            const result = configRepo.updateFieldRange(section, field, greenRange, yellowRange);
            broadcast('config:updated', { section, field });
            return result;
        } catch (error) {
            return { success: false, error: error.message };
        }
    });
    
    // Reset all config to defaults
    ipcMain.handle('config:resetToDefaults', async () => {
        try {
            const result = configRepo.resetToDefaults();
            broadcast('config:reset', {});
            return result;
        } catch (error) {
            return { success: false, error: error.message };
        }
    });
    
    // Reset a specific field to default
    ipcMain.handle('config:resetFieldToDefault', async (event, { section, field }) => {
        try {
            const result = configRepo.resetFieldToDefault(section, field);
            broadcast('config:updated', { section, field });
            return result;
        } catch (error) {
            return { success: false, error: error.message };
        }
    });
    
    // Check if factory and user configs match
    ipcMain.handle('config:compareConfigs', async () => {
        try {
            const matches = configRepo.compareConfigs();
            return { success: true, matches };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });
    
    // Apply config selection (factory or user)
    ipcMain.handle('config:applySelection', async (event, { option }) => {
        try {
            let result;
            if (option === 'factory') {
                result = configRepo.useFactoryConfig();
            } else if (option === 'user') {
                result = configRepo.mergeKeepUserValues();
            } else {
                return { success: false, error: 'Invalid option' };
            }
            
            if (result.success) {
                broadcast('config:updated', {});
            }
            return result;
        } catch (error) {
            return { success: false, error: error.message };
        }
    });
    
    console.log('Config IPC handlers registered');
}
