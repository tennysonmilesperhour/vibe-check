import { describe, it, expect } from 'vitest';
import { letterObservations } from '../report-letter.js';

const base = { days: 5, calendarDays: 7, partial: false, rows: Array.from({ length: 9 }, () => ({})), interactions: [], emotions: [], patterns: [], practices: [], alignments: [] };

describe('letterObservations', () => {
  it('starts with the days kept, in plain numbers', () => {
    expect(letterObservations(base)[0]).toEqual({ id: 'days', text: 'You kept 5 of 7 days this week, in 9 entries.', href: '#report-words-heading', label: 'Read the moments' });
    expect(letterObservations({ ...base, partial: true }, { type: 'monthly' })[0].text).toBe('You kept 5 of 7 days this month so far, in 9 entries.');
  });

  it('says nothing when nothing was kept', () => {
    expect(letterObservations({ ...base, days: 0, rows: [] })).toEqual([]);
  });

  it('keeps to three, with interactions before feelings and patterns', () => {
    const report = { ...base,
      interactions: [{ interaction_feeling: 'supportive' }, { interaction_feeling: 'supportive' }, { interaction_feeling: 'strained' }],
      emotions: [{ label: 'Tired', sources: [{}, {}, {}, {}] }],
      patterns: [{ state: 'on-edge', days: 3 }],
    };
    const found = letterObservations(report);
    expect(found.map((item) => item.id)).toEqual(['days', 'interactions', 'feeling']);
    expect(found[1].text).toBe('You recorded 3 interactions: 2 supportive, 1 strained.');
    expect(found[2].text).toBe('“Tired” came up in 4 entries.');
  });

  it('points an unsafe interaction to support, without judging it', () => {
    const found = letterObservations({ ...base, interactions: [{ interaction_feeling: 'unsafe' }] });
    expect(found[1]).toMatchObject({ href: '/support-now?focus=relationship', label: 'Support for relationships' });
    expect(found[1].text).toBe('You recorded 1 interaction: 1 unsafe. What you wrote about the unsafe one stays exactly as you wrote it.');
  });

  it('describes a pattern as its card does, with and without', () => {
    const connection = { state: 'on-edge', days: 4, total: 6, context: { type: 'habit', label: 'late work' }, without: { days: 2, total: 12 } };
    expect(letterObservations({ ...base, rows: [], days: 0, patterns: [connection] })[0].text).toBe('Fight or flight on 4 of the 6 compared check-ins with late work, and on 2 of the 12 with other habits but not late work.');
    expect(letterObservations({ ...base, rows: [], days: 0, patterns: [{ ...connection, context: { type: 'person', label: 'Mara' }, without: { days: 0, total: 0 } }] })[0].text).toBe('Fight or flight on 4 of the 6 compared check-ins with Mara.');
    expect(letterObservations({ ...base, rows: [], days: 0, patterns: [{ state: 'anger', days: 3, total: 7, context: { type: 'state', id: '', label: '' } }] })[0].text).toBe('You chose Anger on 3 of the 7 days recorded.');
  });

  it('names a practice that helped, and how responses felt', () => {
    const report = { ...base, days: 0, rows: [], practices: [{ id: 'orient', helpful: [{}, {}] }], alignments: [{ stress_context: { alignment: 'aligned' } }, { stress_context: { alignment: 'mixed' } }] };
    expect(letterObservations(report).map((item) => item.text)).toEqual([
      'After Find your surroundings, you felt clearer, more connected, more able to begin, or more settled 2 times.',
      'In 1 of the 2 responses you described, it felt like you.',
    ]);
  });
});
