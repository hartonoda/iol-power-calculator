import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('api', {
  patient: {
    add: (patient) => ipcRenderer.invoke('patient:add', patient),
    update: (patient) => ipcRenderer.invoke('patient:update', patient),
    delete: (id) => ipcRenderer.invoke('patient:delete', id),
    getAll: () => ipcRenderer.invoke('patient:getAll'),
    getById: (id) => ipcRenderer.invoke('patient:getById', id),
    checkExists: (name, dateOfBirth) => ipcRenderer.invoke('patient:checkExists', name, dateOfBirth),
  },
  operation: {
    add: (operation) => ipcRenderer.invoke('operation:add', operation),
    update: (operation) => ipcRenderer.invoke('operation:update', operation),
    delete: (id) => ipcRenderer.invoke('operation:delete', id),
    getAll: () => ipcRenderer.invoke('operation:getAll'),
    getById: (id) => ipcRenderer.invoke('operation:getById', id),
    getByPatientId: (patientId) => ipcRenderer.invoke('operation:getByPatientId', patientId),
    addPaired: (operation) => ipcRenderer.invoke('operation:addPaired', operation),
    getOtherEye: (operationId) => ipcRenderer.invoke('operation:getOtherEye', operationId),
    deletePaired: (operationId) => ipcRenderer.invoke('operation:deletePaired', operationId),
    updateLinkedId: (operationId, linkedId) =>
      ipcRenderer.invoke('operation:updateLinkedId', operationId, linkedId),
  },
  print: {
    preview: () => ipcRenderer.invoke('print:preview'),
  },
  database: {
    getInfo: () => ipcRenderer.invoke('database:getInfo'),
  },
  import: {
    valutazioneCsv: (filePath) => ipcRenderer.invoke('import:valutazioneCsv', filePath),
    /** @deprecated */
    valutazioneXls: (filePath) => ipcRenderer.invoke('import:valutazioneCsv', filePath),
  },
  iolModel: {
    getAll: () => ipcRenderer.invoke('iolModel:getAll'),
    getById: (id) => ipcRenderer.invoke('iolModel:getById', id),
    getByName: (name) => ipcRenderer.invoke('iolModel:getByName', name),
    add: (name) => ipcRenderer.invoke('iolModel:add', name),
    update: (id, name) => ipcRenderer.invoke('iolModel:update', id, name),
    delete: (id) => ipcRenderer.invoke('iolModel:delete', id),
  },
  config: {
    get: () => ipcRenderer.invoke('config:get'),
    updateFieldRange: (section, field, greenRange, yellowRange) =>
      ipcRenderer.invoke('config:updateFieldRange', { section, field, greenRange, yellowRange }),
    resetToDefaults: () => ipcRenderer.invoke('config:resetToDefaults'),
    resetFieldToDefault: (section, field) =>
      ipcRenderer.invoke('config:resetFieldToDefault', { section, field }),
  },
  iolRules: {
    get: () => ipcRenderer.invoke('iolRules:get'),
    getScoreDeductions: () => ipcRenderer.invoke('iolRules:getScoreDeductions'),
    updateParamThresholds: (paramName, thresholds) =>
      ipcRenderer.invoke('iolRules:updateParamThresholds', { paramName, thresholds }),
    updateThresholdDeduction: (paramName, thresholdIndex, iolType, value) =>
      ipcRenderer.invoke('iolRules:updateThresholdDeduction', {
        paramName,
        thresholdIndex,
        iolType,
        value,
      }),
    updateFullConfig: (scoreDeductions) =>
      ipcRenderer.invoke('iolRules:updateFullConfig', scoreDeductions),
    resetToDefaults: () => ipcRenderer.invoke('iolRules:resetToDefaults'),
    resetParamToDefault: (paramName) =>
      ipcRenderer.invoke('iolRules:resetParamToDefault', { paramName }),
  },
});

contextBridge.exposeInMainWorld('isElectron', true);
