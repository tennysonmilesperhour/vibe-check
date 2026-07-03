import React from "react";
import { EMOTIONS } from "./vocab";
import { Pencil } from "lucide-react";

const emojiFor = (label) => EMOTIONS.find((e) => e.label === label)?.emoji || "";

/** Field-register summary of today's saved entry. */
export default function TodaySummary({ entry, onEdit }) {
  const scores = [
    { label: "MOOD", value: entry.mood_score },
    { label: "ENERGY", value: entry.energy_level },
    { label: "SLEEP", value: entry.sleep_quality },
  ];
  return (
    <section aria-labelledby="today-summary-heading">
      <div className="flex items-end justify-between">
        <h2 id="today-summary-heading" className="text-3xl" style={{ color: "var(--gh-ink)" }}>
          Today, kept
        </h2>
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex items-center gap-1.5 text-sm font-medium"
          style={{ color: "var(--gh-accent)" }}
        >
          <Pencil className="w-3.5 h-3.5" aria-hidden="true" /> Revisit today
        </button>
      </div>

      <div className="flex mt-4">
        {scores.map((s, i) => (
          <div key={s.label} className={`flex-1 hairline pt-3 ${i > 0 ? "pl-4" : ""} ${i < 2 ? "pr-4" : ""}`}>
            <div className="text-xs font-bold tracking-wide" style={{ color: "var(--gh-ink-muted)" }}>{s.label}</div>
            <div className="font-display text-3xl" style={{ color: "var(--gh-ink)" }}>{s.value ?? "–"}<span className="text-base" style={{ color: "var(--gh-ink-muted)" }}>/10</span></div>
          </div>
        ))}
      </div>

      {entry.emotions?.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {entry.emotions.map((label) => (
            <span key={label} className="px-2.5 py-1 text-xs font-medium" style={{ background: "var(--gh-cream)", border: "1px solid hsl(var(--border))", color: "var(--gh-ink-soft)" }}>
              <span aria-hidden="true">{emojiFor(label)}</span> {label}
            </span>
          ))}
        </div>
      )}

      {(entry.gratitude || entry.high_moment?.description) && (
        <p className="mt-4 text-sm max-w-prose" style={{ color: "var(--gh-ink-soft)" }}>
          {entry.gratitude || entry.high_moment.description}
        </p>
      )}
    </section>
  );
}
