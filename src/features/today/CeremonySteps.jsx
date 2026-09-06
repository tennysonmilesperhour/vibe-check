import React from "react";
import PersonPicker from "@/features/people/PersonPicker";
import { Textarea } from "@/components/ui/textarea";
import { SCALE_WORDS } from "./vocab";
import WeatherOrb from "./WeatherOrb";
import { WEATHER_STATES, weatherForScore } from "./weather";

const cream = "var(--gh-cream)";
const creamSoft = "rgba(255,253,246,0.75)";

/** Five legible weather states stored on the existing ten-point mood scale. */
export function WeatherStep({ value, onChange }) {
  const selected = value == null ? null : weatherForScore(value);

  return (
    <div className="weather-step">
      <p className="text-sm" style={{ color: creamSoft }}>Your inner weather</p>
      <h1 className="mt-2 text-4xl md:text-6xl" style={{ color: cream, maxWidth: "14ch", lineHeight: 0.98 }}>
        What was the atmosphere inside you today?
      </h1>
      <p className="mt-4 max-w-md text-sm" style={{ color: creamSoft }}>
        Choose the sky that feels closest. It does not have to be exact.
      </p>
      <div className="weather-choices mt-8" role="radiogroup" aria-label="Choose today's inner weather">
        {WEATHER_STATES.map((weather) => {
          const isSelected = selected?.id === weather.id;
          return (
            <button
              key={weather.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => onChange(weather.score)}
              className="weather-choice"
            >
              <WeatherOrb score={weather.score} size="choice" selected={isSelected} />
              <span>{weather.label}</span>
            </button>
          );
        })}
      </div>
      <p className="mt-5 min-h-5 text-sm" aria-live="polite" style={{ color: cream }}>
        {selected ? selected.description : ""}
      </p>
    </div>
  );
}

/** 1-10 tap dial with a large serif readout. One question per screen. */
export function ScaleStep({ field, question, value, onChange }) {
  const words = SCALE_WORDS[field] || [];
  return (
    <div>
      <h1 className="text-4xl md:text-6xl" style={{ color: cream, maxWidth: "14ch", lineHeight: 0.98 }}>
        {question}
      </h1>
      <div className="mt-10 flex items-end gap-4">
        <span className="font-display" style={{ fontSize: "5.5rem", lineHeight: 1, color: cream }}>
          {value ?? "–"}
        </span>
        {value != null && (
          <span className="pb-3 text-lg" style={{ color: creamSoft }}>{words[value]}</span>
        )}
      </div>
      <div className="mt-6 grid grid-cols-5 sm:grid-cols-10 gap-1.5 max-w-xl" role="radiogroup" aria-label={question}>
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            aria-label={`${n} of 10`}
            onClick={() => onChange(n)}
            className="h-12 text-sm font-bold transition-transform"
            style={{
              background: value === n ? cream : "rgba(255,253,246,0.18)",
              color: value === n ? "var(--gh-accent)" : cream,
              border: `1px solid ${value != null && n <= value ? creamSoft : "rgba(255,253,246,0.3)"}`,
              transform: value === n ? "translateY(-3px)" : "none",
            }}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Multi-select chip grid (emotions / activities). */
export function ChipsStep({ question, hint, options, selected, onToggle }) {
  return (
    <div>
      <h1 className="text-4xl md:text-6xl" style={{ color: cream, maxWidth: "14ch", lineHeight: 0.98 }}>
        {question}
      </h1>
      {hint && <p className="mt-3 text-sm" style={{ color: creamSoft }}>{hint}</p>}
      <div className="mt-8 flex flex-wrap gap-2 max-w-2xl">
        {options.map((opt) => {
          const isOn = selected.includes(opt.label);
          return (
            <button
              key={opt.label}
              type="button"
              aria-pressed={isOn}
              onClick={() => onToggle(opt.label)}
              className="min-h-11 px-4 py-2.5 text-sm font-medium transition-transform"
              style={{
                background: isOn ? cream : "rgba(255,253,246,0.14)",
                color: isOn ? "var(--gh-ink)" : cream,
                border: `1px solid ${isOn ? cream : "rgba(255,253,246,0.35)"}`,
                transform: isOn ? "translateY(-2px)" : "none",
              }}
            >
              <span aria-hidden="true">{opt.emoji}</span> {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Optional high/low moment: description + people + intensity. */
export function MomentStep({ kind, question, value, onChange }) {
  const update = (patch) => onChange({ ...(value || {}), ...patch });
  return (
    <div>
      <h1 className="text-4xl md:text-6xl" style={{ color: cream, maxWidth: "14ch", lineHeight: 0.98 }}>
        {question}
      </h1>
      <p className="mt-3 text-sm" style={{ color: creamSoft }}>Optional. Skip if nothing stands out.</p>
      <div className="mt-8 max-w-xl space-y-4">
        <Textarea
          value={value?.description || ""}
          maxLength={1000}
          onChange={(e) => update({ description: e.target.value })}
          placeholder={kind === "high" ? "What lifted you today?" : "What weighed on you today?"}
          aria-label={kind === "high" ? "Describe today's high point" : "Describe today's hardest moment"}
          className="min-h-24 bg-white/90 text-base"
          style={{ color: "var(--gh-ink)" }}
        />
        <div className="bg-white/90 p-1">
          <PersonPicker
            value={value?.person_ids || []}
            onChange={(ids) => update({ person_ids: ids })}
            placeholder="Anyone involved?"
          />
        </div>
        <div>
          <span className="text-sm" style={{ color: creamSoft }}>How strongly did it land? {value?.intensity || "–"}/10</span>
          <div className="mt-2 grid grid-cols-5 sm:grid-cols-10 gap-1.5 max-w-md" role="radiogroup" aria-label="Moment intensity">
            {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={value?.intensity === n}
                aria-label={`Intensity ${n}`}
                onClick={() => update({ intensity: n })}
                className="h-11 text-sm font-bold"
                style={{
                  background: value?.intensity === n ? cream : "rgba(255,253,246,0.18)",
                  color: value?.intensity === n ? "var(--gh-accent)" : cream,
                  border: "1px solid rgba(255,253,246,0.3)",
                }}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Free reflection + gratitude, the closing breath of the ceremony. */
export function ReflectionStep({ value, onChange }) {
  return (
    <div>
      <h1 className="text-4xl md:text-6xl" style={{ color: cream, maxWidth: "14ch", lineHeight: 0.98 }}>
        Anything else the day should remember?
      </h1>
      <div className="mt-8 max-w-xl space-y-4">
        <Textarea
          value={value.gratitude || ""}
          maxLength={500}
          onChange={(e) => onChange({ ...value, gratitude: e.target.value })}
          placeholder="One thing you're grateful for (optional)"
          aria-label="Gratitude, optional"
          className="min-h-16 bg-white/90 text-base"
          style={{ color: "var(--gh-ink)" }}
        />
        <Textarea
          value={value.notes || ""}
          maxLength={4000}
          onChange={(e) => onChange({ ...value, notes: e.target.value })}
          placeholder="Reflections, dreams, loose threads (optional)"
          aria-label="Additional reflection, optional"
          className="min-h-24 bg-white/90 text-base"
          style={{ color: "var(--gh-ink)" }}
        />
      </div>
    </div>
  );
}
