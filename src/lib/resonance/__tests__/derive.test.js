import { describe, it, expect } from 'vitest';
import { deriveAll } from '../derive.js';

const profile = {
  first_name: 'Ann',
  last_name: 'Lee',
  birth_date: '1990-07-15', // life path 5 -> The Hierophant
  enabled_systems: ['numerology', 'tarot_archetype', 'human_design', 'gene_keys'],
  human_design: { type: 'Projector', conscious_sun_gate: '14' },
  gene_keys: {},
  numerology: {},
  tarot_archetype: {},
};

describe('deriveAll', () => {
  it('computes the numerology core from birth data + name', () => {
    const { values } = deriveAll(profile, '2026-07-02');
    expect(values.numerology.life_path).toBe(5);
    expect(values.numerology.expression).toBeGreaterThan(0);
    expect(values.numerology.personal_year).toBe(4);
  });

  it('derives the tarot birth card from the life path', () => {
    const { values } = deriveAll(profile, '2026-07-02');
    expect(values.tarot_archetype.birth_card).toBe('The Hierophant');
  });

  it('carries the Gene Key <-> HD gate identity (Life Work = Conscious Sun)', () => {
    const { values } = deriveAll(profile, '2026-07-02');
    expect(values.gene_keys.life_work).toBe('14');
  });

  it('flags a conflict when entered data contradicts a derivation', () => {
    const contradicted = {
      ...profile,
      tarot_archetype: { birth_card: 'The Hermit' },
    };
    const { conflicts } = deriveAll(contradicted, '2026-07-02');
    const conflict = conflicts.find((c) => c.field === 'tarot_archetype.birth_card');
    expect(conflict).toBeTruthy();
    expect(conflict.entered).toBe('The Hermit');
    expect(conflict.computed).toBe('The Hierophant');
  });

  it('no conflicts when entered matches computed', () => {
    const agreeing = { ...profile, numerology: { life_path: '5' } };
    const { conflicts } = deriveAll(agreeing, '2026-07-02');
    expect(conflicts.filter((c) => c.field === 'numerology.life_path')).toEqual([]);
  });

  it('degrades gracefully without a birth date', () => {
    const { values, conflicts } = deriveAll({ enabled_systems: ['numerology'] }, '2026-07-02');
    expect(values.numerology.life_path).toBeNull();
    expect(conflicts).toEqual([]);
  });
});
