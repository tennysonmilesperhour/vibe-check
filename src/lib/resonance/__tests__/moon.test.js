import { describe, it, expect } from 'vitest';
import { moonPhase, PHASES } from '../moon.js';

describe('moonPhase', () => {
  it('the reference epoch itself is a new moon', () => {
    const m = moonPhase('2000-01-06');
    expect(m.name).toBe('New Moon');
    expect(m.illumination).toBeLessThan(0.05);
  });

  it('half a synodic month after the epoch is full', () => {
    // 29.53 / 2 ≈ 14.77 days after 2000-01-06 → 2000-01-21
    const m = moonPhase('2000-01-21');
    expect(m.name).toBe('Full Moon');
    expect(m.illumination).toBeGreaterThan(0.95);
  });

  it('a quarter month in is waxing', () => {
    const m = moonPhase('2000-01-13');
    expect(['First Quarter', 'Waxing Crescent', 'Waxing Gibbous']).toContain(m.name);
  });

  it('returns one of the eight canonical phases with an emoji', () => {
    const m = moonPhase('2026-07-02');
    expect(PHASES.map((p) => p.name)).toContain(m.name);
    expect(m.emoji).toBeTruthy();
    expect(m.index).toBeGreaterThanOrEqual(0);
    expect(m.index).toBeLessThan(8);
  });

  it('illumination stays within [0,1] across a full cycle', () => {
    for (let d = 1; d <= 29; d++) {
      const key = `2026-06-${String(d).padStart(2, '0')}`;
      const m = moonPhase(key);
      expect(m.illumination).toBeGreaterThanOrEqual(0);
      expect(m.illumination).toBeLessThanOrEqual(1);
    }
  });
});
