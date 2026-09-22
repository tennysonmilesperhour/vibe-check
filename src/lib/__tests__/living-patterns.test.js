import { describe, it, expect, vi, afterEach } from 'vitest';
import { timelineEntries, entryStates, filterEntries, stressPatterns, reportPeriod, previousPeriod, buildReport, historyChart, validDateKey } from '../living-patterns';
import { recommendPractices, PRACTICES, STRESS_STATES } from '../practices';
import { fetchAllPages } from '../crypto';

afterEach(() => vi.useRealTimers());
const day = (id, date, mood_score, extra = {}) => ({ id, date, mood_score, ...extra });

describe('a whole history, including difficult moments', () => {
  it('keeps an unsafe interaction beside a good daily mood and excludes unfinished drafts', () => {
    vi.setSystemTime(new Date(2026, 8, 8, 12));
    const entries = timelineEntries([day('day', '2026-09-07', 9)], [day('moment', '2026-09-07', 2, { kind: 'interaction', interaction_feeling: 'unsafe' }), day('draft', '2026-09-07', 1, { is_draft: true })]);
    const report = buildReport(entries, reportPeriod('weekly', '2026-09-07'));
    expect(report.rows).toHaveLength(2);
    expect(report.days).toBe(1);
    expect(report.moods.mean).toBe(9);
    expect(report.interactions[0].interaction_feeling).toBe('unsafe');
    expect(report.interactions[0].mood_score).toBe(2);
    expect(report.interactions[0].entry_kind).toBe('interaction');
  });
  it('keeps missing chart days empty, including explicit zero stress', () => {
    const chart = historyChart([day('1', '2026-03-07', 3), day('2', '2026-03-09', 9, { stress_context: { stress_score: 0 } })], '2026-03-07', '2026-03-09');
    expect(chart.map((point) => point.mood)).toEqual([3, null, 9]);
    expect(chart[2].stress).toBe(0);
  });
  it('paginates beyond 120 and 1,000 records', async () => {
    const all = Array.from({ length: 1227 }, (_, id) => ({ id }));
    const fetch = vi.fn(async (limit, offset) => all.slice(offset, offset + limit));
    expect(await fetchAllPages(fetch, 500)).toEqual(all);
    expect(fetch).toHaveBeenCalledTimes(3);
  });
  it('filters a habit and person together without counting untagged entries', () => {
    const entries = timelineEntries([day('1', '2026-09-02', 3, { person_ids: ['p'], activities: ['Late work'] }), day('2', '2026-09-03', 8), day('3', '2026-09-04', 9, { high_moment: { person_ids: ['p'] }, activities: ['Walk'] })]);
    expect(filterEntries(entries, { person: 'p', habit: 'Late work' }).map((entry) => entry.id)).toEqual(['1']);
    expect(filterEntries(entries, { person: 'p' })).toHaveLength(2);
    expect(filterEntries(entries, { person: 'P' })).toHaveLength(2);
  });
});

describe('reports follow local calendar periods', () => {
  it('handles a week spanning years and configurable Sunday starts', () => {
    expect(reportPeriod('weekly', '2026-01-01')).toEqual({ type: 'weekly', start: '2025-12-29', end: '2026-01-04' });
    expect(reportPeriod('weekly', '2026-01-01', 0)).toEqual({ type: 'weekly', start: '2025-12-28', end: '2026-01-03' });
  });
  it('handles leap months and sparse/partial periods without inventing scores', () => {
    expect(previousPeriod(reportPeriod('monthly', '2024-03-31'))).toEqual({ type: 'monthly', start: '2024-02-01', end: '2024-02-29' });
    vi.setSystemTime(new Date(2026, 8, 8, 12));
    const report = buildReport([], reportPeriod('monthly', '2026-09-08'));
    expect(report.partial).toBe(true);
    expect(report.calendarDays).toBe(8);
    expect(report.missing).toBe(8);
    expect(report.moods).toBeNull();
    expect(report.patterns).toEqual([]);
    expect(validDateKey('2026-02-30')).toBe(false);
  });
  it('rebuilds excerpts after edits and deletions rather than using stale report text', () => {
    const period = reportPeriod('monthly', '2026-08-02');
    const entry = day('x', '2026-08-02', 5, { notes: 'Original words' });
    expect(buildReport(timelineEntries([entry]), period).moments[0].notes).toBe('Original words');
    expect(buildReport(timelineEntries([{ ...entry, notes: 'Corrected words' }]), period).moments[0].notes).toBe('Corrected words');
    expect(buildReport([], period).moments).toEqual([]);
  });
});

describe('stress patterns and practice relevance', () => {
  it('does not infer a stress state from a mood score or diagnose a body cue', () => {
    expect(entryStates({ mood_score: 1, stress_context: { body_cues: ['Chest tension'] } })).toEqual([]);
    expect(entryStates({ emotions: ['Anxious'] })).toEqual(['on-edge']);
    expect(entryStates({ emotions: ['Anxious'], stress_context: { state_ids: ['on-edge'] } })).toEqual(['on-edge']);
  });
  it('requires repetition across days and honors dismissal', () => {
    const entries = Array.from({ length: 3 }, (_, i) => ({ key: `${i}`, date: '2026-09-01', emotions: ['Angry'], person_ids: ['p'] }));
    expect(stressPatterns(entries)).toEqual([]);
    const repeated = entries.map((entry, i) => ({ ...entry, date: `2026-09-0${i + 1}` }));
    const patterns = stressPatterns(repeated, [{ id: 'p', name: 'Demo person' }]);
    expect(patterns[0].context.type).toBe('person');
    expect(patterns[0].days).toBe(3);
    expect(stressPatterns(repeated, [], { 'anger:person:p': 'dismissed', 'anger:state:': 'dismissed' })).toEqual([]);
  });
  it('offers distinct actions, complete instructions and an alternative for every selected state', () => {
    for (const state of STRESS_STATES) {
      expect(recommendPractices(state.id).length).toBeGreaterThan(0);
      for (const practice of recommendPractices(state.id)) { expect(practice.steps.length).toBeGreaterThan(1); expect(practice.alternative).toBeTruthy(); }
    }
    expect(recommendPractices('anger')[0].id).not.toBe(recommendPractices('procrastination')[0].id);
    expect(new Set(PRACTICES.map((practice) => practice.id)).size).toBe(PRACTICES.length);
  });
  it('never recommends a hidden practice or one reported as uncomfortable', () => {
    expect(recommendPractices('on-edge', [{ practice_id: 'orient', outcome: 'More uncomfortable' }], ['comfortable-breath'])).toEqual([]);
  });
  it('keeps missing practice feedback distinct from reported outcomes and alignment', () => {
    const report = buildReport([], reportPeriod('monthly', '2026-08-02'), [{ practice_id: 'orient', date: '2026-08-02', status: 'completed', outcome: null }, { practice_id: 'orient', date: '2026-08-03', status: 'stopped', outcome: 'More uncomfortable', alignment: 'aligned' }]);
    expect(report.practices[0].attempts).toHaveLength(2);
    expect(report.practices[0].withFeedback).toHaveLength(1);
    expect(report.practices[0].helpful).toHaveLength(0);
    expect(report.practices[0].uncomfortable).toHaveLength(1);
  });
});
