import { describe, it, expect } from 'vitest';
import { settleCosmicProfile, withSphere } from '../settle.js';

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

  it('gives saved tarot cards a source', () => {
    const settled = settleCosmicProfile({ birth_date: '1985-11-23', tarot_archetype: { birth_card: '3 – The Empress' } });
    expect(settled.tarot_archetype).toEqual({ birth_card: '3 – The Empress', birth_card_source: 'retired' });
    expect(settled.birth_date).toBe('1985-11-23');
  });
});
