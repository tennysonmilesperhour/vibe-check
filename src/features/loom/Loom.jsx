import React, { useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { resonanceGraph } from "@/lib/resonance/graph";
import { SYSTEMS } from "@/lib/resonance/tables";
import { todayKey } from "@/lib/dates";
import { useLoomLayout } from "./useLoomLayout";
import { WheelRings, LoomFigure, DrawPath } from "./LoomGeometry";
import MoonGlyph from "./MoonGlyph";

const SYSTEM_LABEL = Object.fromEntries(SYSTEMS.map((s) => [s.id, s.label]));

// Selectable sacred-geometry styles for the wheel's backdrop.
const GEOMETRY_STYLES = [
  { id: "hexagram", label: "Hexagram" },
  { id: "dodecagram", label: "Dodecagram" },
  { id: "metatron", label: "Metatron" },
  { id: "aspects", label: "Aspect Web" },
];
const GEOMETRY_KEY = "loom.geometry";
const DEFAULT_GEOMETRY = "hexagram";
const readGeometry = () => {
  if (typeof window === "undefined") return DEFAULT_GEOMETRY;
  const saved = window.localStorage.getItem(GEOMETRY_KEY);
  return GEOMETRY_STYLES.some((s) => s.id === saved) ? saved : DEFAULT_GEOMETRY;
};

/**
 * The Loom — the app's signature visualization. Your placements plotted on
 * the real zodiac wheel with the 64-gate ring; resonance threads drawn
 * between points that share a hexagram, a number, or a sign. The today
 * layer pulses what the current moon and personal day touch.
 */
export default function Loom({ profile, dateKey = todayKey(), size = 400, onDeepDive }) {
  const reduced = useReducedMotion();
  const [selected, setSelected] = useState(null); // {type:'node'|'thread', data}
  const [geoStyle, setGeoStyle] = useState(readGeometry);

  const chooseGeometry = (id) => {
    setGeoStyle(id);
    try { window.localStorage.setItem(GEOMETRY_KEY, id); } catch { /* private mode */ }
  };

  const graph = useMemo(() => resonanceGraph(profile || {}, dateKey), [profile, dateKey]);
  const layout = useLoomLayout(graph, size);

  const completedCount = new Set(graph.nodes.map((n) => n.system)).size;
  const highlightGates = graph.nodes.map((n) => n.gate).filter(Boolean);
  const activeIds = new Set(graph.today?.activeNodeIds || []);

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
        aria-label={`Your resonance map: ${graph.nodes.length} placements across ${completedCount} systems, ${graph.edges.length} resonance threads`}
        style={{ width: "100%", height: "auto", display: "block" }}
      >
        <WheelRings cx={layout.cx} cy={layout.cy} rZodiac={layout.rZodiac} rGates={layout.rGates} highlightGates={highlightGates} />
        <LoomFigure style={geoStyle} cx={layout.cx} cy={layout.cy} size={size} nodes={layout.nodes} />

        {/* resonance threads */}
        {layout.threads.map((thread, i) => (
          <g key={`${thread.a}-${thread.b}`}>
            <DrawPath
              d={thread.d}
              delay={1.2 + i * 0.15}
              stroke={thread.color}
              strokeWidth={thread.isActiveToday ? 2.4 : thread.strength === 2 ? 1.6 : 1}
              opacity={thread.isActiveToday ? 1 : 0.75}
              style={{ cursor: "pointer" }}
              onClick={() => setSelected({ type: "thread", data: thread })}
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
          const r = node.ring === "wheel" ? 6 : 5;
          return (
            <g key={node.id} style={{ cursor: "pointer" }} onClick={() => setSelected({ type: "node", data: node })}>
              {isActive && !reduced && (
                <motion.circle
                  cx={node.x} cy={node.y} r={r + 5}
                  fill="none" stroke="var(--gh-gold)" strokeWidth="1"
                  animate={{ opacity: [0.2, 0.8, 0.2], r: [r + 3, r + 7, r + 3] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                />
              )}
              <motion.circle
                cx={node.x} cy={node.y} r={r}
                fill={isActive ? "var(--gh-gold)" : "var(--gh-cream)"}
                stroke="rgba(90,36,48,0.4)"
                strokeWidth="1"
                initial={reduced ? false : { scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: reduced ? 0 : 0.9 + i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                style={{ transformOrigin: "center", transformBox: "fill-box" }}
              />
              <title>{node.label}</title>
            </g>
          );
        })}
      </svg>

      {/* today line */}
      {graph.today?.moonPhase && (
        <p className="text-center text-sm mt-2 inline-flex items-center gap-1.5 w-full justify-center" style={{ color: "rgba(255,253,246,0.85)" }}>
          <MoonGlyph name={graph.today.moonPhase.name} illumination={graph.today.moonPhase.illumination} color="var(--gh-cream)" />
          <span>
            {graph.today.moonPhase.name}
            {graph.today.personalDay ? ` · Personal Day ${graph.today.personalDay}` : ""}
            {graph.edges.some((e) => e.isActiveToday) ? " · a thread is lit today" : ""}
          </span>
        </p>
      )}

      {/* geometry style picker */}
      <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5" role="group" aria-label="Sacred geometry style">
        {GEOMETRY_STYLES.map((s) => {
          const on = s.id === geoStyle;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => chooseGeometry(s.id)}
              aria-pressed={on}
              className="text-xs px-3 py-1.5 rounded-full transition"
              style={{
                border: `1px solid ${on ? "var(--gh-gold)" : "rgba(255,253,246,0.4)"}`,
                background: on ? "rgba(253,201,78,0.9)" : "rgba(255,253,246,0.12)",
                color: on ? "var(--gh-ink)" : "var(--gh-cream)",
                fontWeight: on ? 600 : 400,
              }}
            >
              {s.label}
            </button>
          );
        })}
      </div>

      {/* detail panel: accessible alternative to floating tooltips */}
      {selected && (
        <div
          className="mt-4 p-4"
          style={{ background: "rgba(255,253,246,0.95)", border: "1px solid rgba(90,36,48,0.2)" }}
          role="region"
          aria-live="polite"
        >
          {selected.type === "node" ? (
            <>
              <div className="flex items-center justify-between">
                <h3 className="text-xl" style={{ color: "var(--gh-ink)" }}>{selected.data.label}</h3>
                <button type="button" className="text-sm underline underline-offset-4" style={{ color: "var(--gh-ink-muted)" }} onClick={() => setSelected(null)}>Close</button>
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
                <h3 className="text-xl" style={{ color: "var(--gh-ink)" }}>A resonance thread</h3>
                <button type="button" className="text-sm underline underline-offset-4" style={{ color: "var(--gh-ink-muted)" }} onClick={() => setSelected(null)}>Close</button>
              </div>
              <p className="text-sm mt-2 max-w-prose" style={{ color: "var(--gh-ink-soft)" }}>{selected.data.why}</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
