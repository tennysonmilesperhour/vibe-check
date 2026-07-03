import { describe, it, expect } from 'vitest';
import { parseLocalDate, dateKey, todayKey, isTodayKey, getPeriodKey, addDaysKey, diffDaysKeys } from '../dates.js';

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

  it('isTodayKey matches todayKey only', () => {
    expect(isTodayKey(todayKey())).toBe(true);
    expect(isTodayKey('1999-01-01')).toBe(false);
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
