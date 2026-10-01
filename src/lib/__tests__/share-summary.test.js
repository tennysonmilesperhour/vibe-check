import { describe, it, expect } from 'vitest';
import { buildShareSummary, nameReplacer } from '../share-summary.js';
import { timelineEntries } from '../living-patterns.js';

const people = [
  { id: 'p-sam', name: 'Sam' },
  { id: 'p-samlee', name: 'Sam Lee', legacy_names: ['Sammy'] },
  { id: 'p-zo', name: 'Zo' },
  { id: 'p-ana', name: 'Ana (Demo)' },
];

const checkIns = [
  { id: 'c1', date: '2026-09-01', mood_score: 3, energy_level: 4, sleep_quality: 5, stress_context: { stress_score: 7, stress_measure: 'highest-today', state_ids: ['on-edge'], body_cues: ['Tense jaw'] }, emotions: ['Anxious', 'Tired'] },
  { id: 'c2', date: '2026-09-02', mood_score: 6, energy_level: 6, sleep_quality: 7, stress_context: { stress_score: 3, state_ids: ['on-edge', 'shutdown'], alignment: 'aligned' }, emotions: ['Tired'], person_ids: ['p-sam'] },
  { id: 'c3', date: '2026-09-08', mood_score: 8, energy_level: '', sleep_quality: 11, stress_context: { body_cues: ['Tense jaw', 'Tight shoulders'] } },
  { id: 'c4', date: '2026-09-09', mood_score: 5, is_demo: true },
  { id: 'c5', date: '2026-10-05', mood_score: 9 },
];
const journal = [
  { id: 'j1', date: '2026-09-01', kind: 'interaction', interaction_feeling: 'unsafe', boundary_respected: 'no', person_ids: ['p-samlee'], notes: 'Sam Lee shouted. Sammy again, same as last time.', mood_score: 2, stress_context: { state_ids: ['on-edge'], situation: 'A call with Sam about rent', need: 'Space' } },
  { id: 'j2', date: '2026-09-02', kind: 'interaction', interaction_feeling: 'supportive', boundary_respected: 'yes', person_ids: ['p-sam'], notes: 'Sam listened. Samantha came too, and Zoë.' },
  { id: 'j3', date: '2026-09-03', kind: 'interaction', interaction_feeling: 'strained', person_ids: ['p-samlee', 'p-gone'], stress_context: { alignment: 'not-aligned' } },
  { id: 'j4', date: '2026-09-04', kind: 'reflection', notes: 'Talked to Zo about Ana.', high_moment: { description: 'A walk with ana' }, stress_context: { alignment: 'aligned' } },
];
const entries = timelineEntries(checkIns, journal);
const sessions = [
  { id: 's1', date: '2026-09-01', practice_id: 'orient', outcome: 'More settled' },
  { id: 's2', date: '2026-09-02', practice_id: 'orient', outcome: 'About the same' },
  { id: 's3', date: '2026-09-03', practice_id: 'orient' },
  { id: 's4', date: '2026-09-03', practice_id: 'comfortable-breath', outcome: 'More uncomfortable' },
  { id: 's5', date: '2026-09-04', practice_id: 'orient', outcome: 'Clearer', status: 'hidden' },
  { id: 's6', date: '2026-09-04', practice_id: 'orient', outcome: 'Clearer', is_demo: true },
  { id: 's7', date: '2026-08-20', practice_id: 'orient', outcome: 'Clearer' },
];
const base = { entries, sessions, people, start: '2026-09-01', end: '2026-09-30', today: '2026-09-20' };

describe('a summary to share', () => {
  it('covers the chosen days through today, without demo entries', () => {
    const summary = buildShareSummary(base);
    expect(summary).toMatchObject({ start: '2026-09-01', end: '2026-09-20', calendarDays: 20, recordedDays: 5, checkIns: 3, journalEntries: 4, demoLeftOut: true });
    expect(() => buildShareSummary({ ...base, start: '2026-09-30', end: '2026-09-01' })).toThrow('Choose a valid date range.');
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
    // A Sunday week start moves the boundaries.
    expect(buildShareSummary({ ...base, weekStartsOn: 0 }).scores.rows.map((row) => row.start)).toEqual(['2026-09-01', '2026-09-06', '2026-09-13', '2026-09-20']);
  });

  it('groups a long range by month', () => {
    const { scores } = buildShareSummary({ ...base, start: '2026-05-10', end: '2026-10-31', today: '2026-10-31' });
    expect(scores.unit).toBe('month');
    expect(scores.rows.map((row) => `${row.start}..${row.end}`)).toEqual(['2026-05-10..2026-05-31', '2026-06-01..2026-06-30', '2026-07-01..2026-07-31', '2026-08-01..2026-08-31', '2026-09-01..2026-09-30', '2026-10-01..2026-10-31']);
  });

  it('counts days, not entries, for chosen states, feeling words and body cues', () => {
    const summary = buildShareSummary(base);
    expect(summary.states).toEqual([{ id: 'on-edge', label: 'Fight or flight', days: 2 }, { id: 'shutdown', label: 'Shutdown', days: 1 }]);
    expect(summary.emotions).toEqual([{ label: 'Tired', days: 2 }, { label: 'Anxious', days: 1 }]);
    expect(summary.bodyCues).toEqual([{ label: 'Tense jaw', days: 2 }, { label: 'Tight shoulders', days: 1 }]);
    expect(summary.alignment).toEqual([{ id: 'aligned', label: 'Like myself', count: 2 }, { id: 'not-aligned', label: 'Away from myself', count: 1 }]);
  });

  it('labels people by how often they appear, and keeps a removed person', () => {
    const { interactions } = buildShareSummary(base);
    expect(interactions.total).toBe(3);
    expect(interactions.feelings).toEqual([{ value: 'supportive', count: 1 }, { value: 'strained', count: 1 }, { value: 'unsafe', count: 1 }]);
    expect(interactions.boundaries).toEqual([{ value: 'yes', count: 1 }, { value: 'no', count: 1 }]);
    // Sam and Sam Lee each appear on two entries, so the tie goes by name:
    // Sam is Person 1. Sam Lee has more interactions, so leads this list.
    expect(interactions.people).toEqual([
      { label: 'Person 2', total: 2, feelings: [{ value: 'strained', count: 1 }, { value: 'unsafe', count: 1 }] },
      { label: 'Person 1', total: 1, feelings: [{ value: 'supportive', count: 1 }] },
      { label: 'Person 3', total: 1, feelings: [{ value: 'strained', count: 1 }] },
    ]);
    const named = buildShareSummary({ ...base, hideNames: false }).interactions.people.map((row) => row.label);
    expect(named).toEqual(['Sam Lee', 'A person you removed', 'Sam']);
  });

  it('reports each practice and the responses given, leaving out hidden and demo ones', () => {
    expect(buildShareSummary(base).practices).toEqual([
      { id: 'orient', title: 'Find your surroundings', attempts: 3, outcomes: [{ value: 'More settled', count: 1 }, { value: 'About the same', count: 1 }], noResponse: 1 },
      { id: 'comfortable-breath', title: 'An unforced breath', attempts: 1, outcomes: [{ value: 'More uncomfortable', count: 1 }], noResponse: 0 },
    ]);
  });

  it('includes only the chosen entries, oldest first, with names replaced', () => {
    const summary = buildShareSummary({ ...base, chosen: ['journal:j4', 'journal:j1', 'day:c5', 'day:c2'], note: 'Ask about Sam and the move.' });
    expect(summary.words.map((word) => word.key)).toEqual(['journal:j1', 'day:c2', 'journal:j4']);
    expect(summary.words[0]).toEqual({
      key: 'journal:j1', date: '2026-09-01', kind: 'Interaction', mood: 2, states: ['Fight or flight'], emotions: [], people: ['Person 2'],
      parts: [
        { label: null, text: 'Person 2 shouted. Person 2 again, same as last time.' },
        { label: 'What happened before', text: 'A call with Person 1 about rent' },
        { label: 'What I needed', text: 'Space' },
      ],
    });
    expect(summary.words[1]).toMatchObject({ kind: 'Daily check-in', mood: 6, states: ['Fight or flight', 'Shutdown'], emotions: ['Tired'], people: ['Person 1'] });
    expect(summary.words[2].parts).toEqual([{ label: null, text: 'Talked to Person 4 about Person 5.' }, { label: 'A supportive moment', text: 'A walk with Person 5' }]);
    expect(summary.note).toBe('Ask about Person 1 and the move.');
    expect(buildShareSummary({ ...base, chosen: ['journal:j2'], hideNames: false }).words[0].parts[0].text).toBe('Sam listened. Samantha came too, and Zoë.');
  });
});

describe('replacing names', () => {
  const labels = new Map([['p-sam', 'Person 1'], ['p-samlee', 'Person 2'], ['p-zo', 'Person 3'], ['p-ana', 'Person 4']]);
  const replace = nameReplacer(people, labels);

  it('replaces whole words in any case, longest name first', () => {
    expect(replace('Sam Lee and sam, then SAM.')).toBe('Person 2 and Person 1, then Person 1.');
    expect(replace('Sammy, Samantha and the same Zoë, not Zo.')).toBe('Person 2, Samantha and the same Zoë, not Person 3.');
    expect(replace('Ana (Demo) or Ana? banana')).toBe('Person 4 or Person 4? banana');
    expect(replace('(Sam)-Sam_ x')).toBe('(Person 1)-Sam_ x');
  });

  it('leaves text alone when there is no one to replace', () => {
    expect(nameReplacer([], new Map())('Sam')).toBe('Sam');
  });
});
