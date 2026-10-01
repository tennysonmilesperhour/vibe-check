// A summary to share with a therapist, a doctor, or anyone the person
// chooses: what they recorded over a stretch of days, as plain counts and
// averages, plus only the entries they pick. People's names are replaced
// with labels unless the person chooses otherwise. It is built on the
// device from what the person recorded, and says so.
import { endOfMonth, startOfWeek } from 'date-fns';
import { addDaysKey, dateKey, diffDaysKeys, parseLocalDate, todayKey } from './dates.js';
import { entryStates, filterEntries, validDateKey } from './living-patterns.js';
import { BOUNDARY_ANSWERS, INTERACTION_FEELINGS, entryPeople, peopleNameReplacer, personLabels } from './people.js';
import { ALIGNMENTS, OUTCOMES, STRESS_STATES, practiceById } from './practices.js';

// Weeks read well up to about four months; past that, months.
const WEEKLY_UP_TO_DAYS = 16 * 7;
// However far back the dates are set, a summary starts at the first thing
// recorded in them, and never more than 20 years back.
const OLDEST_DAYS = 20 * 366;
// How many of the most used feeling words the summary lists.
const TOP_WORDS = 12;

/** @param {unknown} value */
const textOf = (value) => (typeof value === 'string' ? value.trim() : '');

/** @param {unknown} list */
const wordsOf = (list) => (Array.isArray(list) ? list.map(textOf).filter(Boolean) : []);

/** @param {string} id */
const stateLabel = (id) => STRESS_STATES.find((state) => state.id === id)?.label || id;

/** Whether an entry records an interaction, with or without how it felt. @param {any} entry */
const isInteraction = (entry) => entry.kind === 'journal' && (entry.entry_kind === 'interaction' || Boolean(entry.interaction_feeling));

/** How an entry is named in the summary and its picker. @param {any} entry */
export const kindOf = (entry) => (entry.kind === 'day' ? 'Daily check-in' : isInteraction(entry) ? 'Interaction' : 'Journal');

/**
 * Labels for everyone who can appear (see personLabels), or their names.
 * @param {any[]} people @param {any[]} rows @param {boolean} hideNames
 */
function labelPeople(people, rows, hideNames) {
  const labels = personLabels(people, rows.flatMap(entryPeople));
  if (hideNames) return labels;
  const names = new Map(people.filter((person) => person?.id).map((person) => [person.id, textOf(person.name)]));
  return new Map([...labels].map(([id, label]) => [id, names.get(id) || (names.has(id) ? label : 'A person you removed')]));
}

/** @param {number[]} values */
function stats(values) {
  if (!values.length) return null;
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  return { count: values.length, mean: Math.round(mean * 10) / 10, min: Math.min(...values), max: Math.max(...values) };
}

/** @param {unknown} value @param {number} low @param {number} high */
const score = (value, low, high) => {
  if (value === null || value === undefined || value === '' || typeof value === 'boolean') return null;
  const number = Number(value);
  return Number.isFinite(number) && number >= low && number <= high ? number : null;
};

/** @param {any[]} checkIns */
function scoresOf(checkIns) {
  const pick = (/** @type {(entry: any) => number | null} */ read) => stats(checkIns.map(read).filter((value) => value !== null));
  return {
    days: new Set(checkIns.map((entry) => entry.date)).size,
    mood: pick((entry) => score(entry.mood_score, 1, 10)),
    energy: pick((entry) => score(entry.energy_level, 1, 10)),
    sleep: pick((entry) => score(entry.sleep_quality, 1, 10)),
    stress: pick((entry) => score(entry.stress_context?.stress_score, 0, 10)),
  };
}

/**
 * The stretches the scores are grouped by: weeks for up to 16 weeks, then
 * calendar months. The first and last may be partial.
 * @param {string} start @param {string} end @param {0|1|2|3|4|5|6} weekStartsOn
 */
function stretches(start, end, weekStartsOn) {
  const unit = diffDaysKeys(end, start) + 1 > WEEKLY_UP_TO_DAYS ? 'month' : 'week';
  const out = [];
  for (let cursor = start; cursor <= end;) {
    const date = parseLocalDate(cursor);
    const last = unit === 'month' ? dateKey(endOfMonth(date)) : addDaysKey(dateKey(startOfWeek(date, { weekStartsOn })), 6);
    const stop = last < end ? last : end;
    out.push({ start: cursor, end: stop });
    cursor = addDaysKey(stop, 1);
  }
  return { unit, stretches: out };
}

/**
 * Days (not entries) on which each value was recorded, most first. Values
 * that differ only in letter case count together, under the form used most
 * (a capitalized one in a tie).
 * @param {any[]} rows @param {(row: any) => string[]} valuesOf
 */
function daysWith(rows, valuesOf) {
  const groups = new Map();
  for (const row of rows) for (const value of valuesOf(row)) {
    const key = value.toLowerCase();
    if (!groups.has(key)) groups.set(key, { dates: new Set(), forms: new Map() });
    const group = groups.get(key);
    group.dates.add(row.date);
    group.forms.set(value, (group.forms.get(value) || 0) + 1);
  }
  const capitalized = (/** @type {string} */ form) => (form.charAt(0) !== form.charAt(0).toLowerCase() ? 1 : 0);
  return [...groups.values()].map(({ dates, forms }) => ({ value: [...forms].sort((a, b) => b[1] - a[1] || capitalized(b[0]) - capitalized(a[0]) || a[0].localeCompare(b[0]))[0][0], days: dates.size }))
    .sort((a, b) => b.days - a.days || a.value.localeCompare(b.value));
}

/**
 * Counts of each known value, then of rows that recorded none.
 * @param {any[]} rows @param {string[]} values @param {(row: any) => unknown} read
 */
function tally(rows, values, read) {
  const counts = values.map((value) => ({ value, count: rows.filter((row) => read(row) === value).length }));
  const unrecorded = rows.filter((row) => !values.includes(/** @type {string} */ (read(row)))).length;
  return [...counts, { value: 'not recorded', count: unrecorded }].filter((item) => item.count > 0);
}

/**
 * @param {{
 *   entries: any[], sessions?: any[], people?: any[],
 *   start: string, end: string, weekStartsOn?: 0|1|2|3|4|5|6,
 *   chosen?: string[], hideNames?: boolean, note?: string, today?: string,
 * }} input
 */
export function buildShareSummary({ entries, sessions = [], people = [], start, end, weekStartsOn = 1, chosen = [], hideNames = true, note = '', today = todayKey() }) {
  if (!validDateKey(start) || !validDateKey(end) || start > end) throw new Error('Choose a valid date range.');
  // Demo entries are examples, not the person's record.
  const own = entries.filter((entry) => !entry.is_demo);
  const ownSessions = sessions.filter((session) => !session.is_demo && session.status !== 'hidden' && validDateKey(session.date));
  const last = end < today ? end : today;
  const firstRecord = [...own.map((entry) => entry.date), ...ownSessions.map((session) => session.date)].filter(validDateKey).sort()[0];
  const oldest = addDaysKey(last, -OLDEST_DAYS);
  const from = firstRecord && firstRecord > start && firstRecord <= last ? firstRecord : start;
  const bounded = from < oldest ? oldest : from;
  const first = bounded > last ? last : bounded;
  const rows = filterEntries(own, { start: first, end: last });
  const checkIns = rows.filter((entry) => entry.kind === 'day');
  // Labelled across the whole record, so labels do not depend on the dates.
  const labels = labelPeople(people, own, hideNames);
  const labelOf = (/** @type {string} */ id) => labels.get(id) || 'A person';
  const replacer = hideNames ? peopleNameReplacer(people, (person) => labelOf(person.id)) : null;
  // Words of a longer name count in free text and in feeling phrases of
  // several words ("Missing Jordan"), not in a one-word feeling.
  const replaceNames = (/** @type {string} */ text, parts = true) => (replacer ? replacer(text, { parts: parts || /\s/.test(text.trim()) }) : text);

  const grouping = stretches(first, last, weekStartsOn);
  const byStretch = grouping.stretches.map(() => /** @type {any[]} */ ([]));
  for (const entry of checkIns) {
    const index = grouping.stretches.findIndex((stretch) => entry.date >= stretch.start && entry.date <= stretch.end);
    if (index >= 0) byStretch[index].push(entry);
  }
  const stressKinds = checkIns.filter((entry) => score(entry.stress_context?.stress_score, 0, 10) !== null)
    .map((entry) => (entry.stress_context.stress_measure === 'highest-today' ? 'highest-today' : 'at-check-in'));

  const interactions = rows.filter(isInteraction);
  const interactionPeople = new Map();
  for (const entry of interactions) for (const id of entryPeople(entry)) {
    if (!interactionPeople.has(id)) interactionPeople.set(id, []);
    interactionPeople.get(id).push(entry);
  }

  const practiceSessions = ownSessions.filter((session) => session.date >= first && session.date <= last);
  const practiceIds = [...new Set(practiceSessions.map((session) => session.practice_id))];
  const alignmentOf = (/** @type {any[]} */ list, /** @type {(item: any) => unknown} */ read) => ALIGNMENTS
    .map((item) => ({ id: item.id, label: item.label, count: list.filter((row) => read(row) === item.id).length }))
    .filter((item) => item.count > 0);

  const chosenKeys = new Set(chosen);
  const words = rows.filter((entry) => chosenKeys.has(entry.key)).reverse().map((entry) => {
    const context = entry.stress_context || {};
    const parts = [
      [null, entry.notes],
      ['A supportive moment', entry.high_moment?.description],
      ['A difficult moment', entry.low_moment?.description],
      ['Gratitude', entry.gratitude],
      ['What happened before', context.situation],
      ['My response', context.response],
      ['What I needed', context.need],
    ].map(([label, text]) => ({ label, text: replaceNames(textOf(text)) })).filter((part) => part.text);
    return {
      key: entry.key,
      date: entry.date,
      kind: kindOf(entry),
      mood: score(entry.mood_score, 1, 10),
      states: entryStates(entry).map(stateLabel),
      emotions: wordsOf(entry.emotions).map((word) => replaceNames(word, false)),
      people: entryPeople(entry).map(labelOf),
      parts,
    };
  });

  return {
    start: first,
    end: last,
    hideNames,
    note: replaceNames(textOf(note)),
    calendarDays: diffDaysKeys(last, first) + 1,
    recordedDays: new Set(rows.map((entry) => entry.date)).size,
    checkIns: checkIns.length,
    journalEntries: rows.length - checkIns.length,
    scores: {
      unit: grouping.unit,
      rows: grouping.stretches.map((stretch, i) => ({ ...stretch, ...scoresOf(byStretch[i]) })),
      overall: scoresOf(checkIns),
      stressAtCheckIn: stressKinds.filter((kind) => kind === 'at-check-in').length,
      stressHighestToday: stressKinds.filter((kind) => kind === 'highest-today').length,
    },
    states: daysWith(rows, (entry) => entryStates(entry)).map(({ value, days }) => ({ id: value, label: stateLabel(value), days })),
    emotions: daysWith(rows, (entry) => wordsOf(entry.emotions)).slice(0, TOP_WORDS).map(({ value, days }) => ({ label: replaceNames(value, false), days })),
    bodyCues: daysWith(rows, (entry) => wordsOf(entry.stress_context?.body_cues)).map(({ value, days }) => ({ label: value, days })),
    interactions: {
      total: interactions.length,
      feelings: tally(interactions, INTERACTION_FEELINGS, (entry) => entry.interaction_feeling),
      boundaries: tally(interactions, BOUNDARY_ANSWERS, (entry) => entry.boundary_respected),
      people: [...interactionPeople].map(([id, list]) => ({ id, label: labelOf(id), total: list.length, feelings: tally(list, INTERACTION_FEELINGS, (entry) => entry.interaction_feeling) }))
        .sort((a, b) => b.total - a.total || a.label.localeCompare(b.label, undefined, { numeric: true })),
    },
    practices: practiceIds.map((id) => {
      const attempts = practiceSessions.filter((session) => session.practice_id === id);
      return { id, title: practiceById(id)?.title || String(id), attempts: attempts.length, outcomes: tally(attempts, OUTCOMES, (session) => session.outcome) };
    }).sort((a, b) => b.attempts - a.attempts || a.title.localeCompare(b.title)),
    alignment: {
      entries: alignmentOf(rows, (entry) => entry.stress_context?.alignment),
      practices: alignmentOf(practiceSessions, (session) => session.alignment),
    },
    words,
    demoLeftOut: entries.some((entry) => entry.is_demo && validDateKey(entry.date) && entry.date >= first && entry.date <= last),
  };
}
