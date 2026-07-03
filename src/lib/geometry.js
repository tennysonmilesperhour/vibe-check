// Shared SVG geometry vocabulary for the Loom, tarot cards, and mandalas.
// Convention: angles in degrees, 0 = 12 o'clock, increasing clockwise
// (matches the pre-existing CardGeometry convention).

const DEG = Math.PI / 180;

/** [x, y] on a circle. 0deg = straight up, clockwise positive. */
export function polar(cx, cy, r, angleDeg) {
  const a = (angleDeg - 90) * DEG;
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
}

/** n points evenly spaced around a circle, starting at startDeg. */
export function ringPoints(cx, cy, r, n, startDeg = 0) {
  return Array.from({ length: n }, (_, i) => polar(cx, cy, r, startDeg + (i * 360) / n));
}

/** 2n alternating outer/inner points (classic star polygon). */
export function starPoints(cx, cy, rOuter, rInner, n) {
  return Array.from({ length: n * 2 }, (_, i) => {
    const r = i % 2 === 0 ? rOuter : rInner;
    return polar(cx, cy, r, (i * 180) / n);
  });
}

/** SVG path arc from angle a1 to a2 on a circle (short way when |a2-a1| <= 180). */
export function arcPath(cx, cy, r, a1, a2) {
  const [x1, y1] = polar(cx, cy, r, a1);
  const [x2, y2] = polar(cx, cy, r, a2);
  const large = Math.abs(a2 - a1) > 180 ? 1 : 0;
  const sweep = a2 > a1 ? 1 : 0;
  return `M ${x1} ${y1} A ${r} ${r} 0 ${large} ${sweep} ${x2} ${y2}`;
}

/** Serialize [[x,y],...] for <polygon points>. */
export function pts(arr) {
  return arr.map(([x, y]) => `${x},${y}`).join(' ');
}

/**
 * Zodiac wheel mapping for the Loom.
 * Input: absolute ecliptic degree, 0 = 0° Aries, increasing through the signs.
 * Output: our polar() angle. Astro charts put 0° Aries at the LEFT (ascendant
 * axis) and run counterclockwise; under the 12-o'clock-clockwise polar
 * convention that is angle 270 minus the ecliptic degree.
 */
export function degToWheel(eclipticDeg) {
  return (270 - eclipticDeg + 360) % 360;
}
