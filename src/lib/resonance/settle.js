// Saved cosmic profiles brought up to date, for data saved before a change
// in how Vibe Check works it out. It runs when the Cosmos page loads and
// again when the profile is saved, once the birth date is final.
import { settleTarot } from './tarotCards.js';

// Until September 30, 2026, the Gene Keys form named the wrong chart
// positions for these spheres (Conscious Moon, Conscious Node, Unconscious
// Sun and Unconscious Node).
export const RELABELED_SPHERES = ['radiance', 'purpose', 'attraction', 'iq'];

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
 * The profile with earlier data settled:
 * - tarot cards get a source (settleTarot);
 * - Gene Keys spheres saved under the old labels are marked
 *   `positions_checked: false` until the person checks them.
 * @param {Record<string, any>} profile
 * @returns {Record<string, any>}
 */
export function settleCosmicProfile(profile) {
  const geneKeys = profile.gene_keys;
  const recheck = geneKeys && geneKeys.positions_checked === undefined && RELABELED_SPHERES.some((key) => geneKeys[key]);
  return {
    ...profile,
    tarot_archetype: settleTarot(profile.tarot_archetype, profile.birth_date),
    ...(recheck ? { gene_keys: { ...geneKeys, positions_checked: false } } : {}),
  };
}
