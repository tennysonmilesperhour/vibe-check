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
 * One-time, idempotent migration: Relationship -> Person.
 * Safe to call on every mount; bails fast once people exist or marker is set.
 * Base44 connections are not brought over: they held other accounts' email
 * addresses and charts.
 */
export async function migratePeople({ Person, Relationship, auth }) {
  const me = await auth.me();
  if (me?.people_migrated_at) return { migrated: false };

  const existing = await Person.list();
  if (existing.length > 0) {
    await auth.updateMe({ people_migrated_at: new Date().toISOString() });
    return { migrated: false };
  }

  const relationships = await Relationship.list().catch(() => []);

  const drafts = relationships.map((r) => ({
    name: r.name,
    person_type: r.relationship_type || 'other',
    qualities: r.qualities || [],
    concerns: r.concerns || [],
    boundary_notes: r.boundary_notes || '',
    legacy_names: [],
  })).filter((d) => d.name);

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

/** The entries a person is part of, in the order given (newest first from timelineEntries): their timeline in People. */
export function personTimeline(person, entries) {
  return entries.filter((entry) => entryInvolvesPerson(entry, person));
}

/**
 * How the interactions recorded with a person felt, in the journal's own
 * words: a count for each feeling, and the total. Only entries with a
 * feeling count; nothing is inferred from mood or text.
 * @param {any} person @param {any[]} entries
 * @returns {Record<string, number>}
 */
export function interactionMix(person, entries) {
  const mix = Object.fromEntries(INTERACTION_FEELINGS.map((feeling) => [feeling, 0]));
  for (const entry of entries) {
    if (INTERACTION_FEELINGS.includes(entry.interaction_feeling) && entryInvolvesPerson(entry, person)) mix[entry.interaction_feeling] += 1;
  }
  return { ...mix, total: INTERACTION_FEELINGS.reduce((sum, feeling) => sum + mix[feeling], 0) };
}

/** "5 supportive, 2 strained, 1 unsafe": the feelings with a count, in the journal's order. */
export function describeInteractionMix(mix) {
  return INTERACTION_FEELINGS.filter((feeling) => mix[feeling]).map((feeling) => `${mix[feeling]} ${feeling}`).join(', ');
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
