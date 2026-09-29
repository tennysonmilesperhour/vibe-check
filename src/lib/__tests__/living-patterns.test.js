import { describe, it, expect, vi, afterEach } from 'vitest';
import { timelineEntries, entryStates, filterEntries, stateCards, stressPatterns, reportPeriod, previousPeriod, buildReport, historyChart, validDateKey } from '../living-patterns';
import { recommendPractices, PRACTICES, STRESS_STATES, hiddenPractices, hiddenPracticesPatch } from '../practices';
import { fetchAllPages } from '../crypto';
import { fisherGreater, cmhGreater } from '../pattern-stats';
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
  it('tells the two kinds of check-in stress apart', () => {
    const chart = historyChart([day('1', '2026-09-27', 5, { stress_context: { stress_score: 3 } }), day('2', '2026-09-28', 5, { stress_context: { stress_score: 7, stress_measure: 'highest-today' } })], '2026-09-27', '2026-09-28');
    expect(chart.map((point) => point.stressKind)).toEqual(['at-check-in', 'highest-today']);
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
  it('keeps the earlier promise for older uncomfortable responses, and changes the stored list, not a copy', () => {
    const sessions = [{ practice_id: 'orient', outcome: 'More uncomfortable' }];
    expect(hiddenPractices({}, sessions)).toEqual(['orient']);
    expect(hiddenPractices({ uncomfortable_hidden_v1: true, hidden_practices: [] }, sessions)).toEqual([]);
    // Written out once, from what is stored now.
    expect(hiddenPracticesPatch(sessions)({ hidden_practices: ['small-start'] })).toEqual({ hidden_practices: ['small-start', 'orient'], uncomfortable_hidden_v1: true });
    // Already written out elsewhere (and orient unhidden there): nothing comes back.
    expect(hiddenPracticesPatch(sessions)({ uncomfortable_hidden_v1: true, hidden_practices: ['familiar-sense'] })).toEqual({ hidden_practices: ['familiar-sense'], uncomfortable_hidden_v1: true });
    const unhide = hiddenPracticesPatch(sessions, (list) => list.filter((id) => id !== 'orient'));
    expect(unhide({})).toEqual({ hidden_practices: [], uncomfortable_hidden_v1: true });
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

// A record where states, people, and habits are independent, so any
// connection found is false. It is also messy the way real records are:
// mood-only days, skipped questions, calm days left blank, busy days that
// carry more of every tag than quiet ones, and older check-ins that don't
// say which questions they asked.
function unconnectedRecord(rand, dayCount) {
  const states = ['confusion', 'on-edge', 'anger', 'shutdown', 'numbness', 'procrastination'].map((id) => ({ id, rate: 0.03 + rand() * 0.3 }));
  const people = Array.from({ length: 2 + Math.floor(rand() * 5) }, (_, i) => ({ id: `p${i}`, rate: 0.1 + rand() * 0.5 }));
  const habits = Array.from({ length: 3 + Math.floor(rand() * 12) }, (_, i) => ({ id: `h${i}`, rate: 0.1 + rand() * 0.55 }));
  const entries = [];
  for (let d = 0; d < dayCount; d += 1) {
    if (rand() < 0.2) continue; // no record that day
    const date = addDaysKey('2025-10-01', d);
    if (rand() < 0.3) { entries.push({ key: `${d}`, kind: 'day', date, mood_score: 5, stress_context: { asked_steps: ['mood'] } }); continue; } // mood only
    const busy = 0.2 + rand() * 1.6;
    const pick = (list) => list.filter((item) => rand() < Math.min(0.95, item.rate * busy)).map((item) => item.id);
    const chosen = pick(states);
    // Calm days are kept short before the states question more often.
    const statesAsked = rand() >= (chosen.length ? 0.1 : 0.35);
    const tagsAsked = rand() >= 0.2;
    const older = rand() < 0.15;
    const visited = ['mood', ...(tagsAsked ? ['activities'] : []), ...(statesAsked ? ['stress'] : [])];
    entries.push({
      key: `${d}`, kind: 'day', date,
      stress_context: { ...(statesAsked && chosen.length ? { state_ids: chosen } : {}), ...(older ? {} : { asked_steps: visited }) },
      ...(tagsAsked ? { person_ids: pick(people), activities: pick(habits) } : {}),
    });
  }
  return entries;
}
const showsConnection = (entries) => stressPatterns(entries).some((pattern) => pattern.context.type !== 'state');
// A check-in that reached the stress and people-and-habits questions.
const answered = (ids) => ({ ...(ids.length ? { state_ids: ids } : {}), asked_steps: ['mood', 'activities', 'stress'] });

describe('connections are compared with comparable days without them', () => {
  it('computes the one-sided Fisher exact test', () => {
    // 3 of 4 days with it, 1 of 4 without: (C(4,3)C(4,1) + C(4,4)C(4,0)) / C(8,4) = 17/70.
    expect(fisherGreater(3, 4, 1, 4)).toBeCloseTo(17 / 70, 10);
    expect(fisherGreater(0, 5, 5, 5)).toBeCloseTo(1, 10);
    expect(fisherGreater(5, 5, 0, 5)).toBeCloseTo(1 / 252, 10);
  });

  it('computes the stratified test, and sees no link where each stratum has none', () => {
    expect(cmhGreater([{ a: 10, b: 10, c: 10, d: 10 }])).toBeGreaterThan(0.5);
    expect(cmhGreater([{ a: 18, b: 2, c: 2, d: 18 }])).toBeLessThan(0.0001);
    // Crude: 12 of 20 vs 4 of 20. Within each stratum the rates are equal.
    expect(cmhGreater([{ a: 10, b: 5, c: 2, d: 1 }, { a: 2, b: 3, c: 2, d: 15 }])).toBeGreaterThan(0.2);
  });

  it('shows a connection to fewer than 1 in 50 people whose records have none, per view', () => {
    const rand = mulberry32(20260929);
    for (const dayCount of [30, 90]) {
      const people = 300;
      let falseAlarms = 0;
      for (let i = 0; i < people; i += 1) if (showsConnection(unconnectedRecord(rand, dayCount))) falseAlarms += 1;
      expect(falseAlarms / people).toBeLessThan(0.02);
    }
  });

  it('shows one to fewer than 1 in 20 across a year of ranges and monthly reports', () => {
    const rand = mulberry32(7);
    const people = 100;
    let falseAlarms = 0;
    for (let i = 0; i < people; i += 1) {
      const entries = unconnectedRecord(rand, 365);
      const end = addDaysKey('2025-10-01', 364);
      const views = [30, 90, 365].map((span) => entries.filter((entry) => entry.date > addDaysKey(end, -span)));
      for (let month = 0; month < 12; month += 1) {
        const start = addDaysKey('2025-10-01', month * 30);
        views.push(entries.filter((entry) => entry.date >= start && entry.date < addDaysKey(start, 30)));
      }
      if (views.some(showsConnection)) falseAlarms += 1;
    }
    expect(falseAlarms / people).toBeLessThan(0.05);
  });

  it('does not read busy days, which carry more of everything, as a connection', () => {
    // Busy days have coffee and anger; quiet days have tea and nothing else.
    const entries = Array.from({ length: 80 }, (_, d) => {
      const busy = d % 2 === 0;
      return { key: `${d}`, kind: 'day', date: addDaysKey('2026-01-01', d), activities: busy ? ['Coffee', 'Work', 'Gym', 'Calls'] : ['Tea'], stress_context: answered(busy && d % 4 === 0 ? ['anger', 'on-edge'] : busy ? ['on-edge'] : []) };
    });
    const coffee = stressPatterns(entries).find((pattern) => pattern.key === 'anger:habit:Coffee');
    expect(coffee).toBeUndefined();
  });

  it('does not link a state to a habit because the habit lowers a different state', () => {
    // A walk makes "on edge" rarer; anger has nothing to do with it. Picking
    // only days with some state would make anger look tied to walking.
    const entries = Array.from({ length: 200 }, (_, d) => {
      const walk = d % 3 === 0;
      const onEdge = walk ? d % 10 === 0 : d % 5 !== 0;
      const angry = d % 4 === 1;
      return { key: `${d}`, kind: 'day', date: addDaysKey('2025-01-01', d), activities: [walk ? 'Walk' : 'Desk'], stress_context: answered([...(onEdge ? ['on-edge'] : []), ...(angry ? ['anger'] : [])]) };
    });
    const found = stressPatterns(entries);
    expect(found.find((pattern) => pattern.key === 'anger:habit:Walk')).toBeUndefined();
    expect(found.find((pattern) => pattern.key === 'on-edge:habit:Desk')).toMatchObject({ significant: true });
  });

  it('does not link them either when calm days are often kept before the states question', () => {
    // The same walk data, but most days with no state stop before the
    // question, so the days compared are mostly days with some state.
    const entries = Array.from({ length: 200 }, (_, d) => {
      const walk = d % 3 === 0;
      const onEdge = walk ? d % 10 === 0 : d % 5 !== 0;
      const angry = d % 4 === 1;
      const calm = !onEdge && !angry;
      const reached = !calm || d % 7 === 0;
      return { key: `${d}`, kind: 'day', date: addDaysKey('2025-01-01', d), activities: [walk ? 'Walk' : 'Desk'], stress_context: reached ? answered([...(onEdge ? ['on-edge'] : []), ...(angry ? ['anger'] : [])]) : { asked_steps: ['mood', 'activities'] } };
    });
    const walkAnger = stressPatterns(entries).find((pattern) => pattern.key === 'anger:habit:Walk');
    expect(walkAnger?.significant ?? false).toBe(false);
  });

  it('finds a strong connection that is really there, with both counts', () => {
    const entries = Array.from({ length: 60 }, (_, d) => {
      const withJules = d % 3 === 0; // 20 days with Jules, 40 with Sam
      const angry = withJules ? d % 4 !== 0 : d % 10 === 1; // 15 of 20 with, 4 of 40 without
      return { key: `${d}`, kind: 'day', date: addDaysKey('2026-01-01', d), person_ids: [withJules ? 'jules' : 'sam'], stress_context: answered(angry ? ['anger'] : []) };
    });
    const found = stressPatterns(entries, [{ id: 'jules', name: 'Jules' }]).filter((pattern) => pattern.context.type !== 'state');
    expect(found).toHaveLength(1);
    expect(found[0]).toMatchObject({ key: 'anger:person:jules', days: 15, total: 20, without: { days: 4, total: 40 }, significant: true });
    expect(found[0].context.label).toBe('Jules');
  });

  it('leaves out days without any person tagged', () => {
    const entries = Array.from({ length: 60 }, (_, d) => {
      const withJules = d % 3 === 0;
      const angry = withJules ? d % 4 !== 0 : d % 10 === 1;
      return { key: `${d}`, kind: 'day', date: addDaysKey('2026-01-01', d), person_ids: [withJules ? 'jules' : 'sam'], stress_context: answered(angry ? ['anger'] : []) };
    });
    // Twenty mood-only days change nothing: they are not days without Jules or without anger.
    const withShortDays = [...entries, ...Array.from({ length: 20 }, (_, d) => ({ key: `short-${d}`, kind: 'day', date: addDaysKey('2026-03-15', d), mood_score: 6 }))];
    const found = stressPatterns(withShortDays).find((pattern) => pattern.key === 'anger:person:jules');
    expect(found).toMatchObject({ days: 15, total: 20, without: { days: 4, total: 40 } });
  });

  it('keeps a connection the person confirmed, marked as possibly chance, and hides one they dismissed', () => {
    const entries = Array.from({ length: 12 }, (_, d) => ({ key: `${d}`, kind: 'day', date: addDaysKey('2026-01-01', d), person_ids: [d < 6 ? 'p' : 'q'], stress_context: answered(d % 2 ? ['anger'] : []) }));
    const connection = (feedback) => stressPatterns(entries, [], feedback).find((pattern) => pattern.key === 'anger:person:p');
    expect(connection({})).toBeUndefined(); // 3 of 6 with, 3 of 6 without: nothing to see
    expect(connection({ 'anger:person:p': 'confirmed' })).toMatchObject({ days: 3, total: 6, without: { days: 3, total: 6 }, significant: false });
    expect(connection({ 'anger:person:p': 'dismissed' })).toBeUndefined();
  });

  it('keeps a confirmed connection in a short view like a week', () => {
    const week = Array.from({ length: 7 }, (_, d) => ({ key: `${d}`, kind: 'day', date: addDaysKey('2026-09-14', d), person_ids: [d < 4 ? 'jules' : 'sam'], stress_context: answered(d < 4 ? ['anger'] : []) }));
    expect(stressPatterns(week, [], { 'anger:person:jules': 'confirmed' }).find((pattern) => pattern.key === 'anger:person:jules')).toMatchObject({ days: 4, total: 4, without: { days: 0, total: 3 } });
  });

  it('lists a connection beyond chance before one kept only because it was confirmed', () => {
    const entries = Array.from({ length: 60 }, (_, d) => {
      const withJules = d % 3 === 0;
      const angry = withJules ? d % 4 !== 0 : d % 10 === 1;
      return { key: `${d}`, kind: 'day', date: addDaysKey('2026-01-01', d), person_ids: [withJules ? 'jules' : 'sam'], activities: [d % 2 ? 'Coffee' : 'Tea'], stress_context: answered(angry ? ['anger'] : []) };
    });
    const found = stressPatterns(entries, [], { 'anger:habit:Coffee': 'confirmed' }).filter((pattern) => pattern.context.type !== 'state');
    expect(found.map((pattern) => pattern.key)).toEqual(['anger:person:jules', 'anger:habit:Coffee']);
  });
  it('only compares check-ins that recorded asking both questions', () => {
    const julesAnger = (d, extra = {}) => {
      const withJules = d % 3 === 0;
      const angry = withJules ? d % 4 !== 0 : d % 10 === 1;
      return { key: `${d}`, kind: 'day', date: addDaysKey('2026-01-01', d), person_ids: [withJules ? 'jules' : 'sam'], stress_context: answered(angry ? ['anger'] : []), ...extra };
    };
    const base = Array.from({ length: 60 }, (_, d) => julesAnger(d));
    const shown = (entries) => stressPatterns(entries).find((pattern) => pattern.key === 'anger:person:jules');
    expect(shown(base)).toMatchObject({ days: 15, total: 20 });
    // A season of Jules before states could be recorded changes nothing.
    const before = Array.from({ length: 40 }, (_, d) => ({ key: `early-${d}`, kind: 'day', date: addDaysKey('2025-10-01', d), person_ids: ['jules'] }));
    expect(shown([...before, ...base])).toMatchObject({ days: 15, total: 20, without: { days: 4, total: 40 } });
    // Check-ins that never reached the stress question don't count as calm days.
    const skipped = Array.from({ length: 30 }, (_, d) => ({ key: `skip-${d}`, kind: 'day', date: addDaysKey('2026-04-01', d), person_ids: ['jules'], stress_context: { asked_steps: ['mood', 'activities'] } }));
    expect(shown([...base, ...skipped])).toMatchObject({ days: 15, total: 20 });
    // Older check-ins that don't record it are left out, with or without a
    // state, however recently they were made: some were kept before the
    // stress question. So are those from preview builds, which recorded it
    // differently.
    const older = (key, date, created, extra) => ({ key, kind: 'day', date, created_date: created, person_ids: ['jules'], stress_context: {}, ...extra });
    const oldEdited = older('old', '2025-12-01', '2025-12-01T20:00:00Z', { stress_context: { state_ids: ['anger'] } });
    const oldCalm = Array.from({ length: 20 }, (_, d) => older(`calm-${d}`, addDaysKey('2025-12-02', d), '2026-09-20T20:00:00Z'));
    const preview = older('preview', '2025-11-30', '2026-09-28T20:00:00Z', { stress_context: { state_ids: ['anger'], visited_steps: ['mood', 'activities', 'stress'] } });
    expect(shown([...base, oldEdited, ...oldCalm, preview])).toMatchObject({ days: 15, total: 20, without: { days: 4, total: 40 } });
    // They still count as recorded days for a state.
    expect(stateCards([...base, oldEdited]).find((card) => card.state === 'anger')).toMatchObject({ days: 20, total: 61 });
    // Journal moments add no extra chances to a day.
    const moments = Array.from({ length: 30 }, (_, d) => ({ key: `moment-${d}`, kind: 'journal', date: addDaysKey('2026-01-01', d * 2 + 1), person_ids: ['sam'], stress_context: answered(['anger']) }));
    expect(shown([...base, ...moments])).toMatchObject({ days: 15, total: 20, without: { days: 4, total: 40 } });
  });
});
