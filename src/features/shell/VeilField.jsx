import React from "react";

/**
 * Flowing translucent veils for sky-register surfaces.
 * intensity 0..1 scales the veil opacity; purely decorative.
 */
export default function VeilField({ intensity = 1 }) {
  const o = (base) => Math.min(1, base * intensity);
  return (
    <svg
      viewBox="0 0 900 380"
      preserveAspectRatio="none"
      aria-hidden="true"
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
    >
      <path
        d="M -20 300 C 200 240, 380 350, 600 280 S 860 220, 940 260 L 940 400 L -20 400 Z"
        fill={`rgba(255,252,246,${o(0.16)})`}
      />
      <path
        d="M -20 330 C 220 280, 400 380, 620 315 S 870 255, 940 295 L 940 400 L -20 400 Z"
        fill={`rgba(255,252,246,${o(0.2)})`}
      />
      <path
        d="M -20 90 C 180 130, 420 60, 640 105 S 880 150, 940 120"
        fill="none"
        stroke={`rgba(255,252,246,${o(0.5)})`}
        strokeWidth="1.2"
      />
    </svg>
  );
}
