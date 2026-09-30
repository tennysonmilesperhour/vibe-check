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

// Where a saved birth card came from (birth_card_source):
// - 'birth_date': worked out from the birth date by Greer's method;
// - 'retired': filled in by a retired method, for the person to keep or replace;
// - 'entered': chosen by the person, and never challenged;
// - 'saved': saved before sources were recorded, from no method Vibe Check
//   knows, so possibly the person's own;
// - none: saved before sources were recorded, and not yet sorted out
//   (settleTarot does that once, against the birth date it was saved with).
// A shadow card gets 'retired' or 'saved' the same way.

// A shadow card a retired method worked out from the old birth card's
// digits goes when that birth card is replaced.
/** @param {Record<string, any>} tarot */
const replacedCard = (tarot) => {
  if (tarot.shadow_card_source !== 'retired') return tarot;
  const { shadow_card: _card, shadow_card_source: _source, ...rest } = tarot;
  return rest;
};

/**
 * Tarot data with the birth card worked out from the birth date.
 * @param {Record<string, any> | null | undefined} tarot @param {string} birthDate
 */
export function withComputedCard(tarot, birthDate) {
  const cards = birthCards(birthDate);
  return cards ? replacedCard({ ...tarot, birth_card: cardOption(cards.personality.id), birth_card_source: 'birth_date' }) : tarot;
}

/**
 * Tarot data with a birth card the person chose.
 * @param {Record<string, any> | null | undefined} tarot @param {string} card
 */
export function withChosenCard(tarot, card) {
  return replacedCard({ ...tarot, birth_card: card, birth_card_source: 'entered' });
}

/**
 * Tarot data after the birth date changes: a birth card worked out from the
 * date is worked out again, and without a full date it is cleared until the
 * next one fills it in. Any other card stays, including a retired method's,
 * which the notice offers to keep or replace. It goes only by the recorded
 * source, since the date passes through partial values while it is typed.
 * @param {Record<string, any> | null | undefined} tarot @param {string} nextDate
 */
export function followBirthCard(tarot, nextDate) {
  if (tarot?.birth_card_source !== 'birth_date') return tarot;
  if (birthCards(nextDate)) return withComputedCard(tarot, nextDate);
  // Undefined rather than deleted keeps the key's place, so the same date
  // typed again gives the same saved form (the page compares it as JSON).
  return { ...tarot, birth_card: undefined };
}

/**
 * Whether a shadow card a retired method filled in gives way to the soul
 * card: beside the birth date's own card, unless the person kept their card.
 * @param {Record<string, any> | null | undefined} tarot
 * @param {boolean} isComputedCard whether the birth card is the birth date's card
 */
export const shadowGivesWay = (tarot, isComputedCard) =>
  isComputedCard && tarot?.shadow_card_source === 'retired' && tarot?.birth_card_source !== 'entered';

/**
 * Tarot data squared with the birth date, when the profile loads and when
 * it is saved: an earlier method's birth card that is now the birth date's
 * card becomes 'birth_date', and a shadow card that gives way goes.
 * @param {Record<string, any> | null | undefined} tarot @param {string} birthDate
 */
export function reconcileTarot(tarot, birthDate) {
  if (!tarot) return tarot;
  const birth = cardId(tarot.birth_card);
  const isComputedCard = birth !== null && birth === birthCards(birthDate)?.personality.id;
  const next = isComputedCard && tarot.birth_card_source === 'retired' ? { ...tarot, birth_card_source: 'birth_date' } : tarot;
  return shadowGivesWay(next, isComputedCard) ? replacedCard(next) : next;
}

/**
 * Saved tarot data as the Cosmos page loads it. Cards with no source get
 * one, against the birth date they were saved with: a birth card that
 * matches the date's card is 'birth_date', one a retired method gave is
 * 'retired', and any other is 'saved'; a shadow card a retired method gave
 * is 'retired', and any other 'saved'. Once a card has a source it is never
 * judged against a later date. Then it is squared with the date
 * (reconcileTarot).
 * @param {Record<string, any> | null | undefined} tarot @param {string} birthDate
 */
export function settleTarot(tarot, birthDate) {
  if (!tarot) return tarot;
  const next = { ...tarot };
  const retired = retiredCards(birthDate);
  const birth = cardId(next.birth_card);
  if (birth !== null && !next.birth_card_source) {
    next.birth_card_source = birth === birthCards(birthDate)?.personality.id ? 'birth_date' : retired?.birth.includes(birth) ? 'retired' : 'saved';
  }
  const shadow = cardId(next.shadow_card);
  if (shadow !== null && !next.shadow_card_source) next.shadow_card_source = retired?.shadow.includes(shadow) ? 'retired' : 'saved';
  return reconcileTarot(next, birthDate);
}
