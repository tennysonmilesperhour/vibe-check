// Tarot birth and year cards by Mary K. Greer's method: add the birth month,
// day and year as numbers, then add the digits of the total until it is 22
// or less. That number is the birth (personality) card, with 22 as The Fool;
// reducing it to one digit gives the soul card. The year card uses the same
// sum with a calendar year in place of the birth year.
import { arcanaName } from './tables.js';

const digitSum = (n) => String(n).split('').reduce((a, d) => a + Number(d), 0);

const parts = (birthDate) => {
  if (!birthDate || !/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) return null;
  const [y, m, d] = birthDate.split('-').map(Number);
  return { y, m, d };
};

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
 * The birth (personality) and soul cards for a birth date, or null. They are
 * the same card when the total is already a single digit.
 * @param {string} birthDate a YYYY-MM-DD key
 */
export function birthCards(birthDate) {
  const p = parts(birthDate);
  if (!p) return null;
  const n = toGreer(p.m + p.d + p.y);
  let soul = n;
  while (soul > 9) soul = digitSum(soul);
  return { personality: card(n), soul: card(soul) };
}

/**
 * The year card for a birth date in a calendar year, or null.
 * @param {string} birthDate a YYYY-MM-DD key @param {number} year
 */
export function yearCard(birthDate, year) {
  const p = parts(birthDate);
  if (!p || !Number.isInteger(year)) return null;
  return card(toGreer(p.m + p.d + year));
}
