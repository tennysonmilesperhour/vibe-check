import { describe, it, expect } from 'vitest';
import { evaluateBoundaries, dedupeAlerts } from '../boundaries.js';

const mk = (date, mood) => ({ date, mood_score: mood });

const settings = { mood_threshold: 4, consecutive_days: 3 };

describe('evaluateBoundaries', () => {
  it('flags a low-mood day at or under the threshold', () => {
    const out = evaluateBoundaries([mk('2026-07-02', 3)], settings);
    expect(out.some((a) => a.alert_type === 'low_mood' && a.date === '2026-07-02')).toBe(true);
  });

  it('does not flag above threshold', () => {
    expect(evaluateBoundaries([mk('2026-07-02', 5)], settings)).toEqual([]);
  });

  it('flags a declining run of consecutive_days consecutive drops', () => {
    const out = evaluateBoundaries(
      [mk('2026-07-02', 5), mk('2026-07-01', 6), mk('2026-06-30', 7), mk('2026-06-29', 7)],
      settings
    );
    expect(out.some((a) => a.alert_type === 'declining')).toBe(true);
  });

  it('no declining alert when the run is broken', () => {
    const out = evaluateBoundaries(
      [mk('2026-07-02', 5), mk('2026-07-01', 7), mk('2026-06-30', 6)],
      settings
    );
    expect(out.some((a) => a.alert_type === 'declining')).toBe(false);
  });

  it('declining requires day-adjacent entries (a logging gap is not a decline)', () => {
    const out = evaluateBoundaries(
      [mk('2026-07-02', 5), mk('2026-06-28', 6), mk('2026-06-20', 7)],
      settings
    );
    expect(out.some((a) => a.alert_type === 'declining')).toBe(false);
  });
});

describe('dedupeAlerts', () => {
  it('drops candidates that already exist for the same type+date', () => {
    const existing = [{ alert_type: 'low_mood', date: '2026-07-02' }];
    const fresh = [
      { alert_type: 'low_mood', date: '2026-07-02', message: 'dup' },
      { alert_type: 'declining', date: '2026-07-02', message: 'new' },
    ];
    const out = dedupeAlerts(fresh, existing);
    expect(out).toHaveLength(1);
    expect(out[0].alert_type).toBe('declining');
  });
});
