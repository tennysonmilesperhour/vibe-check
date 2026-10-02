// Changes made here, written into the cached record (see useLivingData), so
// pages show them without reading a whole part again.

/** @param {string | undefined} userId @param {string} part */
export const recordKey = (userId, part) => ['living', userId, part];

// Each part in the order its query reads it: newest first, then by id.
const newestFirst = (/** @type {string} */ field) => (/** @type {any} */ a, /** @type {any} */ b) => (
  a[field] < b[field] ? 1 : a[field] > b[field] ? -1 : String(a.id).localeCompare(String(b.id))
);
/** @type {Record<string, (a: any, b: any) => number>} */
const ORDER = {
  checkIns: newestFirst('date'), journal: newestFirst('date'), sessions: newestFirst('date'),
  reflections: newestFirst('period_key'), people: newestFirst('created_at'),
};

/**
 * Writes a change into a cached part. A read of the part already under way
 * began before the change was stored and may not hold it: one with a copy in
 * hand is replaced by a read begun now, which everyone waiting on the old one
 * receives, and a first read is waited for, then changed. The copy keeps its
 * age unless fresh says it was just read, and a copy that was due for a
 * reload (marked out of date, or its last reload failed) still gets one. A
 * part no page has loaded is left to load whole.
 * @param {import('@tanstack/react-query').QueryClient} client
 * @param {readonly unknown[]} queryKey @param {(rows: any[]) => any[]} change
 */
async function writeIntoPart(client, queryKey, change, { fresh = false } = {}) {
  const query = client.getQueryCache().find({ queryKey, exact: true });
  if (!query) return;
  if (query.state.fetchStatus !== 'idle') {
    const replace = query.state.data !== undefined;
    await query.fetch(undefined, replace ? { cancelRefetch: true } : undefined).catch(() => {});
    // A read begun after the change was stored holds it.
    if (replace && query.state.status === 'success') return;
  }
  const state = query.state;
  if (state.data === undefined) return;
  const due = state.isInvalidated || state.status === 'error';
  client.setQueryData(queryKey, (/** @type {any[]} */ rows) => change(rows), fresh ? undefined : { updatedAt: state.dataUpdatedAt });
  if (due) client.invalidateQueries({ queryKey, exact: true }).catch(() => {});
}

/**
 * A row saved here, put into its cached part in the part's order: a
 * check-in replaces the one for its date, anything else the row with its id.
 * @param {import('@tanstack/react-query').QueryClient} client
 * @param {string} userId @param {string} part @param {any} row
 */
export function putRecordRow(client, userId, part, row) {
  return writeIntoPart(client, recordKey(userId, part), (rows) => (
    [row, ...rows.filter((other) => other.id !== row.id && !(part === 'checkIns' && other.date === row.date))].sort(ORDER[part])
  ));
}

/** A row removed here, taken out of its cached part. */
export function dropRecordRow(/** @type {import('@tanstack/react-query').QueryClient} */ client, /** @type {string} */ userId, /** @type {string} */ part, /** @type {any} */ id) {
  return writeIntoPart(client, recordKey(userId, part), (rows) => rows.filter((other) => other.id !== id));
}

/**
 * The newest check-ins as stored now (asked for with limit, newest first),
 * replacing the cached ones from the oldest of their dates on: days kept,
 * changed, or removed on another device show too. Fewer rows than asked for
 * are every check-in there is.
 * @param {import('@tanstack/react-query').QueryClient} client
 * @param {string} userId @param {any[]} rows @param {number} limit
 */
export function putRecentCheckIns(client, userId, rows, limit) {
  return writeIntoPart(client, recordKey(userId, 'checkIns'), (cached) => {
    if (rows.length < limit) return [...rows].sort(ORDER.checkIns);
    const oldest = rows[rows.length - 1].date;
    return [...rows, ...cached.filter((row) => row.date < oldest)].sort(ORDER.checkIns);
  }, { fresh: true });
}
