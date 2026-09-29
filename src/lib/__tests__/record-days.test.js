import { describe, it, expect } from 'vitest';
import { daysKeptThisMonth, daysKeptLabel } from '../record-days.js';

const entries = (...dates) => dates.map((date) => ({ date }));

describe('days kept this month', () => {
  const today = '2026-09-29';

  it('counts distinct days this month, with gaps costing nothing', () => {
    expect(daysKeptThisMonth(entries('2026-09-01', '2026-09-15', '2026-09-15', '2026-09-29'), today)).toBe(3);
  });

  it('leaves out other months and future dates', () => {
    expect(daysKeptThisMonth(entries('2026-08-31', '2026-10-01', '2025-09-10', '2026-09-30'), today)).toBe(0);
  });

  it('names the month and says nothing when there is nothing yet', () => {
    expect(daysKeptLabel(1, today)).toBe('1 day kept in September');
    expect(daysKeptLabel(12, today)).toBe('12 days kept in September');
    expect(daysKeptLabel(0, today)).toBe('');
  });
});
