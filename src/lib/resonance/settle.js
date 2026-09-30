// Saved cosmic profiles brought up to date when the Cosmos page loads, for
// data saved before a change in how Vibe Check works it out. Nothing here
// is stored until the person saves their profile.
import { settleTarot } from './tarotCards.js';

// Until September 30, 2026, the Gene Keys form named the wrong chart
// positions for these spheres (Conscious Moon, Conscious Node, Unconscious
// Sun and Unconscious Node).
export const RELABELED_SPHERES = ['radiance', 'purpose', 'attraction', 'iq'];

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
