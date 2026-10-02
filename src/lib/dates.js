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


/** @param {unknown} value @returns {value is string} */
const isDayKey = (value) => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);

const DAY_STYLES = { long: 'EEEE, MMMM d', medium: 'EEE, MMM d', short: 'MMM d' };

/**
 * A day key as people read it: "Monday, September 28" (long), "Mon, Sep 28"
 * (medium) or "Sep 28" (short). The year follows when the day falls in
 * another year than `now`, or always with `withYear`. Anything that isn't a
 * day key comes back as it was, so a stray value never breaks a page.
 * @param {string | null | undefined} key 'yyyy-MM-dd'
 * @param {{ style?: 'long' | 'medium' | 'short', withYear?: boolean, now?: Date }} [options]
 * @returns {string}
 */
export function formatDay(key, { style = 'medium', withYear = false, now = new Date() } = {}) {
  if (!isDayKey(key)) return key ?? '';
  const date = parseLocalDate(key);
  const pattern = DAY_STYLES[style] || DAY_STYLES.medium;
  return format(date, withYear || date.getFullYear() !== now.getFullYear() ? `${pattern}, yyyy` : pattern);
}

/**
 * Two day keys as one span, joined with "to" as in the summary to share:
 * "Sep 21 to 27, 2026", "Sep 28 to Oct 4, 2026", "Dec 29, 2025 to Jan 4,
 * 2026", or "September 2026" for a whole month. One day reads as that day.
 * @param {string} startKey @param {string} endKey
 * @returns {string}
 */
export function formatRange(startKey, endKey) {
  if (!isDayKey(startKey) || !isDayKey(endKey)) return [startKey, endKey].filter(Boolean).join(' to ');
  const start = parseLocalDate(startKey);
  const end = parseLocalDate(endKey);
  const full = (/** @type {Date} */ date) => format(date, 'MMM d, yyyy');
  if (startKey === endKey) return full(start);
  // A span that runs backwards keeps both dates whole, so neither reads as shared.
  if (startKey > endKey || start.getFullYear() !== end.getFullYear()) return `${full(start)} to ${full(end)}`;
  if (start.getMonth() !== end.getMonth()) return `${format(start, 'MMM d')} to ${full(end)}`;
  if (start.getDate() === 1 && addDays(end, 1).getDate() === 1) return format(start, 'MMMM yyyy');
  return `${format(start, 'MMM d')} to ${format(end, 'd, yyyy')}`;
}
