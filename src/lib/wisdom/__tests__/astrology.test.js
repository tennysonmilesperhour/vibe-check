import { describe, it, expect } from 'vitest';
import { astrologyReading, astrologyPlacements, astrologyAspects, astrologyPeriodWisdom } from '../astrology';
import { periodWisdom, synergyReading } from '../readings';
import { PLANETS } from '../content/astrology';
import { deriveAstrology } from '@/lib/resonance/astrology';
import { deriveAll } from '@/lib/resonance/derive';
import { resonanceGraph } from '@/lib/resonance/graph';
import { parseLocalDate } from '@/lib/dates';

const computed = deriveAstrology('1990-07-15');
describe('astrology chart reading', () => {
  it('reads every supported placement, with a verified house and aspect', () => {
    const data = { ...Object.fromEntries(PLANETS.map(p => [p.key, 'Libra'])), venus_house: '7', aspects: [{ planet_a: 'venus', aspect: 'square', planet_b: 'saturn' }] };
    const reading = astrologyReading(data, computed);
    for (const p of PLANETS) expect(reading).toContain(`${p.label} in Libra`);
    expect(reading).toContain('House 7');
    expect(reading).toContain('VENUS SQUARE SATURN');
    expect(reading).toContain('chart entry');
    expect(reading).toContain('generation');
    expect(reading).toContain('I am Tobacco');
    expect(reading).toContain('No placement makes mistreatment necessary');
  });
  it('does not invent unknown planets, houses, or aspects from a Sun sign', () => {
    const reading = astrologyReading({}, computed);
    expect(reading).toContain('Sun in Cancer (date estimate)');
    expect(reading).not.toMatch(/Moon in |House [1-9]|ENTERED ASPECT/);
    expect(reading).toContain('no calculated transits');
  });
  it('keeps entered Sun overrides and unknown selections consistent with the graph', () => {
    const data = { sun_sign: 'Leo', sun_source: 'entered' };
    expect(astrologyPlacements(data, computed)[0].sign).toBe('Leo');
    expect(astrologyPlacements({ ...data, sun_source: 'date_estimate' }, computed)[0].sign).toBe('Cancer');
    const unknown = { birth_date: '1990-07-15', enabled_systems: ['astrology'], astrology: { sun_sign: '', sun_source: 'unknown' } };
    expect(astrologyPlacements(unknown.astrology, computed)).toEqual([]);
    expect(resonanceGraph(unknown, '2026-09-08').nodes.some(n => n.id === 'astrology.sun')).toBe(false);
    expect(deriveAll({ ...unknown, astrology: data }, '2026-09-08').conflicts).toEqual([]);
  });
  it('preserves uncertainty about saved Sun provenance', () => {
    expect(astrologyPlacements({ sun_sign: 'Cancer' }, computed)[0].source).toBe('source unconfirmed');
    expect(astrologyReading({ sun_sign: 'Cancer' }, computed)).toContain('may have been estimated by an earlier version');
    expect(astrologyPlacements({ sun_sign: 'Cancer', sun_source: 'entered' }, computed)[0].source).toBe('entered');
    expect(astrologyPlacements({ sun_sign: 'Cancer', sun_source: 'unknown' }, computed)).toEqual([]);
  });
  it('ignores invalid signs, malformed houses, and incomplete or duplicate aspects', () => {
    const data = { sun_sign: 'Not a sign', moon_sign: 'constructor', venus_sign: 'Taurus', venus_house: '1.5', aspects: [null, { planet_a: 'sun', planet_b: 'sun', aspect: 'square' }, { planet_a: 'sun', planet_b: 'moon', aspect: 'invented' }, { planet_a: 'sun', planet_b: 'moon', aspect: 'trine' }, { planet_a: 'moon', planet_b: 'sun', aspect: 'trine' }] };
    const placements = astrologyPlacements(data, computed);
    expect(placements).toHaveLength(1);
    expect(placements[0].house).toBeNull();
    expect(astrologyAspects(data)).toHaveLength(1);
    expect(() => astrologyReading(data, computed)).not.toThrow();
    expect(astrologyAspects({ aspects: {} })).toEqual([]);
  });
  it('reads a valid aspect even when all signs are unknown', () => {
    const reading = astrologyReading({ sun_source: 'unknown', aspects: [{ planet_a: 'sun', planet_b: 'moon', aspect: 'trine' }] }, computed);
    expect(reading).toContain('SUN TRINE MOON');
    expect(reading).toContain('No signs entered');
    expect(reading).not.toContain('Sun in Cancer');
  });
  it('updates the reading when placements change', () => {
    expect(astrologyReading({ venus_sign: 'Taurus' })).toContain('Venus in Taurus');
    const updated = astrologyReading({ venus_sign: 'Scorpio' });
    expect(updated).toContain('Venus in Scorpio');
    expect(updated).not.toContain('Venus in Taurus');
  });
  it('rejects impossible calendar dates before estimating signs', () => {
    for (const date of ['2026-02-30', '2026-00-12', '2026-13-01', '2026-01-00']) expect(deriveAstrology(date).sun_sign).toBeNull();
    expect(deriveAstrology('2024-02-29').sun_sign).toBe('Pisces');
  });
});

describe('astrology over time', () => {
  const profile = { birth_date: '1990-07-15', enabled_systems: ['astrology'], astrology: { sun_sign: 'Cancer' } };
  for (const period of ['daily', 'weekly', 'monthly', 'yearly']) {
    it(`makes the ${period} reflection explicit about its natal basis`, () => {
      const reflection = periodWisdom(period, profile);
      expect(reflection.basis).toContain('rotating natal reflection');
      expect(reflection.wisdom).toContain('I am Tobacco');
      expect(reflection.wisdom).not.toMatch(/Life Path|personal day|personal month|personal year/i);
      expect(reflection.contemplation).toContain('choice');
    });
  }
  it('does not read disabled astrology or numerology from leftover profile data', () => {
    const reflection = periodWisdom('daily', { ...profile, enabled_systems: ['chakras'] }, { today: { moonPhase: { name: 'Full Moon' } } });
    expect(reflection.wisdom).not.toMatch(/Cancer|Moon|personal day/i);
    expect(reflection.basis).toBeUndefined();
  });
  it('respects disabled astrology in relationship readings even with stored birth dates', () => {
    const reading = synergyReading({ ...profile, enabled_systems: [] }, { birth_date: '1990-03-30', astrology: { sun_sign: 'Aries' } }, 'A friend');
    expect(reading).not.toMatch(/Cancer|Aries|Your.*Sun/);
  });
  it('uses a stable focus within the same week', () => {
    const data = { sun_sign: 'Cancer', moon_sign: 'Scorpio', mars_sign: 'Gemini' };
    expect(astrologyPeriodWisdom('weekly', data, {}, parseLocalDate('2026-09-08'))).toEqual(astrologyPeriodWisdom('weekly', data, {}, parseLocalDate('2026-09-10')));
  });
  it('does not infer relationship quality from shared or different elements', () => {
    for (const sign of ['Cancer', 'Capricorn', 'Aries']) {
      const reading = synergyReading(profile, { astrology: { sun_sign: sign } }, 'A friend');
      expect(reading).toContain('cannot establish compatibility');
      expect(reading).toContain('no symbolic reading obliges you to stay');
      expect(reading).not.toMatch(/naturally nourishing|instinctive understanding|misreads are common/);
    }
  });
});
