// Tarot birth and year cards by Mary K. Greer's method: add the birth month,
// day and year as numbers, then add the digits of the total until it is 22
// or less. That number is the birth (personality) card, with 22 as The Fool;
// reducing it to one digit gives the soul card. The year card uses the same
// sum with a calendar year in place of the birth year.
import { arcanaName } from './tables.js';
import { digitSum, lifePath, parts as birthDateParts, reduceSingle } from './numerology.js';

const toGreer = (total) => {
  let n = total;
  while (n > 22) n = digitSum(n);
  return n;
};

const card = (n) => {
  const id = n === 22 ? 0 : n;
  return { id, name: arcanaName(id) };
};

/**
 * A card as the profile form stores it, e.g. "12 – The Hanged Man".
 * @param {number} id
 */
export const cardOption = (id) => `${id} – ${arcanaName(id)}`;

/**
 * The card id for a stored card, either a bare name ("The Hierophant") or
 * the form's "N – Name" option, or null.
 * @param {unknown} value
 */
export function cardId(value) {
  const bare = String(value || '').replace(/^\s*\d+\s*[–-]\s*/, '').trim().toLowerCase();
  for (let id = 0; id < 22; id++) {
    if (arcanaName(id)?.toLowerCase() === bare) return id;
  }
  return null;
}

/**
 * The birth (personality) card for a birth date, and its soul card, or null.
 * The soul card is null when the total is already one digit, since both
 * would be the same card.
 * @param {string} birthDate a YYYY-MM-DD key
 */
export function birthCards(birthDate) {
  const p = birthDateParts(birthDate);
  if (!p) return null;
  const n = toGreer(p.m + p.d + p.y);
  const soul = reduceSingle(n);
  return { personality: card(n), soul: soul === n ? null : card(soul) };
}

/**
 * The year card for a birth date in a calendar year, or null.
 * @param {string} birthDate a YYYY-MM-DD key @param {number} year
 */
export function yearCard(birthDate, year) {
  const p = birthDateParts(birthDate);
  if (!p || !Number.isInteger(year)) return null;
  return card(toGreer(p.m + p.d + year));
}

// Before Greer's method, Vibe Check filled in the birth card from the Life
// Path number, and gave Justice (Life Path 11) The High Priestess as a shadow
// card. A saved card that matches is most likely one the app filled in.
/** @type {Record<number, number>} */
const RETIRED_BIRTH_CARD = { 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7, 8: 8, 9: 9, 11: 11, 22: 0, 33: 6 };

/**
 * The card ids the retired Life Path method filled in for a birth date, or null.
 * @param {string} birthDate a YYYY-MM-DD key
 * @returns {{ birth: number, shadow: number | null } | null}
 */
export function retiredCards(birthDate) {
  const lp = lifePath(birthDate);
  const birth = lp == null ? undefined : RETIRED_BIRTH_CARD[lp];
  if (birth === undefined) return null;
  return { birth, shadow: birth > 9 ? digitSum(birth) : null };
}
