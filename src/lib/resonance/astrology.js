// Sun-sign astrology — everything that is honestly derivable from a birth
// DATE alone, no birth time or place required. The Sun's sign, and with it a
// sign's element / modality / polarity / ruling planet, are fixed tropical
// correspondences; the decan follows the date's position within the sign.
//
// Moon, Rising, and the Nodes are deliberately NOT here: they need an exact
// birth time (and place, for the Rising) plus ephemeris math, so they stay on
// the AI birth-chart calculator rather than being faked from the date.
import { ZODIAC_SIGNS } from '@/components/cosmic/correspondences';

// Tropical sign boundaries as calendar dates — [month, day] the sign begins.
// These match the date ranges the app has always used (ProfileForm.getSunSign).
const SIGN_START = {
  Aries: [3, 21], Taurus: [4, 20], Gemini: [5, 21], Cancer: [6, 21],
  Leo: [7, 23], Virgo: [8, 23], Libra: [9, 23], Scorpio: [10, 23],
  Sagittarius: [11, 22], Capricorn: [12, 22], Aquarius: [1, 20], Pisces: [2, 19],
};

// Fixed traditional attributes per sign. Rulers use the modern rulerships that
// most contemporary readers expect (Scorpio→Pluto, Aquarius→Uranus, Pisces→Neptune).
const SIGN_ATTRIBUTES = {
  Aries:       { element: 'Fire',  modality: 'Cardinal', ruler: 'Mars' },
  Taurus:      { element: 'Earth', modality: 'Fixed',    ruler: 'Venus' },
  Gemini:      { element: 'Air',   modality: 'Mutable',  ruler: 'Mercury' },
  Cancer:      { element: 'Water', modality: 'Cardinal', ruler: 'Moon' },
  Leo:         { element: 'Fire',  modality: 'Fixed',    ruler: 'Sun' },
  Virgo:       { element: 'Earth', modality: 'Mutable',  ruler: 'Mercury' },
  Libra:       { element: 'Air',   modality: 'Cardinal', ruler: 'Venus' },
  Scorpio:     { element: 'Water', modality: 'Fixed',    ruler: 'Pluto' },
  Sagittarius: { element: 'Fire',  modality: 'Mutable',  ruler: 'Jupiter' },
  Capricorn:   { element: 'Earth', modality: 'Cardinal', ruler: 'Saturn' },
  Aquarius:    { element: 'Air',   modality: 'Fixed',    ruler: 'Uranus' },
  Pisces:      { element: 'Water', modality: 'Mutable',  ruler: 'Neptune' },
};

// Fire & Air are Yang (active/positive); Earth & Water are Yin (receptive/negative).
const ELEMENT_POLARITY = { Fire: 'Yang', Air: 'Yang', Earth: 'Yin', Water: 'Yin' };

const parts = (birthDate) => {
  if (!birthDate || !/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) return null;
  const [y, m, d] = birthDate.split('-').map(Number);
  return { y, m, d };
};

/** Day-of-year in a fixed non-leap year (decans don't need leap precision). */
const CUMULATIVE = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
const dayOfYear = (m, d) => CUMULATIVE[m - 1] + d;

/** Sun sign from a birth date ('yyyy-MM-dd'), tropical/date-based. */
export function sunSign(birthDate) {
  const p = parts(birthDate);
  if (!p) return null;
  const { m, d } = p;
  if ((m === 3 && d >= 21) || (m === 4 && d <= 19)) return 'Aries';
  if ((m === 4 && d >= 20) || (m === 5 && d <= 20)) return 'Taurus';
  if ((m === 5 && d >= 21) || (m === 6 && d <= 20)) return 'Gemini';
  if ((m === 6 && d >= 21) || (m === 7 && d <= 22)) return 'Cancer';
  if ((m === 7 && d >= 23) || (m === 8 && d <= 22)) return 'Leo';
  if ((m === 8 && d >= 23) || (m === 9 && d <= 22)) return 'Virgo';
  if ((m === 9 && d >= 23) || (m === 10 && d <= 22)) return 'Libra';
  if ((m === 10 && d >= 23) || (m === 11 && d <= 21)) return 'Scorpio';
  if ((m === 11 && d >= 22) || (m === 12 && d <= 21)) return 'Sagittarius';
  if ((m === 12 && d >= 22) || (m === 1 && d <= 19)) return 'Capricorn';
  if ((m === 1 && d >= 20) || (m === 2 && d <= 18)) return 'Aquarius';
  return 'Pisces';
}

/** Fixed attributes for a sign: { element, modality, polarity, ruler }, or null. */
export function signAttributes(sign) {
  const a = SIGN_ATTRIBUTES[sign];
  if (!a) return null;
  return { ...a, polarity: ELEMENT_POLARITY[a.element] };
}

/**
 * Which decan (1, 2, or 3) the birth date falls in — the sign's 30° split into
 * thirds, approximated by the date's position within the sign's own span.
 * Date-derived, so it's an approximation near decan boundaries.
 */
export function sunDecan(birthDate) {
  const sign = sunSign(birthDate);
  const p = parts(birthDate);
  if (!sign || !p) return null;

  const idx = ZODIAC_SIGNS.indexOf(sign);
  const nextSign = ZODIAC_SIGNS[(idx + 1) % 12];
  const [sm, sd] = SIGN_START[sign];
  const [nm, nd] = SIGN_START[nextSign];

  const wrap = (n) => ((n % 365) + 365) % 365;
  const daysIn = wrap(dayOfYear(p.m, p.d) - dayOfYear(sm, sd));
  const span = wrap(dayOfYear(nm, nd) - dayOfYear(sm, sd)) || 30;

  return Math.min(2, Math.floor((daysIn / span) * 3)) + 1;
}

/**
 * The planet that sub-rules a decan. Each decan carries the flavour of the next
 * sign of the same element (triplicity order); its ruler is that sign's ruler.
 * Decan 1 = the sign itself, decan 2 = next same-element sign, decan 3 = the third.
 */
export function decanRuler(sign, decan) {
  const base = ZODIAC_SIGNS.indexOf(sign);
  if (base === -1 || !decan) return null;
  const subSign = ZODIAC_SIGNS[(base + (decan - 1) * 4) % 12];
  return SIGN_ATTRIBUTES[subSign]?.ruler ?? null;
}

/**
 * Everything derivable about the Sun from a birth date.
 * Returns nulls (never throws) when the date is missing/invalid.
 */
export function deriveAstrology(birthDate) {
  const sun_sign = sunSign(birthDate);
  if (!sun_sign) {
    return { sun_sign: null, element: null, modality: null, polarity: null, ruler: null, decan: null, decan_ruler: null };
  }
  const attrs = signAttributes(sun_sign);
  const decan = sunDecan(birthDate);
  return {
    sun_sign,
    element: attrs.element,
    modality: attrs.modality,
    polarity: attrs.polarity,
    ruler: attrs.ruler,
    decan,
    decan_ruler: decanRuler(sun_sign, decan),
  };
}
