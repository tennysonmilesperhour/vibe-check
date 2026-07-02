// The ONLY date entry point for vibe-check.
// Check-in dates are 'yyyy-MM-dd' keys interpreted in the user's LOCAL timezone.
// Never call `new Date('yyyy-MM-dd')` on a date-only string anywhere else in the app:
// that parses as UTC midnight and shifts the day for anyone west of Greenwich.
import { format, addDays, differenceInCalendarDays, getISOWeek, getISOWeekYear } from 'date-fns';

/** 'yyyy-MM-dd' -> Date at LOCAL midnight of that calendar day. */
export function parseLocalDate(key) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Date -> 'yyyy-MM-dd' in local time. */
export function dateKey(date = new Date()) {
  return format(date, 'yyyy-MM-dd');
}

export function todayKey() {
  return dateKey();
}

export function isTodayKey(key) {
  return key === todayKey();
}

/**
 * Period cache keys shared with backend functions.
 * Kept in exact parity with base44/functions/shared/periodKey.ts —
 * the parity test in __tests__/periodKeyParity.test.js guards drift.
 */
export function getPeriodKey(type, date = new Date()) {
  if (type === 'daily') return dateKey(date);
  if (type === 'weekly') {
    return `${getISOWeekYear(date)}-W${String(getISOWeek(date)).padStart(2, '0')}`;
  }
  if (type === 'monthly') return format(date, 'yyyy-MM');
  return format(date, 'yyyy');
}

export function addDaysKey(key, days) {
  return dateKey(addDays(parseLocalDate(key), days));
}

/** Whole calendar days from b to a (positive when a is later). */
export function diffDaysKeys(a, b) {
  return differenceInCalendarDays(parseLocalDate(a), parseLocalDate(b));
}

/** Human context line helper: hours since a given ISO datetime, floored. */
export function hoursSince(isoDateTime) {
  return Math.max(0, Math.floor((Date.now() - new Date(isoDateTime).getTime()) / 3600000));
}
