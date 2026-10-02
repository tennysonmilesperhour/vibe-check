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
      {/* The same tabs as Patterns, inside the page's own margins. */}
      <div className="practice-tabs">
        <nav aria-label="Practice areas" className="living-tabs">
          {[["somatic", "For this moment"], ["healing", "Practice board"]].map(([id, label]) => (
            <button key={id} type="button" onClick={() => setTab(id)} aria-current={tab === id ? "page" : undefined}>
              {label}
            </button>
          ))}
        </nav>
      </div>
      {tab === "healing" ? <HealingBoard /> : <SomaticPractice />}
    </div>
  );
}
