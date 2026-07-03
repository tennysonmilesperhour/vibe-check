// Numerology, fully computed — the app previously asked users to type these
// (or spent an LLM call). Component method with master numbers preserved
// for core numbers; personal cycles reduce to single digits.

const digitSum = (n) => String(n).split('').reduce((a, d) => a + Number(d), 0);

export function reduceKeepMasters(n) {
  while (n > 9 && n !== 11 && n !== 22 && n !== 33) n = digitSum(n);
  return n;
}

export function reduceSingle(n) {
  while (n > 9) n = digitSum(n);
  return n;
}

const parts = (birthDate) => {
  if (!birthDate || !/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) return null;
  const [y, m, d] = birthDate.split('-').map(Number);
  return { y, m, d };
};

/** Life path: reduce month, day, year separately (keeping masters), sum, reduce. */
export function lifePath(birthDate) {
  const p = parts(birthDate);
  if (!p) return null;
  const total = reduceKeepMasters(p.m) + reduceKeepMasters(p.d) + reduceKeepMasters(digitSum(p.y));
  return reduceKeepMasters(total);
}

// Pythagorean letter values: A=1..I=9, J=1..R=9, S=1..Z=8
const LETTER_VALUE = Object.fromEntries(
  'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map((ch, i) => [ch, (i % 9) + 1])
);
const VOWELS = new Set(['A', 'E', 'I', 'O', 'U']);

function nameNumber(name, vowelsOnly) {
  if (!name) return null;
  const letters = name.toUpperCase().replace(/[^A-Z]/g, '').split('');
  const included = vowelsOnly ? letters.filter((ch) => VOWELS.has(ch)) : letters;
  if (included.length === 0) return null;
  return reduceKeepMasters(included.reduce((a, ch) => a + LETTER_VALUE[ch], 0));
}

/** Expression (destiny): every letter of the name. */
export const expression = (fullName) => nameNumber(fullName, false);

/** Soul urge (heart's desire): vowels only. */
export const soulUrge = (fullName) => nameNumber(fullName, true);

/** Personal year, rolling on the user's birthday (not Jan 1). */
export function personalYear(birthDate, onDateKey) {
  const b = parts(birthDate);
  const o = parts(onDateKey);
  if (!b || !o) return null;
  const birthdayPassed = o.m > b.m || (o.m === b.m && o.d >= b.d);
  const referenceYear = birthdayPassed ? o.y : o.y - 1;
  return reduceSingle(reduceSingle(b.m) + reduceSingle(b.d) + reduceSingle(digitSum(referenceYear)));
}

export function personalMonth(birthDate, onDateKey) {
  const py = personalYear(birthDate, onDateKey);
  const o = parts(onDateKey);
  if (py === null || !o) return null;
  return reduceSingle(py + o.m);
}

export function personalDay(birthDate, onDateKey) {
  const pm = personalMonth(birthDate, onDateKey);
  const o = parts(onDateKey);
  if (pm === null || !o) return null;
  return reduceSingle(pm + o.d);
}
