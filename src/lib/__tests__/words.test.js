import { describe, it, expect } from 'vitest';
import { commonForm, groupWords } from '../words';

describe('counting recorded words', () => {
  it('names a group by the form used most, a capitalized one in a tie', () => {
    expect(commonForm(new Map([['worried', 3], ['Worried', 1]]))).toBe('worried');
    expect(commonForm(new Map([['worried', 2], ['Worried', 2]]))).toBe('Worried');
  });

  it('groups words that differ only in case, counting each row once', () => {
    const rows = [{ id: 1, words: ['coffee', 'Coffee'] }, { id: 2, words: ['Coffee'] }, { id: 3, words: ['Walk'] }, { id: 4 }];
    expect(groupWords(rows, (row) => row.words).map(({ label, rows: found }) => [label, found.map((row) => row.id)])).toEqual([
      ['Coffee', [1, 2]],
      ['Walk', [3]],
    ]);
  });
});
