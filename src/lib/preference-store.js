// Preferences are one stored object per person, changed from many places
// (practice choices, pattern feedback, the safety plan, settings). A change
// is merged into the latest stored values and written only if nothing else
// wrote them since they were read: the write matches the row's updated_at,
// which the database moves on every update. When it has moved, the change
// reads and merges again. So two quick changes, or changes from two tabs or
// devices, never drop one another, and a function patch always changes
// what is stored now. The write also matches the owner, so a change started
// before a sign-out never lands in the next account.

const MAX_ATTEMPTS = 5;
const OTHER_ACCOUNT = 'Not saved: a different account is signed in now.';

/**
 * @param {{ read: () => Promise<any>, swap: (row: any, values: any) => Promise<any>, create: (values: any) => Promise<any> }} store
 *   read: the signed-in person's row, if any. swap: write values only if the
 *   row still has the updated_at it was read with; the saved row, or nothing
 *   when it had moved. create: the first row; null when one appeared meanwhile.
 * @param {string} userId the account the change was made in
 * @param {object | ((stored: any) => object)} patch
 */
export async function mergePreferences(store, userId, patch) {
  if (!userId) throw new Error('Sign in to save this.');
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    const row = await store.read();
    if (row && row.user_id !== userId) throw new Error(OTHER_ACCOUNT);
    const current = row?.values || {};
    const values = { ...current, ...(typeof patch === 'function' ? patch(current) : patch) };
    const saved = row ? await store.swap(row, values) : await store.create(values);
    if (saved) return saved;
  }
  throw new Error('Your settings were changing somewhere else at the same moment. Please try again.');
}

/** Postgres error codes: a row for this owner already exists; another account is signed in. */
export const UNIQUE_VIOLATION = '23505';
export const ROW_SECURITY = '42501';
export { OTHER_ACCOUNT };
