// Sending the saves kept on this device (kept-saves.js). Each answer decides
// what happens to a save: sent, tried again later, or left for the person to
// choose.
import { dropSave, keptSaves, markSave, needsChoice } from './kept-saves';

/** @typedef {import('./kept-saves').KeptSave} KeptSave */
/** @typedef {import('./kept-saves').SaveStorage} SaveStorage */

/**
 * Whether the account answered and refused the save itself, so sending it
 * again would get the same answer: a request PostgREST rejects (PGRST1xx,
 * PGRST2xx) or a database error about the data or the person's access
 * (classes 21, 22, 23, 42, 44, 54, and P0 from a trigger). A lost connection,
 * a server or gateway in trouble, or an expired session (PGRST3xx) is tried
 * again later instead.
 */
export function isRefusal(error) {
  return /^(PGRST[12]\d\d|(21|22|23|42|44|54|P0)[0-9A-Z]{3})$/.test(String(error?.code || ''));
}

/** Whether a save waits on the person: the account holds a different version. */
export const changedElsewhere = (/** @type {string} */ message) => Object.assign(new Error(message), { changedElsewhere: true });

const ISO_TIME = /^\d{4}-\d{2}-\d{2}T/;
/** @param {any} stored @param {any} kept */
function same(stored, kept) {
  if (stored == null || kept == null) return stored == null && kept == null;
  if (Array.isArray(stored) || Array.isArray(kept)) {
    return Array.isArray(stored) && Array.isArray(kept) && stored.length === kept.length && stored.every((item, i) => same(item, kept[i]));
  }
  if (typeof stored === 'object' && typeof kept === 'object') {
    return [...new Set([...Object.keys(stored), ...Object.keys(kept)])].every((key) => same(stored[key], kept[key]));
  }
  // The database writes a time its own way: 12:30:00+00:00 for 12:30:00.000Z.
  if (typeof stored === 'string' && typeof kept === 'string' && ISO_TIME.test(stored) && ISO_TIME.test(kept)) return Date.parse(stored) === Date.parse(kept);
  return stored === kept;
}

/**
 * Whether a stored row already holds everything a kept save writes: the save
 * was sent before and only its answer was lost on the way back.
 * @param {object} row @param {object} payload
 */
export function holdsSave(row, payload) {
  return Object.entries(payload).every(([key, value]) => same(row?.[key], value));
}

/**
 * Sends the person's kept saves in the order they were kept, removing each
 * once sent. Stops at the first save that can't reach the account, leaving
 * the rest for the next try. One the account refuses, or that would replace
 * a version saved somewhere else, stays with the reason for the person to
 * decide; sending it again wouldn't change the answer.
 * @param {string} userId
 * @param {(save: KeptSave) => Promise<unknown>} send
 * @param {SaveStorage} [storage]
 * @returns {Promise<{ sent: number, waiting: number }>}
 */
export async function sendKeptSaves(userId, send, storage = globalThis.localStorage) {
  let sent = 0;
  // Only this version of the save: a newer one kept meanwhile is sent next.
  const current = (save) => keptSaves(userId, storage).find((item) => item.id === save.id)?.version === save.version;
  for (const save of keptSaves(userId, storage)) {
    if (needsChoice(save)) continue;
    try {
      await send(save);
    } catch (error) {
      const reason = error?.changedElsewhere ? { conflict: error.message } : isRefusal(error) ? { refused: error?.message || 'The account refused it.' } : null;
      if (!reason) break;
      if (current(save)) markSave(userId, save.id, reason, storage);
      continue;
    }
    if (current(save)) dropSave(userId, save.id, storage);
    sent += 1;
  }
  return { sent, waiting: keptSaves(userId, storage).length };
}
