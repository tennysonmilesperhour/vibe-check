import React from "react";
import { useSearchParamState } from "@/lib/deeplink";
import TarotTable from "@/features/practice/TarotTable";
import HealingBoard from "./HealingBoard";
import SomaticPractice from '@/features/practice/SomaticPractice';

/** Active inner work: the tarot table and the healing board, one roof. */
export default function Practice() {
  const [tab, setTab] = useSearchParamState("tab", "somatic");

  return (
    <div className={tab === "tarot" ? "dusk-surface min-h-screen" : "field-wash min-h-screen"}>
      <nav aria-label="Practice areas" className="flex justify-center gap-1 pt-6">
        {[["somatic", "For this moment"], ["tarot", "Tarot & Oracle"], ["healing", "Practice board"]].map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            aria-current={tab === id ? "page" : undefined}
            className="px-4 py-2 text-sm font-bold transition-all duration-200"
            style={tab === id
              ? { background: tab === "tarot" ? "var(--gh-gold)" : "var(--gh-ink)", color: tab === "tarot" ? "var(--gh-dusk-deep)" : "var(--gh-field)", borderRadius: "calc(var(--radius) - 3px)", boxShadow: "var(--shadow-soft)" }
              : { border: "1px solid", borderColor: tab === "tarot" ? "rgba(245,229,216,0.35)" : "hsl(var(--border))", color: tab === "tarot" ? "var(--gh-dusk-ink)" : "var(--gh-ink-soft)", borderRadius: "calc(var(--radius) - 3px)" }}
          >
            {label}
          </button>
        ))}
      </nav>
      {tab === "somatic" || !['healing', 'tarot'].includes(tab) ? <SomaticPractice /> : tab === "healing" ? <HealingBoard /> : <TarotTable />}
    </div>
  );
}
