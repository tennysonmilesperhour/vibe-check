import { describe, it, expect } from 'vitest';
import { reportObservations } from '../report-observations.js';

const base = { start: '2026-09-21', end: '2026-09-27', days: 5, calendarDays: 7, partial: false, rows: Array.from({ length: 9 }, () => ({})), interactions: [], emotions: [], patterns: [], practices: [], alignments: [] };
const options = { today: '2026-09-29' };

describe('reportObservations', () => {
  it('starts with the days and entries recorded, linking to every entry in the period', () => {
    expect(reportObservations(base, options)[0]).toEqual({ id: 'days', text: 'You recorded 9 entries on 5 of the 7 days this week.', to: '/Analytics?tab=journal&range=custom&start=2026-09-21&end=2026-09-27', label: 'Read them' });
    const partial = reportObservations({ ...base, start: '2026-09-01', end: '2026-09-30', partial: true }, { ...options, type: 'monthly' })[0];
    expect(partial.text).toBe('You recorded 9 entries on 5 of the 7 days this month so far.');
    expect(partial.to).toContain('end=2026-09-29');
  });

  it('says nothing when nothing was recorded', () => {
    expect(reportObservations({ ...base, days: 0, rows: [] }, options)).toEqual([]);
  });

  it('keeps to three, with interactions before feelings and patterns', () => {
    const report = { ...base,
      interactions: [{ interaction_feeling: 'supportive' }, { interaction_feeling: 'supportive' }, { interaction_feeling: 'strained' }],
      emotions: [{ label: 'Tired', sources: [{}, {}, {}, {}] }],
      patterns: [{ state: 'on-edge', days: 3, total: 5, context: { type: 'state' } }],
    };
    const found = reportObservations(report, options);
    expect(found.map((item) => item.id)).toEqual(['days', 'interactions', 'feeling']);
    expect(found[1].text).toBe('You recorded 3 interactions: 2 supportive, 1 strained.');
    expect(found[2].text).toBe('“Tired” came up in 4 entries.');
  });

  it('points an unsafe interaction to support, without judging it', () => {
    const found = reportObservations({ ...base, interactions: [{ interaction_feeling: 'unsafe' }] }, options);
    expect(found[1]).toMatchObject({ to: '/support-now?focus=relationship', label: 'Support for relationships' });
    expect(found[1].text).toBe('You recorded 1 interaction: 1 unsafe. What you wrote about the unsafe one stays exactly as you wrote it.');
  });

  it('leaves out a hidden theme and uses the name someone gave one', () => {
    const report = { ...base, days: 0, rows: [], emotions: [{ label: 'Anxious', sources: [{}, {}, {}] }, { label: 'Tired', sources: [{}, {}] }] };
    expect(reportObservations(report, { ...options, themeLabels: { 'feeling:Anxious': false, 'feeling:Tired': 'Running on empty' } })[0].text).toBe('“Running on empty” came up in 2 entries.');
  });

  it('describes a pattern as its card does', () => {
    const connection = { state: 'on-edge', days: 4, total: 6, context: { type: 'habit', label: 'late work' }, without: { days: 2, total: 12 } };
    expect(reportObservations({ ...base, rows: [], days: 0, patterns: [connection] }, options)[0].text).toBe('Fight or flight on 4 of the 6 compared check-ins with late work, and on 2 of the 12 with other habits but not late work.');
    expect(reportObservations({ ...base, rows: [], days: 0, patterns: [{ state: 'anger', days: 3, total: 7, context: { type: 'state', id: '', label: '' } }] }, options)[0].text).toBe('You chose Anger on 3 of the 7 days recorded in this view.');
  });

  it('names a practice that helped, and how responses felt, without a verdict', () => {
    const report = { ...base, days: 0, rows: [], practices: [{ id: 'orient', helpful: [{}, {}] }], alignments: [{ stress_context: { alignment: 'not-aligned' } }, { stress_context: { alignment: 'not-aligned' } }, { stress_context: { alignment: 'mixed' } }] };
    expect(reportObservations(report, options).map((item) => item.text)).toEqual([
      'After Find your surroundings, you felt clearer, more connected, more able to begin, or more settled 2 times.',
      'How your responses felt, in 3 entries: 1 “Some of both”, 2 “Away from myself”.',
    ]);
  });
});
