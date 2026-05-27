import { ipcMain, dialog } from 'electron';
import path from 'path';
import fs from 'fs';
import {
  extractPatientsFromValutazioneFile,
  DEFAULT_CSV_PATH,
} from '../services/valutazioneImport.js';

export function registerImportHandlers(patientRepo, appDatabase) {
  const runImport = async (resolvedPath) => {
    if (!fs.existsSync(resolvedPath)) {
      return { success: false, error: `File non trovato: ${resolvedPath}` };
    }

    const patients = extractPatientsFromValutazioneFile(resolvedPath);
    const { added, skipped } = patientRepo.importBatch(patients);
    if (appDatabase) appDatabase.fallbackBackup();

    return {
      success: true,
      filePath: resolvedPath,
      total: patients.length,
      added,
      skipped,
    };
  };

  ipcMain.handle('import:valutazioneCsv', async (_, filePath) => {
    let resolvedPath = filePath;

    if (!resolvedPath) {
      const defaultDir = path.dirname(DEFAULT_CSV_PATH);
      const result = await dialog.showOpenDialog({
        title: 'Importa pazienti da valutazione.csv',
        defaultPath: fs.existsSync(DEFAULT_CSV_PATH) ? DEFAULT_CSV_PATH : defaultDir,
        properties: ['openFile'],
        filters: [
          { name: 'CSV / Excel', extensions: ['csv', 'xls', 'xlsx'] },
          { name: 'Tutti i file', extensions: ['*'] },
        ],
      });

      if (result.canceled || !result.filePaths?.length) {
        return { success: false, canceled: true };
      }
      resolvedPath = result.filePaths[0];
    }

    try {
      return await runImport(resolvedPath);
    } catch (err) {
      console.error('valutazione import failed:', err);
      return { success: false, error: err.message || String(err) };
    }
  });

  /** @deprecated use import:valutazioneCsv */
  ipcMain.handle('import:valutazioneXls', async (_, filePath) => {
    try {
      return await runImport(filePath || DEFAULT_CSV_PATH);
    } catch (err) {
      return { success: false, error: err.message || String(err) };
    }
  });
}
