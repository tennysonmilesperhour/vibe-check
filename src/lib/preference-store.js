// Preferences are one stored object per person, changed from many places
// (practice choices, pattern feedback, the safety plan, settings). A change
// is merged into the latest stored values and written only if nothing else
// wrote them since they were read: the write matches the row's updated_at,
// which the database moves on every update. When it has moved, the change
// reads and merges again. So no change drops the keys another one set, from
// this tab or another tab or device, and a function patch always changes
// what is stored now. The write also matches the owner, so a change started
// before a sign-out never lands in the next account.
// Callers send only what they changed (a field of the safety plan, not the
// whole plan as this device last saw it), so a key written elsewhere stays.

const MAX_ATTEMPTS = 6;
const REQUEST_MS = 20000;
export const OTHER_ACCOUNT = 'Not saved: a different account is signed in now.';
export const TOO_SLOW = 'Saving is taking too long. Check your connection and try again.';
// Postgres error codes: a row for this owner already exists; the signed-in
// account may not write this owner's row.
export const UNIQUE_VIOLATION = '23505';
export const ROW_SECURITY = '42501';

const pause = (attempt) => new Promise((resolve) => setTimeout(resolve, 40 * attempt + Math.random() * 80));

/**
 * @param {{ read: () => Promise<any>, swap: (row: any, values: any) => Promise<any>, create: (values: any) => Promise<any> }} store
 *   read: the signed-in person's row, if any. swap: write values only if the
 *   row still has the updated_at it was read with; the saved row, or nothing
 *   when it had moved. create: the first row; null when one appeared meanwhile.
 * @param {string | undefined} userId the account the change was made in
 * @param {object | ((stored: any) => object)} patch
 */
export async function mergePreferences(store, userId, patch) {
  if (!userId) throw new Error('Sign in to save this.');
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    if (attempt) await pause(attempt);
    const row = await store.read();
    if (row && row.user_id !== userId) throw new Error(OTHER_ACCOUNT);
    const current = row?.values || {};
    const values = { ...current, ...(typeof patch === 'function' ? patch(current) : patch) };
    const saved = row ? await store.swap(row, values) : await store.create(values);
    if (saved) return saved;
  }
  throw new Error('Your settings were changing somewhere else at the same moment. Please try again.');
}

// Each request is abandoned after requestMs, so a stalled one fails instead of
// holding every later change back, and can't reach the server late.
async function inTime(requestMs, run) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), requestMs);
  try {
    return await run(controller.signal);
  } catch (error) {
    if (controller.signal.aborted) throw new Error(TOO_SLOW);
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * The store for a preferences entity (list, updateWhere, createFor), writing
 * as this account only.
 * @param {any} entity @param {string} userId
 */
export function preferenceStore(entity, userId, requestMs = REQUEST_MS) {
  return {
    read: () => inTime(requestMs, async (signal) => (await entity.list('-created_date', 1, 0, { signal }))[0]),
    swap: (row, values) => inTime(requestMs, async (signal) => (await entity.updateWhere({ id: row.id, user_id: userId, updated_at: row.updated_at }, { values }, { signal }))[0]),
    create: (values) => inTime(requestMs, (signal) => entity.createFor(userId, { values }, { signal })).catch((/** @type {any} */ error) => {
      if (error?.code === UNIQUE_VIOLATION) return null;
      if (error?.code === ROW_SECURITY) throw new Error(OTHER_ACCOUNT);
      throw error;
    }),
  };
}

// Changes from this tab go one at a time, in the order they were made, so a
// later choice about the same thing always lands after an earlier one. Every
// request gives up after REQUEST_MS, so one turn can't hold the rest forever.
let tail = Promise.resolve();
/**
 * @template T
 * @param {() => Promise<T>} work
 * @returns {Promise<T>}
 */
export function inOrder(work) {
  const result = tail.then(work);
  tail = result.then(() => {}, () => {});
  return result;
}
