import { describe, it, expect } from 'vitest';
import {
  LIFE_PATH_CARD, ARCANA_ASTRO, CENTER_CHAKRA, GATE_WHEEL,
  gateWheelDegree, signStartDegree, arcanaForLifePath,
} from '../tables.js';

describe('LIFE_PATH_CARD', () => {
  it('maps core numbers to Major Arcana ids', () => {
    expect(LIFE_PATH_CARD[1]).toBe(1);   // The Magician
    expect(LIFE_PATH_CARD[7]).toBe(7);   // The Chariot
    expect(LIFE_PATH_CARD[9]).toBe(9);   // The Hermit
    expect(LIFE_PATH_CARD[11]).toBe(11); // Justice
    expect(LIFE_PATH_CARD[22]).toBe(0);  // The Fool
    expect(LIFE_PATH_CARD[33]).toBe(6);  // 33 exceeds 22, reduces 3+3=6 -> The Lovers
  });
  it('arcanaForLifePath returns name + id', () => {
    expect(arcanaForLifePath(7)).toMatchObject({ id: 7, name: 'The Chariot' });
    expect(arcanaForLifePath(22)).toMatchObject({ id: 0, name: 'The Fool' });
  });
});

describe('ARCANA_ASTRO (Golden Dawn attributions)', () => {
  it('sign cards carry their sign', () => {
    expect(ARCANA_ASTRO[4]).toMatchObject({ kind: 'sign', sign: 'Aries' });      // Emperor
    expect(ARCANA_ASTRO[8]).toMatchObject({ kind: 'sign', sign: 'Leo' });        // Strength
    expect(ARCANA_ASTRO[18]).toMatchObject({ kind: 'sign', sign: 'Pisces' });    // The Moon
  });
  it('planet cards carry their planet', () => {
    expect(ARCANA_ASTRO[1]).toMatchObject({ kind: 'planet', planet: 'Mercury' }); // Magician
    expect(ARCANA_ASTRO[2]).toMatchObject({ kind: 'planet', planet: 'Moon' });    // High Priestess
    expect(ARCANA_ASTRO[21]).toMatchObject({ kind: 'planet', planet: 'Saturn' }); // The World
  });
  it('covers all 22 majors', () => {
    expect(Object.keys(ARCANA_ASTRO)).toHaveLength(22);
  });
});

describe('CENTER_CHAKRA (matches the app doctrine in correspondences.jsx)', () => {
  it('direct mappings', () => {
    expect(CENTER_CHAKRA.head).toBe('Crown');
    expect(CENTER_CHAKRA.ajna).toBe('Third Eye');
    expect(CENTER_CHAKRA.sacral).toBe('Sacral');
    expect(CENTER_CHAKRA.root).toBe('Root');
  });
  it('G center integrates heart and throat', () => {
    expect(CENTER_CHAKRA.g).toEqual(['Heart', 'Throat']);
  });
});

describe('GATE_WHEEL', () => {
  it('contains all 64 gates exactly once', () => {
    expect(GATE_WHEEL).toHaveLength(64);
    expect(new Set(GATE_WHEEL).size).toBe(64);
    expect(Math.min(...GATE_WHEEL)).toBe(1);
    expect(Math.max(...GATE_WHEEL)).toBe(64);
  });

  it('gate 41 sits at ~2 degrees Aquarius (start of the HD solar year)', () => {
    const deg = gateWheelDegree(41);
    const aquarius = signStartDegree('Aquarius'); // 300
    expect(deg).toBeGreaterThan(aquarius);
    expect(deg).toBeLessThan(aquarius + 6);
  });

  it('gate 25 straddles the Pisces/Aries boundary', () => {
    const deg = gateWheelDegree(25);
    expect(deg > 354 || deg < 4).toBe(true);
  });
});

describe('signStartDegree', () => {
  it('Aries 0, Cancer 90, Libra 180, Capricorn 270', () => {
    expect(signStartDegree('Aries')).toBe(0);
    expect(signStartDegree('Cancer')).toBe(90);
    expect(signStartDegree('Libra')).toBe(180);
    expect(signStartDegree('Capricorn')).toBe(270);
  });
});
