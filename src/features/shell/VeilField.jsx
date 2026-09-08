import React from "react";

/** A small constellation: nodes, and the lines someone drew between them.
 *  Coordinates live in its own 240×140 box — it is drawn in a second,
 *  un-stretched SVG so the stars stay round however the surface scales. */
const CONSTELLATION = {
  points: [
    [28, 30],
    [82, 64],
    [137, 38],
    [125, 96],
    [192, 80],
  ],
  // index pairs into `points`
  edges: [
    [0, 1],
    [1, 2],
    [1, 3],
    [3, 4],
  ],
};

/**
 * Flowing translucent veils for sky-register surfaces, plus a drawn
 * constellation up where the stars are. Purely decorative.
 * `intensity` 0..1 scales everything's opacity together.
 */
export default function VeilField({ intensity = 1 }) {
  const o = (base) => Math.min(1, base * intensity);
  const cream = (a) => `rgba(255,252,246,${o(a)})`;

  return (
    <>
    <svg
      viewBox="0 0 900 380"
      preserveAspectRatio="none"
      aria-hidden="true"
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
    >
      {/* ── the veils along the bottom, layered front to back ── */}
      <path
        d="M -20 300 C 200 240, 380 350, 600 280 S 860 220, 940 260 L 940 400 L -20 400 Z"
        fill={cream(0.16)}
      />
      <path
        d="M -20 330 C 220 280, 400 380, 620 315 S 870 255, 940 295 L 940 400 L -20 400 Z"
        fill={cream(0.2)}
      />
      {/* A third, shallower veil adds one more fold of depth. */}
      <path
        d="M -20 356 C 240 322, 430 392, 650 344 S 880 300, 940 330 L 940 400 L -20 400 Z"
        fill={cream(0.14)}
      />

      {/* ── drifting threads across the sky ── */}
      <path
        d="M -20 90 C 180 130, 420 60, 640 105 S 880 150, 940 120"
        fill="none"
        stroke={cream(0.5)}
        strokeWidth="1.2"
      />
      <path
        d="M -20 158 C 220 196, 460 132, 690 170 S 890 196, 940 180"
        fill="none"
        stroke={cream(0.24)}
        strokeWidth="0.9"
      />

    </svg>

    {/* ── the constellation, drawn round ──
        Its own SVG so the veils above can keep stretching to fill the
        surface while these stars keep their proportions. */}
    <svg
      viewBox="0 0 240 140"
      aria-hidden="true"
      style={{
        position: "absolute",
        top: "7%",
        right: "6%",
        width: "min(240px, 30%)",
        height: "auto",
        pointerEvents: "none",
      }}
    >
      {CONSTELLATION.edges.map(([a, b]) => {
        const [x1, y1] = CONSTELLATION.points[a];
        const [x2, y2] = CONSTELLATION.points[b];
        return (
          <line
            key={`${a}-${b}`}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={cream(0.34)}
            strokeWidth="0.8"
          />
        );
      })}
      {CONSTELLATION.points.map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r={i === 1 ? 2.6 : 1.8} fill={cream(0.85)} />
      ))}
    </svg>
    </>
  );
}
