// Words people record, such as feelings and habits, counted the same way
// wherever they are counted.

/**
 * The form of a word used most, a capitalized one in a tie.
 * @param {Map<string, number>} forms Each spelling and how often it was used.
 */
export function commonForm(forms) {
  const capitalized = (/** @type {string} */ form) => (form.charAt(0) !== form.charAt(0).toLowerCase() ? 1 : 0);
  return [...forms].sort((a, b) => b[1] - a[1] || capitalized(b[0]) - capitalized(a[0]) || a[0].localeCompare(b[0]))[0][0];
}

/**
 * Words that differ only in letter case, grouped under their common form,
 * each with the rows it appears in, most first.
 * @template T
 * @param {T[]} rows
 * @param {(row: T) => string[] | undefined} wordsOf
 * @returns {{ label: string, rows: T[] }[]}
 */
export function groupWords(rows, wordsOf) {
  const groups = new Map();
  for (const row of rows) {
    const seen = new Set();
    for (const word of wordsOf(row) || []) {
      const key = word.toLowerCase();
      if (!groups.has(key)) groups.set(key, { rows: [], forms: new Map() });
      const group = groups.get(key);
      group.forms.set(word, (group.forms.get(word) || 0) + 1);
      if (!seen.has(key)) { seen.add(key); group.rows.push(row); }
    }
  }
  return [...groups.values()].map(({ rows: found, forms }) => ({ label: commonForm(forms), rows: found }))
    .sort((a, b) => b.rows.length - a.rows.length || a.label.localeCompare(b.label));
}
