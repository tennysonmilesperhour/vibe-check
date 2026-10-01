// Person model helpers: matching, migration, and historical text linking.
// Replaces the old load-bearing substring match ("Mom" matched "Tom's mommy")
// with whole-word matching against names and legacy aliases.

/** @param {string} s */
export const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** How an interaction felt, and whether a boundary was respected: the journal's choices. */
export const INTERACTION_FEELINGS = ['supportive', 'strained', 'unsafe', 'mixed', 'unsure'];
export const BOUNDARY_ANSWERS = ['yes', 'no', 'unsure'];

function aliasesOf(person) {
  return [person.name, ...(person.legacy_names || [])].filter(Boolean);
}

export function samePersonId(a, b) {
  return Boolean(a) && Boolean(b) && String(a).toLowerCase() === String(b).toLowerCase();
}

/** Picker ids from the day, high moment, and low moment, without duplicates. */
export function entryPeople(entry) {
  return [...new Set([...(entry.person_ids || []), ...(entry.high_moment?.person_ids || []), ...(entry.low_moment?.person_ids || [])])];
}

/** Picker search: name or alias contains the query. Empty query returns everyone. */
export function searchPeople(query, people) {
  const needle = (query || '').trim().toLowerCase();
  if (!needle) return people;
  return people.filter((person) => aliasesOf(person).some((alias) => alias.toLowerCase().includes(needle)));
}

/** Exact (case-insensitive) name or legacy-alias match. Returns the person or null. */
export function matchPersonByText(text, people) {
  if (!text) return null;
  const needle = text.trim().toLowerCase();
  for (const person of people) {
    if (aliasesOf(person).some((a) => a.toLowerCase() === needle)) return person;
  }
  return null;
}

/** Whole-word mention of a person (any alias) inside free text. */
export function mentionsPerson(text, person) {
  if (!text) return false;
  return aliasesOf(person).some((alias) => {
    // \b fails around punctuation-heavy names, so use non-word-char boundaries.
    const re = new RegExp(`(^|\\W)${escapeRegex(alias.toLowerCase())}($|\\W)`, 'i');
    return re.test(text.toLowerCase());
  });
}

/** Union-merge person drafts that share a lowercase name (migration helper). */
export function dedupePeopleDrafts(drafts) {
  const byName = new Map();
  for (const draft of drafts) {
    const key = draft.name.trim().toLowerCase();
    const prior = byName.get(key);
    if (!prior) {
      byName.set(key, { ...draft, legacy_names: [...(draft.legacy_names || [])] });
      continue;
    }
    byName.set(key, {
      ...prior,
      ...Object.fromEntries(Object.entries(draft).filter(([, v]) => v !== undefined && v !== null && v !== '')),
      name: prior.name, // first spelling wins for display
      qualities: [...new Set([...(prior.qualities || []), ...(draft.qualities || [])])],
      concerns: [...new Set([...(prior.concerns || []), ...(draft.concerns || [])])],
      legacy_names: [...new Set([...(prior.legacy_names || []), ...(draft.legacy_names || [])])],
    });
  }
  return [...byName.values()];
}

/**
 * One-time, idempotent migration: Relationship + Connection -> Person.
 * Safe to call on every mount; bails fast once people exist or marker is set.
 */
export async function migratePeople({ Person, Relationship, Connection, auth }) {
  const me = await auth.me();
  if (me?.people_migrated_at) return { migrated: false };

  const existing = await Person.list();
  if (existing.length > 0) {
    await auth.updateMe({ people_migrated_at: new Date().toISOString() });
    return { migrated: false };
  }

  const [relationships, connections] = await Promise.all([
    Relationship.list().catch(() => []),
    Connection.list().catch(() => []),
  ]);

  const drafts = [
    ...relationships.map((r) => ({
      name: r.name,
      person_type: r.relationship_type || 'other',
      qualities: r.qualities || [],
      concerns: r.concerns || [],
      boundary_notes: r.boundary_notes || '',
      legacy_names: [],
    })),
    ...connections.map((c) => ({
      name: c.target_name || c.target_email,
      person_type: c.connection_type || 'friend',
      linked_user_email: c.target_email,
      cosmic_snapshot: c.target_cosmic_profile || null,
      snapshot_updated_at: c.updated_date || c.created_date,
      legacy_names: [],
    })),
  ].filter((d) => d.name);

  const merged = dedupePeopleDrafts(drafts);
  for (const draft of merged) {
    await Person.create(draft);
  }
  await auth.updateMe({ people_migrated_at: new Date().toISOString() });
  return { migrated: true, count: merged.length };
}

/**
 * True when this entry tagged the person with the picker, including people
 * recorded only on a high or low moment. Historical who_involved text is a
 * fallback only when the picker was never used on the entry.
 */
export function entryInvolvesPerson(entry, person) {
  if (!entry || !person?.id) return false;
  const ids = entryPeople(entry);
  if (ids.some((id) => samePersonId(id, person.id))) return true;
  if (ids.length) return false;
  const texts = [entry.high_moment?.who_involved, entry.low_moment?.who_involved];
  return texts.some((text) => text && mentionsPerson(text, person));
}

/** Historical mood stats for a person from check-ins (picker tags, including nested moments). */
export function personCheckInStats(person, checkIns) {
  const involved = checkIns.filter((entry) => entryInvolvesPerson(entry, person));
  if (involved.length === 0) return { mentions: 0, avgMood: null, lastMention: null };
  const scored = involved.filter((entry) => entry.mood_score != null);
  const avgMood = scored.length
    ? scored.reduce((a, e) => a + Number(e.mood_score), 0) / scored.length
    : null;
  const lastMention = involved.map((e) => e.date).filter(Boolean).sort().at(-1) || null;
  return { mentions: involved.length, avgMood: avgMood == null ? null : Math.round(avgMood * 10) / 10, lastMention };
}

export function personMentionCount(person, entries) {
  return entries.filter((entry) => entryInvolvesPerson(entry, person)).length;
}

/** Other people tagged in the same check-in or journal moment via the picker. */
export function peopleRecordedTogether(person, people, entries) {
  const shared = new Map();
  for (const entry of entries) {
    if (!entryInvolvesPerson(entry, person)) continue;
    for (const id of entryPeople(entry)) {
      if (samePersonId(id, person.id)) continue;
      const key = String(id).toLowerCase();
      shared.set(key, (shared.get(key) || 0) + 1);
    }
  }
  return people
    .filter((other) => !samePersonId(other.id, person.id) && shared.has(String(other.id).toLowerCase()))
    .map((other) => ({ person: other, shared: shared.get(String(other.id).toLowerCase()) }))
    .sort((a, b) => b.shared - a.shared || a.person.name.localeCompare(b.person.name));
}

function companionScore(a, b, entries) {
  return entries.filter((entry) => entryInvolvesPerson(entry, a) && entryInvolvesPerson(entry, b)).length;
}

/** Frequent people first so the inner orbit reflects tracking proximity. */
export function orderPeopleForOrbit(people, entries) {
  const scored = people.map((person) => ({ person, mentions: personMentionCount(person, entries) }));
  scored.sort((a, b) => b.mentions - a.mentions || a.person.name.localeCompare(b.person.name));
  return scored.map((row) => row.person);
}

/** Sit people who were tagged together nearer each other on a ring. */
export function arrangeOrbitRing(people, entries) {
  if (people.length <= 2) return [...people];
  const remaining = [...people];
  const ordered = [remaining.shift()];
  while (remaining.length) {
    const last = ordered[ordered.length - 1];
    remaining.sort((a, b) => companionScore(last, b, entries) - companionScore(last, a, entries) || a.name.localeCompare(b.name));
    ordered.push(remaining.shift());
  }
  return ordered;
}

/**
 * People in the order they were added, the order "Person 1", "Person 2" and
 * so on follow wherever names are replaced with labels.
 * @param {any[]} people
 */
export function peopleInAddedOrder(people) {
  const added = (/** @type {any} */ person) => (typeof person?.created_at === 'string' ? person.created_at : '');
  return people.filter((person) => person?.id).sort((a, b) => added(a).localeCompare(added(b)) || String(a.id).localeCompare(String(b.id)));
}

/**
 * Labels for people in a shared record: "Person 1", "Person 2" and so on in
 * the order people were added, and "Removed person 1" and so on for ids
 * still on entries whose person is gone, so the two never collide. Numbers
 * stay the same from one summary or export to the next unless someone added
 * earlier is removed.
 * @param {any[]} people @param {Iterable<string>} [ids] ids that appear on entries
 * @returns {Map<string, string>}
 */
export function personLabels(people, ids = []) {
  const labels = new Map(peopleInAddedOrder(people).map((person, i) => [person.id, `Person ${i + 1}`]));
  [...new Set(ids)].filter((id) => id && !labels.has(id)).sort().forEach((id, i) => labels.set(id, `Removed person ${i + 1}`));
  return labels;
}

// Names in these scripts are usually written without spaces around them
// (Chinese, Japanese, Thai, and Korean, where particles attach to names), so
// they are matched inside longer runs of letters too.
const UNSPACED = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}\p{Script=Thai}\p{Script=Lao}\p{Script=Khmer}\p{Script=Myanmar}]/u;
// Words in a saved name that are not a name on their own.
const NOT_NAMES = new Set(['mr', 'mrs', 'ms', 'mx', 'dr', 'miss', 'sir', 'prof', 'aunt', 'auntie', 'uncle', 'grandma', 'grandpa', 'nana', 'papa', 'mom', 'mum', 'dad', 'my', 'the', 'and', 'of']);
const APOSTROPHE = /['’ʼ]/;
// Letters and the marks that combine with them carry a word on; an
// apostrophe, a digit, punctuation or a space ends it.
const WORD = /[\p{L}\p{M}]/u;
const continuesWord = (/** @type {string} */ ch) => Boolean(ch) && WORD.test(ch) && !APOSTROPHE.test(ch);
const hasCase = (/** @type {string} */ ch) => ch.toLowerCase() !== ch.toUpperCase();
const isUpper = (/** @type {string} */ ch) => hasCase(ch) && ch === ch.toUpperCase();
const isLower = (/** @type {string} */ ch) => hasCase(ch) && ch === ch.toLowerCase();
// Comparisons that ignore letter case, including Turkish dotted and dotless i.
const fold = (/** @type {string} */ text) => text.toLowerCase().replace(/ı/g, 'i').replace(/\u0307/g, '').replace(/['’ʼ]/g, '');

/** @param {unknown} value */
const cleanName = (value) => (typeof value === 'string' ? value.normalize('NFC').trim() : '');
const withoutNote = (/** @type {string} */ name) => name.replace(/\s*\([^)]*\)\s*$/, '').trim();
// Any apostrophe, any run of spaces, and any form of i stand for each other.
const namePattern = (/** @type {string} */ name) => escapeRegex(name)
  .replace(/['’ʼ]/g, "['’ʼ]").replace(/\s+/g, '\\s+').replace(/[iIıİ]/g, '[iIıİ]');

/** The whole character before an index, or ''. @param {string} text @param {number} index */
function charBefore(text, index) {
  if (index <= 0) return '';
  const low = text.charCodeAt(index - 1);
  return index > 1 && low >= 0xdc00 && low <= 0xdfff ? text.slice(index - 2, index) : text[index - 1];
}

/** The whole character at an index, or ''. @param {string} text @param {number} index */
const charAt = (text, index) => (index < text.length ? String.fromCodePoint(/** @type {number} */ (text.codePointAt(index))) : '');

/**
 * Replaces people's names in free text with labels. For each person it
 * matches, as whole words:
 * - the saved name and earlier names, in any letter case, with or without a
 *   trailing note in brackets ("Jordan (work)");
 * - in free text, each word of a longer name on its own ("Jordan", "Smith")
 *   when it starts with a capital, as names usually are;
 * - extra exact strings such as ids.
 * In scripts written without spaces, names match inside longer runs of
 * letters. A name two people share gets both labels, and a whole saved name
 * outranks the same word inside a longer name. Names of people no longer
 * saved, and names spelled another way, cannot be known and stay.
 * @param {any[]} people
 * @param {(person: any) => string} labelOf
 * @param {(person: any) => unknown[]} [extra]
 * @returns {(text: string, options?: { parts?: boolean }) => string}
 */
export function peopleNameReplacer(people, labelOf, extra = () => []) {
  /** @type {Map<string, { name: string, whole: Set<string>, part: Set<string> }>} */
  const variants = new Map();
  const add = (/** @type {string} */ name, /** @type {string} */ label, /** @type {boolean} */ whole) => {
    if (!name || !label) return;
    const key = fold(name).replace(/\s+/g, ' ');
    const found = variants.get(key) || { name, whole: new Set(), part: new Set() };
    (whole ? found.whole : found.part).add(label);
    variants.set(key, found);
  };
  for (const person of people) {
    if (!person) continue;
    const label = labelOf(person);
    const saved = [person.name, ...(Array.isArray(person.legacy_names) ? person.legacy_names : [])].map(cleanName).filter(Boolean);
    for (const name of saved) {
      const bare = withoutNote(name);
      for (const whole of [name, bare]) {
        add(whole, label, true);
        // "张 伟" is written 张伟 in running text.
        if (UNSPACED.test(whole) && /\s/.test(whole)) add(whole.replace(/\s+/g, ''), label, true);
      }
      const words = bare.split(/\s+/).map((word) => word.replace(/^[\p{P}\p{S}]+|[\p{P}\p{S}]+$/gu, '')).filter(Boolean);
      if (words.length < 2) continue;
      for (const word of words) {
        if ((word.match(/\p{L}/gu) || []).length < 2 || NOT_NAMES.has(word.toLowerCase())) continue;
        add(word, label, false);
      }
    }
    for (const value of extra(person)) add(cleanName(value), label, true);
  }

  // Each match becomes a placeholder of private-use characters, which no
  // name contains, so no label is matched again by a later, shorter name.
  /** @type {string[]} */
  const tokens = [];
  const rules = [...variants.values()].sort((a, b) => b.name.length - a.name.length).map(({ name, whole, part }) => {
    const owners = whole.size ? whole : part;
    const token = `\uE000${String.fromCharCode(0xE100 + tokens.length)}\uE001`;
    tokens.push([...owners].join(' or '));
    const unspaced = UNSPACED.test(name);
    const isPart = !whole.size;
    const hint = fold(name.split(/\s+/)[0]);
    const pattern = new RegExp(namePattern(name), 'giu');
    return { isPart, hint, apply: (/** @type {string} */ text) => text.replace(pattern, (match, offset) => {
        const first = charAt(match, 0);
        // A word of a longer name counts only when it starts with a capital.
        if (isPart && hasCase(first) && !isUpper(first)) return match;
        if (unspaced) return token;
        const before = charBefore(text, offset);
        const after = charAt(text, offset + match.length);
        const last = charBefore(match, match.length);
        // A name joined to a word, as in #SamBirthday, still counts when the
        // capitals show where it starts and ends.
        const leftOk = !continuesWord(before) || (isLower(before) && isUpper(first));
        const rightOk = !continuesWord(after) || (isLower(last) && isUpper(after));
        if (!leftOk || !rightOk) return match;
        // "Sam2" reads "Person 1 2", not "Person 12".
        const digit = /\p{N}/u;
        return `${digit.test(before) ? ' ' : ''}${token}${digit.test(after) ? ' ' : ''}`;
      }) };
  });
  const restore = (/** @type {string} */ text) => text.replace(/\uE000([\uE100-\uF8FF])\uE001/g, (match, code) => tokens[code.charCodeAt(0) - 0xE100] ?? match);
  return (text, { parts = true } = {}) => {
    let current = String(text ?? '').normalize('NFC');
    // A rule runs only where its first word appears at all.
    let folded = fold(current);
    for (const rule of rules) {
      if ((rule.isPart && !parts) || !folded.includes(rule.hint)) continue;
      const next = rule.apply(current);
      if (next !== current) { current = next; folded = fold(current); }
    }
    return restore(current);
  };
}
