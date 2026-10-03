// The note on Today that a weekly report is ready: the most recent completed
// week, once it holds something recorded, until the person opens the report
// or hides the note. In the app only: nothing is emailed or pushed. Which
// week was seen is remembered on this device, per person.
import { previousPeriod, reportPeriod } from './living-patterns';

const PREFIX = 'vibe:week-ready:';
/** Where the week seen is stored for a person. @param {string} userId */
export const weekSeenKey = (userId) => PREFIX + userId;
// Reading localStorage itself throws where site data is blocked.
const storageOf = () => globalThis.localStorage;

// How far back the recorded days need to go to cover last week, whichever
// day the week begins on.
export const RECENT_DAYS = 14;

/**
 * The completed week to offer, or null: last week, when something was
 * recorded in it and its note hasn't been opened or hidden here.
 * @param {{ today: string, weekStartsOn: 0 | 1, recordedDates: string[], seen: string | null }} options
 * @returns {{ type: string, start: string, end: string } | null}
 */
export function readyWeek({ today, weekStartsOn, recordedDates, seen }) {
  const week = lastWeek(today, weekStartsOn);
  if (seen === week.start) return null;
  return recordedDates.some((date) => date >= week.start && date <= week.end) ? week : null;
}

/** The most recent completed week. @param {string} today @param {0 | 1} weekStartsOn */
export const lastWeek = (today, weekStartsOn) => previousPeriod(reportPeriod('weekly', today, weekStartsOn), weekStartsOn);

/**
 * The start of the week whose note was last opened or hidden here.
 * @param {string | null | undefined} userId @param {Pick<Storage, 'getItem'>} [storage]
 */
export function weekSeen(userId, storage) {
  if (!userId) return null;
  try {
    return (storage || storageOf()).getItem(weekSeenKey(userId));
  } catch {
    return null;
  }
}

/**
 * @param {string | null | undefined} userId @param {string} weekStart
 * @param {Pick<Storage, 'setItem'>} [storage]
 */
export function markWeekSeen(userId, weekStart, storage) {
  if (!userId) return;
  try {
    (storage || storageOf()).setItem(weekSeenKey(userId), weekStart);
  } catch {
    // Storage blocked: the note shows again next time, and nothing is lost.
  }
}

/** Forgets the week seen, when the person signs out or deletes the account. @param {string | null | undefined} userId */
export function clearWeekSeen(userId) {
  if (!userId) return;
  try {
    storageOf().removeItem(weekSeenKey(userId));
  } catch {
    // Storage blocked: there's nothing stored to forget.
  }
}
