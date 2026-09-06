import React from "react";
import VeilField from "./VeilField";
import WeatherOrb from "@/features/today/WeatherOrb";
import { weatherIdForScore } from "@/features/today/weather";

/**
 * Sky-register surface: the golden hour gradient, a soft sun glow,
 * and flowing veils. `depth` 1..4 deepens the gradient (ceremony steps).
 */
export default function SkyField({ depth = 1, moodScore = null, showSun = true, veilIntensity = 1, showVeilLine = true, className = "", children }) {
  return (
    <div
      className={`sky-surface relative overflow-hidden ${className}`}
      data-depth={depth > 1 ? String(Math.min(depth, 4)) : undefined}
      data-weather={weatherIdForScore(moodScore)}
    >
      {showSun && (
        <div className="weather-orb-stage" aria-hidden="true">
          <WeatherOrb score={moodScore} size="hero" />
        </div>
      )}
      <VeilField intensity={veilIntensity} showLine={showVeilLine} />
      <div className="relative">{children}</div>
    </div>
  );
}
