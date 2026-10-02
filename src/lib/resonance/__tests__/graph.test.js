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
    expect(hanged.edges.find((e) => e.kind === 'number')?.why).toBe('Your birth card, The Hanged Man, is card 12, and your Life Path is 3. Both reduce to 3.');
    const unrelated = resonanceGraph({ ...profile, tarot_archetype: { birth_card: 'The Tower' } }, '2026-07-02');
    expect(unrelated.edges.find((e) => e.kind === 'number')).toBeUndefined();
  });

  it('words the number link for a matching card, a master number and The Fool', () => {
    const why = (overrides) => resonanceGraph({ ...profile, ...overrides }, '2026-07-02').edges.find((e) => e.kind === 'number')?.why;
    expect(graph.edges.find((e) => e.kind === 'number')?.why).toBe('Your birth card, The Hierophant, is card 5, the same number as your Life Path.');
    // Life Path 11 with The High Priestess shares the root 2, not the number.
    expect(why({ numerology: { life_path: '11' }, tarot_archetype: { birth_card: '2 – The High Priestess' } }))
      .toBe('Your birth card, The High Priestess, is card 2, and your Life Path is 11. Both reduce to 2.');
    expect(why({ numerology: { life_path: '11' }, tarot_archetype: { birth_card: '11 – Justice' } }))
      .toBe('Your birth card, Justice, is card 11, the same number as your Life Path.');
    expect(why({ numerology: { life_path: '4' }, tarot_archetype: { birth_card: '0 – The Fool' } }))
      .toBe('Your birth card, The Fool, counts as 22, and your Life Path is 4. Both reduce to 4.');
    expect(why({ numerology: { life_path: '22' }, tarot_archetype: { birth_card: 'The Fool' } }))
      .toBe('Your birth card, The Fool, counts as 22, the same number as your Life Path.');
  });

  it('labels Enneagram and chakra points from the content, whatever label was saved', () => {
    const labels = resonanceGraph({
      ...profile,
      enabled_systems: ['enneagram', 'chakras'],
      enneagram: { type: '4 – The Individualist', wing: '4w5' },
      chakras: { dominant_center: 'Heart (Anahata) – Love & connection' },
    }, '2026-07-02').nodes.map((n) => n.label);
    expect(labels).toEqual(['Type 4 – Authenticity and depth (4w5)', 'Heart center']);
    // A wing that doesn't belong to the type is left out.
    const leftover = resonanceGraph({ ...profile, enabled_systems: ['enneagram'], enneagram: { type: '9', wing: '4w5' } }, '2026-07-02');
    expect(leftover.nodes.map((n) => n.label)).toEqual(['Type 9 – Peace and harmony']);
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

  it('lights the Moon placement today, and only placements that exist', () => {
    // The Loom lights today's placements and their threads by these ids.
    expect(graph.today.activeNodeIds).toContain('astrology.moon');
    const ids = new Set(graph.nodes.map((n) => n.id));
    for (const id of graph.today.activeNodeIds) expect(ids.has(id)).toBe(true);
    for (const edge of graph.edges.filter((e) => e.isActiveToday)) {
      expect(graph.today.activeNodeIds.includes(edge.a) || graph.today.activeNodeIds.includes(edge.b)).toBe(true);
    }
  });

  it('lights nothing without a Moon placement or a matching personal day', () => {
    const bare = resonanceGraph({ ...profile, astrology: { sun_sign: 'Cancer' }, birth_date: '' }, '2026-07-02');
    expect(bare.today.moonPhase).toBeTruthy();
    expect(bare.today.activeNodeIds).toEqual([]);
    expect(bare.edges.some((e) => e.isActiveToday)).toBe(false);
    expect(resonanceGraph(profile, undefined).today.activeNodeIds).toEqual([]);
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
