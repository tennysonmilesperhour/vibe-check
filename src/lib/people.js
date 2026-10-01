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
// Words in a saved name that are never a name on their own: titles and
// small linking words ("Sam from work").
const NEVER_NAMES = new Set([
  'mr', 'mrs', 'ms', 'mx', 'dr', 'miss', 'sir', 'prof', 'my', 'the', 'and', 'or', 'of', 'from', 'at', 'in', 'with', 'for', 'to', 'on', 'by',
  'und', 'et', 'ou', 'בן', 'בת', 'بن', 'ابن', 'بنت',
]);
// A saved name that starts with "mother of" or "father of" (أم أحمد) names
// someone through their child, so only the whole name is theirs.
const KUNYA = new Set(['أم', 'ام', 'أبو', 'ابو']);
// Family, role and place words ("Mike Work", "Sarah From Yoga"): a name
// on their own only as the first word of a saved name ("Son Heung-min").
const ROLE_WORDS = new Set([
  'aunt', 'auntie', 'uncle', 'grandma', 'grandpa', 'nana', 'papa', 'mom', 'mum', 'dad', 'brother', 'sister', 'son', 'daughter', 'wife',
  'husband', 'partner', 'boyfriend', 'girlfriend', 'cousin', 'niece', 'nephew', 'baby', 'ex', 'best', 'old', 'new', 'little', 'big',
  'friend', 'boss', 'coworker', 'colleague', 'neighbor', 'neighbour', 'roommate', 'landlord', 'therapist', 'doctor', 'teacher', 'coach', 'manager',
  'work', 'school', 'gym', 'home', 'office', 'team', 'class', 'church', 'club', 'yoga', 'cell', 'mobile',
]);
// The particles inside names ("de la Cruz"): a name when capitalized
// ("Al Green", "Minh Le", "Van Morrison").
const PARTICLES = new Set(['de', 'da', 'di', 'do', 'dos', 'das', 'del', 'della', 'la', 'le', 'van', 'von', 'der', 'den', 'du', 'bin', 'al', 'el']);
// Letters that attach to the front of a Hebrew or Arabic word ("and", "to",
// "from", and the Arabic article ال), as in ודוד, "and David". Checked only
// for names of three letters or more, where they cannot make another word.
const ATTACHED = {
  Hebrew: /(?:^|[^\p{L}\p{M}])[ובכלמש]{1,3}$/u,
  Arabic: /(?:^|[^\p{L}\p{M}])(?:[وفبلك]{0,2}ال|[وفبلك]{1,2})$/u,
};
// The script of a letter, so a letter of another script ends a word: Sam
// stands on its own in 今天和Sam吃饭, וSam or Samом.
const SCRIPTS = ['Latin', 'Cyrillic', 'Greek', 'Armenian', 'Georgian', 'Hebrew', 'Arabic', 'Devanagari', 'Bengali', 'Gurmukhi', 'Gujarati',
  'Tamil', 'Telugu', 'Kannada', 'Malayalam', 'Sinhala', 'Thai', 'Lao', 'Khmer', 'Myanmar', 'Ethiopic', 'Han', 'Hiragana', 'Katakana', 'Hangul']
  .map((name) => /** @type {[string, RegExp]} */ ([name, new RegExp(`\\p{Script=${name}}`, 'u')]));
const scriptOf = (/** @type {string} */ ch) => SCRIPTS.find(([, test]) => test.test(ch))?.[0] || '';
// Scripts in which names are usually written with a capital.
const CAPITALIZED = /[\p{Script=Latin}\p{Script=Greek}\p{Script=Cyrillic}\p{Script=Armenian}]/u;
// Invisible marks that come along when a name is pasted: zero-width space,
// direction marks and embeddings, and the byte order mark. Joiners stay, as
// some scripts need them.
const INVISIBLE = /[\u00AD\u061C\u180E\u200B\u200E\u200F\u202A-\u202E\u2060-\u2064\u2066-\u2069\uFEFF]/g;
// Ids and timestamps inside text are never read as names; a person's id
// becomes their label as a whole.
const MACHINE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}|\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:?\d{2})?/gi;
// Decoration around a saved name, such as "Jess 💜".
const DECORATION = /^[\p{P}\p{S}\p{Extended_Pictographic}\uFE0F\u200D\s]+|[\p{P}\p{S}\p{Extended_Pictographic}\uFE0F\u200D\s]+$/gu;
// "Sam's" in "Sam's mom" names someone else.
const POSSESSIVE = /['’ʼ]s$|s['’ʼ]$/iu;
const APOSTROPHE = /['’ʼ]/;
const DIGIT = /\p{N}/u;
// Letters of the same script, and the marks that combine with them, carry
// a word on; an apostrophe, a digit, punctuation, a space or a letter of
// another script ends it.
const WORD = /[\p{L}\p{M}]/u;
const MARK = /\p{M}/u;
const continuesWord = (/** @type {string} */ ch, /** @type {string} */ neighbour) => {
  if (!ch || !WORD.test(ch) || APOSTROPHE.test(ch)) return false;
  return MARK.test(ch) || scriptOf(ch) === scriptOf(neighbour);
};
const hasCase = (/** @type {string} */ ch) => ch.toLowerCase() !== ch.toUpperCase();
const isUpper = (/** @type {string} */ ch) => hasCase(ch) && ch === ch.toUpperCase();
const isLower = (/** @type {string} */ ch) => hasCase(ch) && ch === ch.toLowerCase();
// Comparisons that ignore letter case, including Turkish dotted and dotless i.
const fold = (/** @type {string} */ text) => text.toLowerCase().replace(/ı/g, 'i').replace(/\u0307/g, '').replace(/['’ʼ]/g, '');

/** @param {unknown} value */
const cleanName = (value) => (typeof value === 'string' ? value.normalize('NFC').replace(INVISIBLE, '').trim() : '');
const withoutNote = (/** @type {string} */ name) => name.replace(/\s*\([^)]*\)\s*$/, '').trim();
// Any apostrophe or none, any run of spaces, and any form of i stand for
// each other.
const namePattern = (/** @type {string} */ name) => escapeRegex(name)
  .replace(/['’ʼ]/g, "['’ʼ]?").replace(/\s+/g, '\\s+').replace(/[iIıİ]/g, '[iIıİ]');

/** The whole character before an index, or ''. @param {string} text @param {number} index */
function charBefore(text, index) {
  if (index <= 0) return '';
  const low = text.charCodeAt(index - 1);
  return index > 1 && low >= 0xdc00 && low <= 0xdfff ? text.slice(index - 2, index) : text[index - 1];
}

/**
 * Whether a match sits inside a hashtag or handle (#SamBirthday), where the
 * capitals show where a joined name starts and ends.
 * @param {string} text @param {number} index
 */
function inTag(text, index) {
  let at = index;
  while (at > 0 && /[\p{L}\p{M}\p{N}_]/u.test(charBefore(text, at))) at -= charBefore(text, at).length;
  return at > 0 && /[#@]/.test(text[at - 1]);
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
 * @returns {(text: string, options?: { parts?: boolean | 'phrase' }) => string}
 *   parts: false matches whole saved names only; 'phrase' allows words of a
 *   longer name when the text runs to several words, as a feeling phrase may.
 */
export function peopleNameReplacer(people, labelOf, extra = () => []) {
  /** @type {Map<string, string>} */
  const exactIds = new Map();
  // Spellings that differ only in case or apostrophes share one rule.
  /** @type {Map<string, { spellings: Set<string>, whole: Set<string>, part: Set<string> }>} */
  const variants = new Map();
  const add = (/** @type {string} */ name, /** @type {string} */ label, /** @type {boolean} */ whole) => {
    if (!name || !label) return;
    const key = fold(name).replace(/\s+/g, ' ');
    const found = variants.get(key) || { spellings: new Set(), whole: new Set(), part: new Set() };
    found.spellings.add(name);
    (whole ? found.whole : found.part).add(label);
    variants.set(key, found);
  };
  for (const person of people) {
    if (!person) continue;
    const label = labelOf(person);
    const saved = [person.name, ...(Array.isArray(person.legacy_names) ? person.legacy_names : [])].map(cleanName).filter(Boolean);
    for (const name of saved) {
      const bare = withoutNote(name).replace(DECORATION, '');
      for (const whole of [name, bare].filter(Boolean)) {
        add(whole, label, true);
        // "张 伟" is written 张伟 in running text.
        if (UNSPACED.test(whole) && /\s/.test(whole)) add(whole.replace(/\s+/g, ''), label, true);
      }
      // A Chinese or Korean name saved without a space: the given name, and
      // for four characters both halves, as people write them on their own.
      if (/^(?:\p{Script=Han}{3,4}|\p{Script=Hangul}{3,4})$/u.test(bare)) {
        const chars = [...bare];
        if (chars.length === 3) add(chars.slice(1).join(''), label, false);
        else { add(chars.slice(0, 2).join(''), label, false); add(chars.slice(2).join(''), label, false); }
      }
      // Couples and aliases are often saved as "Jen&Tom" or "Sam/Samuel".
      const raw = bare.split(/[\s/&+|,]+/).filter(Boolean);
      if (raw.length < 2 || KUNYA.has(raw[0])) continue;
      raw.forEach((piece, position) => {
        // "Sam's" in "Sam's mom", or "Chris'" in "Chris' mom", names someone else.
        if (POSSESSIVE.test(piece.replace(/[^\p{L}\p{M}\p{N}'’ʼ]+$/u, ''))) return;
        const word = piece.replace(/^[\p{P}\p{S}]+|[\p{P}\p{S}]+$/gu, '');
        const lower = word.toLowerCase();
        if ((word.match(/\p{L}/gu) || []).length < 2 || NEVER_NAMES.has(lower)) return;
        if (PARTICLES.has(lower) && word === lower) return;
        if (ROLE_WORDS.has(lower) && (position > 0 || word === lower)) return;
        add(word, label, false);
      });
    }
    for (const value of extra(person)) {
      const exact = cleanName(value);
      if (exact.match(MACHINE)?.[0] === exact) exactIds.set(exact.toLowerCase(), label);
      else add(exact, label, true);
    }
  }

  // Each match becomes a placeholder of private-use characters, which no
  // name contains, so no label is matched again by a later, shorter name.
  // A placeholder holds its index in two private-use characters.
  const SPAN = 0x700;
  const placeholder = (/** @type {number} */ index) => `\uE000${String.fromCharCode(0xE100 + Math.floor(index / SPAN), 0xE100 + (index % SPAN))}\uE001`;
  /** @type {string[]} */
  const tokens = [];
  const tokenFor = (/** @type {string} */ value) => placeholder(tokens.push(value) - 1);
  const longest = (/** @type {Set<string>} */ spellings) => [...spellings].sort((a, b) => b.length - a.length)[0];
  const rules = [...variants.values()].sort((a, b) => longest(b.spellings).length - longest(a.spellings).length).map(({ spellings, whole, part }) => {
    const name = longest(spellings);
    // A one-letter name ("T") matches only as saved, so the t in "don't" stays.
    const exactCase = (name.match(/\p{L}/gu) || []).length < 2;
    const attached = ATTACHED[scriptOf(name)];
    const prefixed = attached && (name.match(/\p{L}/gu) || []).length >= 3 ? attached : null;
    const owners = whole.size ? whole : part;
    const token = tokenFor([...owners].join(' or '));
    const unspaced = UNSPACED.test(name);
    const isPart = !whole.size;
    const hint = fold(name.split(/\s+/)[0]);
    const pattern = new RegExp([...spellings].sort((a, b) => b.length - a.length).map(namePattern).join('|'), 'giu');
    return { isPart, hint, apply: (/** @type {string} */ text) => text.replace(pattern, (match, offset) => {
        if (exactCase && !spellings.has(match)) return match;
        const first = charAt(match, 0);
        // A word of a longer name counts only when it starts with a capital,
        // in scripts where names are written that way.
        if (isPart && CAPITALIZED.test(first) && !isUpper(first)) return match;
        const before = charBefore(text, offset);
        const after = charAt(text, offset + match.length);
        if (!unspaced) {
          const last = charBefore(match, match.length);
          // A name joined to a word, as in #SamBirthday, still counts when
          // the capitals show where it starts and ends; so does a Hebrew or
          // Arabic name after the letters that attach to the front of words.
          const tag = inTag(text, offset);
          const leftOk = !continuesWord(before, first) || (tag && isLower(before) && isUpper(first)) || Boolean(prefixed?.test(text.slice(Math.max(0, offset - 8), offset)));
          const rightOk = !continuesWord(after, last) || (tag && isLower(last) && isUpper(after));
          if (!leftOk || !rightOk) return match;
          // In DON'T or IT'S, the letter after the apostrophe is not a name.
          if (exactCase && APOSTROPHE.test(before) && continuesWord(charBefore(text, offset - before.length), first)) return match;
        }
        // "Sam2" reads "Person 1 2", not "Person 12".
        return `${DIGIT.test(before) ? ' ' : ''}${token}${DIGIT.test(after) ? ' ' : ''}`;
      }) };
  });
  const fixedTokens = tokens.length;
  const restore = (/** @type {string} */ text, /** @type {string[]} */ kept) => text.replace(/\uE000([\uE100-\uE7FF])([\uE100-\uE7FF])\uE001/g, (match, high, low) => {
    const index = (high.charCodeAt(0) - 0xE100) * SPAN + (low.charCodeAt(0) - 0xE100);
    return (index < fixedTokens ? tokens[index] : kept[index - fixedTokens]) ?? match;
  });
  return (text, { parts = true } = {}) => {
    const original = String(text ?? '');
    const useParts = parts === 'phrase' ? /\s/.test(original.trim()) || UNSPACED.test(original) : parts;
    // Invisible marks inside a name in the text, as in a pasted copy, do not
    // hide it.
    const normalized = original.normalize('NFC').replace(INVISIBLE, '');
    // Ids and timestamps are set aside first: a person's id becomes their
    // label, and any other is kept exactly as it was.
    /** @type {string[]} */
    const kept = [];
    let labelled = false;
    let current = normalized.replace(MACHINE, (match) => {
      const label = exactIds.get(match.toLowerCase());
      if (label) labelled = true;
      return placeholder(fixedTokens + kept.push(label ?? match) - 1);
    });
    const setAside = current;
    // A rule runs only where its first word appears at all.
    let folded = fold(current);
    for (const rule of rules) {
      if ((rule.isPart && !useParts) || !folded.includes(rule.hint)) continue;
      const next = rule.apply(current);
      if (next !== current) { current = next; folded = fold(current); }
    }
    return current !== setAside || labelled ? restore(current, kept) : original;
  };
}
