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

/**
 * The year card in effect on a day, or null. Greer counts the year from
 * January 1 for a birthday from January through June, and from one
 * birthday to the next for a birthday from July on.
 * @param {string} birthDate @param {string} dateKey YYYY-MM-DD keys
 */
export function yearCardOn(birthDate, dateKey) {
  const b = birthDateParts(birthDate);
  const on = birthDateParts(dateKey);
  if (!b || !on) return null;
  const beforeBirthday = on.m < b.m || (on.m === b.m && on.d < b.d);
  return yearCard(birthDate, b.m >= 7 && beforeBirthday ? on.y - 1 : on.y);
}

// Vibe Check filled in birth cards with two earlier methods. Until July 4,
// 2026 it used the same sum reduced to 21 or less, so 22 gave The Emperor
// rather than The Fool. After that it used a card for the Life Path number.
// Both also filled in a "shadow card" from the birth card's digits.
/** @type {Record<number, number>} */
const RETIRED_LIFE_PATH_CARD = { 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7, 8: 8, 9: 9, 11: 11, 22: 0, 33: 6 };

/**
 * The card ids the retired methods filled in for a birth date, or null.
 * @param {string} birthDate a YYYY-MM-DD key
 * @returns {{ birth: number[], shadow: number[] } | null}
 */
export function retiredCards(birthDate) {
  const p = birthDateParts(birthDate);
  if (!p) return null;
  let total = p.m + p.d + p.y;
  while (total > 21) total = digitSum(total);
  const lp = lifePath(birthDate);
  const byLifePath = lp == null ? undefined : RETIRED_LIFE_PATH_CARD[lp];
  const birth = [...new Set(byLifePath === undefined ? [total] : [total, byLifePath])];
  return { birth, shadow: [...new Set(birth.filter((id) => id > 9).map(digitSum))] };
}

/**
 * Tarot data with the birth card worked out from the birth date.
 * @param {Record<string, any> | null | undefined} tarot @param {string} birthDate
 */
export function withComputedCard(tarot, birthDate) {
  const cards = birthCards(birthDate);
  return cards ? { ...tarot, birth_card: cardOption(cards.personality.id), birth_card_source: 'birth_date' } : tarot;
}

/**
 * Tarot data after the birth date changes. A birth card filled in from the
 * old date, by this method or a retired one, is worked out again from the
 * new date; a card the person chose stays.
 * @param {Record<string, any> | null | undefined} tarot
 * @param {string} previousDate @param {string} nextDate
 */
export function followBirthCard(tarot, previousDate, nextDate) {
  const saved = tarot?.birth_card;
  if (!saved || tarot.birth_card_source === 'entered') return tarot;
  const id = cardId(saved);
  const filledIn = tarot.birth_card_source === 'birth_date'
    || (id !== null && (id === birthCards(previousDate)?.personality.id || Boolean(retiredCards(previousDate)?.birth.includes(id))));
  return filledIn ? withComputedCard(tarot, nextDate) : tarot;
}

/**
 * Saved tarot data brought up to date, for data saved before cards recorded
 * where they came from:
 * - a birth card that matches the birth date's card is marked as worked out
 *   from it, so it follows a changed date;
 * - a shadow card a retired method filled in is dropped. It came from the
 *   birth card's digits, like the soul card that now shows on its own.
 * A birth card from a retired method that differs stays, for the person to
 * keep or replace.
 * @param {Record<string, any> | null | undefined} tarot @param {string} birthDate
 */
export function settleTarot(tarot, birthDate) {
  if (!tarot) return tarot;
  const next = { ...tarot };
  if (next.birth_card && !next.birth_card_source && cardId(next.birth_card) === birthCards(birthDate)?.personality.id) {
    next.birth_card_source = 'birth_date';
  }
  const shadow = cardId(next.shadow_card);
  if (shadow !== null && !next.shadow_card_source && retiredCards(birthDate)?.shadow.includes(shadow)) {
    delete next.shadow_card;
  }
  return next;
}
