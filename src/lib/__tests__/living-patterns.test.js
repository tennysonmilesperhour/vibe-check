import { describe, it, expect, vi, afterEach } from 'vitest';
import { timelineEntries, entryStates, filterEntries, stressPatterns, reportPeriod, previousPeriod, buildReport, historyChart, validDateKey } from '../living-patterns';
import { recommendPractices, PRACTICES, STRESS_STATES } from '../practices';
import { fetchAllPages } from '../crypto';
import { fisherGreater } from '../pattern-stats';
import { addDaysKey } from '../dates';

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
  it('uses only the states the person chose, never a relabeled feeling, mood score, or body cue', () => {
    expect(entryStates({ mood_score: 1, stress_context: { body_cues: ['Chest tension'] } })).toEqual([]);
    expect(entryStates({ emotions: ['Anxious'] })).toEqual([]);
    expect(entryStates({ emotions: ['Anxious'], stress_context: { state_ids: ['on-edge'] } })).toEqual(['on-edge']);
  });
  it('shows a state once it repeats across days, without claiming a connection it cannot compare', () => {
    const angry = (i) => ({ key: `${i}`, date: `2026-09-0${i + 1}`, stress_context: { state_ids: ['anger'] }, person_ids: ['p'] });
    expect(stressPatterns([0, 1, 2].map((i) => ({ ...angry(i), date: '2026-09-01' })))).toEqual([]);
    const patterns = stressPatterns([0, 1, 2].map(angry), [{ id: 'p', name: 'Demo person' }]);
    // Every day had the person, so there are no days without them to compare with.
    expect(patterns.map((pattern) => pattern.context.type)).toEqual(['state']);
    expect(patterns[0]).toMatchObject({ state: 'anger', days: 3, total: 3 });
    expect(stressPatterns([0, 1, 2].map(angry), [], { 'anger:state:': 'dismissed' })).toEqual([]);
  });
  it('offers distinct actions, complete instructions and an alternative for every selected state', () => {
    for (const state of STRESS_STATES) {
      expect(recommendPractices(state.id).length).toBeGreaterThan(0);
      for (const practice of recommendPractices(state.id)) { expect(practice.steps.length).toBeGreaterThan(1); expect(practice.alternative).toBeTruthy(); }
    }
    expect(recommendPractices('anger')[0].id).not.toBe(recommendPractices('procrastination')[0].id);
    expect(new Set(PRACTICES.map((practice) => practice.id)).size).toBe(PRACTICES.length);
  });
  it('never recommends a hidden practice, and keeps an uncomfortable one last with the reason', () => {
    const offered = recommendPractices('on-edge', [{ practice_id: 'orient', outcome: 'More uncomfortable' }], ['comfortable-breath']);
    expect(offered.map((practice) => practice.id)).toEqual(['orient']);
    expect(offered[0].reason).toMatch(/more uncomfortable after this once/);
    const both = recommendPractices('on-edge', [{ practice_id: 'orient', outcome: 'More uncomfortable' }]);
    expect(both.map((practice) => practice.id)).toEqual(['comfortable-breath', 'orient']);
  });
  it('says why a practice is offered and puts what helped first', () => {
    const offered = recommendPractices('on-edge', [{ practice_id: 'comfortable-breath', outcome: 'More settled' }, { practice_id: 'comfortable-breath', outcome: 'Clearer' }]);
    expect(offered[0]).toMatchObject({ id: 'comfortable-breath', helped: 2 });
    expect(offered[0].reason).toBe('Offered for fight or flight. You noted it helped 2 times.');
    expect(offered[1].reason).toBe('Offered for fight or flight.');
    expect(recommendPractices('confusion').map((practice) => practice.id)).toContain('decision-pause');
  });
  it('keeps missing practice feedback distinct from reported outcomes and alignment', () => {
    const report = buildReport([], reportPeriod('monthly', '2026-08-02'), [{ practice_id: 'orient', date: '2026-08-02', status: 'completed', outcome: null }, { practice_id: 'orient', date: '2026-08-03', status: 'stopped', outcome: 'More uncomfortable', alignment: 'aligned' }]);
    expect(report.practices[0].attempts).toHaveLength(2);
    expect(report.practices[0].withFeedback).toHaveLength(1);
    expect(report.practices[0].helpful).toHaveLength(0);
    expect(report.practices[0].uncomfortable).toHaveLength(1);
  });
});

// Deterministic random numbers, so the simulation is the same on every run.
function mulberry32(seed) {
  let t = seed;
  return () => {
    t = (t + 0x6D2B79F5) | 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

// A record where states, people, and habits are independent: any connection found is false.
function unconnectedRecord(rand, dayCount) {
  const states = ['confusion', 'on-edge', 'anger', 'shutdown', 'numbness', 'procrastination'].map((id) => ({ id, rate: 0.05 + rand() * 0.35 }));
  const people = Array.from({ length: 2 + Math.floor(rand() * 4) }, (_, i) => ({ id: `p${i}`, rate: 0.1 + rand() * 0.45 }));
  const habits = Array.from({ length: 3 + Math.floor(rand() * 6) }, (_, i) => ({ id: `h${i}`, rate: 0.1 + rand() * 0.55 }));
  const entries = [];
  for (let d = 0; d < dayCount; d += 1) {
    if (rand() < 0.2) continue; // a day without a record
    const moments = rand() < 0.25 ? 2 : 1;
    for (let k = 0; k < moments; k += 1) {
      entries.push({
        key: `${d}:${k}`, kind: k ? 'journal' : 'day', date: addDaysKey('2026-01-01', d),
        stress_context: { state_ids: states.filter((state) => rand() < state.rate / moments).map((state) => state.id) },
        person_ids: people.filter((person) => rand() < person.rate / moments).map((person) => person.id),
        activities: habits.filter((habit) => rand() < habit.rate / moments).map((habit) => habit.id),
      });
    }
  }
  return entries;
}

describe('connections are compared with the days without them', () => {
  it('computes the one-sided Fisher exact test', () => {
    // 3 of 4 days with it, 1 of 4 without: (C(4,3)C(4,1) + C(4,4)C(4,0)) / C(8,4) = 17/70.
    expect(fisherGreater(3, 4, 1, 4)).toBeCloseTo(17 / 70, 10);
    expect(fisherGreater(0, 5, 5, 5)).toBeCloseTo(1, 10);
    expect(fisherGreater(5, 5, 0, 5)).toBeCloseTo(1 / 252, 10);
  });

  it('shows a connection to fewer than 1 in 20 people whose records have none', () => {
    const rand = mulberry32(20260929);
    for (const dayCount of [30, 90]) {
      const people = 300;
      let falseAlarms = 0;
      for (let i = 0; i < people; i += 1) {
        if (stressPatterns(unconnectedRecord(rand, dayCount)).some((pattern) => pattern.context.type !== 'state')) falseAlarms += 1;
      }
      expect(falseAlarms / people).toBeLessThan(0.05);
    }
  });

  it('finds a strong connection that is really there, with both counts', () => {
    const entries = Array.from({ length: 60 }, (_, d) => {
      const withJules = d % 3 === 0; // 20 days with Jules
      const angry = withJules ? d % 4 !== 0 : d % 10 === 1; // 15 of 20 with, 4 of 40 without
      return { key: `${d}`, date: addDaysKey('2026-01-01', d), person_ids: withJules ? ['jules'] : [], stress_context: { state_ids: angry ? ['anger'] : [] } };
    });
    const found = stressPatterns(entries, [{ id: 'jules', name: 'Jules' }]).filter((pattern) => pattern.context.type !== 'state');
    expect(found).toHaveLength(1);
    expect(found[0]).toMatchObject({ key: 'anger:person:jules', days: 15, total: 20, without: { days: 4, total: 40 }, significant: true });
    expect(found[0].context.label).toBe('Jules');
  });

  it('keeps a connection the person confirmed, and hides one they dismissed', () => {
    const entries = Array.from({ length: 12 }, (_, d) => ({ key: `${d}`, date: addDaysKey('2026-01-01', d), person_ids: d < 6 ? ['p'] : [], stress_context: { state_ids: d % 2 ? ['anger'] : [] } }));
    const connection = (feedback) => stressPatterns(entries, [], feedback).find((pattern) => pattern.context.type === 'person');
    expect(connection({})).toBeUndefined(); // 3 of 6 with, 3 of 6 without: nothing to see
    expect(connection({ 'anger:person:p': 'confirmed' })).toMatchObject({ days: 3, total: 6, without: { days: 3, total: 6 }, significant: false });
    expect(connection({ 'anger:person:p': 'dismissed' })).toBeUndefined();
  });
});
