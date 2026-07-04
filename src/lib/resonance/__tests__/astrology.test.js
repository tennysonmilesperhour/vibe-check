import { describe, it, expect } from 'vitest';
import { sunSign, signAttributes, sunDecan, decanRuler, deriveAstrology } from '../astrology.js';

describe('sunSign', () => {
  it('maps dates to tropical signs', () => {
    expect(sunSign('1990-07-15')).toBe('Cancer');
    expect(sunSign('1990-03-21')).toBe('Aries');    // boundary start
    expect(sunSign('1990-04-19')).toBe('Aries');    // boundary end
    expect(sunSign('1990-04-20')).toBe('Taurus');
    expect(sunSign('1990-12-25')).toBe('Capricorn'); // year-crossing sign
    expect(sunSign('1990-01-10')).toBe('Capricorn');
    expect(sunSign('1990-02-28')).toBe('Pisces');
  });
  it('is null without a valid date', () => {
    expect(sunSign(null)).toBeNull();
    expect(sunSign('not-a-date')).toBeNull();
  });
});

describe('signAttributes', () => {
  it('carries element / modality / polarity / ruler', () => {
    expect(signAttributes('Aries')).toEqual({ element: 'Fire', modality: 'Cardinal', polarity: 'Yang', ruler: 'Mars' });
    expect(signAttributes('Cancer')).toEqual({ element: 'Water', modality: 'Cardinal', polarity: 'Yin', ruler: 'Moon' });
    expect(signAttributes('Aquarius').ruler).toBe('Uranus'); // modern rulership
  });
  it('is null for a non-sign', () => {
    expect(signAttributes('Ophiuchus')).toBeNull();
  });
});

describe('decans', () => {
  it('first days of a sign are the 1st decan, ruled by the sign itself', () => {
    expect(sunDecan('1990-03-21')).toBe(1);
    expect(decanRuler('Aries', 1)).toBe('Mars');
  });
  it('later days move into the 2nd/3rd decan of the same triplicity', () => {
    expect(sunDecan('1990-04-18')).toBe(3);       // late Aries
    expect(decanRuler('Aries', 2)).toBe('Sun');   // Leo sub-ruler
    expect(decanRuler('Aries', 3)).toBe('Jupiter'); // Sagittarius sub-ruler
  });
});

describe('deriveAstrology', () => {
  it('bundles everything derivable from the date', () => {
    const a = deriveAstrology('1990-07-15');
    expect(a.sun_sign).toBe('Cancer');
    expect(a.element).toBe('Water');
    expect(a.modality).toBe('Cardinal');
    expect(a.polarity).toBe('Yin');
    expect(a.ruler).toBe('Moon');
    expect([1, 2, 3]).toContain(a.decan);
    expect(a.decan_ruler).toBeTruthy();
  });
  it('degrades to nulls without a date', () => {
    expect(deriveAstrology(null).sun_sign).toBeNull();
    expect(deriveAstrology(null).element).toBeNull();
  });
});
