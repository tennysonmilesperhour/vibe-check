import { describe, it, expect } from 'vitest';
import { calendarDays, calendarMonths, calendarSummary, scoreBand } from '../pattern-calendar';
import { timelineEntries, filterEntries } from '../living-patterns';

describe('calendar scores remain faithful to the record', () => {
  it('keeps a high daily mood beside an unsafe moment and uses peak recorded stress', () => {
    const entries = timelineEntries([{ id: 'd', date: '2026-09-01', mood_score: 9, stress_context: { stress_score: 2 } }], [{ id: 'j', date: '2026-09-01', mood_score: 1, interaction_feeling: 'unsafe', stress_context: { stress_score: 8 } }]);
    const mood = calendarDays(entries, '2026-09-01', '2026-09-01')[0];
    expect(mood.value).toBe(9);
    expect(mood.unsafe).toBe(1);
    expect(mood.rows).toHaveLength(2);
    expect(calendarDays(entries, '2026-09-01', '2026-09-01', 'stress')[0].value).toBe(8);
  });
  it('distinguishes zero, missing, invalid scores, and journal-only mood', () => {
    const entries = timelineEntries([{ id: 'a', date: '2026-03-07', mood_score: 0 }, { id: 'b', date: '2026-03-09', mood_score: '' }, { id: 'c', date: '2026-03-10', mood_score: 11 }], [{ id: 'j', date: '2026-03-08', mood_score: 9 }]);
    expect(calendarDays(entries, '2026-03-07', '2026-03-10').map((day) => day.value)).toEqual([0, null, null, null]);
    expect(scoreBand(0)).toBe(0);
    expect(scoreBand(null)).toBeNull();
    expect([2, 2.5, 4, 4.5, 6, 7, 8, 9, 10].map(scoreBand)).toEqual([0, 1, 1, 2, 2, 3, 3, 4, 4]);
  });
  it('uses only entries that match the selected person or habit', () => {
    const entries = timelineEntries([{ id: 'd', date: '2026-09-01', mood_score: 9, person_ids: ['a'] }], [{ id: 'j', date: '2026-09-01', person_ids: ['b'], interaction_feeling: 'unsafe', stress_context: { stress_score: 8 } }]);
    const filtered = filterEntries(entries, { person: 'a' });
    expect(calendarDays(filtered, '2026-09-01', '2026-09-01', 'stress')[0]).toMatchObject({ value: null, unsafe: 0 });
    expect(calendarDays(filtered, '2026-09-01', '2026-09-01')[0].value).toBe(9);
  });
  it('aligns leap months and both week starts in local time', () => {
    const monday = calendarMonths('2024-02-10', '2024-03-02', 1);
    expect(monday[0]).toMatchObject({ first: '2024-02-01', last: '2024-02-29', offset: 3 });
    expect(monday[0].dates).toHaveLength(29);
    expect(calendarMonths('2024-02-10', '2024-03-02', 0)[0].offset).toBe(4);
    expect(calendarMonths('2026-02-30', '2026-03-01')).toEqual([]);
    expect(calendarDays([], '2026-03-04', '2026-03-01')).toEqual([]);
  });
  it('breaks consecutive runs at missing days and keeps weekday sample counts', () => {
    const entries = timelineEntries(['2026-08-03', '2026-08-10', '2026-08-17', '2026-08-18', '2026-08-20'].map((date, index) => ({ id: String(index), date, mood_score: 3 })));
    const result = calendarSummary(calendarDays(entries, '2026-08-01', '2026-08-31'));
    expect(result.longest).toEqual({ start: '2026-08-17', end: '2026-08-18', count: 2 });
    expect(result.weekdays[1]).toMatchObject({ count: 3, mean: 3 });
    expect(result.weekdays[2]).toMatchObject({ count: 1, mean: null });
    expect(result.recorded).toBe(5);
    expect(result.missing).toBe(26);
  });
  it('counts energy separately and excludes drafts without inventing stress', () => {
    const entries = [{ key: 'd', date: '2026-09-01', kind: 'day', mood_score: 9, energy_level: 2, sleep_quality: 8 }, { key: 'draft', date: '2026-09-01', kind: 'journal', is_draft: true, stress_context: { stress_score: 10 }, interaction_feeling: 'unsafe' }];
    expect(calendarDays(entries, '2026-09-01', '2026-09-01', 'energy')[0].value).toBe(2);
    expect(calendarDays(entries, '2026-09-01', '2026-09-01', 'sleep')[0].value).toBe(8);
    expect(calendarDays(entries, '2026-09-01', '2026-09-01', 'stress')[0]).toMatchObject({ value: null, unsafe: 0 });
  });
});
