import { describe, it, expect } from 'vitest';
import { recentHardMoment, harmRecordedWith } from '../symbolic-guard';

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
});
