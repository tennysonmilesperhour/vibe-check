import { describe, it, expect } from 'vitest';
import { recentHardMoment, harmRecordedWith, guardWaiting, settleDecision } from '../symbolic-guard';

const today = '2026-09-29';

describe('symbolic readings wait after a hard moment', () => {
  it('notices an unsafe moment, a boundary not respected, or a low day in the last three days', () => {
    expect(recentHardMoment({ journal: [{ date: '2026-09-28', interaction_feeling: 'unsafe' }] }, today)).toEqual({ kind: 'harm', date: '2026-09-28' });
    expect(recentHardMoment({ journal: [{ date: '2026-09-27', boundary_respected: 'no' }] }, today)).toEqual({ kind: 'harm', date: '2026-09-27' });
    expect(recentHardMoment({ checkIns: [{ date: '2026-09-29', mood_score: 3 }] }, today)).toEqual({ kind: 'low', date: '2026-09-29' });
    // A journal moment counts too, for someone who journals without checking in.
    expect(recentHardMoment({ journal: [{ date: '2026-09-28', mood_score: 1 }] }, today)).toEqual({ kind: 'low', date: '2026-09-28' });
    expect(recentHardMoment({ journal: [{ date: '2026-09-28', mood_score: 1, is_draft: true }] }, today)).toBeNull();
  });

  it('puts harm first, and lets older or gentler days pass', () => {
    expect(recentHardMoment({ checkIns: [{ date: '2026-09-29', mood_score: 2 }], journal: [{ date: '2026-09-27', interaction_feeling: 'unsafe' }] }, today)).toMatchObject({ kind: 'harm' });
    expect(recentHardMoment({ checkIns: [{ date: '2026-09-26', mood_score: 1 }], journal: [{ date: '2026-09-26', interaction_feeling: 'unsafe' }] }, today)).toBeNull();
    expect(recentHardMoment({ checkIns: [{ date: '2026-09-29', mood_score: 4 }, { date: '2026-09-28', mood_score: null }], journal: [{ date: '2026-09-29', interaction_feeling: 'strained', boundary_respected: 'unsure' }] }, today)).toBeNull();
    expect(recentHardMoment({ journal: [{ date: '2026-09-29', interaction_feeling: 'unsafe', is_draft: true }] }, today)).toBeNull();
  });

  it('finds harm recorded with a particular person', () => {
    const sam = { id: 'sam', name: 'Sam' };
    const journal = [{ date: '2026-01-01', person_ids: ['sam'], boundary_respected: 'no' }, { date: '2026-01-02', person_ids: ['jules'], interaction_feeling: 'supportive' }];
    expect(harmRecordedWith(sam, journal)).toBe(true);
    expect(harmRecordedWith({ id: 'jules', name: 'Jules' }, journal)).toBe(false);
  });

  it('waits for a running or offline check with no current answer, and never for a failed one', () => {
    expect(guardWaiting({ fetchStatus: 'fetching', isPending: true, isStale: true })).toBe(true);
    expect(guardWaiting({ fetchStatus: 'paused', isPending: true, isStale: true })).toBe(true);
    // A saved check-in marks the cached answer stale: wait for the new one.
    expect(guardWaiting({ fetchStatus: 'fetching', isPending: false, isStale: true })).toBe(true);
    expect(guardWaiting({ fetchStatus: 'fetching', isPending: false, isStale: false })).toBe(false);
    expect(guardWaiting({ fetchStatus: 'idle', isPending: false, isStale: true })).toBe(false);
    expect(guardWaiting({ fetchStatus: 'idle', isPending: true, isStale: true })).toBe(false);
    // An old answer that holds a hard moment stands, offline or slow...
    const low = { kind: 'low', date: '2026-09-28' };
    expect(guardWaiting({ fetchStatus: 'paused', isPending: false, isStale: true, data: low })).toBe(false);
    expect(guardWaiting({ fetchStatus: 'fetching', isPending: false, isStale: true, data: low })).toBe(false);
    // ...unless a save has since made it out of date.
    expect(guardWaiting({ fetchStatus: 'fetching', isPending: false, isStale: true, isInvalidated: true, data: low })).toBe(true);
  });

  it('lets the first answer decide for the visit', () => {
    const low = { kind: 'low', date: '2026-09-29' };
    expect(settleDecision(undefined, true, null)).toBeUndefined();
    expect(settleDecision(undefined, false, low)).toBe(low);
    expect(settleDecision(undefined, false, null)).toBeNull();
    // Later answers never change it.
    expect(settleDecision(null, false, low)).toBeNull();
    expect(settleDecision(low, true, null)).toBe(low);
  });
});
