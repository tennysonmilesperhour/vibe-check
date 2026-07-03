import { describe, it, expect } from 'vitest';
import { lifePath, expression, soulUrge, personalYear, personalMonth, personalDay, reduceKeepMasters, reduceSingle } from '../numerology.js';

describe('reducers', () => {
  it('reduceKeepMasters preserves 11/22/33', () => {
    expect(reduceKeepMasters(11)).toBe(11);
    expect(reduceKeepMasters(22)).toBe(22);
    expect(reduceKeepMasters(33)).toBe(33);
    expect(reduceKeepMasters(38)).toBe(11); // 3+8
    expect(reduceKeepMasters(32)).toBe(5);
  });
  it('reduceSingle always lands 1-9', () => {
    expect(reduceSingle(22)).toBe(4);
    expect(reduceSingle(38)).toBe(2);
  });
});

describe('lifePath (component method, masters preserved)', () => {
  it('1990-07-15 -> 5 (7 + 6 + 1)', () => {
    expect(lifePath('1990-07-15')).toBe(5);
  });
  it('1985-11-22 -> 11 (11 + 22 + 5 = 38 -> 11)', () => {
    expect(lifePath('1985-11-22')).toBe(11);
  });
  it('handles missing input', () => {
    expect(lifePath(null)).toBeNull();
  });
});

describe('name numbers (Pythagorean)', () => {
  it('expression sums all letters: "Ann" = 1+5+5 = 11 (master kept)', () => {
    expect(expression('Ann')).toBe(11);
  });
  it('soulUrge sums vowels only: "Ann" vowels = A = 1', () => {
    expect(soulUrge('Ann')).toBe(1);
  });
  it('ignores non-letters and case', () => {
    expect(expression("aN-n!")).toBe(11);
  });
  it('empty name is null', () => {
    expect(expression('')).toBeNull();
  });
});

describe('personal cycles (birthday roll, single digits)', () => {
  const birth = '1990-07-15';
  it('before the birthday uses the previous year', () => {
    // 2026-07-02, birthday not yet reached: year 2025 -> 9; 7 + 6 + 9 = 22 -> 4
    expect(personalYear(birth, '2026-07-02')).toBe(4);
  });
  it('after the birthday uses the current year', () => {
    // 2026-08-01: year 2026 -> 1; 7 + 6 + 1 = 14 -> 5
    expect(personalYear(birth, '2026-08-01')).toBe(5);
  });
  it('personalMonth chains from personalYear', () => {
    // PY 4 in July: 4 + 7 = 11 -> 2
    expect(personalMonth(birth, '2026-07-02')).toBe(2);
  });
  it('personalDay chains from personalMonth', () => {
    // PM 2 on the 2nd: 2 + 2 = 4
    expect(personalDay(birth, '2026-07-02')).toBe(4);
  });
});
