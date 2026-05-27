import { registerPatientHandlers } from './patientHandlers.js';
import { registerOperationHandlers } from './operationHandlers.js';
import { registerIolModelHandlers } from './iolModelHandlers.js';
import { registerConfigHandlers } from './configHandlers.js';
import { registerIOLRulesHandlers } from './iolRulesHandlers.js';

export function broadcast() {
  // Standalone app: no WebSocket clients
}

export function registerAllHandlers({
  appDatabase,
  patientRepo,
  operationRepo,
  iolModelRepo,
  configRepo,
  iolRulesRepo,
}) {
  registerPatientHandlers(patientRepo, appDatabase);
  registerOperationHandlers(operationRepo, appDatabase);
  registerIolModelHandlers(iolModelRepo, appDatabase);
  registerConfigHandlers(configRepo);
  registerIOLRulesHandlers(iolRulesRepo);
}
