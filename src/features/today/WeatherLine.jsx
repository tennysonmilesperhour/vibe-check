import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { todayKey } from "@/lib/dates";
import { resonanceGraph } from "@/lib/resonance/graph";

const listJoin = (items) =>
  items.length <= 1 ? items[0] : `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;

/**
 * Today's cosmic weather, computed from the resonance graph — which of your
 * placements the current moon phase and personal day actually touch. No
 * network, no generation: every line traces back to graph structure.
 */
export function composeWeather(graph) {
  const { moonPhase: moon, personalDay: pd, activeNodeIds = [] } = graph?.today || {};
  if (!moon) return null;

  const theme = `${moon.name}${pd ? ` · Personal Day ${pd}` : ""}`;
  const byId = Object.fromEntries(graph.nodes.map((n) => [n.id, n]));
  const activeLabels = activeNodeIds.map((id) => byId[id]?.label).filter(Boolean);
  const litEdge = graph.edges.find((e) => e.isActiveToday);

  const parts = [];
  if (activeLabels.length) parts.push(`Today's sky touches your ${listJoin(activeLabels)}.`);
  if (litEdge) parts.push(litEdge.why);
  const illumination = Math.round((moon.illumination ?? 0) * 100);
  const wisdom = parts.join(" ") ||
    `The moon is ${illumination}% lit. Nothing on your loom is specially stirred — an open day.`;

  return { theme, wisdom, activeLabels };
}

export default function WeatherLine({ onActivePoints }) {
  const [weather, setWeather] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const me = await base44.auth.me();
        if (!me?.cosmic_profile?.enabled_systems?.length) return;
        const w = composeWeather(resonanceGraph(me.cosmic_profile, todayKey()));
        if (!cancelled && w) {
          setWeather(w);
          onActivePoints?.(w.activeLabels);
        }
      } catch {
        // silent: the page reads fine without weather
      }
    })();
    return () => { cancelled = true; };
  }, [onActivePoints]);

  if (!weather) return null;

  return (
    <div className="p-4" style={{ background: "var(--gh-cream)", border: "1px solid hsl(var(--border))", borderRadius: "var(--radius)", boxShadow: "var(--shadow-soft)" }}>
      <p className="text-xs font-bold tracking-wide" style={{ color: "var(--gh-ink-muted)" }}>TODAY'S COSMIC WEATHER</p>
      <p className="font-display text-2xl mt-1" style={{ color: "var(--gh-ink)" }}>{weather.theme}</p>
      <p className="text-sm mt-1 max-w-prose" style={{ color: "var(--gh-ink-soft)" }}>{weather.wisdom}</p>
    </div>
  );
}
