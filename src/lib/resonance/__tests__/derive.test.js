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

  it('derives the Sun sign and its fixed attributes from the birth date', () => {
    const { values } = deriveAll(profile, '2026-07-02');
    expect(values.astrology.sun_sign).toBe('Cancer');
    expect(values.astrology.element).toBe('Water');
    expect(values.astrology.ruler).toBe('Moon');
  });

  it('computes the full numerology set (personality, birthday, maturity, cycles)', () => {
    const { values } = deriveAll(profile, '2026-07-02');
    const n = values.numerology;
    expect(n.personality).toBeGreaterThan(0);
    expect(n.birthday).toBe(6); // 15 -> 6
    expect(n.maturity).toBeGreaterThan(0);
    expect(n.personal_month).not.toBeNull();
    expect(n.personal_day).not.toBeNull();
    expect(Array.isArray(n.karmic_debts)).toBe(true);
  });

  it('adds the personal-year tarot card', () => {
    const { values } = deriveAll(profile, '2026-07-02');
    // personal year 4 -> The Emperor
    expect(values.tarot_archetype.personal_year_card).toBe('The Emperor');
  });

  it('flags an astrology conflict when the entered Sun sign contradicts the date', () => {
    const { conflicts } = deriveAll({ ...profile, astrology: { sun_sign: 'Leo' } }, '2026-07-02');
    const c = conflicts.find((x) => x.field === 'astrology.sun_sign');
    expect(c).toBeTruthy();
    expect(c.computed).toBe('Cancer');
  });

  it('does not flag a tarot conflict for the "N – Name" option format', () => {
    const { conflicts } = deriveAll({ ...profile, tarot_archetype: { birth_card: '5 – The Hierophant' } }, '2026-07-02');
    expect(conflicts.filter((c) => c.field === 'tarot_archetype.birth_card')).toEqual([]);
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
