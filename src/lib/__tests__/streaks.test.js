import { describe, it, expect } from 'vitest';
import { computeStreak, isMilestone, MILESTONES } from '../streaks.js';

const entries = (...keys) => keys.map((date) => ({ date }));

describe('computeStreak', () => {
  const today = '2026-07-02';

  it('counts consecutive days ending today', () => {
    expect(computeStreak(entries('2026-07-02', '2026-07-01', '2026-06-30'), today)).toBe(3);
  });

  it('anchors on yesterday when today is not logged yet (streak not broken until midnight)', () => {
    expect(computeStreak(entries('2026-07-01', '2026-06-30'), today)).toBe(2);
  });

  it('a gap breaks the streak', () => {
    expect(computeStreak(entries('2026-07-02', '2026-06-30'), today)).toBe(1);
  });

  it('empty history is zero', () => {
    expect(computeStreak([], today)).toBe(0);
  });

  it('two-day-old last entry is zero', () => {
    expect(computeStreak(entries('2026-06-30'), today)).toBe(0);
  });

  it('ignores duplicate same-day entries and unsorted input', () => {
    expect(computeStreak(entries('2026-06-30', '2026-07-02', '2026-07-01', '2026-07-02'), today)).toBe(3);
  });
});

describe('milestones', () => {
  it('fires at 7, 30, 100 only', () => {
    expect(MILESTONES).toEqual([7, 30, 100]);
    expect(isMilestone(7)).toBe(true);
    expect(isMilestone(30)).toBe(true);
    expect(isMilestone(100)).toBe(true);
    expect(isMilestone(8)).toBe(false);
    expect(isMilestone(0)).toBe(false);
  });
});
