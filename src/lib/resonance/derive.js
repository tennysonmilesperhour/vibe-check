// Derivation + validation: compute everything computable from birth data,
// cross-check what the user entered, and report contradictions gently.
// Every derived value carries its provenance so the UI can say "computed".
import {
  lifePath, expression, soulUrge, personality, birthdayNumber, maturity, karmicDebts,
  personalYear, personalMonth, personalDay,
} from './numerology.js';
import { birthCards, cardId, cardOption, retiredCards, yearCard as greerYearCard } from './tarotCards.js';
import { deriveAstrology } from './astrology.js';

// Normalize for comparison; also strips the "N – " prefix the tarot form stores
// so "5 – The Hierophant" matches the engine's bare "The Hierophant".
const norm = (v) => String(v ?? '').trim().replace(/^\d+\s*[–-]\s*/, '').toLowerCase();

/**
 * deriveAll(profile, onDateKey) ->
 *   { values: {astrology, numerology, tarot_archetype, gene_keys, human_design}, conflicts: [...] }
 * Never throws; missing inputs yield nulls, not errors. Everything here is
 * computed from birth DATE + name alone — no birth time or place needed.
 */
export function deriveAll(profile = {}, onDateKey) {
  const birthDate = profile.birth_date || null;
  const fullName = [profile.first_name, profile.last_name].filter(Boolean).join(' ');

  const lp = lifePath(birthDate);
  // Tarot birth, soul and year cards by Mary K. Greer's method (tarotCards).
  const cards = birthCards(birthDate);
  const birthCard = cards?.personality ?? null;
  const soulCard = cards?.soul ?? null;
  const py = birthDate && onDateKey ? personalYear(birthDate, onDateKey) : null;
  const yearCard = birthDate && onDateKey ? greerYearCard(birthDate, Number(onDateKey.slice(0, 4))) : null;

  const astro = deriveAstrology(birthDate);

  const values = {
    astrology: astro,
    numerology: {
      life_path: lp,
      expression: fullName ? expression(fullName) : null,
      soul_urge: fullName ? soulUrge(fullName) : null,
      personality: fullName ? personality(fullName) : null,
      birthday: birthdayNumber(birthDate),
      maturity: fullName ? maturity(birthDate, fullName) : null,
      personal_year: py,
      personal_month: birthDate && onDateKey ? personalMonth(birthDate, onDateKey) : null,
      personal_day: birthDate && onDateKey ? personalDay(birthDate, onDateKey) : null,
      karmic_debts: fullName || birthDate ? karmicDebts(birthDate, fullName) : [],
    },
    tarot_archetype: {
      birth_card: birthCard?.name ?? null,
      soul_card: soulCard?.name ?? null,
      personal_year_card: yearCard?.name ?? null,
    },
    gene_keys: {
      // Same 64 hexagrams: Life's Work Key IS the Conscious Sun Gate.
      life_work: profile.gene_keys?.life_work || profile.human_design?.conscious_sun_gate || null,
    },
    human_design: {
      conscious_sun_gate: profile.human_design?.conscious_sun_gate || profile.gene_keys?.life_work || null,
    },
  };

  const conflicts = [];
  const check = (field, entered, computed, source, extra = {}) => {
    if (entered == null || entered === '' || computed == null) return;
    if (norm(entered) !== norm(computed)) {
      conflicts.push({ field, entered, computed, source, ...extra });
    }
  };

  // A entered chart may be more accurate than calendar boundaries. Only flag legacy entries
  // for review; an explicit choice or unknown value should not be repeatedly challenged.
  if (!profile.astrology?.sun_source) check('astrology.sun_sign', profile.astrology?.sun_sign, astro.sun_sign, 'calendar-based Sun estimate');
  check('numerology.life_path', profile.numerology?.life_path, lp, 'birth date');
  // A birth card the person chose stays theirs. Any other is checked against
  // the birth date: `value` is the card as the form stores it, and `retired`
  // marks a saved card the retired Life Path method filled in, before
  // birth_card_source was recorded, so the notice can explain the change.
  const tarot = profile.tarot_archetype || {};
  if (birthCard && tarot.birth_card_source !== 'entered') {
    const retired = tarot.birth_card_source ? null : retiredCards(birthDate);
    const isRetired = retired !== null && cardId(tarot.birth_card) === retired.birth;
    check('tarot_archetype.birth_card', tarot.birth_card, birthCard.name, 'birth date', {
      value: cardOption(birthCard.id),
      retired: isRetired,
      // The retired method's shadow card was this date's soul card, which now shows on its own.
      retiredShadow: isRetired && retired?.shadow != null ? cardOption(retired.shadow) : null,
    });
  }
  if (profile.gene_keys?.life_work && profile.human_design?.conscious_sun_gate) {
    check(
      'gene_keys.life_work',
      profile.gene_keys.life_work,
      profile.human_design.conscious_sun_gate,
      'Human Design Conscious Sun gate (same hexagram)'
    );
  }

  return { values, conflicts };
}
