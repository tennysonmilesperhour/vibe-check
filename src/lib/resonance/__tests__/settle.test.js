import { describe, it, expect } from 'vitest';
import { needsPositionCheck, settleCosmicProfile, settleOnSave, withSphere } from '../settle.js';

describe('settleCosmicProfile', () => {
  it('asks for a check of Gene Keys spheres saved under the old labels', () => {
    const saved = { birth_date: '1991-04-17', gene_keys: { life_work: '51', radiance: '31' } };
    expect(settleCosmicProfile(saved).gene_keys).toEqual({ life_work: '51', radiance: '31', positions_checked: false });
    // Once checked, or with none of those spheres saved, nothing changes.
    expect(settleCosmicProfile({ gene_keys: { radiance: '31', positions_checked: true } }).gene_keys).toEqual({ radiance: '31', positions_checked: true });
    expect(settleCosmicProfile({ gene_keys: { life_work: '51' } }).gene_keys).toEqual({ life_work: '51' });
    expect(settleCosmicProfile({}).gene_keys).toBeUndefined();
  });

  it('needs no check for a sphere entered under the current labels, after a save and reload too', () => {
    const entered = withSphere({ life_work: '51' }, 'radiance', '31');
    expect(entered).toEqual({ life_work: '51', radiance: '31', positions_checked: true });
    const reloaded = settleCosmicProfile(JSON.parse(JSON.stringify({ gene_keys: entered }))).gene_keys;
    expect(reloaded.positions_checked).toBe(true);
    // A sphere saved under the old labels still needs a check after one edit.
    expect(withSphere({ radiance: '31', iq: '5', positions_checked: false }, 'iq', '6').positions_checked).toBe(false);
    // Other fields don't count.
    expect(withSphere({}, 'life_work', '51')).toEqual({ life_work: '51' });
  });

  it('knows when spheres still need a check', () => {
    expect(needsPositionCheck({ radiance: '31', positions_checked: false })).toBe(true);
    expect(needsPositionCheck({ life_work: '51', positions_checked: false })).toBe(false);
    expect(needsPositionCheck({ radiance: '31', positions_checked: true })).toBe(false);
    expect(needsPositionCheck(undefined)).toBe(false);
  });

  it('squares tarot cards with the final birth date on save, without sorting out unsourced cards', () => {
    // An earlier card that the new date makes the computed one.
    const kept = { birth_date: '1970-11-28', tarot_archetype: { birth_card: '11 – Justice', birth_card_source: 'retired', shadow_card: '2 – The High Priestess', shadow_card_source: 'retired' } };
    expect(settleOnSave(kept).tarot_archetype).toEqual({ birth_card: '11 – Justice', birth_card_source: 'birth_date' });
    // A card with no source is left for the next load.
    const unsourced = { birth_date: '1978-01-02', tarot_archetype: { birth_card: '19 – The Sun', birth_card_source: 'birth_date', shadow_card: '10 – Wheel of Fortune' } };
    expect(settleOnSave(unsourced).tarot_archetype).toEqual(unsourced.tarot_archetype);
  });

  it('gives an Enneagram type saved under an earlier name its current name', () => {
    expect(settleCosmicProfile({ enneagram: { type: '4 – The Individualist', wing: '4w5' } }).enneagram).toEqual({ type: '4 – Authenticity and depth', wing: '4w5' });
    expect(settleCosmicProfile({ enneagram: { type: '4 – Authenticity and depth' } }).enneagram).toEqual({ type: '4 – Authenticity and depth' });
    expect(settleCosmicProfile({ enneagram: {} }).enneagram).toEqual({});
  });

  it('drops a saved wing that does not belong to the type', () => {
    expect(settleCosmicProfile({ enneagram: { type: '9 – The Peacemaker', wing: '4w5', instinct: 'Social (so)' } }).enneagram)
      .toEqual({ type: '9 – Peace and harmony', wing: undefined, instinct: 'Social (so)' });
    expect(settleCosmicProfile({ enneagram: { type: '9 – Peace and harmony', wing: '9w1' } }).enneagram).toEqual({ type: '9 – Peace and harmony', wing: '9w1' });
  });

  it('drops a saved personal year, which is worked out from the birth date wherever it shows', () => {
    const settled = settleCosmicProfile({ birth_date: '1990-07-15', numerology: { life_path: '5', personal_year: '4' } });
    expect(JSON.parse(JSON.stringify(settled.numerology))).toEqual({ life_path: '5' });
    expect(settleCosmicProfile({ numerology: { life_path: '5' } }).numerology).toEqual({ life_path: '5' });
    // Without a birth date it can't be kept current, so a saved one goes too.
    expect(JSON.parse(JSON.stringify(settleCosmicProfile({ numerology: { personal_year: '7' } }).numerology))).toEqual({});
  });

  it('gives saved tarot cards a source', () => {
    const settled = settleCosmicProfile({ birth_date: '1985-11-23', tarot_archetype: { birth_card: '3 – The Empress' } });
    expect(settled.tarot_archetype).toEqual({ birth_card: '3 – The Empress', birth_card_source: 'retired' });
    expect(settled.birth_date).toBe('1985-11-23');
  });
});
