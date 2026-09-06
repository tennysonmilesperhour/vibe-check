import React from "react";
import { weatherForScore } from "./weather";

/** A compact visual fingerprint made from the day's recorded values. */
export default function DailySigil({ entry, size = 112, light = false }) {
  if (!entry) return null;
  const weather = weatherForScore(entry.mood_score);
  const energy = Number(entry.energy_level ?? 5);
  const sleep = Number(entry.sleep_quality ?? 5);
  const emotionCount = Math.min(entry.emotions?.length || 0, 8);
  const activityCount = Math.min(entry.activities?.length || 0, 8);
  const center = size / 2;
  const ink = light ? "var(--gh-ink)" : "var(--gh-cream)";
  const muted = light ? "rgba(90,36,48,0.28)" : "rgba(255,253,246,0.28)";

  return (
    <svg
      className="daily-sigil"
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label={`${weather.label} day sigil, mood ${entry.mood_score}, energy ${energy}, sleep ${sleep}`}
    >
      <circle cx={center} cy={center} r={center - 5} fill="none" stroke={muted} />
      <circle cx={center} cy={center} r={18 + energy * 1.7} fill="none" stroke={ink} strokeWidth="1.5" opacity="0.8" />
      <circle cx={center} cy={center} r={7 + sleep * 1.2} fill="var(--weather-orb-core, #efb373)" opacity="0.92" />
      <path d={`M ${center - 30} ${center + 28} Q ${center} ${center + 18 - energy} ${center + 30} ${center + 28}`} fill="none" stroke={ink} strokeWidth="1.5" />
      {Array.from({ length: emotionCount }, (_, index) => {
        const angle = (Math.PI * 2 * index) / Math.max(emotionCount, 1) - Math.PI / 2;
        return <circle key={`emotion-${index}`} cx={center + Math.cos(angle) * 43} cy={center + Math.sin(angle) * 43} r="2.5" fill={ink} />;
      })}
      {Array.from({ length: activityCount }, (_, index) => (
        <line key={`activity-${index}`} x1={23 + index * 9} y1={size - 14} x2={23 + index * 9} y2={size - 9 - (index % 2) * 3} stroke={ink} strokeWidth="1.5" />
      ))}
    </svg>
  );
}

