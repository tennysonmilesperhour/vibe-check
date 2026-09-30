// Saved cosmic profiles brought up to date, for data saved before a change
// in how Vibe Check works it out. settleCosmicProfile runs when the Cosmos
// page loads; settleOnSave squares the tarot cards with the birth date again
// when the profile is saved, once the date is final.
import { reconcileTarot, settleTarot } from './tarotCards.js';
import { enneagramOption, resolveEnneagram, wingOf } from '../wisdom/content/enneagram.js';
import { personalYear } from './numerology.js';
import { todayKey } from '../dates.js';

// Until September 30, 2026, the Gene Keys form named the wrong chart
// positions for these spheres (Conscious Moon, Conscious Node, Unconscious
// Sun and Unconscious Node).
export const RELABELED_SPHERES = ['radiance', 'purpose', 'attraction', 'iq'];

export const POSITION_CHECK_NOTE = 'Earlier versions of Vibe Check named the wrong chart positions for Radiance, Purpose, Attraction and IQ. If you looked yours up in a Human Design chart, check them against your Gene Keys profile.';

/**
 * Whether Gene Keys spheres saved under the old labels still need a check.
 * @param {Record<string, any> | null | undefined} geneKeys
 */
export const needsPositionCheck = (geneKeys) =>
  geneKeys?.positions_checked === false && RELABELED_SPHERES.some((key) => geneKeys[key]);

/**
 * Gene Keys data with a sphere set. A sphere first entered under the
 * current labels needs no check; one saved under the old labels still does.
 * @param {Record<string, any> | null | undefined} geneKeys @param {string} key @param {string} value
 */
export function withSphere(geneKeys, key, value) {
  const next = { ...geneKeys, [key]: value };
  if (RELABELED_SPHERES.includes(key) && next.positions_checked === undefined) next.positions_checked = true;
  return next;
}

/**
 * The profile as the Cosmos page loads it:
 * - tarot cards get a source (settleTarot);
 * - Gene Keys spheres saved under the old labels are marked
 *   `positions_checked: false` until the person checks them;
 * - an Enneagram type saved under an earlier name gets the form's current
 *   name for the same number, and a wing that doesn't belong to the type
 *   goes;
 * - a saved personal year is brought up to date, since it changes each
 *   birthday.
 * @param {Record<string, any>} profile
 * @param {string} [today]
 * @returns {Record<string, any>}
 */
export function settleCosmicProfile(profile, today = todayKey()) {
  const geneKeys = profile.gene_keys;
  const recheck = geneKeys && geneKeys.positions_checked === undefined && RELABELED_SPHERES.some((key) => geneKeys[key]);
  const enneagram = profile.enneagram;
  const number = enneagram?.type ? resolveEnneagram(enneagram.type)?.number : null;
  const staleWing = Boolean(number && enneagram.wing && !wingOf(enneagram.wing, number));
  const renamed = Boolean(number && enneagram.type !== enneagramOption(number));
  const year = profile.birth_date ? personalYear(profile.birth_date, today) : null;
  const savedYear = profile.numerology?.personal_year;
  return {
    ...profile,
    tarot_archetype: settleTarot(profile.tarot_archetype, profile.birth_date),
    ...(recheck ? { gene_keys: { ...geneKeys, positions_checked: false } } : {}),
    ...(renamed || staleWing ? { enneagram: { ...enneagram, ...(renamed ? { type: enneagramOption(number) } : {}), ...(staleWing ? { wing: undefined } : {}) } } : {}),
    ...(year != null && savedYear && String(savedYear) !== String(year) ? { numerology: { ...profile.numerology, personal_year: String(year) } } : {}),
  };
}

/**
 * The profile as it is saved, with the tarot cards squared with the final
 * birth date (reconcileTarot).
 * @param {Record<string, any>} profile
 * @returns {Record<string, any>}
 */
export function settleOnSave(profile) {
  return { ...profile, tarot_archetype: reconcileTarot(profile.tarot_archetype, profile.birth_date) };
}
