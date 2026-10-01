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

// Names in these scripts are usually written without spaces around them
// (Chinese, Japanese, Thai, and Korean, where particles attach to names), so
// they are matched inside longer runs of letters too.
const UNSPACED = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}\p{Script=Thai}\p{Script=Lao}\p{Script=Khmer}\p{Script=Myanmar}]/u;
// Words in a saved name that are not a name on their own.
const NOT_NAMES = new Set(['mr', 'mrs', 'ms', 'mx', 'dr', 'miss', 'sir', 'prof', 'aunt', 'auntie', 'uncle', 'grandma', 'grandpa', 'nana', 'papa', 'mom', 'mum', 'dad', 'my', 'the', 'and', 'of', 'from', 'at', 'work']);
const LETTER = /\p{L}/gu;

/** @param {unknown} value */
const cleanName = (value) => (typeof value === 'string' ? value.normalize('NFC').trim() : '');
// Straight and curly apostrophes stand for each other.
const namePattern = (/** @type {string} */ name) => escapeRegex(name).replace(/['’ʼ]/g, "['’ʼ]");

/**
 * Replaces people's names in free text with labels. For each person it
 * matches the saved name in any letter case, the name without a trailing
 * note in brackets ("Jordan (work)"), earlier names, and each word of a
 * longer name on its own ("Jordan", "Smith") when written with a capital as
 * names usually are; extra exact strings, such as ids, can be added. Matches
 * are whole words, except in scripts written without spaces. A name that
 * two people share is replaced with both labels. Names of people no longer
 * saved, and names spelled another way, cannot be known and stay.
 * @param {any[]} people
 * @param {(person: any) => string} labelOf
 * @param {(person: any) => unknown[]} [extra]
 * @returns {(text: string) => string}
 */
export function peopleNameReplacer(people, labelOf, extra = () => []) {
  // A whole saved name outranks the same word as part of a longer name:
  // "Sam" is the person saved as Sam, not Sam Lee.
  /** @type {Map<string, { name: string, whole: Set<string>, part: Set<string> }>} */
  const variants = new Map();
  const add = (/** @type {string} */ name, /** @type {string} */ label, /** @type {boolean} */ whole) => {
    if (!name || !label) return;
    const key = name.toLowerCase();
    const found = variants.get(key) || { name, whole: new Set(), part: new Set() };
    (whole ? found.whole : found.part).add(label);
    variants.set(key, found);
  };
  for (const person of people) {
    if (!person) continue;
    const label = labelOf(person);
    const full = [person.name, ...(Array.isArray(person.legacy_names) ? person.legacy_names : [])].map(cleanName).filter(Boolean);
    const names = [...new Set(full.flatMap((name) => [name, name.replace(/\s*\([^)]*\)\s*$/, '').trim()]))].filter(Boolean);
    for (const name of names) {
      add(name, label, true);
      const words = name.split(/\s+/).map((word) => word.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, ''));
      if (words.length < 2) continue;
      for (const word of words) {
        if ((word.match(LETTER) || []).length < 2 || NOT_NAMES.has(word.toLowerCase())) continue;
        add(word.charAt(0).toUpperCase() + word.slice(1), label, false);
      }
    }
    for (const value of extra(person)) add(cleanName(value), label, true);
  }
  // Each match becomes a placeholder first, so no label is matched again by
  // a later, shorter name.
  const labels = [];
  const rules = [...variants.values()]
    .sort((a, b) => b.name.length - a.name.length)
    .map(({ name, whole, part }) => {
      const token = `\uE000${labels.push([...(whole.size ? whole : part)].join(' or ')) - 1}\uE001`;
      const flags = whole.size ? 'giu' : 'gu';
      if (UNSPACED.test(name)) {
        const inside = new RegExp(namePattern(name), flags);
        return (/** @type {string} */ text) => text.replace(inside, token);
      }
      const pattern = new RegExp(`(^|[^\\p{L}\\p{N}_])${namePattern(name)}(?=[^\\p{L}\\p{N}_]|$)`, flags);
      return (/** @type {string} */ text) => text.replace(pattern, (_, before) => before + token);
    });
  return (text) => rules.reduce((current, rule) => rule(current), String(text ?? '').normalize('NFC'))
    .replace(/\uE000(\d+)\uE001/g, (_, index) => labels[Number(index)]);
}
