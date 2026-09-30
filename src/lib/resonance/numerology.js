// Numerology, fully computed — the app previously asked users to type these
// (or spent an LLM call). Component method with master numbers preserved
// for core numbers; personal cycles reduce to single digits.

export const digitSum = (n) => String(n).split('').reduce((a, d) => a + Number(d), 0);

export function reduceKeepMasters(n) {
  while (n > 9 && n !== 11 && n !== 22 && n !== 33) n = digitSum(n);
  return n;
}

export function reduceSingle(n) {
  while (n > 9) n = digitSum(n);
  return n;
}

/** A YYYY-MM-DD birth date as numbers, or null. */
export const parts = (birthDate) => {
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

/** Raw (un-reduced) letter-sum of a name under a filter: 'all' | 'vowels' | 'consonants'. */
function nameSum(name, filter = 'all') {
  if (!name) return null;
  const letters = name.toUpperCase().replace(/[^A-Z]/g, '').split('');
  const included =
    filter === 'vowels' ? letters.filter((ch) => VOWELS.has(ch))
    : filter === 'consonants' ? letters.filter((ch) => !VOWELS.has(ch))
    : letters;
  if (included.length === 0) return null;
  return included.reduce((a, ch) => a + LETTER_VALUE[ch], 0);
}

function nameNumber(name, filter) {
  const raw = nameSum(name, filter);
  return raw === null ? null : reduceKeepMasters(raw);
}

/** Expression (destiny): every letter of the name. */
export const expression = (fullName) => nameNumber(fullName, 'all');

/** Soul urge (heart's desire): vowels only. */
export const soulUrge = (fullName) => nameNumber(fullName, 'vowels');

/** Personality: consonants only — the outer self others meet first. */
export const personality = (fullName) => nameNumber(fullName, 'consonants');

/** Birthday number: the day of the month, reduced (masters kept). */
export function birthdayNumber(birthDate) {
  const p = parts(birthDate);
  return p ? reduceKeepMasters(p.d) : null;
}

/** Maturity: Life Path + Expression, reduced — the self you grow into. */
export function maturity(birthDate, fullName) {
  const lp = lifePath(birthDate);
  const ex = expression(fullName);
  if (lp === null || ex === null) return null;
  return reduceKeepMasters(lp + ex);
}

// Karmic debt numbers surface when a total passes through one of these on its
// way down to a single digit.
const KARMIC = new Set([13, 14, 16, 19]);

function debtInChain(total) {
  let n = total;
  while (n > 9) {
    if (KARMIC.has(n)) return n;
    n = digitSum(n);
  }
  return null;
}

/**
 * Karmic debts across the core numbers — each is a { source, number } pair.
 * Checks the Life Path total, the Expression/Soul-Urge/Personality name sums,
 * and the birth day.
 */
export function karmicDebts(birthDate, fullName) {
  const p = parts(birthDate);
  const found = [];
  const push = (source, total) => {
    if (total == null) return;
    const debt = debtInChain(total);
    if (debt) found.push({ source, number: debt });
  };

  if (p) {
    push('Life Path', reduceKeepMasters(p.m) + reduceKeepMasters(p.d) + reduceKeepMasters(digitSum(p.y)));
    if (KARMIC.has(p.d)) found.push({ source: 'Birthday', number: p.d });
  }
  push('Expression', nameSum(fullName, 'all'));
  push('Soul Urge', nameSum(fullName, 'vowels'));
  push('Personality', nameSum(fullName, 'consonants'));

  // de-dupe on source+number
  const seen = new Set();
  return found.filter(({ source, number }) => {
    const key = `${source}:${number}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

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
