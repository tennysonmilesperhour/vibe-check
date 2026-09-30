import { describe, it, expect } from 'vitest';
import { deriveAll } from '../derive.js';

const profile = {
  first_name: 'Ann',
  last_name: 'Lee',
  birth_date: '1990-07-15', // life path 5; 7 + 15 + 1990 = 2012 -> 5, The Hierophant
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

  it('derives the tarot birth card from the birth date (Greer)', () => {
    const { values } = deriveAll(profile, '2026-07-02');
    expect(values.tarot_archetype.birth_card).toBe('The Hierophant');
    // A single-digit total gives one card, so there is no separate soul card.
    expect(values.tarot_archetype.soul_card).toBeNull();
    // 11 + 23 + 1985 = 2019 -> 12, soul 3
    const later = deriveAll({ ...profile, birth_date: '1985-11-23' }, '2026-07-02').values.tarot_archetype;
    expect(later).toMatchObject({ birth_card: 'The Hanged Man', soul_card: 'The Empress' });
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

  it('adds the year card, counted from the birthday for a July birthday (Greer)', () => {
    // Before July 15: 7 + 15 + 2025 = 2047 -> 13
    expect(deriveAll(profile, '2026-07-02').values.tarot_archetype.personal_year_card).toBe('Death');
    // From July 15: 7 + 15 + 2026 = 2048 -> 14
    expect(deriveAll(profile, '2026-07-15').values.tarot_archetype.personal_year_card).toBe('Temperance');
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
    // The card as the form stores it, for "Use".
    expect(conflict.value).toBe('5 – The Hierophant');
    expect(conflict.retired).toBe(false);
  });

  it('marks a saved birth card a retired method filled in, and offers to keep it', () => {
    const tarotConflict = (birthDate, card) => deriveAll({ ...profile, birth_date: birthDate, tarot_archetype: { birth_card: card } }, '2026-07-02')
      .conflicts.find((c) => c.field === 'tarot_archetype.birth_card');
    // Life Path 3 gave The Empress; Greer's method gives The Hanged Man.
    expect(tarotConflict('1985-11-23', '3 – The Empress')).toMatchObject({ computed: 'The Hanged Man', value: '12 – The Hanged Man', retired: true, keepable: true });
    // Life Path 11 gave Justice; Greer's method gives Judgement.
    expect(tarotConflict('1960-01-03', '11 – Justice')).toMatchObject({ computed: 'Judgement', retired: true });
    // The first method turned 22 into The Emperor; Greer's gives The Fool.
    expect(tarotConflict('1950-05-11', '4 – The Emperor')).toMatchObject({ computed: 'The Fool', retired: true });
    // A card no method gave may come from the person's own practice.
    expect(tarotConflict('1985-11-23', '16 – The Tower')).toMatchObject({ retired: false, keepable: true, systems: ['tarot_archetype'] });
    // A card marked as retired when the profile loaded (settleTarot).
    const marked = deriveAll({ ...profile, birth_date: '1985-11-23', tarot_archetype: { birth_card: '3 – The Empress', birth_card_source: 'retired' } }, '2026-07-02');
    expect(marked.conflicts.find((c) => c.field === 'tarot_archetype.birth_card')).toMatchObject({ retired: true, keepable: true });
  });

  it('names the systems each conflict compares', () => {
    const both = { ...profile, gene_keys: { life_work: '15' } };
    expect(deriveAll(both, '2026-07-02').conflicts.find((c) => c.field === 'gene_keys.life_work')?.systems).toEqual(['gene_keys', 'human_design']);
    expect(deriveAll({ ...profile, numerology: { life_path: '7' } }, '2026-07-02').conflicts.find((c) => c.field === 'numerology.life_path')?.systems).toEqual(['numerology']);
  });

  it('leaves a birth card the person chose alone', () => {
    const kept = { ...profile, birth_date: '1985-11-23', tarot_archetype: { birth_card: '3 – The Empress', birth_card_source: 'entered' } };
    expect(deriveAll(kept, '2026-07-02').conflicts.filter((c) => c.field === 'tarot_archetype.birth_card')).toEqual([]);
    // A card filled in from another birth date is still checked, and only replaced.
    const filled = { ...profile, tarot_archetype: { birth_card: '3 – The Empress', birth_card_source: 'birth_date' } };
    expect(deriveAll(filled, '2026-07-02').conflicts.find((c) => c.field === 'tarot_archetype.birth_card')).toMatchObject({ retired: false, keepable: false });
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
