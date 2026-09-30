import { describe, it, expect } from 'vitest';
import { recentHardMoment, harmRecordedWith, guardAnswer, settleDecision } from '../symbolic-guard';

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

  it('waits for a first answer, and for a recheck of an old "no hard moment", offline too', () => {
    expect(guardAnswer({ fetchStatus: 'fetching', isPending: true, isStale: true })).toBe('wait');
    expect(guardAnswer({ fetchStatus: 'paused', isPending: true, isStale: true })).toBe('wait');
    expect(guardAnswer({ fetchStatus: 'fetching', isPending: false, isStale: true, data: null })).toBe('wait');
    expect(guardAnswer({ fetchStatus: 'paused', isPending: false, isStale: true, data: null })).toBe('wait');
  });

  it('shows a known hard moment at once while it is checked again', () => {
    const low = { kind: 'low', date: '2026-09-28' };
    expect(guardAnswer({ fetchStatus: 'fetching', isPending: false, isStale: true, data: low })).toBe('provisional');
    expect(guardAnswer({ fetchStatus: 'paused', isPending: false, isStale: true, data: low })).toBe('provisional');
  });

  it('takes a current answer, or the last one there is when the check cannot run', () => {
    const low = { kind: 'low', date: '2026-09-28' };
    expect(guardAnswer({ fetchStatus: 'idle', isPending: false, isStale: false, data: null })).toBe('final');
    expect(guardAnswer({ fetchStatus: 'fetching', isPending: false, isStale: false, data: low })).toBe('final');
    // A failed recheck keeps the moment it knew; a failed first check shows readings.
    expect(guardAnswer({ fetchStatus: 'idle', isPending: false, isStale: true, data: low })).toBe('final');
    expect(guardAnswer({ fetchStatus: 'idle', isPending: false, isStale: true })).toBe('final');
    // Disabled.
    expect(guardAnswer({ fetchStatus: 'idle', isPending: true, isStale: true })).toBe('final');
  });

  it('lets a final answer decide for the visit, and a provisional pause lift', () => {
    const low = { kind: 'low', date: '2026-09-29' };
    expect(settleDecision(undefined, 'wait', null)).toBeUndefined();
    expect(settleDecision(undefined, 'final', low)).toEqual({ moment: low, final: true });
    expect(settleDecision(undefined, 'final', null)).toEqual({ moment: null, final: true });
    // A final decision never changes, so an open reading is never replaced.
    const shown = { moment: null, final: true };
    expect(settleDecision(shown, 'final', low)).toBe(shown);
    expect(settleDecision(shown, 'provisional', low)).toBe(shown);
    // A provisional pause holds while waiting, and a current answer may lift it.
    const pause = settleDecision(undefined, 'provisional', low);
    expect(pause).toEqual({ moment: low, final: false });
    expect(settleDecision(pause, 'wait', null)).toBe(pause);
    expect(settleDecision(pause, 'provisional', low)).toBe(pause);
    expect(settleDecision(pause, 'final', null)).toEqual({ moment: null, final: true });
  });
});
