import React from "react";
import VeilField from "./VeilField";

/**
 * Sky-register surface: the twilight gradient, a low sun still burning
 * off to one side, the first stars above it, flowing veils, and a little
 * grain over everything so the washes are not perfectly smooth.
 *
 * `depth` 1..4 pulls more night across the sky (the ceremony steps).
 * `showStars` can be turned off for short surfaces where a starfield
 * reads as noise rather than sky.
 */
export default function SkyField({
  depth = 1,
  showSun = true,
  showStars = true,
  veilIntensity = 1,
  className = "",
  children,
}) {
  return (
    <div
      className={`sky-surface relative overflow-hidden ${className}`}
      data-depth={depth > 1 ? String(Math.min(depth, 4)) : undefined}
    >
      {showStars && <div aria-hidden="true" className="starfield starfield--fade" />}

      {showSun && (
        <>
          {/* The sun's own disc of light, low and to the right. */}
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              right: "-70px",
              top: "36%",
              width: "340px",
              height: "340px",
              borderRadius: "50%",
              pointerEvents: "none",
              background:
                "radial-gradient(circle, rgba(255,244,214,0.95) 0%, rgba(255,238,190,0.45) 40%, transparent 70%)",
            }}
          />
          {/* A wider, fainter halo so the glow falls off gradually
              instead of ending at the edge of the disc. */}
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              right: "-220px",
              top: "18%",
              width: "680px",
              height: "680px",
              borderRadius: "50%",
              pointerEvents: "none",
              background:
                "radial-gradient(circle, rgba(255,236,196,0.30) 0%, rgba(255,226,178,0.12) 45%, transparent 72%)",
            }}
          />
        </>
      )}

      <VeilField intensity={veilIntensity} />
      <div aria-hidden="true" className="grain-layer" />
      <div className="relative">{children}</div>
    </div>
  );
}
