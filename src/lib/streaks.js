// Evening-ritual streaks, computed on date keys (never Date parsing).
import { diffDaysKeys, addDaysKey } from './dates.js';

export const MILESTONES = [7, 30, 100];

export const isMilestone = (n) => MILESTONES.includes(n);

/**
 * Consecutive-day streak ending today or yesterday.
 * Today being unlogged doesn't break the streak until the day is over.
 */
export function computeStreak(checkIns, today) {
  const days = new Set(checkIns.map((entry) => entry.date));
  if (days.size === 0) return 0;

  let anchor = days.has(today) ? today : addDaysKey(today, -1);
  if (!days.has(anchor)) return 0;

  let streak = 0;
  let cursor = anchor;
  while (days.has(cursor)) {
    streak += 1;
    cursor = addDaysKey(cursor, -1);
  }
  return streak;
}

/** Sanity guard used by callers displaying "N evenings". */
export function streakLabel(n) {
  if (n <= 0) return 'Begin tonight';
  if (n === 1) return '1 evening';
  return `${n} evenings`;
}

// re-export for callers that want adjacency math without importing dates.js
export { diffDaysKeys };
