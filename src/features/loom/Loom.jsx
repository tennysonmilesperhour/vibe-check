import React, { useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { resonanceGraph } from "@/lib/resonance/graph";
import { SYSTEMS } from "@/lib/resonance/tables";
import { todayKey } from "@/lib/dates";
import { useLoomLayout } from "./useLoomLayout";
import { WheelRings, DrawPath } from "./LoomGeometry";

const SYSTEM_LABEL = Object.fromEntries(SYSTEMS.map((s) => [s.id, s.label]));
const SYSTEM_COLORS = {
  astrology: "var(--gh-cream)",
  human_design: "var(--gh-gold)",
  gene_keys: "var(--gh-amber)",
  numerology: "var(--gh-rose)",
  tarot_archetype: "var(--gh-peach)",
  enneagram: "var(--gh-cream)",
  chakras: "var(--gh-gold)",
};
const THREAD_LABELS = {
  hexagram: "same I Ching hexagram",
  number: "numerology ↔ Tarot",
  astro: "same zodiac sign",
  center: "shared center",
};

function nodeMark(node) {
  const astrologyMarks = {
    "astrology.sun": "☉",
    "astrology.moon": "☾",
    "astrology.rising": "ASC",
    "astrology.north_node": "☊",
  };
  if (astrologyMarks[node.id]) return astrologyMarks[node.id];
  if (node.id === "human_design.conscious_sun") return `G${node.gate}`;
  if (node.system === "human_design") return "HD";
  if (node.system === "gene_keys") return `K${node.gate || ""}`;
  if (node.system === "numerology") return `#${node.number || ""}`;
  if (node.system === "tarot_archetype") return "T";
  if (node.system === "enneagram") return `E${String(node.label).match(/\d+/)?.[0] || ""}`;
  if (node.system === "chakras") return "C";
  return "•";
}

/**
 * The Loom: the app's signature visualization. Your placements plotted on
 * the real zodiac wheel with the 64-gate ring; resonance threads drawn
 * between points that share a hexagram, a number, or a sign. The today
 * layer pulses what the current moon and personal day touch.
 */
export default function Loom({ profile, dateKey = todayKey(), size = 400, onDeepDive }) {
  const reduced = useReducedMotion();
  const [selected, setSelected] = useState(null); // {type:'node'|'thread', data}

  const graph = useMemo(() => resonanceGraph(profile || {}, dateKey), [profile, dateKey]);
  const layout = useLoomLayout(graph, size);

  const completedCount = new Set(graph.nodes.map((n) => n.system)).size;
  const highlightGates = graph.nodes.map((n) => n.gate).filter(Boolean);
  const activeIds = new Set(graph.today?.activeNodeIds || []);
  const focusedNodeIds = new Set();
  if (selected?.type === "node") {
    focusedNodeIds.add(selected.data.id);
    graph.edges.forEach((edge) => {
      if (edge.a === selected.data.id || edge.b === selected.data.id) {
        focusedNodeIds.add(edge.a);
        focusedNodeIds.add(edge.b);
      }
    });
  } else if (selected?.type === "thread") {
    focusedNodeIds.add(selected.data.a);
    focusedNodeIds.add(selected.data.b);
  }

  if (graph.nodes.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-lg" style={{ color: "var(--gh-cream)" }}>The Loom is unwoven.</p>
        <p className="text-sm mt-1" style={{ color: "rgba(255,253,246,0.8)" }}>
          Add birth details and turn on a system or two, and your map begins to draw itself.
        </p>
      </div>
    );
  }

  return (
    <div>
      <svg
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label={`Your Loom: ${graph.nodes.length} placements across ${completedCount} systems, with ${graph.edges.length} exact ${graph.edges.length === 1 ? "connection" : "connections"}`}
        style={{ width: "100%", height: "auto", display: "block" }}
      >
        <WheelRings cx={layout.cx} cy={layout.cy} rZodiac={layout.rZodiac} rGates={layout.rGates} highlightGates={highlightGates} />

        {/* shared wheel positions keep one true anchor, with nearby readable emblems */}
        {layout.nodes.filter((node) => Math.hypot(node.x - node.anchorX, node.y - node.anchorY) > 1).map((node) => (
          <line
            key={`anchor-${node.id}`}
            x1={node.anchorX}
            y1={node.anchorY}
            x2={node.x}
            y2={node.y}
            stroke={SYSTEM_COLORS[node.system] || "var(--gh-cream)"}
            strokeWidth="0.75"
            opacity={selected && !focusedNodeIds.has(node.id) ? 0.12 : 0.38}
            aria-hidden="true"
          />
        ))}

        {/* exact cross-system correspondences */}
        {layout.threads.map((thread, i) => (
          <g key={`${thread.a}-${thread.b}`}>
            <DrawPath
              d={thread.d}
              delay={1.2 + i * 0.15}
              stroke={thread.color}
              strokeWidth={thread.isActiveToday ? 2.4 : thread.strength === 2 ? 1.6 : 1}
              opacity={selected
                ? (focusedNodeIds.has(thread.a) && focusedNodeIds.has(thread.b) ? 1 : 0.12)
                : (thread.isActiveToday ? 1 : 0.8)}
              style={{ cursor: "pointer" }}
              role="button"
              tabIndex="0"
              aria-label={`Open exact connection: ${thread.why}`}
              onClick={() => setSelected({ type: "thread", data: thread })}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  setSelected({ type: "thread", data: thread });
                }
              }}
            />
            {thread.isActiveToday && !reduced && (
              <motion.path
                d={thread.d}
                fill="none"
                stroke="var(--gh-gold)"
                strokeWidth="4"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.35, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                style={{ pointerEvents: "none", filter: "blur(3px)" }}
              />
            )}
          </g>
        ))}

        {/* placement nodes */}
        {layout.nodes.map((node, i) => {
          const isActive = activeIds.has(node.id);
          const r = size * 0.028;
          const mark = nodeMark(node);
          const isFocused = !selected || focusedNodeIds.has(node.id);
          return (
            <g key={node.id} role="button" tabIndex="0" aria-label={`Open ${node.label}`}
              opacity={isFocused ? 1 : 0.28}
              style={{ cursor: "pointer", transition: "opacity 180ms ease" }} onClick={() => setSelected({ type: "node", data: node })}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  setSelected({ type: "node", data: node });
                }
              }}>
              {isActive && !reduced && (
                <motion.circle
                  cx={node.x} cy={node.y} r={r + 5}
                  fill="var(--gh-gold)"
                  stroke="none"
                  animate={{ opacity: [0.08, 0.2, 0.08], r: [r + 4, r + 7, r + 4] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                />
              )}
              <motion.circle
                cx={node.x} cy={node.y} r={r}
                fill={isActive ? "var(--gh-gold)" : "var(--gh-ink)"}
                stroke={SYSTEM_COLORS[node.system] || "var(--gh-cream)"}
                strokeWidth={selected?.type === "node" && selected.data.id === node.id ? 2.5 : 1.5}
                initial={reduced ? false : { scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: reduced ? 0 : 0.9 + i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                style={{ transformOrigin: "center", transformBox: "fill-box" }}
              />
              <text
                x={node.x}
                y={node.y + 0.5}
                textAnchor="middle"
                dominantBaseline="central"
                fill={isActive ? "var(--gh-ink)" : "var(--gh-cream)"}
                fontFamily="Space Grotesk, sans-serif"
                fontSize={mark.length > 2 ? size * 0.015 : size * 0.021}
                fontWeight="700"
                pointerEvents="none"
                aria-hidden="true"
              >
                {mark}
              </text>
              <circle cx={node.x} cy={node.y} r={Math.max(25, r + 8)} fill="transparent" />
              <title>{node.label}</title>
            </g>
          );
        })}
      </svg>

      <div className="mt-1 text-center" style={{ color: "rgba(255,253,246,0.86)" }}>
        {graph.edges.length > 0 ? (
          <>
            <p className="text-xs tracking-[0.16em] uppercase">Only exact correspondences are connected</p>
            <div className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs">
              {[...new Set(layout.threads.map((thread) => thread.kind))].map((kind) => (
                <span key={kind} className="inline-flex items-center gap-1.5">
                  <i aria-hidden="true" className="block h-px w-4" style={{ background: layout.threads.find((thread) => thread.kind === kind)?.color }} />
                  {THREAD_LABELS[kind] || kind}
                </span>
              ))}
            </div>
          </>
        ) : (
          <p className="mx-auto max-w-sm text-sm leading-relaxed">
            No exact cross-system matches yet. Your placements stay visible; a line appears only when two systems share a verified correspondence.
          </p>
        )}
      </div>

      <details className="mt-3 text-sm" style={{ color: "var(--gh-cream)" }}>
        <summary className="min-h-11 cursor-pointer py-3 font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gh-gold)]">
          Explore Loom details
        </summary>
        <div className="flex flex-wrap gap-2 pb-2">
          {layout.nodes.map((node) => (
            <button
              key={`detail-${node.id}`}
              type="button"
              className="min-h-11 px-3 py-2 text-sm"
              style={{ border: "1px solid rgba(255,253,246,0.4)", borderRadius: "var(--radius)" }}
              onClick={() => setSelected({ type: "node", data: node })}
            >
              {node.label}
            </button>
          ))}
          {layout.threads.map((thread) => (
            <button
              key={`detail-${thread.a}-${thread.b}`}
              type="button"
              className="min-h-11 px-3 py-2 text-sm"
              style={{ border: "1px solid rgba(255,253,246,0.4)", borderRadius: "var(--radius)" }}
              onClick={() => setSelected({ type: "thread", data: thread })}
            >
              {thread.why}
            </button>
          ))}
        </div>
      </details>

      {/* today line */}
      {graph.today?.moonPhase && (
        <p className="text-center text-sm mt-2" style={{ color: "rgba(255,253,246,0.85)" }}>
          {graph.today.moonPhase.emoji} {graph.today.moonPhase.name}
          {graph.today.personalDay ? ` · Personal Day ${graph.today.personalDay}` : ""}
          {graph.edges.some((e) => e.isActiveToday) ? " · a connection is lit today" : ""}
        </p>
      )}

      {/* detail panel: accessible alternative to floating tooltips */}
      {selected && (
        <div
          className="mt-4 p-4"
          style={{ background: "rgba(255,253,246,0.95)", border: "1px solid rgba(90,36,48,0.2)", borderRadius: "var(--radius)" }}
          role="region"
          aria-live="polite"
        >
          {selected.type === "node" ? (
            <>
              <div className="flex items-center justify-between">
                <h3 className="text-xl" style={{ color: "var(--gh-ink)" }}>{selected.data.label}</h3>
                <button type="button" className="min-h-11 px-3 text-sm underline underline-offset-4" style={{ color: "var(--gh-ink-muted)" }} onClick={() => setSelected(null)}>Close</button>
              </div>
              <p className="text-sm mt-1" style={{ color: "var(--gh-ink-soft)" }}>
                {SYSTEM_LABEL[selected.data.system]} placement
                {selected.data.ring === "wheel" ? " · plotted at its true position on the wheel" : " · held in the inner ring"}
              </p>
              {onDeepDive && (
                <button type="button" className="ink-button text-sm py-2 mt-3" onClick={() => onDeepDive(selected.data.system)}>
                  Deep dive into {SYSTEM_LABEL[selected.data.system]}
                </button>
              )}
            </>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <h3 className="text-xl" style={{ color: "var(--gh-ink)" }}>An exact correspondence</h3>
                <button type="button" className="min-h-11 px-3 text-sm underline underline-offset-4" style={{ color: "var(--gh-ink-muted)" }} onClick={() => setSelected(null)}>Close</button>
              </div>
              <p className="text-sm mt-2 max-w-prose" style={{ color: "var(--gh-ink-soft)" }}>{selected.data.why}</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
