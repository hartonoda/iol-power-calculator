const STORAGE_KEY = 'adminListOperationOrder';
const NUMBERS_STORAGE_KEY = 'adminListOperationOrderNumbers';

export function orderContextKey(operationDate) {
  return operationDate || '__all__';
}

export function readStoredOrderIds(operationDate) {
  try {
    const map = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    const ids = map[orderContextKey(operationDate)];
    return Array.isArray(ids) ? ids.map(String) : [];
  } catch {
    return [];
  }
}

export function storeOrderIds(operationDate, operationIds) {
  try {
    const map = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    const key = orderContextKey(operationDate);
    if (!operationIds.length) {
      delete map[key];
    } else {
      map[key] = operationIds.map(String);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    // ignore storage errors
  }
}

/** @returns {Record<string, number>} */
export function readStoredOrderNumbers(operationDate) {
  try {
    const map = JSON.parse(localStorage.getItem(NUMBERS_STORAGE_KEY) || '{}');
    const entry = map[orderContextKey(operationDate)];
    if (!entry || typeof entry !== 'object') return {};
    /** @type {Record<string, number>} */
    const result = {};
    for (const [id, num] of Object.entries(entry)) {
      const n = Number(num);
      if (Number.isFinite(n)) result[String(id)] = Math.round(n);
    }
    return result;
  } catch {
    return {};
  }
}

/** @param {Record<string, number>} orderNumbers */
export function storeOrderNumbers(operationDate, orderNumbers) {
  try {
    const map = JSON.parse(localStorage.getItem(NUMBERS_STORAGE_KEY) || '{}');
    const key = orderContextKey(operationDate);
    /** @type {Record<string, number>} */
    const cleaned = {};
    for (const [id, num] of Object.entries(orderNumbers)) {
      const n = Number(num);
      if (Number.isFinite(n)) cleaned[String(id)] = Math.round(n);
    }
    if (!Object.keys(cleaned).length) {
      delete map[key];
    } else {
      map[key] = cleaned;
    }
    localStorage.setItem(NUMBERS_STORAGE_KEY, JSON.stringify(map));
  } catch {
    // ignore storage errors
  }
}

/** Keep saved order, append any new operations at the end. */
export function mergeOrderWithOperations(operations, savedIds) {
  const opIds = operations.map((op) => String(op.id));
  if (!savedIds.length) return opIds;
  const saved = savedIds.filter((id) => opIds.includes(id));
  const appended = opIds.filter((id) => !saved.includes(id));
  return [...saved, ...appended];
}

export function applyOrderToOperations(operations, orderedIds) {
  if (!orderedIds.length) return [...operations];
  const byId = new Map(operations.map((op) => [String(op.id), op]));
  const ordered = orderedIds.map((id) => byId.get(String(id))).filter(Boolean);
  const orderedSet = new Set(orderedIds.map(String));
  const rest = operations.filter((op) => !orderedSet.has(String(op.id)));
  return [...ordered, ...rest];
}

/** Drop assignments for operations no longer in the list. */
export function pruneOrderNumbers(operations, orderNumbers) {
  const opIds = new Set(operations.map((op) => String(op.id)));
  /** @type {Record<string, number>} */
  const next = {};
  let changed = false;
  for (const [id, num] of Object.entries(orderNumbers)) {
    if (opIds.has(id)) {
      next[id] = num;
    } else {
      changed = true;
    }
  }
  return changed ? next : orderNumbers;
}
