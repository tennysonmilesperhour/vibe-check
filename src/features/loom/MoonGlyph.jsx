import React from "react";

/**
 * A small vector moon that draws the actual phase — no emoji. The lit region is
 * a semicircle (the fully-lit hemisphere) closed by the terminator, a
 * half-ellipse whose width encodes crescent vs. gibbous. Works in light/dark and
 * survives the html2canvas "Save your Loom" export, which emoji do not.
 */
export default function MoonGlyph({ name = "", illumination = 0, size = 15, color = "currentColor" }) {
  const r = size / 2;
  const illum = Math.max(0, Math.min(1, illumination));
  const waxing = /waxing|first quarter/i.test(name);
  const crescent = illum < 0.5;
  const rx = r * Math.abs(1 - 2 * illum); // terminator half-width: 0 at quarter, r at new/full

  let litPath = null;
  if (illum > 0.01) {
    // Outer outline runs down the lit hemisphere; the terminator arcs back up.
    // Sweep flags follow SVG's y-down (clockwise = 1) convention.
    const outer = waxing ? 1 : 0;
    const inner = waxing ? (crescent ? 0 : 1) : (crescent ? 1 : 0);
    litPath = `M 0 ${-r} A ${r} ${r} 0 0 ${outer} 0 ${r} A ${rx} ${r} 0 0 ${inner} 0 ${-r} Z`;
  }

  return (
    <svg
      width={size} height={size}
      viewBox={`${-r} ${-r} ${size} ${size}`}
      aria-hidden="true"
      style={{ display: "inline-block", verticalAlign: "-0.15em" }}
    >
      <circle cx="0" cy="0" r={r - 0.5} fill="none" stroke={color} strokeWidth="1" opacity="0.55" />
      {litPath && <path d={litPath} fill={color} />}
    </svg>
  );
}
