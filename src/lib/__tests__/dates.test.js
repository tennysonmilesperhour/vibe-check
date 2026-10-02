import { describe, it, expect } from 'vitest';
import { parseLocalDate, dateKey, getPeriodKey, addDaysKey, diffDaysKeys, formatDay, formatRange, validDateKey } from '../dates.js';

describe('parseLocalDate', () => {
  it('returns local midnight for the named day, never UTC-shifted', () => {
    const d = parseLocalDate('2026-07-02');
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(6);
    expect(d.getDate()).toBe(2); // the off-by-one bug this module exists to kill
    expect(d.getHours()).toBe(0);
  });

  it('survives DST spring-forward day', () => {
    const d = parseLocalDate('2026-03-08');
    expect(d.getDate()).toBe(8);
  });
});

describe('dateKey round trips', () => {
  it('dateKey(parseLocalDate(k)) === k', () => {
    for (const k of ['2026-01-01', '2026-12-31', '2024-02-29']) {
      expect(dateKey(parseLocalDate(k))).toBe(k);
    }
  });
});

describe('getPeriodKey', () => {
  const d = parseLocalDate('2026-07-02');
  it('daily', () => expect(getPeriodKey('daily', d)).toBe('2026-07-02'));
  it('weekly is ISO week', () => expect(getPeriodKey('weekly', d)).toBe('2026-W27'));
  it('monthly', () => expect(getPeriodKey('monthly', d)).toBe('2026-07'));
  it('yearly', () => expect(getPeriodKey('yearly', d)).toBe('2026'));

  it('ISO week-year boundary: Jan 1 2027 is week 53 of 2026', () => {
    expect(getPeriodKey('weekly', parseLocalDate('2027-01-01'))).toBe('2026-W53');
  });
  it('ISO week-year boundary: Dec 29 2025 is week 1 of 2026', () => {
    expect(getPeriodKey('weekly', parseLocalDate('2025-12-29'))).toBe('2026-W01');
  });
});

describe('day arithmetic on keys', () => {
  it('addDaysKey crosses months', () => {
    expect(addDaysKey('2026-06-30', 2)).toBe('2026-07-02');
    expect(addDaysKey('2026-07-02', -2)).toBe('2026-06-30');
  });
  it('diffDaysKeys', () => {
    expect(diffDaysKeys('2026-07-02', '2026-06-30')).toBe(2);
    expect(diffDaysKeys('2026-06-30', '2026-07-02')).toBe(-2);
  });
});

describe('formatDay', () => {
  const now = parseLocalDate('2026-10-02');

  it('reads a day key at three lengths', () => {
    expect(formatDay('2026-09-28', { now })).toBe('Mon, Sep 28');
    expect(formatDay('2026-09-28', { style: 'long', now })).toBe('Monday, September 28');
    expect(formatDay('2026-09-28', { style: 'short', now })).toBe('Sep 28');
  });

  it('adds the year for another year, or when asked', () => {
    expect(formatDay('2025-12-31', { now })).toBe('Wed, Dec 31, 2025');
    expect(formatDay('2025-12-31', { style: 'long', now })).toBe('Wednesday, December 31, 2025');
    expect(formatDay('2026-09-28', { style: 'short', withYear: true, now })).toBe('Sep 28, 2026');
  });

  it('keeps the calendar day on a daylight saving change', () => {
    expect(formatDay('2026-03-08', { style: 'short', now })).toBe('Mar 8');
  });

  it('returns anything that is not a real day as it was', () => {
    expect(formatDay(undefined)).toBe('');
    expect(formatDay(null)).toBe('');
    expect(formatDay('soon')).toBe('soon');
    expect(formatDay('2026-02-30')).toBe('2026-02-30');
    expect(formatDay('0026-09-28')).toBe('0026-09-28');
  });
});

describe('formatRange', () => {
  it('shares the month and year where it can', () => {
    expect(formatRange('2026-09-21', '2026-09-27')).toBe('Sep 21 to 27, 2026');
    expect(formatRange('2026-09-28', '2026-10-04')).toBe('Sep 28 to Oct 4, 2026');
    expect(formatRange('2025-12-29', '2026-01-04')).toBe('Dec 29, 2025 to Jan 4, 2026');
  });

  it('names a whole month', () => {
    expect(formatRange('2026-09-01', '2026-09-30')).toBe('September 2026');
    expect(formatRange('2024-02-01', '2024-02-29')).toBe('February 2024');
    expect(formatRange('2026-09-01', '2026-09-29')).toBe('Sep 1 to 29, 2026');
  });

  it('reads one day as that day, and a backwards span in full', () => {
    expect(formatRange('2026-09-21', '2026-09-21')).toBe('Sep 21, 2026');
    expect(formatRange('2026-09-27', '2026-09-21')).toBe('Sep 27, 2026 to Sep 21, 2026');
  });

  it('joins values that are not real days as they are', () => {
    expect(formatRange('2026-09-21', '')).toBe('2026-09-21');
    expect(formatRange('2026-09-01', '2026-09-31')).toBe('2026-09-01 to 2026-09-31');
  });

  it('spells out months, or leaves off the year within one year, when asked', () => {
    expect(formatRange('2026-09-21', '2026-09-27', { long: true })).toBe('September 21 to 27, 2026');
    expect(formatRange('2026-09-28', '2026-10-04', { long: true })).toBe('September 28 to October 4, 2026');
    expect(formatRange('2026-09-21', '2026-09-27', { withYear: false })).toBe('Sep 21 to 27');
    expect(formatRange('2026-09-21', '2026-09-21', { withYear: false })).toBe('Sep 21');
    expect(formatRange('2026-09-01', '2026-09-30', { withYear: false })).toBe('September 2026');
    expect(formatRange('2025-12-29', '2026-01-04', { withYear: false })).toBe('Dec 29, 2025 to Jan 4, 2026');
  });
});

describe('validDateKey', () => {
  it('accepts real days only', () => {
    expect(validDateKey('2024-02-29')).toBe(true);
    expect(validDateKey('2026-02-29')).toBe(false);
    expect(validDateKey('2026-9-1')).toBe(false);
    expect(validDateKey(20260901)).toBe(false);
  });
});
