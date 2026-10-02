// Changes made here, written into the cached record (see useLivingData), so
// pages show them without reading a whole part again.

/** @param {string | undefined} userId @param {string} part */
export const recordKey = (userId, part) => ['living', userId, part];

const byDateDesc = (a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0);

/**
 * A row saved here, put into its cached part so every page shows it without
 * reading the part again: a check-in in date order (one per date), anything
 * else in place or first. A part that isn't cached is left to load whole.
 * @param {import('@tanstack/react-query').QueryClient} client
 * @param {string} userId @param {string} part @param {any} row
 */
export function putRecordRow(client, userId, part, row) {
  client.setQueryData(recordKey(userId, part), (/** @type {any[] | undefined} */ rows) => {
    if (!rows) return rows;
    if (part === 'checkIns') return [row, ...rows.filter((other) => other.id !== row.id && other.date !== row.date)].sort(byDateDesc);
    return rows.some((other) => other.id === row.id) ? rows.map((other) => (other.id === row.id ? row : other)) : [row, ...rows];
  });
}

/** A row removed here, taken out of its cached part. */
export function dropRecordRow(/** @type {import('@tanstack/react-query').QueryClient} */ client, /** @type {string} */ userId, /** @type {string} */ part, /** @type {any} */ id) {
  client.setQueryData(recordKey(userId, part), (/** @type {any[] | undefined} */ rows) => rows?.filter((other) => other.id !== id));
}
