import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { weatherForScore, weatherIdForScore } from "./weather";

const ORB_SIZES = {
  hero: { width: "100%", height: "100%" },
  large: { width: "8rem", height: "8rem" },
  choice: { width: "2.75rem", height: "2.75rem" },
  tiny: { width: "1rem", height: "1rem" },
};

export default function WeatherOrb({ score, size = "large", selected = false, label }) {
  const reduced = useReducedMotion();
  const weather = weatherForScore(score);
  const spokenLabel = label || `${weather.label} inner weather`;

  return (
    <motion.span
      className={`weather-orb weather-orb--${size}`}
      data-weather={weatherIdForScore(score)}
      data-selected={selected ? "true" : undefined}
      role={label ? "img" : undefined}
      aria-label={label ? spokenLabel : undefined}
      aria-hidden={label ? undefined : "true"}
      style={ORB_SIZES[size] || ORB_SIZES.large}
      initial={false}
      animate={{ scale: selected && !reduced ? 1.06 : 1 }}
      transition={{ duration: reduced ? 0 : 0.22, ease: [0.22, 1, 0.36, 1] }}
    />
  );
}
