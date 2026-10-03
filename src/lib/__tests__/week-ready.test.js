import { afterEach, describe, expect, it, vi } from 'vitest';
import { clearWeekSeen, lastWeek, markWeekSeen, readyWeek, weekSeen } from '../week-ready';
import { keepSave, keptSaves } from '../kept-saves';

// Tuesday, September 29, 2026.
const today = '2026-09-29';

describe('the week-ready note', () => {
  it('offers last week once something was recorded in it', () => {
    expect(readyWeek({ today, weekStartsOn: 1, recordedDates: ['2026-09-24'], seen: null })).toEqual(expect.objectContaining({ start: '2026-09-21', end: '2026-09-27' }));
  });

  it('follows the day the person\'s week begins on', () => {
    expect(lastWeek(today, 0)).toEqual(expect.objectContaining({ start: '2026-09-20', end: '2026-09-26' }));
    // Sunday the 27th belongs to this week when weeks begin on Sunday.
    expect(readyWeek({ today, weekStartsOn: 0, recordedDates: ['2026-09-27'], seen: null })).toBeNull();
    expect(readyWeek({ today, weekStartsOn: 1, recordedDates: ['2026-09-27'], seen: null })).not.toBeNull();
  });

  it('offers nothing for a week with nothing recorded, or only this week', () => {
    expect(readyWeek({ today, weekStartsOn: 1, recordedDates: [], seen: null })).toBeNull();
    expect(readyWeek({ today, weekStartsOn: 1, recordedDates: ['2026-09-28', '2026-09-13'], seen: null })).toBeNull();
  });

  it('offers nothing once the week was opened or hidden, and the next week again', () => {
    expect(readyWeek({ today, weekStartsOn: 1, recordedDates: ['2026-09-24'], seen: '2026-09-21' })).toBeNull();
    expect(readyWeek({ today, weekStartsOn: 1, recordedDates: ['2026-09-24'], seen: '2026-09-14' })).not.toBeNull();
  });

  it('remembers the week seen per person, and copes without storage', () => {
    const values = new Map();
    const storage = { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => { values.set(key, value); } };
    markWeekSeen('a', '2026-09-21', storage);
    expect(weekSeen('a', storage)).toBe('2026-09-21');
    expect(weekSeen('b', storage)).toBeNull();
    const blocked = { getItem: () => { throw new Error('blocked'); }, setItem: () => { throw new Error('blocked'); } };
    expect(() => markWeekSeen('a', '2026-09-21', blocked)).not.toThrow();
    expect(weekSeen('a', blocked)).toBeNull();
  });
});

describe('where site data is blocked', () => {
  afterEach(() => { vi.unstubAllGlobals(); delete globalThis.localStorage; });

  it('neither the note nor kept saves throw when reading storage itself throws', () => {
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, get() { throw new Error('SecurityError'); } });
    expect(weekSeen('a')).toBeNull();
    expect(() => markWeekSeen('a', '2026-09-21')).not.toThrow();
    expect(() => clearWeekSeen('a')).not.toThrow();
    expect(keptSaves('a')).toEqual([]);
    expect(keepSave('a', { id: 'entry-1', kind: 'journal', payload: {} })).toBe(false);
  });
});
