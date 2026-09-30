import { describe, it, expect } from 'vitest';
import { birthCards, cardId, cardOption, followBirthCard, retiredCards, settleTarot, withChosenCard, withComputedCard, yearCard, yearCardOn } from '../tarotCards.js';
import { TAROT_MAJOR_ARCANA } from '@/components/cosmic/correspondences';

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

  it('stores cards exactly as the form lists them', () => {
    expect(TAROT_MAJOR_ARCANA).toEqual(Array.from({ length: 22 }, (_, id) => cardOption(id)));
  });

  it('knows the cards the retired methods filled in', () => {
    // The first method: 2019 -> 12 with shadow 3; the Life Path method: 3.
    expect(retiredCards('1985-11-23')).toEqual({ birth: [12, 3], shadow: [3] });
    // Both gave Justice here, with The High Priestess as its shadow card.
    expect(retiredCards('1969-12-28')).toEqual({ birth: [11], shadow: [2] });
    // 1966 -> 22: the first method went on to The Emperor, the Life Path method gave The Fool.
    expect(retiredCards('1950-05-11')).toEqual({ birth: [4, 0], shadow: [] });
    // 1981 -> 19: the first method's shadow was 1 + 9 = 10.
    expect(retiredCards('1978-01-02')).toEqual({ birth: [19, 1], shadow: [10] });
    expect(retiredCards('')).toBeNull();
  });

  it('counts the year card from the birthday for a birthday from July on', () => {
    // An April birthday follows the calendar year: 4 + 12 + 2026 = 2042 -> 8
    expect(yearCardOn('1990-04-12', '2026-03-01')?.name).toBe('Strength');
    // A July birthday: 2025 until July 15 (2047 -> 13), then 2026 (2048 -> 14).
    expect(yearCardOn('1990-07-15', '2026-07-14')?.name).toBe('Death');
    expect(yearCardOn('1990-07-15', '2026-07-15')?.name).toBe('Temperance');
    expect(yearCardOn('1990-07-15', '')).toBeNull();
  });

  it('works out the birth card, dropping a shadow card a retired method filled in', () => {
    expect(withComputedCard({ custom_notes: 'Swords' }, '1985-11-23')).toEqual({ custom_notes: 'Swords', birth_card: '12 – The Hanged Man', birth_card_source: 'birth_date' });
    expect(withComputedCard({ birth_card: '11 – Justice', birth_card_source: 'retired', shadow_card: '2 – The High Priestess', shadow_card_source: 'retired' }, '1960-01-03'))
      .toEqual({ birth_card: '20 – Judgement', birth_card_source: 'birth_date' });
    // A shadow card the person chose stays.
    expect(withComputedCard({ shadow_card: '16 – The Tower', shadow_card_source: 'entered' }, '1985-11-23')).toMatchObject({ shadow_card: '16 – The Tower' });
    expect(withComputedCard({ birth_card: '1 – The Magician' }, '')).toEqual({ birth_card: '1 – The Magician' });
  });

  it('records a chosen card, dropping a shadow card worked out from the one it replaces', () => {
    expect(withChosenCard({ birth_card: '11 – Justice', birth_card_source: 'retired', shadow_card: '2 – The High Priestess', shadow_card_source: 'retired' }, '16 – The Tower'))
      .toEqual({ birth_card: '16 – The Tower', birth_card_source: 'entered' });
    expect(withChosenCard({ shadow_card: '3 – The Empress', shadow_card_source: 'entered' }, '16 – The Tower'))
      .toEqual({ birth_card: '16 – The Tower', birth_card_source: 'entered', shadow_card: '3 – The Empress', shadow_card_source: 'entered' });
  });

  it('follows a changed birth date by the recorded source', () => {
    const follow = (tarot, date = '1985-11-23') => followBirthCard(tarot, date)?.birth_card;
    expect(follow({ birth_card: '5 – The Hierophant', birth_card_source: 'birth_date' })).toBe('12 – The Hanged Man');
    // A card the person chose stays, and so do an earlier method's card, left
    // for the notice, and one with no source.
    expect(follow({ birth_card: '5 – The Hierophant', birth_card_source: 'entered' })).toBe('5 – The Hierophant');
    expect(follow({ birth_card: '3 – The Empress', birth_card_source: 'retired' })).toBe('3 – The Empress');
    expect(follow({ birth_card: '5 – The Hierophant' })).toBe('5 – The Hierophant');
    expect(follow({})).toBeUndefined();
    // While a date is typed it passes through empty and partial values; the card ends on the final date.
    const typed = (tarot, dates) => dates.reduce((current, date) => followBirthCard(current, date), tarot);
    const partials = (year) => ['', `0001-11-23`, `0019-11-23`, `0198-11-23`, `${year}-11-23`];
    expect(typed({ birth_card: '12 – The Hanged Man', birth_card_source: 'birth_date' }, partials(1986))).toEqual({ birth_card: '4 – The Emperor', birth_card_source: 'birth_date' });
    expect(typed({ birth_card: '12 – The Hanged Man', birth_card_source: 'birth_date' }, partials(1985))).toEqual({ birth_card: '12 – The Hanged Man', birth_card_source: 'birth_date' });
    const retired = { birth_card: '3 – The Empress', birth_card_source: 'retired', shadow_card: '2 – The High Priestess', shadow_card_source: 'retired' };
    expect(typed(retired, partials(1985))).toEqual(retired);
  });

  it('gives each saved card a source from the saved birth date', () => {
    // A card that matches the birth date's card was worked out from it.
    expect(settleTarot({ birth_card: '12 – The Hanged Man' }, '1985-11-23')).toEqual({ birth_card: '12 – The Hanged Man', birth_card_source: 'birth_date' });
    // A retired method's card that differs is marked, for the notice.
    expect(settleTarot({ birth_card: '3 – The Empress' }, '1985-11-23')).toEqual({ birth_card: '3 – The Empress', birth_card_source: 'retired' });
    // Any other card, and one that already has a source, stays as it is.
    expect(settleTarot({ birth_card: '16 – The Tower' }, '1985-11-23')).toEqual({ birth_card: '16 – The Tower' });
    expect(settleTarot({ birth_card: '3 – The Empress', birth_card_source: 'entered' }, '1985-11-23')).toEqual({ birth_card: '3 – The Empress', birth_card_source: 'entered' });
    // A retired shadow card goes beside the computed birth card, and is marked beside a retired one.
    expect(settleTarot({ birth_card: '11 – Justice', shadow_card: '2 – The High Priestess' }, '1969-12-28')).toEqual({ birth_card: '11 – Justice', birth_card_source: 'birth_date' });
    expect(settleTarot({ birth_card: '11 – Justice', shadow_card: '2 – The High Priestess' }, '1960-01-03'))
      .toEqual({ birth_card: '11 – Justice', birth_card_source: 'retired', shadow_card: '2 – The High Priestess', shadow_card_source: 'retired' });
    expect(settleTarot({ shadow_card: '10 – Wheel of Fortune' }, '1978-01-02')).toEqual({ shadow_card: '10 – Wheel of Fortune', shadow_card_source: 'retired' });
    // A shadow card the person chose, or one no method gave, stays.
    expect(settleTarot({ shadow_card: '3 – The Empress', shadow_card_source: 'entered' }, '1985-11-23')).toEqual({ shadow_card: '3 – The Empress', shadow_card_source: 'entered' });
    expect(settleTarot({ shadow_card: '16 – The Tower' }, '1985-11-23')).toEqual({ shadow_card: '16 – The Tower' });
    expect(settleTarot(undefined, '1985-11-23')).toBeUndefined();
  });

  it('returns null without a valid date', () => {
    expect(birthCards('')).toBeNull();
    expect(birthCards('1990-4-12')).toBeNull();
    expect(yearCard('1990-04-12', NaN)).toBeNull();
  });
});
