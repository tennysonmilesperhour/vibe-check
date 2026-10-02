import { describe, it, expect } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { EMOTIONS, FEELING_FAMILIES, findFeelings, feelingIcon, isListedFeeling } from '../vocab';
import VocabularyIcon from '../VocabularyIcon';

const EARLIER = ['Joyful', 'Grateful', 'Calm', 'Excited', 'Loved', 'Hopeful', 'Proud', 'Creative', 'Content', 'Relieved', 'Anxious', 'Sad',
  'Frustrated', 'Tired', 'Lonely', 'Overwhelmed', 'Numb', 'Angry', 'Afraid', 'Hurt', 'Ashamed', 'Guilty'];

describe('the feeling vocabulary', () => {
  it('lists each word once, in one family', () => {
    const labels = EMOTIONS.map((feeling) => feeling.label);
    expect(new Set(labels).size).toBe(labels.length);
    expect(labels.length).toBeGreaterThanOrEqual(90);
  });

  it('keeps every word of the earlier list, among the common ones', () => {
    for (const label of EARLIER) expect(EMOTIONS.find((feeling) => feeling.label === label)?.common).toBe(true);
    expect(EMOTIONS.filter((feeling) => feeling.common)).toHaveLength(24);
  });

  it('gives every family a symbol that draws', () => {
    for (const family of FEELING_FAMILIES) {
      expect(renderToStaticMarkup(createElement(VocabularyIcon, { name: family.icon }))).toContain('<svg');
    }
  });

  it('finds words by any part, ignoring case and punctuation, within their families', () => {
    expect(findFeelings('')).toBe(FEELING_FAMILIES);
    expect(findFeelings('  ')).toBe(FEELING_FAMILIES);
    expect(findFeelings('IRRIT')).toEqual([expect.objectContaining({ name: 'Anger', words: ['Irritated'] })]);
    expect(findFeelings('out').flatMap((family) => family.words)).toEqual(['Left out', 'Burnt out']);
    expect(findFeelings('self conscious').flatMap((family) => family.words)).toEqual(['Self-conscious']);
    expect(findFeelings('zzz')).toEqual([]);
  });

  it('shows a whole family when the search names it', () => {
    const anger = FEELING_FAMILIES.find((family) => family.name === 'Anger');
    expect(findFeelings('anger')).toEqual([anger]);
    expect(findFeelings('Guilt').map((family) => family.name)).toEqual(['Shame and guilt']);
    expect(findFeelings('stress').map((family) => family.name)).toEqual(['Fear and stress']);
    // "and" and "or" in a family name match nothing on their own.
    expect(findFeelings('or').find((family) => family.name === 'Tired or distant').words).toEqual(['Bored']);
  });

  it('tells listed words from your own, and draws a listed word in any case', () => {
    expect(isListedFeeling('Worried')).toBe(true);
    expect(isListedFeeling('worried')).toBe(false);
    expect(feelingIcon('worried')).toBe('wind');
    expect(feelingIcon('In awe')).toBe('sprout');
    expect(feelingIcon('wistful')).toBeUndefined();
  });
});
