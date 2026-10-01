import { describe, it, expect } from 'vitest';
import { matchPersonByText, mentionsPerson, dedupePeopleDrafts, searchPeople, entryInvolvesPerson, personCheckInStats, peopleRecordedTogether, orderPeopleForOrbit, arrangeOrbitRing, peopleNameReplacer } from '../people.js';

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

describe('searchPeople (picker)', () => {
  it('finds a person by alias without requiring the display name', () => {
    expect(searchPeople('mama', people).map((person) => person.id)).toEqual(['p1']);
    expect(searchPeople('SARAH', people).map((person) => person.id)).toEqual(['p3']);
  });

  it('does not treat an alias search as a reason to add a new person', () => {
    expect(matchPersonByText('mother', people)?.id).toBe('p1');
    expect(matchPersonByText('Mommy', people)).toBeNull();
  });
});

describe('entryInvolvesPerson and personCheckInStats', () => {
  it('counts a person tagged only on a high or low moment', () => {
    const checkIns = [
      { id: 'a', date: '2026-09-01', mood_score: 8, high_moment: { person_ids: ['p1'] } },
      { id: 'b', date: '2026-09-02', mood_score: 4, low_moment: { person_ids: ['P1'] } },
    ];
    expect(entryInvolvesPerson(checkIns[0], people[0])).toBe(true);
    expect(entryInvolvesPerson(checkIns[0], people[1])).toBe(false);
    expect(personCheckInStats(people[0], checkIns)).toEqual({ mentions: 2, avgMood: 6, lastMention: '2026-09-02' });
  });

  it('does not fall back to substring text once the picker has been used', () => {
    const entry = { person_ids: ['p2'], high_moment: { who_involved: 'Dinner with Mom' } };
    expect(entryInvolvesPerson(entry, people[0])).toBe(false);
    expect(entryInvolvesPerson(entry, people[1])).toBe(true);
  });

  it('uses whole-word who_involved text only when no picker ids exist', () => {
    const entry = { high_moment: { who_involved: "Tom's mommy came by" } };
    expect(entryInvolvesPerson(entry, people[0])).toBe(false);
    expect(entryInvolvesPerson(entry, people[1])).toBe(true);
  });
});

describe('people recorded together from picker tags', () => {
  const entries = [
    { id: '1', person_ids: ['p1', 'p2'] },
    { id: '2', high_moment: { person_ids: ['p1'] }, low_moment: { person_ids: ['p3'] } },
    { id: '3', person_ids: ['p1', 'p2', 'p3'] },
    { id: '4', person_ids: ['p2'] },
  ];

  it('matches people tagged in the same entry, including nested moments', () => {
    expect(peopleRecordedTogether(people[0], people, entries).map((row) => [row.person.id, row.shared])).toEqual([
      ['p3', 2],
      ['p2', 2],
    ]);
  });

  it('places frequently tagged people first and sits companions beside each other', () => {
    expect(orderPeopleForOrbit(people, entries).map((person) => person.id)).toEqual(['p1', 'p2', 'p3']);
    expect(arrangeOrbitRing([people[2], people[0], people[1]], entries).map((person) => person.id)[0]).toBe('p3');
    expect(arrangeOrbitRing([people[2], people[0], people[1]], entries).map((person) => person.id)[1]).toBe('p1');
  });
});

describe('replacing people\'s names with labels', () => {
  const labelOf = (person) => ({ a: 'Person 1', b: 'Person 2', c: 'Person 3', d: 'Person 4', e: 'Person 5', f: 'Person 6', g: 'Person 7', h: 'Person 8' })[person.id];
  const crowd = [
    { id: 'a', name: 'Sam' },
    { id: 'b', name: 'Jordan Smith' },
    { id: 'c', name: 'Mr. Kent' },
    { id: 'd', name: 'Alex (work)' },
    { id: 'e', name: 'Alex', legacy_names: ['Lexi'] },
    { id: 'f', name: '小明' },
    { id: 'g', name: '민수' },
    { id: 'h', name: "O'Brien" },
  ];
  const replace = peopleNameReplacer(crowd, labelOf);

  it('replaces full names in any case as whole words, and capitalized parts of longer names', () => {
    expect(replace('Sam, sam and SAM. Samantha and the same.')).toBe('Person 1, Person 1 and Person 1. Samantha and the same.');
    expect(replace('Jordan called. Smith too. jordan stayed home. Jordan Smith left.')).toBe('Person 2 called. Person 2 too. jordan stayed home. Person 2 left.');
    expect(replace('Mr. Kent waved, then Kent left. Mr. Brown stayed.')).toBe('Person 3 waved, then Person 3 left. Mr. Brown stayed.');
  });

  it('gives both labels to a name two people share', () => {
    expect(replace('Alex shouted. Lexi helped.')).toBe('Person 4 or Person 5 shouted. Person 5 helped.');
  });

  it('matches names written without spaces around them', () => {
    expect(replace('我和小明吃饭')).toBe('我和Person 6吃饭');
    expect(replace('민수가 왔다')).toBe('Person 7가 왔다');
  });

  it('matches either apostrophe and either way of writing an accent', () => {
    expect(replace('O’Brien and o\'brien')).toBe('Person 8 and Person 8');
    const decomposed = peopleNameReplacer([{ id: 'x', name: 'José' }], () => 'Person 9');
    expect(decomposed('José came, then José.')).toBe('Person 9 came, then Person 9.');
    expect(peopleNameReplacer([{ id: 'y', name: 'İrem' }], () => 'Person 10')('İrem came.')).toBe('Person 10 came.');
  });

  it('replaces extra strings such as ids, and never a label it just wrote', () => {
    const withIds = peopleNameReplacer([{ id: 'uuid-1', name: 'Or' }, { id: 'uuid-2', name: 'Person' }], (person) => (person.id === 'uuid-1' ? 'Person 1' : 'Person 2'), (person) => [person.id]);
    expect(withIds('uuid-1 and Or or Person')).toBe('Person 1 and Person 1 Person 1 Person 2');
    expect(peopleNameReplacer([], () => 'x')('Nothing to replace')).toBe('Nothing to replace');
  });
});
