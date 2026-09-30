// Symbolic readings wait after a hard moment. A reading can't weigh what
// happened, and the person's own record comes first (see plant-voice.md).
import { addDaysKey, todayKey } from './dates';
import { entryInvolvesPerson } from './people';

export const GUARD_DAYS = 3;
export const LOW_MOOD = 3;

const harmful = (entry) => entry.interaction_feeling === 'unsafe' || entry.boundary_respected === 'no';
const lowMood = (entry) => entry.mood_score != null && Number(entry.mood_score) <= LOW_MOOD;

/**
 * The latest hard moment in the last GUARD_DAYS days, or null: a moment
 * recorded as unsafe or with a boundary not respected, or a mood at LOW_MOOD
 * or below, in a check-in or a journal moment.
 * @param {{ checkIns?: any[], journal?: any[] }} record
 * @param {string} [today]
 * @returns {{ kind: 'harm' | 'low', date: string } | null}
 */
export function recentHardMoment({ checkIns = [], journal = [] } = {}, today = todayKey()) {
  const since = addDaysKey(today, -(GUARD_DAYS - 1));
  const recent = (entry) => Boolean(entry?.date) && entry.date >= since && entry.date <= today;
  const kept = journal.filter((entry) => recent(entry) && !entry.is_draft);
  /** @type {{ kind: 'harm' | 'low', date: string }[]} */
  const moments = [
    ...kept.filter(harmful).map((entry) => ({ kind: /** @type {'harm'} */ ('harm'), date: entry.date })),
    ...[...checkIns.filter(recent), ...kept].filter(lowMood).map((entry) => ({ kind: /** @type {'low'} */ ('low'), date: entry.date })),
  ];
  // Harm first, then the latest day.
  return moments.sort((a, b) => (a.kind === b.kind ? b.date.localeCompare(a.date) : a.kind === 'harm' ? -1 : 1))[0] || null;
}

/**
 * Whether the guard is still waiting on its check, from its query's state: a
 * request running or paused offline, with no answer yet or only a stale one.
 * A failed or disabled check isn't waiting, so readings show as usual.
 * @param {{ fetchStatus: string, isPending: boolean, isStale: boolean }} query
 */
export function guardWaiting({ fetchStatus, isPending, isStale }) {
  return (fetchStatus === 'fetching' || fetchStatus === 'paused') && (isPending || isStale);
}

/**
 * The page's decision about readings. The first answer decides for the
 * visit, so a later one never swaps an open reading for the pause; undefined
 * means still waiting.
 * @template T
 * @param {T | null | undefined} decided the decision already made, if any
 * @param {boolean} waiting @param {T | null} current the latest answer
 * @returns {T | null | undefined}
 */
export function settleDecision(decided, waiting, current) {
  if (decided !== undefined) return decided;
  return waiting ? undefined : current;
}

/**
 * Whether the person recorded feeling unsafe with someone, or a boundary of
 * theirs that someone didn't respect. A chart comparison then isn't offered.
 * @param {any} person @param {any[]} journal
 */
export function harmRecordedWith(person, journal = []) {
  return journal.some((entry) => !entry.is_draft && harmful(entry) && entryInvolvesPerson(entry, person));
}
