import React, { useMemo } from "react";
import { insightCards } from "@/lib/correlations";
import { Sparkle } from "lucide-react";

/** Locally computed insight cards. No button, no LLM, no waiting. */
export default function CorrelationCards({ checkIns, people }) {
  const cards = useMemo(() => insightCards(checkIns, people), [checkIns, people]);

  if (cards.length === 0) return null;

  return (
    <section aria-labelledby="insights-heading">
      <h2 id="insights-heading" className="text-2xl" style={{ color: "var(--gh-ink)" }}>
        What the data keeps saying
      </h2>
      <div className="grid sm:grid-cols-2 gap-3 mt-4">
        {cards.map((card, i) => (
          <div
            key={`${card.kind}-${i}`}
            className="flex gap-3 p-4"
            style={{ background: "var(--gh-cream)", border: "1px solid hsl(var(--border))" }}
          >
            <Sparkle className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "var(--gh-accent)" }} aria-hidden="true" />
            <p className="text-sm" style={{ color: "var(--gh-ink)" }}>{card.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
