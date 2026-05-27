import { ipcMain } from 'electron';
import { broadcast } from './index.js';

export function registerOperationHandlers(operationRepo, appDatabase) {
  ipcMain.handle('operation:add', (_, operation) => {
    const result = operationRepo.add(operation);
    broadcast('operation:added', { id: result.id, patientId: operation.patientId });
    if (result.success && appDatabase) appDatabase.fallbackBackup();
    return result;
  });
  
  ipcMain.handle('operation:update', (_, operation) => {
    const result = operationRepo.update(operation);
    broadcast('operation:updated', { id: operation.id, patientId: operation.patientId });
    if (result.success && appDatabase) appDatabase.fallbackBackup();
    return result;
  });
  
  ipcMain.handle('operation:delete', (_, id) => {
    const result = operationRepo.delete(id);
    broadcast('operation:deleted', { id });
    if (result.success && appDatabase) appDatabase.fallbackBackup();
    return result;
  });
  
  ipcMain.handle('operation:getAll', () => operationRepo.getAll());
  ipcMain.handle('operation:getById', (_, id) => operationRepo.getById(id));
  ipcMain.handle('operation:getByPatientId', (_, patientId) => operationRepo.getByPatientId(patientId));
  
  // Linked operations (for OU - both eyes)
  ipcMain.handle('operation:addPaired', (_, operation) => {
    const result = operationRepo.addPaired(operation);
    broadcast('operation:added', { id: result.id, patientId: operation.patientId, paired: true });
    return result;
  });
  
  ipcMain.handle('operation:getOtherEye', (_, operationId) => operationRepo.getOtherEye(operationId));
  
  ipcMain.handle('operation:deletePaired', (_, operationId) => {
    const result = operationRepo.deletePaired(operationId);
    broadcast('operation:deleted', { id: operationId, paired: true });
    return result;
  });
  
  ipcMain.handle('operation:updateLinkedId', (_, operationId, linkedId) => operationRepo.updateLinkedOperationId(operationId, linkedId));
}

