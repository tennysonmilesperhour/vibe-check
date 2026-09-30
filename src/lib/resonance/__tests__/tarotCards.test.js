import { describe, it, expect } from 'vitest';
import { birthCards, cardId, cardOption, retiredCards, yearCard } from '../tarotCards.js';

describe("tarot birth cards (Mary K. Greer's method)", () => {
  it('adds month, day and year, then reduces to 22 or less', () => {
    // 4 + 12 + 1990 = 2006 -> 8: already one digit, so no separate soul card
    expect(birthCards('1990-04-12')).toEqual({ personality: { id: 8, name: 'Strength' }, soul: null });
    // 11 + 23 + 1985 = 2019 -> 12 -> soul 3
    expect(birthCards('1985-11-23')).toEqual({ personality: { id: 12, name: 'The Hanged Man' }, soul: { id: 3, name: 'The Empress' } });
  });

  it('reaches every major card, with 22 as The Fool', () => {
    // 1 + 2 + 1978 = 1981 -> 19 -> soul 1
    expect(birthCards('1978-01-02')).toMatchObject({ personality: { name: 'The Sun' }, soul: { name: 'The Magician' } });
    // 6 + 7 + 1980 = 1993 -> 22 -> soul 4
    expect(birthCards('1980-06-07')).toMatchObject({ personality: { id: 0, name: 'The Fool' }, soul: { name: 'The Emperor' } });
    // 9 + 10 + 1980 = 1999 -> 28 -> 10 -> soul 1
    expect(birthCards('1980-09-10')).toMatchObject({ personality: { name: 'Wheel of Fortune' }, soul: { name: 'The Magician' } });
  });

  it('works out the year card with the calendar year', () => {
    // 4 + 12 + 2026 = 2042 -> 8
    expect(yearCard('1990-04-12', 2026)).toEqual({ id: 8, name: 'Strength' });
    // 7 + 15 + 2026 = 2048 -> 14
    expect(yearCard('1990-07-15', 2026)).toEqual({ id: 14, name: 'Temperance' });
  });

  it('reads and writes the form\'s "N – Name" option', () => {
    expect(cardOption(12)).toBe('12 – The Hanged Man');
    expect(cardOption(0)).toBe('0 – The Fool');
    expect(cardId('12 – The Hanged Man')).toBe(12);
    expect(cardId('The Fool')).toBe(0);
    expect(cardId('the hermit ')).toBe(9);
    expect(cardId('Not a card')).toBeNull();
    expect(cardId(undefined)).toBeNull();
  });

  it('knows the cards the retired Life Path method filled in', () => {
    // Life Path 3 gave The Empress, with no shadow card.
    expect(retiredCards('1985-11-23')).toEqual({ birth: 3, shadow: null });
    // Life Path 11 gave Justice, with The High Priestess as its shadow card.
    expect(retiredCards('1969-12-28')).toEqual({ birth: 11, shadow: 2 });
    // Life Path 22 gave The Fool.
    expect(retiredCards('1950-05-11')?.birth).toBe(0);
    expect(retiredCards('')).toBeNull();
  });

  it('returns null without a valid date', () => {
    expect(birthCards('')).toBeNull();
    expect(birthCards('1990-4-12')).toBeNull();
    expect(yearCard('1990-04-12', NaN)).toBeNull();
  });
});
