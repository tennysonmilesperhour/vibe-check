import { describe, it, expect } from 'vitest';
import { matchPersonByText, mentionsPerson, dedupePeopleDrafts } from '../people.js';

const people = [
  { id: 'p1', name: 'Mom', legacy_names: ['mother', 'mama'] },
  { id: 'p2', name: 'Tom', legacy_names: [] },
  { id: 'p3', name: 'Sarah K', legacy_names: ['sarah'] },
];

describe('matchPersonByText', () => {
  it('matches exact name case-insensitively', () => {
    expect(matchPersonByText('mom', people)?.id).toBe('p1');
    expect(matchPersonByText('TOM', people)?.id).toBe('p2');
  });

  it('matches legacy aliases', () => {
    expect(matchPersonByText('mama', people)?.id).toBe('p1');
    expect(matchPersonByText('sarah', people)?.id).toBe('p3');
  });

  it('returns null when nothing matches', () => {
    expect(matchPersonByText('stranger', people)).toBeNull();
  });
});

describe('mentionsPerson (whole word, not substring)', () => {
  it('finds whole-word mentions inside free text', () => {
    expect(mentionsPerson("Dinner with Mom and Tom", people[0])).toBe(true);
    expect(mentionsPerson("Dinner with Mom and Tom", people[1])).toBe(true);
  });

  it("does NOT match substrings: the old bug where 'Mom' matched \"Tom's mommy\"", () => {
    expect(mentionsPerson("Tom's mommy came by", people[0])).toBe(false);
  });

  it('matches legacy aliases as whole words', () => {
    expect(mentionsPerson('called mother today', people[0])).toBe(true);
    expect(mentionsPerson('smothered in work', people[0])).toBe(false);
  });

  it('is safe with regex-special characters in names', () => {
    const spiky = { id: 'x', name: 'J.R. (Bob)', legacy_names: [] };
    expect(mentionsPerson('saw J.R. (Bob) at lunch', spiky)).toBe(true);
  });
});

describe('dedupePeopleDrafts', () => {
  it('merges drafts with the same lowercase name, unioning fields', () => {
    const drafts = [
      { name: 'Mom', qualities: ['kind'], legacy_names: ['mother'] },
      { name: 'mom', qualities: ['funny'], linked_user_email: 'mom@x.com', legacy_names: [] },
    ];
    const out = dedupePeopleDrafts(drafts);
    expect(out).toHaveLength(1);
    expect(out[0].name).toBe('Mom');
    expect(out[0].qualities.sort()).toEqual(['funny', 'kind']);
    expect(out[0].linked_user_email).toBe('mom@x.com');
    expect(out[0].legacy_names).toContain('mother');
  });
});
