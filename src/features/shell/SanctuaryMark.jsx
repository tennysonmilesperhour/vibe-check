import React from "react";
import { BREATH_VIEWBOX, breathPaths } from "@/brand/breath";

/** B1 / Breath. Small placements retain the same silhouette with fewer waves. */
export default function SanctuaryMark({ className = "", size = 48 }) {
  const detail = size <= 24 ? "tiny" : size <= 64 ? "compact" : "full";
  return (
    <svg viewBox={BREATH_VIEWBOX} width={size} height={size}
      className={`brand-mark ${className}`} fill="none" strokeLinecap="round"
      strokeLinejoin="round" aria-hidden="true" focusable="false">
      {breathPaths(detail).map(({ d, ink, width }) => (
        <path key={d} d={d} stroke={`var(--brand-${ink})`} strokeWidth={width} />
      ))}
    </svg>
  );
}
