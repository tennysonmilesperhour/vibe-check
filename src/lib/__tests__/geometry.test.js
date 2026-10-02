import { describe, it, expect } from 'vitest';
import { polar, ringPoints, starPoints, pts, degToWheel } from '../geometry.js';

const close = (a, b) => Math.abs(a - b) < 1e-9;

describe('polar', () => {
  it('0deg points straight up (12 o clock convention)', () => {
    const [x, y] = polar(0, 0, 1, 0);
    expect(close(x, 0)).toBe(true);
    expect(close(y, -1)).toBe(true);
  });
  it('90deg points right', () => {
    const [x, y] = polar(0, 0, 1, 90);
    expect(close(x, 1)).toBe(true);
    expect(close(y, 0)).toBe(true);
  });
  it('offsets by center', () => {
    const [x, y] = polar(10, 20, 1, 90);
    expect(close(x, 11)).toBe(true);
    expect(close(y, 20)).toBe(true);
  });
});

describe('ringPoints', () => {
  it('returns n evenly spaced points on the circle', () => {
    const points = ringPoints(0, 0, 5, 6);
    expect(points).toHaveLength(6);
    for (const [x, y] of points) {
      expect(close(Math.hypot(x, y), 5)).toBe(true);
    }
  });
});

describe('starPoints', () => {
  it('alternates outer/inner radii, 2n points', () => {
    const points = starPoints(0, 0, 2, 1, 5);
    expect(points).toHaveLength(10);
    expect(close(Math.hypot(...points[0]), 2)).toBe(true);
    expect(close(Math.hypot(...points[1]), 1)).toBe(true);
  });
});

describe('pts', () => {
  it('serializes point arrays for SVG polygon', () => {
    expect(pts([[1, 2], [3, 4]])).toBe('1,2 3,4');
  });
});

describe('degToWheel', () => {
  it('maps zodiac degree (0=Aries start) to SVG angle with Aries at 9 o clock going counterclockwise', () => {
    // Convention chosen for the Loom: 0° Aries at the left (180 in SVG terms), advancing counterclockwise.
    expect(close(degToWheel(0), 270)).toBe(true);   // 0 Aries -> SVG 270 (pointing left under 12-o'clock polar)
    expect(close(degToWheel(90), 180)).toBe(true);  // 0 Cancer -> bottom
  });
});
