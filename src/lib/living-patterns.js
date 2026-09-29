import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, subWeeks, subMonths } from 'date-fns';
import { dateKey, todayKey, parseLocalDate, diffDaysKeys, addDaysKey } from './dates';
import { STRESS_STATES, HELPFUL_OUTCOMES } from './practices';
import { entryPeople, samePersonId } from './people';
import { fisherGreater, cmhGreater } from './pattern-stats';

export { entryPeople };

export function validDateKey(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(parseLocalDate(value).getTime()) && dateKey(parseLocalDate(value)) === value;
}

/** Normalize separately authored moments without combining them into a daily mood. */
export function timelineEntries(checkIns = [], journal = []) {
  return [
    ...checkIns.map((entry) => ({ ...entry, kind: 'day', key: `day:${entry.id}` })),
    ...journal.filter((entry) => !entry.is_draft).map((entry) => ({ ...entry, entry_kind: entry.kind, kind: 'journal', key: `journal:${entry.id}` })),
  ].filter((entry) => validDateKey(entry.date)).sort((a, b) => b.date.localeCompare(a.date) || (b.occurred_at || b.created_at || '').localeCompare(a.occurred_at || a.created_at || '') || a.key.localeCompare(b.key));
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

/** @param {any} period @param {0|1|2|3|4|5|6} weekStartsOn */
export function previousPeriod(period, weekStartsOn = 1) {
  const date = parseLocalDate(period.start);
  return reportPeriod(period.type, dateKey(period.type === 'monthly' ? subMonths(date, 1) : subWeeks(date, 1)), weekStartsOn);
}

// A state needs 3 recorded days to be shown at all. A connection with a person
// or habit is held to more:
// - Like with like: only days where the person answered the states question
//   (a state, or "None of these") and tagged at least one person (or habit)
//   count. A day without tags is a day without an answer, not a day without
//   the person or the state.
// - At least 5 such days with it, 5 without, and 3 with both.
// - The state on at least 20 percentage points more of the days with it, and
//   at least twice as often. Days when someone tags more of everything make
//   small, broad overlaps; a real connection is a large one.
// - A one-sided Fisher exact test, and a Cochran-Mantel-Haenszel test within
//   days whose records are similarly busy, that both hold after
//   dividing 2% across every pair that had enough days to test in this view
//   (Bonferroni).
// On simulated records where nothing is connected, with mood-only days,
// skipped questions, and busy and quiet days, fewer than 1 in 50 people see
// a connection in a view, and fewer than 1 in 20 across a year of ranges and
// monthly reports (see the tests). A strong real one usually shows within a
// few months. It is still an association in a record, never a cause.
const MIN_STATE_DAYS = 3;
const MIN_GROUP_DAYS = 5;
const MIN_GAP = 0.2;
const MIN_RATIO = 2;
const VIEW_ALPHA = 0.02;

/**
 * What repeats in the record. Two kinds of card:
 * - a state card: how many recorded days include a state the person chose;
 * - a connection: a state that shows up clearly more often on days with a
 *   person or habit than on comparable days without, with both counts.
 * @param {any[]} entries @param {any[]} people @param {any} feedback
 */
export function stressPatterns(entries, people = [], feedback = {}) {
  const statesOf = new Map(entries.map((entry) => [entry, entryStates(entry)]));
  const byDate = new Map();
  for (const entry of entries) {
    if (!byDate.has(entry.date)) byDate.set(entry.date, { states: new Set(), answered: false, people: new Set(), habits: new Set(), entries: [] });
    const day = byDate.get(entry.date);
    const chosen = statesOf.get(entry);
    // "None of these" is an answer too: a calm day, not a skipped question.
    if (chosen.length || entry.stress_context?.none_present) day.answered = true;
    chosen.filter((id) => id !== 'unsure').forEach((id) => day.states.add(id));
    entryPeople(entry).forEach((id) => day.people.add(id));
    (entry.activities || []).forEach((id) => day.habits.add(id));
    day.entries.push(entry);
  }
  const days = [...byDate.values()];
  const status = (key) => feedback[key] || 'suggested';
  const sourcesFor = (state, list) => list.flatMap((day) => day.entries.filter((entry) => statesOf.get(entry).includes(state)));
  const states = [...new Set(days.flatMap((day) => [...day.states]))];

  const cards = states.map((state) => {
    const stateDays = days.filter((day) => day.states.has(state));
    const key = `${state}:state:`;
    return { key, state, context: { type: 'state', id: '', label: '' }, entries: sourcesFor(state, stateDays), days: stateDays.length, total: days.length, status: status(key) };
  }).filter((card) => card.days >= MIN_STATE_DAYS);

  const comparable = {
    person: days.filter((day) => day.answered && day.people.size > 0),
    habit: days.filter((day) => day.answered && day.habits.size > 0),
  };
  const contexts = [
    ...[...new Set(comparable.person.flatMap((day) => [...day.people]))].map((id) => ({ type: 'person', id, label: people.find((person) => person.id === id)?.name || 'A person in your record' })),
    ...[...new Set(comparable.habit.flatMap((day) => [...day.habits]))].map((id) => ({ type: 'habit', id, label: id })),
  ];
  const candidates = [];
  for (const context of contexts) {
    const field = context.type === 'person' ? 'people' : 'habits';
    const otherField = context.type === 'person' ? 'habits' : 'people';
    const withDays = comparable[context.type].filter((day) => day[field].has(context.id));
    const withoutDays = comparable[context.type].filter((day) => !day[field].has(context.id));
    const bigEnough = withDays.length >= MIN_GROUP_DAYS && withoutDays.length >= MIN_GROUP_DAYS;
    for (const state of states) {
      const shared = withDays.filter((day) => day.states.has(state));
      const otherwise = withoutDays.filter((day) => day.states.has(state)).length;
      // Strata: how busy the day's record is, read from the other kind of tag
      // (habits for a person, people for a habit) and the other states. Tags of
      // the same kind can't be used: a day with one person tagged would then
      // always sit apart from a day with someone else.
      const stratumOf = (day) => Math.min(4, day[otherField].size + day.states.size - (day.states.has(state) ? 1 : 0));
      const strata = Array.from({ length: 5 }, () => ({ a: 0, b: 0, c: 0, d: 0 }));
      for (const day of withDays) strata[stratumOf(day)][day.states.has(state) ? 'a' : 'b'] += 1;
      for (const day of withoutDays) strata[stratumOf(day)][day.states.has(state) ? 'c' : 'd'] += 1;
      const key = `${state}:${context.type}:${context.id}`;
      // Whether a pair is tested depends only on its totals, never on how the
      // days split, so the correction counts every pair that could have shown.
      const tested = bigEnough && shared.length + otherwise >= MIN_STATE_DAYS;
      if (!tested && !(status(key) === 'confirmed' && shared.length >= MIN_STATE_DAYS)) continue;
      candidates.push({ key, state, context, tested, strata, entries: sourcesFor(state, shared), days: shared.length, total: withDays.length, without: { days: otherwise, total: withoutDays.length }, status: status(key) });
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
  // A connection the person confirmed stays in view with its counts, marked
  // as not beyond chance when that is so; the choice is theirs.
  }).filter((item) => item.significant || (item.status === 'confirmed' && item.days >= MIN_STATE_DAYS));

  const rank = (item) => (item.context.type === 'state' ? 2 : item.significant ? 0 : 1);
  return [...connections, ...cards]
    .filter((item) => item.status !== 'dismissed')
    .sort((a, b) => rank(a) - rank(b) || b.days - a.days || a.key.localeCompare(b.key));
}

/** @param {any[]} entries @param {any} period @param {any[]} sessions @param {any[]} people @param {any} feedback */
export function buildReport(entries, period, sessions = [], people = [], feedback = {}) {
  const end = period.end < todayKey() ? period.end : todayKey();
  const rows = filterEntries(entries, { start: period.start, end });
  const days = new Set(rows.map((entry) => entry.date)).size;
  const calendarDays = Math.max(0, diffDaysKeys(end, period.start) + 1);
  const dailyMoods = rows.filter((entry) => entry.kind === 'day' && entry.mood_score != null).map((entry) => Number(entry.mood_score));
  const countTags = (field) => {
    const groups = new Map();
    for (const entry of rows) for (const tag of [...new Set(entry[field] || [])]) {
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
    patterns: stressPatterns(rows, people, feedback), emotions: countTags('emotions'), habits: countTags('activities'),
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
