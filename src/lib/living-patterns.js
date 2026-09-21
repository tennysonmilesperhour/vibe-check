import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, subWeeks, subMonths } from 'date-fns';
import { dateKey, todayKey, parseLocalDate, diffDaysKeys, addDaysKey } from './dates';
import { STRESS_STATES } from './practices';
import { entryPeople, samePersonId } from './people';

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

/** @param {any} entry */
export function entryStates(entry) {
  const explicit = entry.stress_context?.state_ids || [];
  const fromTags = STRESS_STATES.filter((state) => state.tags.some((tag) => (entry.emotions || []).some((emotion) => emotion.toLowerCase() === tag.toLowerCase()))).map((state) => state.id);
  return [...new Set([...explicit, ...fromTags])].filter((id) => STRESS_STATES.some((state) => state.id === id));
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

/** @param {any[]} entries @param {any[]} people @param {any} feedback */
export function stressPatterns(entries, people = [], feedback = {}) {
  const groups = new Map();
  for (const entry of entries) {
    for (const state of entryStates(entry).filter((id) => id !== 'unsure')) {
      const contexts = [{ type: 'state', id: '', label: '' },
        ...entryPeople(entry).map((id) => ({ type: 'person', id, label: people.find((person) => person.id === id)?.name || 'A person in your record' })),
        ...(entry.activities || []).map((id) => ({ type: 'habit', id, label: id }))];
      for (const context of contexts) {
        const key = `${state}:${context.type}:${context.id}`;
        if (!groups.has(key)) groups.set(key, { key, state, context, entries: [] });
        groups.get(key).entries.push(entry);
      }
    }
  }
  return [...groups.values()].map((group) => {
    const days = new Set(group.entries.map((entry) => entry.date)).size;
    const comparable = group.context.type === 'person' ? entries.filter((entry) => entryPeople(entry).includes(group.context.id))
      : group.context.type === 'habit' ? entries.filter((entry) => (entry.activities || []).includes(group.context.id)) : entries;
    return { ...group, days, total: comparable.length, status: feedback[group.key] || 'suggested' };
  }).filter((group) => group.days >= 3 && group.status !== 'dismissed')
    .sort((a, b) => (b.context.type !== 'state' ? 1 : 0) - (a.context.type !== 'state' ? 1 : 0) || b.days - a.days || a.key.localeCompare(b.key));
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
      return { id, attempts, withFeedback: attempts.filter((session) => session.outcome), helpful: attempts.filter((session) => ['Clearer', 'More connected', 'More able to begin', 'More settled'].includes(session.outcome)), uncomfortable: attempts.filter((session) => session.outcome === 'More uncomfortable') };
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
    points.push({ date, mood: entry?.mood_score ?? null, energy: entry?.energy_level ?? null, sleep: entry?.sleep_quality ?? null, stress: entry?.stress_context?.stress_score ?? null });
  }
  return points;
}
