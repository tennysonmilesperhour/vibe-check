// A summary to share with a therapist, a doctor, or anyone the person
// chooses: what they recorded over a stretch of days, as plain counts and
// averages, plus only the entries they pick. People's names are replaced
// with labels unless the person chooses otherwise. It is built on the
// device from what the person recorded, and says so.
import { endOfMonth, startOfWeek } from 'date-fns';
import { addDaysKey, dateKey, diffDaysKeys, parseLocalDate, todayKey } from './dates.js';
import { entryStates, filterEntries, validDateKey } from './living-patterns.js';
import { entryPeople } from './people.js';
import { ALIGNMENTS, OUTCOMES, STRESS_STATES, practiceById } from './practices.js';

export const INTERACTION_FEELINGS = ['supportive', 'strained', 'unsafe', 'mixed', 'unsure'];
export const BOUNDARY_ANSWERS = ['yes', 'no', 'unsure'];

// Weeks read well up to about four months; past that, months.
const WEEKLY_UP_TO_DAYS = 16 * 7;

const escapeRegex = (/** @type {string} */ text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** @param {unknown} value */
const textOf = (value) => (typeof value === 'string' ? value.trim() : '');

/**
 * Who appears in the record, most involved first, with the label the summary
 * uses for each: their name, or "Person 1", "Person 2" and so on. Someone
 * tagged but no longer in the person's people still gets a label.
 * @param {any[]} people @param {any[]} rows @param {boolean} hideNames
 */
function labelPeople(people, rows, hideNames) {
  const counts = new Map();
  for (const row of rows) for (const id of entryPeople(row)) counts.set(id, (counts.get(id) || 0) + 1);
  const known = new Map(people.filter((person) => person?.id).map((person) => [person.id, person]));
  const involved = [...counts.keys()].sort((a, b) => counts.get(b) - counts.get(a)
    || String(known.get(a)?.name || '').localeCompare(String(known.get(b)?.name || '')) || String(a).localeCompare(String(b)));
  const ordered = [...involved, ...[...known.keys()].filter((id) => !counts.has(id))];
  return new Map(ordered.map((id, i) => {
    const name = textOf(known.get(id)?.name);
    return [id, hideNames ? `Person ${i + 1}` : name || 'A person you removed'];
  }));
}

/**
 * Replaces each person's name, and any earlier name, with their label
 * wherever it stands as a whole word, in any letter case. Matching the way
 * the app finds mentions means an ordinary word that is also someone's name
 * is replaced too, which the summary's preview shows.
 * @param {any[]} people @param {Map<string, string>} labels
 * @returns {(text: string) => string}
 */
export function nameReplacer(people, labels) {
  const lookup = new Map();
  const names = people
    .flatMap((person) => [person?.name, textOf(person?.name).replace(/ \(Demo\)$/, ''), ...(Array.isArray(person?.legacy_names) ? person.legacy_names : [])]
      .map(textOf).filter(Boolean).map((name) => [name, labels.get(person.id)]))
    .filter(([, label]) => label)
    .sort((a, b) => b[0].length - a[0].length);
  for (const [name, label] of names) if (!lookup.has(name.toLowerCase())) lookup.set(name.toLowerCase(), label);
  if (!lookup.size) return (text) => text;
  // The character before a name is matched rather than looked behind, which
  // older browsers lack.
  const pattern = new RegExp(`(^|[^\\p{L}\\p{N}_])(${[...lookup.keys()].map(escapeRegex).join('|')})(?=[^\\p{L}\\p{N}_]|$)`, 'giu');
  return (text) => text.replace(pattern, (_, before, name) => before + (lookup.get(name.toLowerCase()) ?? name));
}

/** @param {number[]} values */
function stats(values) {
  if (!values.length) return null;
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  return { count: values.length, mean: Math.round(mean * 10) / 10, min: Math.min(...values), max: Math.max(...values) };
}

/** @param {unknown} value @param {number} low @param {number} high */
const score = (value, low, high) => {
  if (value === null || value === undefined || value === '') return null;
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
 * Days (not entries) on which each value was recorded, most first.
 * @param {any[]} rows @param {(row: any) => string[]} valuesOf
 */
function daysWith(rows, valuesOf) {
  const days = new Map();
  for (const row of rows) for (const value of new Set(valuesOf(row))) {
    if (!days.has(value)) days.set(value, new Set());
    days.get(value).add(row.date);
  }
  return [...days].map(([value, dates]) => ({ value, days: dates.size })).sort((a, b) => b.days - a.days || a.value.localeCompare(b.value));
}

/** @param {any[]} rows @param {string[]} values @param {(row: any) => unknown} read */
const tally = (rows, values, read) => values.map((value) => ({ value, count: rows.filter((row) => read(row) === value).length })).filter((item) => item.count > 0);

/** @param {unknown} list */
const wordsOf = (list) => (Array.isArray(list) ? list.map(textOf).filter(Boolean) : []);

/** @param {string} id */
const stateLabel = (id) => STRESS_STATES.find((state) => state.id === id)?.label || id;

// How many of the most used feeling words the summary lists.
const TOP_WORDS = 12;

/** @param {any} entry */
const kindOf = (entry) => (entry.kind === 'day' ? 'Daily check-in' : entry.interaction_feeling || entry.entry_kind === 'interaction' ? 'Interaction' : 'Journal');

/**
 * @param {{
 *   entries: any[], sessions?: any[], people?: any[],
 *   start: string, end: string, weekStartsOn?: 0|1|2|3|4|5|6,
 *   chosen?: string[], hideNames?: boolean, note?: string, today?: string,
 * }} input
 */
export function buildShareSummary({ entries, sessions = [], people = [], start, end, weekStartsOn = 1, chosen = [], hideNames = true, note = '', today = todayKey() }) {
  if (!validDateKey(start) || !validDateKey(end) || start > end) throw new Error('Choose a valid date range.');
  const last = end < today ? end : today;
  const first = start <= last ? start : last;
  // Demo entries are examples, not the person's record.
  const rows = filterEntries(entries.filter((entry) => !entry.is_demo), { start: first, end: last });
  const checkIns = rows.filter((entry) => entry.kind === 'day');
  const labels = labelPeople(people, rows, hideNames);
  const replaceNames = hideNames ? nameReplacer(people, labels) : (/** @type {string} */ text) => text;
  const labelOf = (/** @type {string} */ id) => labels.get(id) || (hideNames ? 'A person' : 'A person you removed');

  const grouping = stretches(first, last, weekStartsOn);
  const stressKinds = checkIns.filter((entry) => score(entry.stress_context?.stress_score, 0, 10) !== null)
    .map((entry) => (entry.stress_context.stress_measure === 'highest-today' ? 'highest-today' : 'at-check-in'));

  const interactions = rows.filter((entry) => entry.interaction_feeling);
  const interactionPeople = new Map();
  for (const entry of interactions) for (const id of entryPeople(entry)) {
    if (!interactionPeople.has(id)) interactionPeople.set(id, []);
    interactionPeople.get(id).push(entry);
  }

  const practiceSessions = sessions.filter((session) => !session.is_demo && session.status !== 'hidden' && validDateKey(session.date) && session.date >= first && session.date <= last);
  const practiceIds = [...new Set(practiceSessions.map((session) => session.practice_id))];

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
      emotions: wordsOf(entry.emotions).map(replaceNames),
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
      rows: grouping.stretches.map((stretch) => ({ ...stretch, ...scoresOf(filterEntries(checkIns, stretch)) })),
      overall: scoresOf(checkIns),
      stressAtCheckIn: stressKinds.filter((kind) => kind === 'at-check-in').length,
      stressHighestToday: stressKinds.filter((kind) => kind === 'highest-today').length,
    },
    states: daysWith(rows, (entry) => entryStates(entry)).map(({ value, days }) => ({ id: value, label: stateLabel(value), days })),
    emotions: daysWith(rows, (entry) => wordsOf(entry.emotions)).slice(0, TOP_WORDS).map(({ value, days }) => ({ label: replaceNames(value), days })),
    bodyCues: daysWith(rows, (entry) => wordsOf(entry.stress_context?.body_cues)).map(({ value, days }) => ({ label: value, days })),
    interactions: {
      total: interactions.length,
      feelings: tally(interactions, INTERACTION_FEELINGS, (entry) => entry.interaction_feeling),
      boundaries: tally(interactions, BOUNDARY_ANSWERS, (entry) => entry.boundary_respected),
      people: [...interactionPeople].map(([id, list]) => ({ label: labelOf(id), total: list.length, feelings: tally(list, INTERACTION_FEELINGS, (entry) => entry.interaction_feeling) }))
        .sort((a, b) => b.total - a.total || a.label.localeCompare(b.label)),
    },
    practices: practiceIds.map((id) => {
      const attempts = practiceSessions.filter((session) => session.practice_id === id);
      return { id, title: practiceById(id)?.title || String(id), attempts: attempts.length, outcomes: tally(attempts, OUTCOMES, (session) => session.outcome), noResponse: attempts.filter((session) => !session.outcome).length };
    }).sort((a, b) => b.attempts - a.attempts || a.title.localeCompare(b.title)),
    alignment: ALIGNMENTS.map((item) => ({ id: item.id, label: item.label, count: rows.filter((entry) => entry.stress_context?.alignment === item.id).length })).filter((item) => item.count > 0),
    words,
    demoLeftOut: entries.some((entry) => entry.is_demo && validDateKey(entry.date) && entry.date >= first && entry.date <= last),
  };
}
