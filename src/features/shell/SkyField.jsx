import React from "react";
import VeilField from "./VeilField";

/**
 * Sky-register surface: the golden hour gradient, a soft sun glow,
 * and flowing veils. `depth` 1..4 deepens the gradient (ceremony steps).
 */
export default function SkyField({ depth = 1, showSun = true, veilIntensity = 1, className = "", children }) {
  return (
    <div className={`sky-surface relative overflow-hidden ${className}`} data-depth={depth > 1 ? String(Math.min(depth, 4)) : undefined}>
      {showSun && (
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
      )}
      <VeilField intensity={veilIntensity} />
      <div className="relative">{children}</div>
    </div>
  );
}
