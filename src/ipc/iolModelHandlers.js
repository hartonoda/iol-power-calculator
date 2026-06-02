import { ipcMain } from 'electron';

export function registerIolModelHandlers(iolModelRepo) {
    // Get all IOL models
    ipcMain.handle('iolModel:getAll', async () => {
        return iolModelRepo.getAll();
    });

    // Get IOL model by ID
    ipcMain.handle('iolModel:getById', async (event, id) => {
        return iolModelRepo.getById(id);
    });

    // Get IOL model by name
    ipcMain.handle('iolModel:getByName', async (event, name) => {
        return iolModelRepo.getByName(name);
    });

    // Add new IOL model (name string or { name, ...constants })
    ipcMain.handle('iolModel:add', async (event, payload) => {
        return iolModelRepo.add(payload);
    });

    // Update IOL model (name and/or constants)
    ipcMain.handle('iolModel:update', async (event, id, payload) => {
        return iolModelRepo.update(id, payload);
    });

    ipcMain.handle('iolModel:duplicate', async (event, id) => {
        return iolModelRepo.duplicate(id);
    });

    // Delete IOL model
    ipcMain.handle('iolModel:delete', async (event, id) => {
        try {
            return { success: iolModelRepo.delete(id) };
        } catch (err) {
            return { success: false, error: err.message };
        }
    });

    // Import from localStorage (for migration)
    ipcMain.handle('iolModel:importFromLocalStorage', async (event, models) => {
        return iolModelRepo.importFromLocalStorage(models);
    });
}
