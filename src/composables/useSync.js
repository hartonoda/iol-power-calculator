/**
 * No-op sync for standalone app (no network server).
 */
export function useSync() {
  const on = () => () => {};
  const onDatabaseChange = () => () => {};
  const onConfigChange = () => () => {};
  const onIOLRulesChange = () => () => {};

  return {
    isConnected: { value: false },
    on,
    onDatabaseChange,
    onConfigChange,
    onIOLRulesChange,
  };
}
