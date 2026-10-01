import { describe, it, expect } from 'vitest';
import { buildShareSummary, kindOf } from '../share-summary.js';
import { timelineEntries } from '../living-patterns.js';

// Added in this order, so labelled Person 1 to Person 4 when names are hidden.
const people = [
  { id: 'p-sam', name: 'Sam', created_at: '2026-01-01T00:00:00Z' },
  { id: 'p-samlee', name: 'Sam Lee', legacy_names: ['Sammy'], created_at: '2026-02-01T00:00:00Z' },
  { id: 'p-zo', name: 'Zo', created_at: '2026-03-01T00:00:00Z' },
  { id: 'p-ana', name: 'Ana (Demo)', created_at: '2026-04-01T00:00:00Z' },
];

const checkIns = [
  { id: 'c1', date: '2026-09-01', mood_score: 3, energy_level: 4, sleep_quality: 5, stress_context: { stress_score: 7, stress_measure: 'highest-today', state_ids: ['on-edge'], body_cues: ['Tense jaw'] }, emotions: ['Anxious', 'Tired'] },
  { id: 'c2', date: '2026-09-02', mood_score: 6, energy_level: 6, sleep_quality: 7, stress_context: { stress_score: 3, state_ids: ['on-edge', 'shutdown'], alignment: 'aligned' }, emotions: ['tired'], person_ids: ['p-sam'] },
  { id: 'c3', date: '2026-09-08', mood_score: 8, energy_level: '', sleep_quality: 11, stress_context: { body_cues: ['Tense jaw', 'Tight shoulders'] } },
  { id: 'c4', date: '2026-09-09', mood_score: 5, is_demo: true },
  { id: 'c5', date: '2026-10-05', mood_score: 9 },
];
const journal = [
  { id: 'j1', date: '2026-09-01', kind: 'interaction', interaction_feeling: 'unsafe', boundary_respected: 'no', person_ids: ['p-samlee'], notes: 'Sam Lee shouted. Sammy again, same as last time.', mood_score: 2, stress_context: { state_ids: ['on-edge'], situation: 'A call with Sam about rent', need: 'Space' } },
  { id: 'j2', date: '2026-09-02', kind: 'interaction', interaction_feeling: 'supportive', boundary_respected: 'yes', person_ids: ['p-sam'], notes: 'Sam listened. Samantha came too, and Zoë.' },
  { id: 'j3', date: '2026-09-03', kind: 'interaction', interaction_feeling: 'strained', person_ids: ['p-samlee', 'p-gone'], stress_context: { alignment: 'not-aligned' } },
  { id: 'j4', date: '2026-09-04', kind: 'reflection', notes: 'Talked to Zo about Ana.', high_moment: { description: 'A walk with ana' }, stress_context: { alignment: 'aligned' } },
  // An interaction recorded without how it felt still counts, boundary and all.
  { id: 'j5', date: '2026-09-05', kind: 'interaction', boundary_respected: 'no', person_ids: ['p-zo'] },
];
const entries = timelineEntries(checkIns, journal);
const sessions = [
  { id: 's1', date: '2026-09-01', practice_id: 'orient', outcome: 'More settled', alignment: 'mixed' },
  { id: 's2', date: '2026-09-02', practice_id: 'orient', outcome: 'About the same' },
  { id: 's3', date: '2026-09-03', practice_id: 'orient' },
  { id: 's4', date: '2026-09-03', practice_id: 'comfortable-breath', outcome: 'More uncomfortable', alignment: 'mixed' },
  { id: 's5', date: '2026-09-04', practice_id: 'orient', outcome: 'Clearer', status: 'hidden' },
  { id: 's6', date: '2026-09-04', practice_id: 'orient', outcome: 'Clearer', is_demo: true },
  { id: 's7', date: '2026-08-20', practice_id: 'orient', outcome: 'Clearer' },
];
const base = { entries, sessions, people, start: '2026-09-01', end: '2026-09-30', today: '2026-09-20' };

describe('a summary to share', () => {
  it('covers the chosen days through today, without demo entries', () => {
    const summary = buildShareSummary(base);
    expect(summary).toMatchObject({ start: '2026-09-01', end: '2026-09-20', calendarDays: 20, recordedDays: 6, checkIns: 3, journalEntries: 5, demoLeftOut: true });
    expect(() => buildShareSummary({ ...base, start: '2026-09-30', end: '2026-09-01' })).toThrow('Choose a valid date range.');
  });

  it('starts at the first thing recorded, however far back the dates are set', () => {
    expect(buildShareSummary({ ...base, start: '2025-01-01' }).start).toBe('2026-08-20');
    // A year typed digit by digit passes through 0202: still bounded.
    const typed = buildShareSummary({ ...base, start: '0202-09-01' });
    expect(typed.start).toBe('2026-08-20');
    expect(buildShareSummary({ entries: [], start: '0202-09-01', end: '2026-09-20', today: '2026-09-20' }).scores.rows.length).toBeLessThanOrEqual(241);
    // Dates before anything was recorded stay as chosen.
    expect(buildShareSummary({ ...base, start: '2025-01-01', end: '2025-01-31' })).toMatchObject({ start: '2025-01-01', end: '2025-01-31', recordedDays: 0 });
    // Dates after today end today, and never start after they end.
    expect(buildShareSummary({ ...base, start: '2026-12-01', end: '2026-12-31' })).toMatchObject({ start: '2026-09-20', end: '2026-09-20', calendarDays: 1 });
  });

  it('averages daily check-in scores by week, ignoring values off the scale', () => {
    const { scores } = buildShareSummary(base);
    expect(scores.unit).toBe('week');
    expect(scores.rows.map((row) => [row.start, row.end, row.days, row.mood?.mean ?? null])).toEqual([
      ['2026-09-01', '2026-09-06', 2, 4.5],
      ['2026-09-07', '2026-09-13', 1, 8],
      ['2026-09-14', '2026-09-20', 0, null],
    ]);
    expect(scores.overall).toMatchObject({ days: 3, mood: { count: 3, mean: 5.7, min: 3, max: 8 }, energy: { count: 2, mean: 5 }, sleep: { count: 2, mean: 6 }, stress: { count: 2, mean: 5 } });
    expect([scores.stressAtCheckIn, scores.stressHighestToday]).toEqual([1, 1]);
    expect(buildShareSummary({ ...base, weekStartsOn: 0 }).scores.rows.map((row) => row.start)).toEqual(['2026-09-01', '2026-09-06', '2026-09-13', '2026-09-20']);
  });

  it('groups a long range by month', () => {
    const long = timelineEntries([{ id: 'm1', date: '2026-05-10', mood_score: 4 }, { id: 'm2', date: '2026-07-04', mood_score: 6 }], []);
    const { scores } = buildShareSummary({ entries: long, start: '2026-05-10', end: '2026-10-31', today: '2026-10-31' });
    expect(scores.unit).toBe('month');
    expect(scores.rows.map((row) => `${row.start}..${row.end}:${row.days}`)).toEqual(['2026-05-10..2026-05-31:1', '2026-06-01..2026-06-30:0', '2026-07-01..2026-07-31:1', '2026-08-01..2026-08-31:0', '2026-09-01..2026-09-30:0', '2026-10-01..2026-10-31:0']);
  });

  it('counts feeling words after names are replaced, so forms of one name count together', () => {
    const feelings = timelineEntries([{ id: 'f1', date: '2026-09-01', emotions: ['Missing Sam Lee'] }, { id: 'f2', date: '2026-09-02', emotions: ['Missing Sammy'] }], []);
    expect(buildShareSummary({ entries: feelings, people, start: '2026-09-01', end: '2026-09-02', today: '2026-09-02' }).emotions).toEqual([{ label: 'Missing Person 2', days: 2 }]);
  });

  it('counts days, not entries, and feeling words in any letter case together', () => {
    const summary = buildShareSummary(base);
    expect(summary.states).toEqual([{ id: 'on-edge', label: 'Fight or flight', days: 2 }, { id: 'shutdown', label: 'Shutdown', days: 1 }]);
    expect(summary.emotions).toEqual([{ label: 'Tired', days: 2 }, { label: 'Anxious', days: 1 }]);
    expect(summary.bodyCues).toEqual([{ label: 'Tense jaw', days: 2 }, { label: 'Tight shoulders', days: 1 }]);
  });

  it('counts every interaction, with labels that stay the same from one summary to the next', () => {
    const { interactions } = buildShareSummary(base);
    expect(interactions.total).toBe(4);
    expect(interactions.feelings).toEqual([{ value: 'supportive', count: 1 }, { value: 'strained', count: 1 }, { value: 'unsafe', count: 1 }, { value: 'not recorded', count: 1 }]);
    expect(interactions.boundaries).toEqual([{ value: 'yes', count: 1 }, { value: 'no', count: 2 }, { value: 'not recorded', count: 1 }]);
    expect(interactions.people).toEqual([
      { id: 'p-samlee', label: 'Person 2', total: 2, feelings: [{ value: 'strained', count: 1 }, { value: 'unsafe', count: 1 }] },
      { id: 'p-sam', label: 'Person 1', total: 1, feelings: [{ value: 'supportive', count: 1 }] },
      { id: 'p-zo', label: 'Person 3', total: 1, feelings: [{ value: 'not recorded', count: 1 }] },
      { id: 'p-gone', label: 'Removed person 1', total: 1, feelings: [{ value: 'strained', count: 1 }] },
    ]);
    // Another stretch of days keeps everyone's label.
    expect(buildShareSummary({ ...base, start: '2026-09-03', end: '2026-09-05' }).interactions.people.map((row) => [row.id, row.label])).toEqual([['p-samlee', 'Person 2'], ['p-zo', 'Person 3'], ['p-gone', 'Removed person 1']]);
    expect(buildShareSummary({ ...base, hideNames: false }).interactions.people.map((row) => row.label)).toEqual(['Sam Lee', 'A person you removed', 'Sam', 'Zo']);
  });

  it('reports practices and responses, and whether responses felt like the person', () => {
    const summary = buildShareSummary(base);
    expect(summary.practices).toEqual([
      { id: 'orient', title: 'Find your surroundings', attempts: 3, outcomes: [{ value: 'More settled', count: 1 }, { value: 'About the same', count: 1 }, { value: 'not recorded', count: 1 }] },
      { id: 'comfortable-breath', title: 'An unforced breath', attempts: 1, outcomes: [{ value: 'More uncomfortable', count: 1 }] },
    ]);
    expect(summary.alignment).toEqual({
      entries: [{ id: 'aligned', label: 'Like myself', count: 2 }, { id: 'not-aligned', label: 'Away from myself', count: 1 }],
      practices: [{ id: 'mixed', label: 'Some of both', count: 2 }],
    });
  });

  it('includes only the chosen entries, oldest first, with names replaced', () => {
    const summary = buildShareSummary({ ...base, chosen: ['journal:j4', 'journal:j1', 'day:c5', 'day:c2', 'journal:j5'], note: 'Ask about Sam and the move.' });
    expect(summary.words.map((word) => [word.key, word.kind])).toEqual([['journal:j1', 'Interaction'], ['day:c2', 'Daily check-in'], ['journal:j4', 'Journal'], ['journal:j5', 'Interaction']]);
    expect(summary.words[0]).toEqual({
      key: 'journal:j1', date: '2026-09-01', kind: 'Interaction', mood: 2, states: ['Fight or flight'], emotions: [], people: ['Person 2'],
      parts: [
        { label: null, text: 'Person 2 shouted. Person 2 again, same as last time.' },
        { label: 'What happened before', text: 'A call with Person 1 about rent' },
        { label: 'What I needed', text: 'Space' },
      ],
    });
    expect(summary.words[1]).toMatchObject({ mood: 6, states: ['Fight or flight', 'Shutdown'], emotions: ['tired'], people: ['Person 1'] });
    expect(summary.words[2].parts).toEqual([{ label: null, text: 'Talked to Person 3 about Person 4.' }, { label: 'A supportive moment', text: 'A walk with Person 4' }]);
    expect(summary.note).toBe('Ask about Person 1 and the move.');
    expect(buildShareSummary({ ...base, chosen: ['journal:j2'], hideNames: false }).words[0].parts[0].text).toBe('Sam listened. Samantha came too, and Zoë.');
  });

  it('names an entry the same way in the picker and in print', () => {
    expect(entries.filter((entry) => ['journal:j5', 'journal:j4', 'day:c1'].includes(entry.key)).map(kindOf)).toEqual(['Interaction', 'Journal', 'Daily check-in']);
  });
});
