// @ts-check
const PREFIX = "vibe-check:check-in-draft";
const VERSION = 1;

function storageKey(userId, dateKey) {
  if (!userId || !dateKey) return null;
  return `${PREFIX}:${userId}:${dateKey}`;
}

export function loadCheckInDraft(userId, dateKey, storage = globalThis.localStorage) {
  const key = storageKey(userId, dateKey);
  if (!key || !storage) return null;
  try {
    const parsed = JSON.parse(storage.getItem(key));
    if (parsed?.version !== VERSION || !parsed?.form) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveCheckInDraft(userId, dateKey, form, stepIndex, storage = globalThis.localStorage) {
  const key = storageKey(userId, dateKey);
  if (!key || !storage) return false;
  try {
    storage.setItem(key, JSON.stringify({
      version: VERSION,
      savedAt: new Date().toISOString(),
      stepIndex,
      form,
    }));
    return true;
  } catch {
    return false;
  }
}

export function clearCheckInDraft(userId, dateKey, storage = globalThis.localStorage) {
  const key = storageKey(userId, dateKey);
  if (key && storage) storage.removeItem(key);
}

export function clearAllLocalDrafts(storage = globalThis.localStorage) {
  if (!storage) return;
  for (let i = storage.length - 1; i >= 0; i -= 1) {
    const key = storage.key(i);
    if (key?.startsWith(`${PREFIX}:`)) storage.removeItem(key);
  }
}
