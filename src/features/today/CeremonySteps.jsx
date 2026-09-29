import React from "react";
import PersonPicker from "@/features/people/PersonPicker";
import { Textarea } from "@/components/ui/textarea";
import { SCALE_WORDS, SCALE_ANCHORS } from "./vocab";
import VocabularyIcon from "./VocabularyIcon";

const cream = "var(--gh-cream)";
const creamSoft = "rgba(255,253,246,0.75)";

/** 1-10 tap dial with a large serif readout. One question per screen. */
export function ScaleStep({ field, question, value, onChange }) {
  const words = SCALE_WORDS[field] || [];
  const anchors = SCALE_ANCHORS[field];
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
      <div className="mt-6 grid grid-cols-5 sm:grid-cols-10 gap-1.5 max-w-xl" role="radiogroup" aria-label={question} aria-describedby={anchors ? `${field}-anchors` : undefined}>
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            aria-label={`${n} of 10`}
            onClick={() => onChange(n)}
            className="h-12 rounded-lg text-sm font-bold transition-transform"
            style={{
              background: value === n ? cream : "rgba(255,253,246,0.24)",
              color: value === n ? "var(--gh-accent)" : cream,
              border: `1px solid ${value != null && n <= value ? cream : "rgba(255,253,246,0.45)"}`,
              transform: value === n ? "translateY(-3px)" : "none",
            }}
          >
            {n}
          </button>
        ))}
      </div>
      {anchors && (
        <p id={`${field}-anchors`} className="mt-2 flex justify-between max-w-xl text-sm" style={{ color: creamSoft }}>
          <span>1 means {anchors[0]}</span><span>10 means {anchors[1]}</span>
        </p>
      )}
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
              className="min-h-11 inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-transform"
              style={{
                background: isOn ? cream : "rgba(255,253,246,0.14)",
                color: isOn ? "var(--gh-ink)" : cream,
                border: `1px solid ${isOn ? cream : "rgba(255,253,246,0.35)"}`,
                transform: isOn ? "translateY(-2px)" : "none",
              }}
            >
              <VocabularyIcon name={opt.icon} size={17} /> {opt.label}
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
          onChange={(e) => update({ description: e.target.value })}
          placeholder={kind === "high" ? "What lifted you today?" : "What weighed on you today?"}
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
          <div className="mt-2 grid grid-cols-5 sm:grid-cols-10 gap-1 max-w-md">
            {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                type="button"
                aria-label={`Intensity ${n}`}
                onClick={() => update({ intensity: n })}
                className="h-11 rounded-lg text-xs font-bold"
                style={{
                  background: value?.intensity === n ? cream : "rgba(255,253,246,0.24)",
                  color: value?.intensity === n ? "var(--gh-accent)" : cream,
                  border: "1px solid rgba(255,253,246,0.45)",
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
          onChange={(e) => onChange({ ...value, gratitude: e.target.value })}
          placeholder="One thing you're grateful for (optional)"
          className="min-h-16 bg-white/90 text-base"
          style={{ color: "var(--gh-ink)" }}
        />
        <Textarea
          value={value.notes || ""}
          onChange={(e) => onChange({ ...value, notes: e.target.value })}
          placeholder="Reflections, dreams, loose threads (optional)"
          className="min-h-24 bg-white/90 text-base"
          style={{ color: "var(--gh-ink)" }}
        />
      </div>
    </div>
  );
}
