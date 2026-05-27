/**
 * Initialize bundled config files in AppData on first run.
 */
export function initializeConfigs(configRepo, iolRulesRepo) {
  try {
    configRepo.getConfig();
  } catch (err) {
    console.warn('Config init:', err);
  }
  try {
    iolRulesRepo.getScoreDeductions();
  } catch (err) {
    console.warn('IOL rules init:', err);
  }
}
