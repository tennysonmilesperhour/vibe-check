import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, subWeeks, subMonths } from 'date-fns';
import { dateKey, todayKey, parseLocalDate, diffDaysKeys, addDaysKey, validDateKey } from './dates';
import { STRESS_STATES, HELPFUL_OUTCOMES, stateById } from './practices';
import { entryPeople, samePersonId, mentionsPerson } from './people';
import { fisherGreater, cmhGreater } from './pattern-stats';
import { canonicalFeeling } from './feelings';

export { entryPeople, validDateKey };

/** @param {any} entry */
const stampOf = (entry) => (typeof entry.occurred_at === 'string' && entry.occurred_at) || (typeof entry.created_at === 'string' && entry.created_at) || '';

/**
 * Normalize separately authored moments without combining them into a daily mood.
 * @param {any[]} [checkIns] @param {any[]} [journal]
 * @param {{ drafts?: boolean }} [options] drafts: keep unfinished journal entries, as the export reader does
 */
export function timelineEntries(checkIns = [], journal = [], { drafts = false } = {}) {
  return [
    ...checkIns.map((entry, i) => ({ ...entry, kind: 'day', key: `day:${entry.id ?? i}` })),
    ...journal.filter((entry) => drafts || !entry.is_draft).map((entry, i) => ({ ...entry, entry_kind: entry.kind, kind: 'journal', key: `journal:${entry.id ?? i}` })),
  ].filter((entry) => validDateKey(entry.date)).sort((a, b) => b.date.localeCompare(a.date) || stampOf(b).localeCompare(stampOf(a)) || a.key.localeCompare(b.key));
}

/**
 * Only the states the person chose. A feeling word like "Anxious" is theirs;
 * it is never relabeled as a state (say, fight or flight) on their behalf.
 * @param {any} entry
 */
export function entryStates(entry) {
  const explicit = entry.stress_context?.state_ids || [];
  return [...new Set(explicit)].filter((id) => STRESS_STATES.some((state) => state.id === id));
}

/** @param {any} entry */
export function entryText(entry) {
  return [entry.notes, entry.high_moment?.description, entry.low_moment?.description, entry.gratitude, entry.stress_context?.situation, entry.stress_context?.response, entry.stress_context?.need].filter(Boolean).join('\n\n');
}

/** What an entry is, as the journal names it. @param {any} entry */
export const entryKindLabel = (entry) => (entry.kind === 'day' ? 'Daily check-in' : entry.entry_kind === 'interaction' || entry.interaction_feeling ? 'Interaction' : 'Journal moment');

/**
 * The words in an entry that concern a person: the moments they were tagged
 * in, and the notes when they were tagged on the entry itself. Without picker
 * tags, a moment counts when its "who was involved" names them. Falls back to
 * all of the entry's words.
 * @param {any} entry @param {any} person
 */
export function personExcerpt(entry, person) {
  const tagged = (/** @type {any[] | undefined} */ ids) => (ids || []).some((id) => samePersonId(id, person.id));
  const picked = entryPeople(entry).length > 0;
  const about = (/** @type {any} */ moment) => Boolean(moment?.description) && (picked ? tagged(moment.person_ids) : mentionsPerson(moment.who_involved, person));
  const parts = [about(entry.high_moment) && entry.high_moment.description, about(entry.low_moment) && entry.low_moment.description, tagged(entry.person_ids) && entry.notes].filter(Boolean);
  return (parts.length ? parts.join('\n') : entryText(entry)).replace(/\n{2,}/g, '\n');
}

/**
 * A pattern in words, as its card shows it: a connection compares check-ins
 * with and without a person or habit; a state card counts the days it was
 * chosen.
 * @param {any} pattern
 */
export function describePattern(pattern) {
  const state = stateById(pattern.state)?.label || 'A state you chose';
  if (!pattern.context || pattern.context.type === 'state') return `You chose ${state} on ${pattern.days} of the ${pattern.total} days recorded in this view.`;
  const others = pattern.context.type === 'person' ? 'other people' : 'other habits';
  return `${state} on ${pattern.days} of the ${pattern.total} compared check-ins with ${pattern.context.label}${pattern.without?.total
    ? `, and on ${pattern.without.days} of the ${pattern.without.total} with ${others} but not ${pattern.context.label}.`
    : `. None of the compared check-ins in this view tag ${others} without ${pattern.context.label}, so there is nothing to compare with.`}`;
}

/** @param {any[]} entries @param {any} filters */
export function filterEntries(entries, filters = {}) {
  return entries.filter((entry) => (!filters.start || entry.date >= filters.start)
    && (!filters.end || entry.date <= filters.end)
    && (!filters.person || entryPeople(entry).some((id) => samePersonId(id, filters.person)))
    && (!filters.habit || (entry.activities || []).includes(filters.habit))
    && (!filters.state || entryStates(entry).includes(filters.state))
    && (!filters.search || entryText(entry).toLowerCase().includes(filters.search.toLowerCase())));
}

/** @param {string} type @param {string} anchor @param {0|1|2|3|4|5|6} weekStartsOn */
export function reportPeriod(type = 'weekly', anchor = todayKey(), weekStartsOn = 1) {
  const date = parseLocalDate(validDateKey(anchor) ? anchor : todayKey());
  const monthly = type === 'monthly';
  return {
    type: monthly ? 'monthly' : 'weekly',
    start: dateKey(monthly ? startOfMonth(date) : startOfWeek(date, { weekStartsOn })),
    end: dateKey(monthly ? endOfMonth(date) : endOfWeek(date, { weekStartsOn })),
  };
}

/** The day the person's week begins on: Sunday (0) when chosen, Monday (1) otherwise. @param {any} preferences */
export const weekStartOf = (preferences) => (preferences?.week_start === 0 ? 0 : 1);

/** @param {any} period @param {0|1|2|3|4|5|6} weekStartsOn */
export function previousPeriod(period, weekStartsOn = 1) {
  const date = parseLocalDate(period.start);
  return reportPeriod(period.type, dateKey(period.type === 'monthly' ? subMonths(date, 1) : subWeeks(date, 1)), weekStartsOn);
}

// A state needs 3 recorded days to be shown at all. A connection with a person
// or habit is held to more:
// - The same question every day: only daily check-ins that asked about states
//   and about people and habits count, and only their answers, so a day with
//   more journal moments has no extra chances. A check-in records the usual
//   questions the person reached on the visits that kept it (asked_steps).
//   Older ones don't say, and some were kept before reaching the states
//   question, so they are left out until a visit that keeps them records
//   it. Of those, only days with at least one person (or habit) tagged. The
//   counts on a connection are these check-ins, not every recorded day.
//   Days are never picked by their states: keeping only days with a state
//   would make unrelated states look connected.
// - At least 5 such days with it, 5 without, and 3 with both.
// - The state on at least 20 percentage points more of the days with it, and
//   at least twice as often.
// - A one-sided Fisher exact test, and a Cochran-Mantel-Haenszel test within
//   days whose records are similarly busy (how many tags and other states
//   they carry), that both hold after dividing 2% across every pair with
//   enough days to test in this view (Bonferroni).
// On simulated records where nothing is connected, messy the way real ones
// are (mood-only days, skipped questions, calm days left blank, busy and
// quiet days, and older check-ins that don't say what they asked), few
// people see a connection in any view (see the tests). A strong real one
// usually shows within a few months. It is still an association in a
// record, never a cause.
const MIN_STATE_DAYS = 3;
const MIN_GROUP_DAYS = 5;
const MIN_GAP = 0.2;
const MIN_RATIO = 2;
const VIEW_ALPHA = 0.02;
const MAX_STRATUM = 40;

// Entries grouped by date: the states, people and habits of each day.
function recordDays(list, statesOf) {
  const byDate = new Map();
  for (const entry of list) {
    if (!byDate.has(entry.date)) byDate.set(entry.date, { states: new Set(), people: new Set(), habits: new Set(), entries: [] });
    const day = byDate.get(entry.date);
    statesOf.get(entry).filter((id) => id !== 'unsure').forEach((id) => day.states.add(id));
    entryPeople(entry).forEach((id) => day.people.add(id));
    (entry.activities || []).forEach((id) => day.habits.add(id));
    day.entries.push(entry);
  }
  return [...byDate.values()];
}
const sourcesFor = (statesOf, state, days) => days.flatMap((day) => day.entries.filter((entry) => statesOf.get(entry).includes(state)));
const statusIn = (feedback) => (key) => feedback[key] || 'suggested';
const rank = (item) => (item.context.type === 'state' ? 2 : item.significant ? 0 : 1);
const ranked = (items) => items
  .filter((item) => item.status !== 'dismissed')
  .sort((a, b) => rank(a) - rank(b) || b.days - a.days || a.key.localeCompare(b.key));

function countStates(days, statesOf, status) {
  const states = [...new Set(days.flatMap((day) => [...day.states]))];
  return states.map((state) => {
    const stateDays = days.filter((day) => day.states.has(state));
    const key = `${state}:state:`;
    return { key, state, context: { type: 'state', id: '', label: '' }, entries: sourcesFor(statesOf, state, stateDays), days: stateDays.length, total: days.length, status: status(key) };
  }).filter((card) => card.days >= MIN_STATE_DAYS);
}

/**
 * Only the state cards: how many recorded days include each state the person
 * chose. Quick enough to recount a view as its filters change.
 * @param {any[]} entries @param {any} feedback
 */
export function stateCards(entries, feedback = {}) {
  const statesOf = new Map(entries.map((entry) => [entry, entryStates(entry)]));
  return ranked(countStates(recordDays(entries, statesOf), statesOf, statusIn(feedback)));
}

/**
 * What repeats in the record. Two kinds of card:
 * - a state card: how many recorded days include a state the person chose;
 * - a connection: a state that shows up clearly more often on days with a
 *   person or habit than on comparable days without, with both counts.
 * @param {any[]} entries @param {any[]} people @param {any} feedback
 */
export function stressPatterns(entries, people = [], feedback = {}) {
  const statesOf = new Map(entries.map((entry) => [entry, entryStates(entry)]));
  const status = statusIn(feedback);
  const days = recordDays(entries, statesOf);
  // Daily check-ins that recorded asking both questions (see above).
  const askedBoth = (entry) => {
    const asked = entry.stress_context?.asked_steps;
    return Array.isArray(asked) && asked.includes('stress') && asked.includes('activities');
  };
  const checkInDays = recordDays(entries.filter((entry) => entry.kind === 'day' && askedBoth(entry)), statesOf);
  const states = [...new Set(days.flatMap((day) => [...day.states]))];
  const cards = countStates(days, statesOf, status);

  const comparable = {
    person: checkInDays.filter((day) => day.people.size > 0),
    habit: checkInDays.filter((day) => day.habits.size > 0),
  };
  const contexts = [
    ...[...new Set(comparable.person.flatMap((day) => [...day.people]))].map((id) => ({ type: 'person', id, label: people.find((person) => person.id === id)?.name || 'A person in your record' })),
    ...[...new Set(comparable.habit.flatMap((day) => [...day.habits]))].map((id) => ({ type: 'habit', id, label: id })),
  ];
  const candidates = [];
  for (const context of contexts) {
    const field = context.type === 'person' ? 'people' : 'habits';
    const withDays = comparable[context.type].filter((day) => day[field].has(context.id));
    const withoutDays = comparable[context.type].filter((day) => !day[field].has(context.id));
    const bigEnough = withDays.length >= MIN_GROUP_DAYS && withoutDays.length >= MIN_GROUP_DAYS;
    for (const state of states) {
      const shared = withDays.filter((day) => day.states.has(state));
      const otherwise = withoutDays.filter((day) => day.states.has(state)).length;
      // Strata: how busy the day's record is. Every tag counts, the one being
      // tested included, so a day with only Jules and a day with only Sam sit
      // together; the state being tested does not count.
      const stratumOf = (day) => Math.min(MAX_STRATUM, day.people.size + day.habits.size + day.states.size - (day.states.has(state) ? 1 : 0));
      const strata = Array.from({ length: MAX_STRATUM + 1 }, () => ({ a: 0, b: 0, c: 0, d: 0 }));
      for (const day of withDays) strata[stratumOf(day)][day.states.has(state) ? 'a' : 'b'] += 1;
      for (const day of withoutDays) strata[stratumOf(day)][day.states.has(state) ? 'c' : 'd'] += 1;
      const key = `${state}:${context.type}:${context.id}`;
      // Whether a pair is tested depends only on its totals, never on how the
      // days split, so the correction counts every pair that could have shown.
      const tested = bigEnough && shared.length + otherwise >= MIN_STATE_DAYS;
      if (!tested && !(status(key) === 'confirmed' && shared.length >= MIN_STATE_DAYS)) continue;
      candidates.push({ key, state, context, tested, strata, entries: sourcesFor(statesOf, state, shared), days: shared.length, total: withDays.length, without: { days: otherwise, total: withoutDays.length }, status: status(key) });
    }
  }
  const threshold = VIEW_ALPHA / Math.max(1, candidates.filter((item) => item.tested).length);
  const connections = candidates.map((item) => {
    const rateWith = item.days / item.total;
    const rateWithout = item.without.total ? item.without.days / item.without.total : 0;
    const significant = item.tested && item.days >= MIN_STATE_DAYS && rateWith - rateWithout >= MIN_GAP && rateWith >= MIN_RATIO * rateWithout
      && fisherGreater(item.days, item.total, item.without.days, item.without.total) < threshold
      && cmhGreater(item.strata) < threshold;
    const { strata: _strata, ...shown } = item;
    return { ...shown, significant };
  // A connection the person confirmed stays in view with its counts while it
  // has 3 compared days, marked as not beyond chance when that is so; the
  // choice is theirs.
  }).filter((item) => item.significant || (item.status === 'confirmed' && item.days >= MIN_STATE_DAYS));

  return ranked([...connections, ...cards]);
}

/** @param {any[]} entries @param {any} period @param {any[]} sessions @param {any[]} people @param {any} feedback */
export function buildReport(entries, period, sessions = [], people = [], feedback = {}) {
  const end = period.end < todayKey() ? period.end : todayKey();
  const rows = filterEntries(entries, { start: period.start, end });
  const days = new Set(rows.map((entry) => entry.date)).size;
  const calendarDays = Math.max(0, diffDaysKeys(end, period.start) + 1);
  const dailyMoods = rows.filter((entry) => entry.kind === 'day' && entry.mood_score != null).map((entry) => Number(entry.mood_score));
  const countTags = (field, spell = (tag) => tag) => {
    const groups = new Map();
    for (const entry of rows) for (const tag of [...new Set((entry[field] || []).map(spell))]) {
      if (!groups.has(tag)) groups.set(tag, []);
      groups.get(tag).push(entry);
    }
    return [...groups].map(([label, sources]) => ({ label, sources })).sort((a, b) => b.sources.length - a.sources.length || a.label.localeCompare(b.label));
  };
  const practiceSessions = sessions.filter((session) => session.date >= period.start && session.date <= end && session.status !== 'hidden');
  const practiceIds = [...new Set(practiceSessions.map((session) => session.practice_id))];
  return {
    ...period, partial: period.end >= todayKey(), rows, days, calendarDays, missing: Math.max(0, calendarDays - days),
    moods: dailyMoods.length ? { count: dailyMoods.length, mean: dailyMoods.reduce((a, b) => a + b, 0) / dailyMoods.length, min: Math.min(...dailyMoods), max: Math.max(...dailyMoods) } : null,
    patterns: stressPatterns(rows, people, feedback),
    // "worried" typed in your own words and "Worried" picked from the list are
    // one theme, named as the list spells it.
    emotions: countTags('emotions', canonicalFeeling), habits: countTags('activities'),
    moments: rows.filter((entry) => entryText(entry)),
    interactions: rows.filter((entry) => entry.interaction_feeling),
    alignments: rows.filter((entry) => entry.stress_context?.alignment),
    practiceSessions,
    practices: practiceIds.map((id) => {
      const attempts = practiceSessions.filter((session) => session.practice_id === id);
      return { id, attempts, withFeedback: attempts.filter((session) => session.outcome), helpful: attempts.filter((session) => HELPFUL_OUTCOMES.includes(session.outcome)), uncomfortable: attempts.filter((session) => session.outcome === 'More uncomfortable') };
    }),
  };
}

/** A point for every calendar day keeps gaps visible instead of bridging missing days. */
export function historyChart(checkIns, start, end) {
  if (!validDateKey(start) || !validDateKey(end) || start > end) return [];
  const byDate = new Map(checkIns.map((entry) => [entry.date, entry]));
  const points = [];
  for (let date = start; date <= end; date = addDaysKey(date, 1)) {
    const entry = byDate.get(date);
    const stress = entry?.stress_context?.stress_score ?? null;
    // Check-ins first asked for stress at that moment, later for the day's highest.
    const stressKind = stress == null ? null : entry.stress_context.stress_measure === 'highest-today' ? 'highest-today' : 'at-check-in';
    points.push({ date, mood: entry?.mood_score ?? null, energy: entry?.energy_level ?? null, sleep: entry?.sleep_quality ?? null, stress, stressKind });
  }
  return points;
}
