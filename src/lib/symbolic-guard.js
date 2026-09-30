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
 * The hard moment from the guard's two reads, as Promise.allSettled results.
 * "No hard moment" needs both, so a read that half failed with nothing found
 * throws instead of lifting a pause. A moment found in either stands; a low
 * mood found while the journal couldn't be read is marked incomplete, since
 * harm recorded there would come first.
 * @param {PromiseSettledResult<any[]>} checkIns
 * @param {PromiseSettledResult<any[]>} journal
 * @param {string} [today]
 * @returns {{ kind: 'harm' | 'low', date: string, incomplete?: boolean } | null}
 */
export function momentFromReads(checkIns, journal, today = todayKey()) {
  const moment = recentHardMoment({
    checkIns: checkIns.status === 'fulfilled' ? checkIns.value : [],
    journal: journal.status === 'fulfilled' ? journal.value : [],
  }, today);
  const failed = [checkIns, journal].find((result) => result.status === 'rejected');
  if (!moment && failed?.status === 'rejected') throw failed.reason;
  if (moment && moment.kind !== 'harm' && journal.status === 'rejected') return { ...moment, incomplete: true };
  return moment;
}

/**
 * What the guard's check says right now, from its query's state:
 * - 'wait': no answer yet, or only an old "no hard moment" while the check
 *   runs again (running or paused offline);
 * - 'provisional': an old answer that holds a hard moment, while the check
 *   runs again, or one found from part of the record. The pause shows at
 *   once, and a newer answer may lift or change it;
 * - 'final': a current answer, or the last one there is when the check
 *   can't run. A failed or disabled check with nothing known is "no hard
 *   moment", so readings show as usual.
 * @param {{ fetchStatus: string, isPending: boolean, isStale: boolean, data?: unknown }} query
 * @returns {'wait' | 'provisional' | 'final'}
 */
export function guardAnswer({ fetchStatus, isPending, isStale, data = null }) {
  const running = fetchStatus === 'fetching' || fetchStatus === 'paused';
  // Found from part of the record: the pause shows, and a full answer may change it.
  if (/** @type {any} */ (data)?.incomplete) return 'provisional';
  if (!running || (!isPending && !isStale)) return 'final';
  if (isPending || !data) return 'wait';
  return 'provisional';
}

/**
 * The page's decision about readings, undefined while waiting. A final
 * answer decides for the visit, so a later one never swaps an open reading
 * for the pause. A provisional pause follows each newer provisional answer
 * and holds until a final one, which may lift it: going from a pause to a
 * reading is the safe direction.
 * @template T
 * @param {{ moment: T | null, final: boolean } | undefined} decided
 * @param {'wait' | 'provisional' | 'final'} answer
 * @param {T | null} current the latest answer
 * @returns {{ moment: T | null, final: boolean } | undefined}
 */
export function settleDecision(decided, answer, current) {
  if (decided?.final || answer === 'wait') return decided;
  if (answer === 'provisional') {
    // An answer from part of the record never outweighs harm already known.
    const knownHarm = /** @type {any} */ (decided?.moment)?.kind === 'harm' && /** @type {any} */ (current)?.incomplete;
    return decided?.moment === current || knownHarm ? decided : { moment: current, final: false };
  }
  return { moment: current, final: true };
}

/**
 * Whether the person recorded feeling unsafe with someone, or a boundary of
 * theirs that someone didn't respect. A chart comparison then isn't offered.
 * @param {any} person @param {any[]} journal
 */
export function harmRecordedWith(person, journal = []) {
  return journal.some((entry) => !entry.is_draft && harmful(entry) && entryInvolvesPerson(entry, person));
}
