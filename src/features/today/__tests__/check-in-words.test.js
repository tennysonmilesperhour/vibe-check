import { describe, it, expect } from 'vitest';
import { picksFrom, typedFrom, combineWords } from '../check-in-words';
import { EMOTIONS } from '../vocab';

// The own-words field, one keystroke at a time.
const typeOut = (picks, text) => {
  let saved = picks;
  for (let i = 1; i <= text.length; i++) saved = combineWords(picks, text.slice(0, i));
  return saved;
};

describe('picked and typed words in a check-in', () => {
  it('never keeps a listed word typed on the way to a longer one', () => {
    expect(typeOut([], 'Close to tears')).toEqual(['Close to tears']);
    expect(typeOut([], 'Mixed feelings')).toEqual(['Mixed feelings']);
    expect(typeOut(['Calm'], 'Lost in thought, Stuck in a rut')).toEqual(['Calm', 'Lost in thought', 'Stuck in a rut']);
  });

  it('drops a typed word once it is deleted, and keeps the picks', () => {
    expect(combineWords(['Sad'], 'Bored, tense')).toEqual(['Sad', 'Bored', 'tense']);
    expect(combineWords(['Sad'], 'tense')).toEqual(['Sad', 'tense']);
  });

  it('keeps a pick when the same word is also typed and then deleted', () => {
    expect(combineWords(['Close'], 'Close')).toEqual(['Close']);
    expect(combineWords(['Close'], '')).toEqual(['Close']);
  });

  it('splits a saved day back into picks and typed words', () => {
    const saved = ['Irritated', 'close to tears', 'Calm', 'wistful'];
    expect(picksFrom(saved, EMOTIONS)).toEqual(['Irritated', 'Calm']);
    expect(typedFrom(saved, EMOTIONS)).toBe('close to tears, wistful');
    expect(combineWords(picksFrom(saved, EMOTIONS), typedFrom(saved, EMOTIONS))).toEqual(['Irritated', 'Calm', 'close to tears', 'wistful']);
    expect(picksFrom(undefined, EMOTIONS)).toEqual([]);
    expect(typedFrom(undefined, EMOTIONS)).toBe('');
  });
});
