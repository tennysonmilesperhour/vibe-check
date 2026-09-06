import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { resonanceGraph } from "@/lib/resonance/graph";
import { todayKey } from "@/lib/dates";
import { useLoomLayout } from "./useLoomLayout";
import { SevenfoldGeometry } from "./LoomGeometry";
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
      style={{ background: "linear-gradient(165deg, var(--gh-rose) 0%, var(--gh-peach) 50%, var(--gh-gold) 100%)", borderRadius: "var(--radius)", overflow: "hidden" }}
    >
      <svg viewBox={`0 0 ${size} ${size}`} style={{ width: "100%", maxWidth: 220, margin: "0 auto", display: "block" }} aria-hidden="true">
        <circle cx={layout.cx} cy={layout.cy} r={layout.rZodiac} fill="none" stroke="rgba(255,253,246,0.4)" strokeWidth="0.75" />
        <circle cx={layout.cx} cy={layout.cy} r={layout.rGates} fill="none" stroke="rgba(255,253,246,0.2)" strokeWidth="0.5" />
        <SevenfoldGeometry cx={layout.cx} cy={layout.cy} r={layout.rInner} />
        {layout.threads.map((t) => (
          <g key={`${t.a}-${t.b}`}>
            <path d={t.d} fill="none" stroke={t.color} strokeWidth={t.isActiveToday ? 1.8 : 1} opacity={0.9} />
            <rect x={t.midX - 1.6} y={t.midY - 1.6} width="3.2" height="3.2" rx="0.4" fill="var(--gh-ink)" stroke={t.color} strokeWidth="0.7" transform={`rotate(45 ${t.midX} ${t.midY})`} />
          </g>
        ))}
        {layout.nodes.map((n) => (
          <circle key={n.id} cx={n.x} cy={n.y} r="4.25" fill="var(--gh-ink)" stroke="var(--gh-cream)" strokeWidth="1" />
        ))}
      </svg>
      <p className="text-center text-xs mt-2 font-medium" style={{ color: "var(--gh-cream)" }}>
        Your Loom · {graph.nodes.length} placements{graph.edges.length > 0 ? ` · ${graph.edges.length} exact ${graph.edges.length === 1 ? "match" : "matches"}` : ""}
      </p>
    </Link>
  );
}
