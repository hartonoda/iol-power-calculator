import { ipcMain } from 'electron';

export function registerPatientHandlers(patientRepo, appDatabase) {
  ipcMain.handle('patient:add', (_, patient) => {
    const result = patientRepo.add(patient);
    if (result.success && appDatabase) appDatabase.fallbackBackup();
    return result;
  });

  ipcMain.handle('patient:update', (_, patient) => {
    const result = patientRepo.update(patient);
    if (result.success && appDatabase) appDatabase.fallbackBackup();
    return result;
  });

  ipcMain.handle('patient:delete', (_, id) => {
    const result = patientRepo.delete(id);
    if (result.success && appDatabase) appDatabase.fallbackBackup();
    return result;
  });

  ipcMain.handle('patient:getAll', () => patientRepo.getAll());
  ipcMain.handle('patient:getById', (_, id) => patientRepo.getById(id));
  ipcMain.handle('patient:checkExists', (_, name, dateOfBirth) => {
    const row = patientRepo.checkPatientExists(name, dateOfBirth);
    return row ? { exists: true, id: row.id } : { exists: false };
  });
}
