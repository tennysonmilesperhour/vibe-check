import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { resonanceGraph } from "@/lib/resonance/graph";
import { todayKey } from "@/lib/dates";
import { useLoomLayout, THREAD_COLORS } from "./useLoomLayout";
import { createPageUrl } from "@/utils";

/** Compact, non-interactive Loom for the Today page. Links into Cosmos. */
export default function MiniLoom({ profile, size = 180 }) {
  const graph = useMemo(() => resonanceGraph(profile || {}, todayKey()), [profile]);
  const layout = useLoomLayout(graph, size);

  if (graph.nodes.length === 0) return null;

  return (
    <Link
      to={createPageUrl("CosmicAddons")}
      aria-label="Open your Loom in Cosmos"
      className="block p-4"
      style={{ background: "var(--gradient-sky)", borderRadius: "var(--radius)", boxShadow: "var(--shadow-soft)" }}
    >
      <svg viewBox={`0 0 ${size} ${size}`} style={{ width: "100%", maxWidth: 220, margin: "0 auto", display: "block" }} aria-hidden="true">
        <circle cx={layout.cx} cy={layout.cy} r={layout.rZodiac} fill="none" stroke="rgba(255,253,246,0.4)" strokeWidth="0.75" />
        <circle cx={layout.cx} cy={layout.cy} r={layout.rGates} fill="none" stroke="rgba(255,253,246,0.2)" strokeWidth="0.5" />
        {layout.threads.map((t) => (
          <path key={`${t.a}-${t.b}`} d={t.d} fill="none" stroke={THREAD_COLORS[t.kind]} strokeWidth={t.isActiveToday ? 1.8 : 1} opacity={0.85} />
        ))}
        {layout.nodes.map((n) => (
          <circle key={n.id} cx={n.x} cy={n.y} r="3.5" fill="var(--gh-cream)" stroke="rgba(90,36,48,0.35)" strokeWidth="0.75" />
        ))}
      </svg>
      <p className="text-center text-xs mt-2 font-medium" style={{ color: "var(--gh-cream)" }}>
        Your Loom · {graph.edges.length} resonance {graph.edges.length === 1 ? "thread" : "threads"}
      </p>
    </Link>
  );
}
