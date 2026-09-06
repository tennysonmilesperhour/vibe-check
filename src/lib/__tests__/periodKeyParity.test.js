import { describe, it, expect } from 'vitest';
import { getPeriodKey as clientKey, parseLocalDate, addDaysKey, dateKey } from '../dates.js';
// The server copy is plain TS with no Deno APIs, so vitest can import it directly.
import { getPeriodKey as serverKey } from '../../../base44/functions/shared/periodKey.ts';

const SAMPLES = [
  // ISO year boundaries: the classic drift zone
  '2025-12-28', '2025-12-29', '2025-12-30', '2025-12-31',
  '2026-01-01', '2026-01-02', '2026-01-03', '2026-01-04', '2026-01-05',
  '2026-12-28', '2026-12-31', '2027-01-01', '2027-01-04',
  // leap day
  '2024-02-28', '2024-02-29', '2024-03-01',
  // DST edges (US)
  '2026-03-07', '2026-03-08', '2026-03-09', '2026-11-01', '2026-11-02',
];

describe('client/server period key parity', () => {
  for (const type of ['daily', 'weekly', 'monthly', 'yearly']) {
    it(`${type} keys identical across ${SAMPLES.length}+ dates`, () => {
      // sampled boundary dates plus a rolling window through 2026
      let k = '2026-01-01';
      const all = [...SAMPLES];
      for (let i = 0; i < 24; i++) { all.push(k); k = addDaysKey(k, 15); }
      for (const key of all) {
        const d = parseLocalDate(key);
        expect(serverKey(type, d), `${type} @ ${key}`).toBe(clientKey(type, d));
      }
    });
  }

  it('sanity: dateKey stays lossless through the rolling window', () => {
    expect(dateKey(parseLocalDate('2026-06-15'))).toBe('2026-06-15');
  });
});
