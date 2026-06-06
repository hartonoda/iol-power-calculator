import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'node:path';
import fs from 'node:fs';
import started from 'electron-squirrel-startup';
import AppDatabase from './db/database.js';
import PatientRepository from './db/patientRepository.js';
import OperationRepository from './db/operationRepository.js';
import IolModelRepository from './db/iolModelRepository.js';
import ConfigRepository from './db/configRepository.js';
import IOLRulesRepository from './db/iolRulesRepository.js';
import { registerAllHandlers } from './ipc/index.js';
import { initializeConfigs } from './services/configInit.js';

let mainWindow = null;
let appDatabase = null;
let configRepo = null;
let iolRulesRepo = null;

if (started) {
  app.quit();
}

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

const createWindow = () => {
  const iconPath = path.join(app.getAppPath(), 'src', 'assets', 'img', 'logo.ico');

  mainWindow = new BrowserWindow({
    width: 1600,
    height: 1000,
    minWidth: 1200,
    minHeight: 700,
    title: 'eye - Valutazione IOL',
    icon: iconPath,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
  }
};

ipcMain.handle('print:preview', async () => {
  if (!mainWindow) return { success: false, error: 'Nessuna finestra disponibile' };
  return new Promise((resolve) => {
    mainWindow.webContents.print(
      {
        silent: false,
        printBackground: true,
        landscape: true,
        margins: { marginType: 'default' },
      },
      (success, failureReason) => {
        resolve(success ? { success: true } : { success: false, error: failureReason });
      },
    );
  });
});

ipcMain.handle('database:getInfo', async () => {
  if (!appDatabase) return null;
  return appDatabase.getDatabaseInfo();
});

function logStartupError(error) {
  const message = error?.stack || String(error);
  console.error(message);
  try {
    const logDir = app.getPath('userData');
    fs.mkdirSync(logDir, { recursive: true });
    fs.appendFileSync(path.join(logDir, 'startup-error.log'), `${new Date().toISOString()}\n${message}\n\n`);
  } catch (logError) {
    console.error('Failed to write startup log:', logError);
  }
  if (app.isReady()) {
    dialog.showErrorBox('IOL Power Calculator', `Avvio non riuscito:\n\n${message}`);
  }
}

function bootstrap() {
  appDatabase = new AppDatabase();
  const db = appDatabase.getConnection();

  const patientRepo = new PatientRepository(db);
  const operationRepo = new OperationRepository(db);
  const iolModelRepo = new IolModelRepository(db);
  configRepo = new ConfigRepository();
  iolRulesRepo = new IOLRulesRepository();

  initializeConfigs(configRepo, iolRulesRepo);
  registerAllHandlers({ appDatabase, patientRepo, operationRepo, iolModelRepo, configRepo, iolRulesRepo });

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
}

app.whenReady().then(() => {
  try {
    bootstrap();
  } catch (error) {
    logStartupError(error);
    app.quit();
  }
}).catch((error) => {
  logStartupError(error);
  app.quit();
});

process.on('uncaughtException', (error) => {
  logStartupError(error);
  app.quit();
});

process.on('unhandledRejection', (reason) => {
  logStartupError(reason);
});

app.on('window-all-closed', () => {
  if (appDatabase) {
    appDatabase.close();
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
