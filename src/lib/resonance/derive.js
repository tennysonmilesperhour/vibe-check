// Derivation + validation: compute everything computable from birth data,
// cross-check what the user entered, and report contradictions gently.
// Every derived value carries its provenance so the UI can say "computed".
import { lifePath, expression, soulUrge, personalYear } from './numerology.js';
import { arcanaForLifePath } from './tables.js';

const norm = (v) => String(v ?? '').trim().toLowerCase();
const normCard = (v) => norm(v).replace(/^\d{1,2}\s*[–—-]\s*/, '');

/**
 * deriveAll(profile, onDateKey) ->
 *   { values: {numerology, tarot_archetype, gene_keys, human_design}, conflicts: [...] }
 * Never throws; missing inputs yield nulls, not errors.
 */
export function deriveAll(profile = {}, onDateKey) {
  const birthDate = profile.birth_date || null;
  const fullName = [profile.first_name, profile.last_name].filter(Boolean).join(' ');

  const lp = lifePath(birthDate);
  const birthCard = lp !== null ? arcanaForLifePath(lp) : null;

  const values = {
    numerology: {
      life_path: lp,
      expression: fullName ? expression(fullName) : null,
      soul_urge: fullName ? soulUrge(fullName) : null,
      personal_year: birthDate && onDateKey ? personalYear(birthDate, onDateKey) : null,
    },
    tarot_archetype: {
      birth_card: birthCard?.name ?? null,
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
  const check = (field, entered, computed, source, normalize = norm) => {
    if (entered == null || entered === '' || computed == null) return;
    if (normalize(entered) !== normalize(computed)) {
      conflicts.push({ field, entered, computed, source });
    }
  };

  check('numerology.life_path', profile.numerology?.life_path, lp, 'birth date');
  check('tarot_archetype.birth_card', profile.tarot_archetype?.birth_card, birthCard?.name, 'life path number', normCard);
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
