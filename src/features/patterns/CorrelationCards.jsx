import React, { useMemo } from "react";
import { insightCards } from "@/lib/correlations";

/** Locally computed insight cards. No button, no LLM, no waiting. */
export default function CorrelationCards({ checkIns, people }) {
  const cards = useMemo(() => insightCards(checkIns, people), [checkIns, people]);

  if (cards.length === 0) return null;

  return (
    <section aria-labelledby="insights-heading">
      <div className="field-notes__heading">
        <h2 id="insights-heading" className="text-2xl" style={{ color: "var(--gh-ink)" }}>Field notes</h2>
        <p>Computed on your device from repeated signals.</p>
      </div>
      <div className="field-notes mt-4">
        {cards.map((card, i) => (
          <article key={`${card.kind}-${i}`}>
            <span aria-hidden="true">✦</span>
            <p>{card.text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
