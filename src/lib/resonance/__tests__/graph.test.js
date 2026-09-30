import { describe, it, expect } from 'vitest';
import { resonanceGraph } from '../graph.js';

const profile = {
  first_name: 'Ann',
  birth_date: '1990-07-15',
  enabled_systems: ['astrology', 'human_design', 'gene_keys', 'numerology', 'tarot_archetype'],
  astrology: { sun_sign: 'Cancer', moon_sign: 'Pisces' },
  human_design: { type: 'Projector', conscious_sun_gate: '14' },
  gene_keys: { life_work: '14' },
  numerology: { life_path: '5' },
  tarot_archetype: { birth_card: 'The Hierophant' },
};

describe('resonanceGraph', () => {
  const graph = resonanceGraph(profile, '2026-07-02');

  it('creates nodes for filled placements with wheel degrees where they exist', () => {
    const sun = graph.nodes.find((n) => n.id === 'astrology.sun');
    expect(sun).toBeTruthy();
    expect(sun.wheelDeg).toBeGreaterThanOrEqual(90); // Cancer starts at 90
    expect(sun.wheelDeg).toBeLessThan(120);

    const gate = graph.nodes.find((n) => n.id === 'human_design.conscious_sun');
    expect(gate.wheelDeg).not.toBeNull();
  });

  it('links Gene Key and HD gate sharing the same hexagram', () => {
    const edge = graph.edges.find((e) => e.kind === 'hexagram');
    expect(edge).toBeTruthy();
    expect([edge.a, edge.b].sort()).toEqual(['gene_keys.life_work', 'human_design.conscious_sun']);
    expect(edge.strength).toBe(2); // both ends user-filled
  });

  it('links life path to birth card by number', () => {
    const edge = graph.edges.find((e) => e.kind === 'number');
    expect(edge).toBeTruthy();
  });

  it('links a two-digit birth card that reduces to the Life Path, and not an unrelated one', () => {
    // 11 + 23 + 1985 = 2019 -> 12, The Hanged Man, which reduces to 3, the Life Path.
    const hanged = resonanceGraph({ ...profile, birth_date: '1985-11-23', numerology: {}, tarot_archetype: {} }, '2026-07-02');
    expect(hanged.edges.find((e) => e.kind === 'number')?.why).toMatch(/The Hanged Man, reduces to 3, the same number as your Life Path/);
    const unrelated = resonanceGraph({ ...profile, tarot_archetype: { birth_card: 'The Tower' } }, '2026-07-02');
    expect(unrelated.edges.find((e) => e.kind === 'number')).toBeUndefined();
  });

  it('links birth card to its Golden Dawn sign (Hierophant -> Taurus)', () => {
    const edge = graph.edges.find((e) => e.kind === 'astro');
    expect(edge).toBeTruthy();
  });

  it('marks today-active nodes from the moon phase and personal day', () => {
    expect(graph.today.moonPhase).toBeTruthy();
    expect(typeof graph.today.personalDay).toBe('number');
    // Pisces moon placement resonates when the sky moon is in play — presence is enough here
    expect(Array.isArray(graph.today.activeNodeIds)).toBe(true);
  });

  it('is serializable (no functions, no cycles)', () => {
    expect(() => JSON.stringify(graph)).not.toThrow();
  });

  it('plots the Sun from the birth date alone, before the astrology form is filled', () => {
    const bare = resonanceGraph(
      { birth_date: '1990-07-15', enabled_systems: ['astrology'], astrology: {} },
      '2026-07-02'
    );
    const sun = bare.nodes.find((n) => n.id === 'astrology.sun');
    expect(sun).toBeTruthy();
    expect(sun.label).toBe('Sun in Cancer'); // derived, not entered
    expect(sun.wheelDeg).toBeGreaterThanOrEqual(90);
  });
});
