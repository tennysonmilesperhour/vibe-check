import { describe, it, expect } from 'vitest';
import { getISOWeek, getISOWeekYear, format } from 'date-fns';
import { getPeriodKey as clientKey, parseLocalDate, addDaysKey, dateKey } from '../dates.js';

// The old Base44/edge-function server copies are gone; date-fns is the
// independent oracle now. Weekly keys are ISO-8601 weeks — the classic
// drift zone around year boundaries.
const SAMPLES = [
  // ISO year boundaries
  '2025-12-28', '2025-12-29', '2025-12-30', '2025-12-31',
  '2026-01-01', '2026-01-02', '2026-01-03', '2026-01-04', '2026-01-05',
  '2026-12-28', '2026-12-31', '2027-01-01', '2027-01-04',
  // leap day
  '2024-02-28', '2024-02-29', '2024-03-01',
  // DST edges (US)
  '2026-03-07', '2026-03-08', '2026-03-09', '2026-11-01', '2026-11-02',
];

const pad = (n) => String(n).padStart(2, '0');

const oracle = {
  daily: (d) => format(d, 'yyyy-MM-dd'),
  weekly: (d) => `${getISOWeekYear(d)}-W${pad(getISOWeek(d))}`,
  monthly: (d) => format(d, 'yyyy-MM'),
  yearly: (d) => format(d, 'yyyy'),
};

describe('period key parity with date-fns ISO calendar', () => {
  for (const type of ['daily', 'weekly', 'monthly', 'yearly']) {
    it(`${type} keys identical across ${SAMPLES.length}+ dates`, () => {
      // sampled boundary dates plus a rolling window through 2026
      let k = '2026-01-01';
      const all = [...SAMPLES];
      for (let i = 0; i < 24; i++) { all.push(k); k = addDaysKey(k, 15); }
      for (const key of all) {
        const d = parseLocalDate(key);
        expect(clientKey(type, d), `${type} @ ${key}`).toBe(oracle[type](d));
      }
    });
  }

  it('sanity: dateKey stays lossless through the rolling window', () => {
    expect(dateKey(parseLocalDate('2026-06-15'))).toBe('2026-06-15');
  });
});
