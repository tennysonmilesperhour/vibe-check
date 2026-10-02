import { describe, it, expect } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { EMOTIONS, FEELING_FAMILIES, findFeelings } from '../vocab';
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

  it('finds words by any part, ignoring case, within their families', () => {
    expect(findFeelings('')).toBe(FEELING_FAMILIES);
    expect(findFeelings('  ')).toBe(FEELING_FAMILIES);
    expect(findFeelings('IRRIT')).toEqual([expect.objectContaining({ name: 'Anger', words: ['Irritated'] })]);
    expect(findFeelings('out').flatMap((family) => family.words)).toEqual(['Left out', 'Burnt out']);
    expect(findFeelings('zzz')).toEqual([]);
  });
});
