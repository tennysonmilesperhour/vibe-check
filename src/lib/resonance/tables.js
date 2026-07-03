// The resonance engine's domain tables — the single source of truth for
// cross-system structure. The prose descriptions live in
// components/cosmic/correspondences.jsx (SYSTEM_CORRESPONDENCES); these are
// the machine-readable counterparts.
import { ZODIAC_SIGNS, SYSTEM_CORRESPONDENCES } from '@/components/cosmic/correspondences';

export { ZODIAC_SIGNS, SYSTEM_CORRESPONDENCES };

/** 0° Aries = 0; each sign spans 30°. */
export function signStartDegree(sign) {
  const idx = ZODIAC_SIGNS.indexOf(sign);
  return idx === -1 ? null : idx * 30;
}

/** Life path number -> Major Arcana card id (matches tarotDeck.jsx ids: 8 Strength, 11 Justice). */
export const LIFE_PATH_CARD = {
  1: 1,   // The Magician
  2: 2,   // The High Priestess
  3: 3,   // The Empress
  4: 4,   // The Emperor
  5: 5,   // The Hierophant
  6: 6,   // The Lovers
  7: 7,   // The Chariot
  8: 8,   // Strength
  9: 9,   // The Hermit
  11: 11, // Justice (master number honored as its own card)
  22: 0,  // The Fool (22 is the Fool's number in birth-card practice)
  33: 6,  // exceeds 22 -> 3+3 = 6 -> The Lovers
};

const ARCANA_NAMES = [
  'The Fool', 'The Magician', 'The High Priestess', 'The Empress', 'The Emperor',
  'The Hierophant', 'The Lovers', 'The Chariot', 'Strength', 'The Hermit',
  'Wheel of Fortune', 'Justice', 'The Hanged Man', 'Death', 'Temperance',
  'The Devil', 'The Tower', 'The Star', 'The Moon', 'The Sun', 'Judgement', 'The World',
];

export function arcanaForLifePath(lifePathNumber) {
  const id = LIFE_PATH_CARD[lifePathNumber];
  if (id === undefined) return null;
  return { id, name: ARCANA_NAMES[id] };
}

export function arcanaName(id) {
  return ARCANA_NAMES[id] ?? null;
}

/** Golden Dawn astrological attributions for the 22 Major Arcana (card id keyed). */
export const ARCANA_ASTRO = {
  0: { kind: 'planet', planet: 'Uranus' },     // The Fool
  1: { kind: 'planet', planet: 'Mercury' },    // The Magician
  2: { kind: 'planet', planet: 'Moon' },       // The High Priestess
  3: { kind: 'planet', planet: 'Venus' },      // The Empress
  4: { kind: 'sign', sign: 'Aries' },          // The Emperor
  5: { kind: 'sign', sign: 'Taurus' },         // The Hierophant
  6: { kind: 'sign', sign: 'Gemini' },         // The Lovers
  7: { kind: 'sign', sign: 'Cancer' },         // The Chariot
  8: { kind: 'sign', sign: 'Leo' },            // Strength
  9: { kind: 'sign', sign: 'Virgo' },          // The Hermit
  10: { kind: 'planet', planet: 'Jupiter' },   // Wheel of Fortune
  11: { kind: 'sign', sign: 'Libra' },         // Justice
  12: { kind: 'planet', planet: 'Neptune' },   // The Hanged Man
  13: { kind: 'sign', sign: 'Scorpio' },       // Death
  14: { kind: 'sign', sign: 'Sagittarius' },   // Temperance
  15: { kind: 'sign', sign: 'Capricorn' },     // The Devil
  16: { kind: 'planet', planet: 'Mars' },      // The Tower
  17: { kind: 'sign', sign: 'Aquarius' },      // The Star
  18: { kind: 'sign', sign: 'Pisces' },        // The Moon
  19: { kind: 'planet', planet: 'Sun' },       // The Sun
  20: { kind: 'planet', planet: 'Pluto' },     // Judgement
  21: { kind: 'planet', planet: 'Saturn' },    // The World
};

/**
 * HD centers -> chakras, exactly as the app's own doctrine states it
 * (correspondences.jsx: human_design_chakras). The spleen center has no
 * single chakra there and is intentionally unmapped.
 */
export const CENTER_CHAKRA = {
  head: 'Crown',
  ajna: 'Third Eye',
  throat: 'Throat',
  g: ['Heart', 'Throat'],
  heart: 'Solar Plexus',   // will center / Manipura
  solar_plexus: 'Sacral',  // emotional wave / Svadhisthana (water)
  sacral: 'Sacral',
  root: 'Root',
  spleen: null,
};

/**
 * The Human Design mandala: 64 gates in wheel order, clockwise through the
 * zodiac, starting from the gate that opens 0° Aries. Each gate spans 5.625°.
 * The wheel is globally offset -1.875° (gate 25 begins at 28.125° Pisces),
 * which anchors gate 41 at 2° Aquarius — the start of the HD solar year.
 * Visualization-grade: used for Loom placement, never for chart calculation.
 */
export const GATE_WHEEL = [
  25, 17, 21, 51, 42, 3, 27, 24, 2, 23, 8, 20, 16, 35, 45, 12,
  15, 52, 39, 53, 62, 56, 31, 33, 7, 4, 29, 59, 40, 64, 47, 6,
  46, 18, 48, 57, 32, 50, 28, 44, 1, 43, 14, 34, 9, 5, 26, 11,
  10, 58, 38, 54, 61, 60, 41, 19, 13, 49, 30, 55, 37, 63, 22, 36,
];

const GATE_SPAN = 360 / 64; // 5.625
const WHEEL_OFFSET = -GATE_SPAN / 3; // -1.875: gate 25 straddles the Aries point

/** Center-of-gate ecliptic degree for a gate number, or null. */
export function gateWheelDegree(gate) {
  const idx = GATE_WHEEL.indexOf(Number(gate));
  if (idx === -1) return null;
  return (idx * GATE_SPAN + WHEEL_OFFSET + GATE_SPAN / 2 + 360) % 360;
}

/** Machine-readable correspondence pair index (prose lives in SYSTEM_CORRESPONDENCES). */
export const CORRESPONDENCE_PAIRS = Object.keys(SYSTEM_CORRESPONDENCES).map((key) => {
  const [a, ...rest] = key.split('_');
  // keys are like 'astrology_human_design' — split on known system names
  return { key, text: SYSTEM_CORRESPONDENCES[key] };
});

/** The seven systems, their profile fields, and display labels. */
export const SYSTEMS = [
  { id: 'astrology', label: 'Astrology' },
  { id: 'human_design', label: 'Human Design' },
  { id: 'gene_keys', label: 'Gene Keys' },
  { id: 'numerology', label: 'Numerology' },
  { id: 'tarot_archetype', label: 'Tarot' },
  { id: 'enneagram', label: 'Enneagram' },
  { id: 'chakras', label: 'Chakras' },
];
