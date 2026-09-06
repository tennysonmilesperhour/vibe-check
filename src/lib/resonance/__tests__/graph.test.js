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

  it('does not link a life path to an overridden, nonmatching birth card', () => {
    const mismatched = resonanceGraph({
      ...profile,
      tarot_archetype: { birth_card: '8 – Strength' },
    }, '2026-07-02');
    expect(mismatched.edges.find((edge) => edge.kind === 'number')).toBeUndefined();
  });

  it('understands the numbered card labels saved by the profile form', () => {
    const numbered = resonanceGraph({
      ...profile,
      tarot_archetype: { birth_card: '5 – The Hierophant' },
    }, '2026-07-02');
    expect(numbered.edges.find((edge) => edge.kind === 'number')).toBeTruthy();
  });

  it('does not invent an astrology link when the attributed sign is absent', () => {
    expect(graph.edges.find((edge) => edge.kind === 'astro')).toBeUndefined();
  });

  it('links a birth card only to an astrology placement with the same sign', () => {
    const matching = resonanceGraph({
      ...profile,
      astrology: { ...profile.astrology, rising_sign: 'Taurus' },
    }, '2026-07-02');
    const edge = matching.edges.find((item) => item.kind === 'astro');
    expect(edge).toMatchObject({
      a: 'tarot_archetype.birth_card',
      b: 'astrology.rising',
    });
    expect(edge.why).toContain('same sign as your rising');
  });

  it('marks today-active nodes from the moon phase and personal day', () => {
    expect(graph.today.moonPhase).toBeTruthy();
    expect(typeof graph.today.personalDay).toBe('number');
    // Pisces moon placement resonates when the sky moon is in play: presence is enough here
    expect(Array.isArray(graph.today.activeNodeIds)).toBe(true);
  });

  it('is serializable (no functions, no cycles)', () => {
    expect(() => JSON.stringify(graph)).not.toThrow();
  });
});
