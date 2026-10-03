// Saves that couldn't reach the account yet: check-ins and journal entries,
// kept on this device for the person who wrote them, then sent when the
// connection returns. localStorage, so they outlast the tab. Signing out from
// Settings, or deleting the account, removes them; any other sign-out (an
// expired session, or a forgotten app-lock PIN) keeps them for when the
// person signs back in.
// Storage can be blocked or full, so every call degrades to "not kept".

const PREFIX = 'vibe:kept-saves:';
// Any change to the kept saves, in this tab.
export const KEPT_SAVES_EVENT = 'vibe:kept-saves';
// The person asked for a kept save to be sent now.
export const SEND_KEPT_SAVES_EVENT = 'vibe:send-kept-saves';
/** @typedef {Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>} SaveStorage */
/** @returns {SaveStorage} */
const storageOf = () => globalThis.localStorage;

/**
 * @typedef {object} KeptSave
 * @property {string} id check-in:<date>, a new entry's own id, or the id of the entry an edit changes
 * @property {'check-in' | 'journal'} kind
 * @property {object} payload what the save writes
 * @property {boolean} [edit] a change to a saved journal entry
 * @property {string | null} [base] when the stored day or entry it started from was last saved (its updated_at), or null when it started from nothing stored
 * @property {string | null} [seen] for a check-in, the newest saved version it holds (the day or its draft)
 * @property {string} keptAt
 * @property {string} version tells this save from a later one for the same day or entry
 * @property {string} [refused] why the account refused it, once it has
 * @property {string} [conflict] why it waits for the person: the account holds a different version, saved somewhere else
 * @property {boolean} [force] the person chose this version over the stored one
 */

/**
 * @param {string | null | undefined} userId
 * @param {SaveStorage} [storage]
 * @returns {KeptSave[]} the person's kept saves, oldest first
 */
export function keptSaves(userId, storage = storageOf()) {
  if (!userId) return [];
  try {
    const list = JSON.parse(storage.getItem(PREFIX + userId) || '[]');
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

/** Whether a kept save waits for the person rather than for a connection. @param {KeptSave} save */
export const needsChoice = (save) => Boolean(save.refused || save.conflict);

/** @param {string} userId @param {KeptSave[]} list @param {SaveStorage} storage */
function write(userId, list, storage) {
  try {
    if (list.length) storage.setItem(PREFIX + userId, JSON.stringify(list));
    else storage.removeItem(PREFIX + userId);
  } catch {
    return false;
  }
  globalThis.dispatchEvent?.(new Event(KEPT_SAVES_EVENT));
  return true;
}

/**
 * Keeps a save on this device, after any kept for the same day's check-in or
 * the same journal entry, which it replaces: the account keeps the latest.
 * @param {string} userId
 * @param {{ id: string, kind: KeptSave['kind'], payload: object, edit?: boolean, base?: string | null }} save
 * @param {{ storage?: SaveStorage, now?: () => string }} [options]
 * @returns {boolean} false when it couldn't be kept (storage blocked or full)
 */
export function keepSave(userId, save, { storage = storageOf(), now = () => new Date().toISOString() } = {}) {
  if (!userId) return false;
  const others = keptSaves(userId, storage).filter((item) => item.id !== save.id);
  return write(userId, [...others, { ...save, keptAt: now(), version: Math.random().toString(36).slice(2) }], storage);
}

/** @param {string} userId @param {string} id @param {SaveStorage} [storage] */
export function dropSave(userId, id, storage = storageOf()) {
  return write(userId, keptSaves(userId, storage).filter((item) => item.id !== id), storage);
}

/**
 * Sends a save that waits for the person again: one they chose over the
 * version the account holds, or one the account refused, to try once more.
 * @param {string} userId @param {string} id @param {SaveStorage} [storage]
 */
export function sendAgain(userId, id, storage = storageOf()) {
  const kept = write(userId, keptSaves(userId, storage).map((item) => {
    if (item.id !== id) return item;
    const { refused: _refused, conflict, ...rest } = item;
    return conflict ? { ...rest, force: true } : rest;
  }), storage);
  globalThis.dispatchEvent?.(new Event(SEND_KEPT_SAVES_EVENT));
  return kept;
}

/** @param {string | null | undefined} userId @param {SaveStorage} [storage] */
export function clearKeptSaves(userId, storage = storageOf()) {
  if (userId) write(userId, [], storage);
}

/**
 * Whether a failed save never reached the account: no connection, or a
 * connection that dropped, as opposed to the account refusing it. A request
 * whose answer was lost may still have been saved, which is why sending again
 * must change nothing the second time.
 */
export function isConnectionError(error) {
  if (globalThis.navigator?.onLine === false) return true;
  if (error?.name === 'AuthRetryableFetchError') return true;
  return /Failed to fetch|NetworkError|Load failed|network connection was lost|fetch failed/i.test(String(error?.message || error || ''));
}

/**
 * Records why a kept save waits for the person (refused or conflict).
 * @param {string} userId @param {string} id @param {Partial<KeptSave>} reason @param {SaveStorage} [storage]
 */
export function markSave(userId, id, reason, storage = storageOf()) {
  return write(userId, keptSaves(userId, storage).map((item) => (item.id === id ? { ...item, ...reason } : item)), storage);
}
