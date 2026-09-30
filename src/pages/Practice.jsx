import React from "react";
import { Navigate } from "react-router-dom";
import { useSearchParamState } from "@/lib/deeplink";
import HealingBoard from "./HealingBoard";
import SomaticPractice from '@/features/practice/SomaticPractice';

/** Active inner work: practices for this moment and the practice board. */
export default function Practice() {
  const [tab, setTab] = useSearchParamState("tab", "somatic");
  // Tarot lives in Cosmos now, beside the other optional systems.
  if (tab === "tarot") return <Navigate to="/CosmicAddons?tab=tarot" replace />;

  return (
    <div className="field-wash min-h-screen">
      <nav aria-label="Practice areas" className="flex justify-center gap-1 pt-6">
        {[["somatic", "For this moment"], ["healing", "Practice board"]].map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            aria-current={tab === id ? "page" : undefined}
            className="px-4 py-2 text-sm font-bold transition-all duration-200"
            style={tab === id
              ? { background: "var(--gh-ink)", color: "var(--gh-field)", borderRadius: "calc(var(--radius) - 3px)", boxShadow: "var(--shadow-soft)" }
              : { border: "1px solid", borderColor: "hsl(var(--border))", color: "var(--gh-ink-soft)", borderRadius: "calc(var(--radius) - 3px)" }}
          >
            {label}
          </button>
        ))}
      </nav>
      {tab === "healing" ? <HealingBoard /> : <SomaticPractice />}
    </div>
  );
}
