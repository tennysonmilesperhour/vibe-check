// Person model helpers: matching, migration, and historical text linking.
// Replaces the old load-bearing substring match ("Mom" matched "Tom's mommy")
// with whole-word matching against names and legacy aliases.

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function aliasesOf(person) {
  return [person.name, ...(person.legacy_names || [])].filter(Boolean);
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

/** Historical mood stats for a person from check-ins (uses person_ids when present, whole-word text as fallback). */
export function personCheckInStats(person, checkIns) {
  const involved = checkIns.filter((entry) => {
    if (entry.person_ids?.length) return entry.person_ids.includes(person.id);
    const texts = [entry.high_moment?.who_involved, entry.low_moment?.who_involved];
    return texts.some((t) => t && mentionsPerson(t, person));
  });
  if (involved.length === 0) return { mentions: 0, avgMood: null, lastMention: null };
  const avgMood = involved.reduce((a, e) => a + (e.mood_score || 0), 0) / involved.length;
  const lastMention = involved.map((e) => e.date).sort().at(-1);
  return { mentions: involved.length, avgMood: Math.round(avgMood * 10) / 10, lastMention };
}
