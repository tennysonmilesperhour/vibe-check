import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { polar, ringPoints, pts } from "@/lib/geometry";
import { ZODIAC_SIGNS, GATE_WHEEL } from "@/lib/resonance/tables";

import ZodiacGlyph from "./ZodiacGlyph";

const cream = (a) => `rgba(255,253,246,${a})`;

/** Draw-on animated path (falls back to static under reduced motion). */
export function DrawPath({ d, delay = 0, stroke = cream(0.5), strokeWidth = 1, fill = "none", ...rest }) {
  const reduced = useReducedMotion();
  if (reduced) return <path d={d} stroke={stroke} strokeWidth={strokeWidth} fill={fill} {...rest} />;
  return (
    <motion.path
      d={d}
      stroke={stroke}
      strokeWidth={strokeWidth}
      fill={fill}
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: 1, opacity: 1 }}
      transition={{ duration: 1.1, delay, ease: [0.22, 1, 0.36, 1] }}
      {...rest}
    />
  );
}

export function Bloom({ children, delay = 0 }) {
  const reduced = useReducedMotion();
  if (reduced) return <g>{children}</g>;
  return (
    <motion.g
      initial={{ scale: 0.6, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      style={{ transformOrigin: "center", transformBox: "fill-box" }}
    >
      {children}
    </motion.g>
  );
}

/** The zodiac ring: 12 sign sectors + glyphs, and the 64-gate tick ring. */
export function WheelRings({ cx, cy, rZodiac, rGates, highlightGates = [] }) {
  const highlight = new Set(highlightGates.map(String));
  return (
    <g aria-hidden="true">
      <circle cx={cx} cy={cy} r={rZodiac} fill="none" stroke={cream(0.4)} strokeWidth="1" />
      <circle cx={cx} cy={cy} r={rGates} fill="none" stroke={cream(0.25)} strokeWidth="0.75" />
      {ZODIAC_SIGNS.map((sign, i) => {
        // sign boundary ticks + glyph at mid-sign; wheel runs counterclockwise from left
        const boundaryAngle = (270 - i * 30 + 360) % 360;
        const midAngle = (270 - (i * 30 + 15) + 360) % 360;
        const [tx1, ty1] = polar(cx, cy, rGates, boundaryAngle);
        const [tx2, ty2] = polar(cx, cy, rZodiac, boundaryAngle);
        const [gx, gy] = polar(cx, cy, (rZodiac + rGates) / 2 + 8, midAngle);
        return (
          <g key={sign}>
            <line x1={tx1} y1={ty1} x2={tx2} y2={ty2} stroke={cream(0.35)} strokeWidth="0.75" />
            <g transform={`translate(${gx - rZodiac * 0.045}, ${gy - rZodiac * 0.045})`}>
              <ZodiacGlyph sign={sign} size={rZodiac * 0.09} color={cream(0.85)} />
            </g>
          </g>
        );
      })}
      {GATE_WHEEL.map((gate, i) => {
        const angle = (270 - (i * 5.625 - 1.875 + 2.8125) + 360) % 360;
        const isLit = highlight.has(String(gate));
        const [x1, y1] = polar(cx, cy, rGates - (isLit ? 7 : 4), angle);
        const [x2, y2] = polar(cx, cy, rGates, angle);
        return (
          <line
            key={gate}
            x1={x1} y1={y1} x2={x2} y2={y2}
            stroke={isLit ? "var(--gh-gold)" : cream(0.3)}
            strokeWidth={isLit ? 2 : 0.6}
          />
        );
      })}
    </g>
  );
}

/**
 * Progressive sacred geometry, carried over from CosmicBlueprint:
 * tiers unlock with the number of systems that hold data.
 * 2+ petals · 3+ interlocking triangles · 5+ hexagon · 7 flower of life.
 */
export function ProgressiveGeometry({ cx, cy, r, completedCount }) {
  const tiers = [];
  const petal = (radius, count, startDeg, key, delay) => (
    <g key={key}>
      {ringPoints(cx, cy, radius, count, startDeg).map(([x, y], i) => (
        <Bloom key={i} delay={delay + i * 0.06}>
          <circle cx={x} cy={y} r={radius} fill="none" stroke={cream(0.22)} strokeWidth="0.8" />
        </Bloom>
      ))}
    </g>
  );

  if (completedCount >= 2) tiers.push(petal(r * 0.33, 6, 0, "petals", 0.2));
  if (completedCount >= 3) {
    const up = ringPoints(cx, cy, r * 0.62, 3, 0);
    const down = ringPoints(cx, cy, r * 0.62, 3, 60);
    tiers.push(
      <g key="triangles">
        <DrawPath d={`M ${pts(up).replace(/ /g, " L ")} Z`.replace("M", "M ")} delay={0.4} stroke={cream(0.35)} />
        <DrawPath d={`M ${pts(down).replace(/ /g, " L ")} Z`} delay={0.55} stroke={cream(0.35)} />
      </g>
    );
  }
  if (completedCount >= 4) tiers.push(petal(r * 0.33, 6, 30, "petals-rot", 0.6));
  if (completedCount >= 5) {
    const hex = ringPoints(cx, cy, r * 0.74, 6, 0);
    tiers.push(<DrawPath key="hexagon" d={`M ${pts(hex).replace(/ /g, " L ")} Z`} delay={0.8} stroke="rgba(253,201,78,0.55)" strokeWidth="1.2" />);
  }
  if (completedCount >= 7) {
    // full flower of life: center + two rings of six
    tiers.push(
      <g key="flower">
        <Bloom delay={1}>
          <circle cx={cx} cy={cy} r={r * 0.33} fill="none" stroke={cream(0.3)} strokeWidth="0.8" />
        </Bloom>
        {ringPoints(cx, cy, r * 0.57, 6, 30).map(([x, y], i) => (
          <Bloom key={`f2-${i}`} delay={1.1 + i * 0.05}>
            <circle cx={x} cy={y} r={r * 0.33} fill="none" stroke={cream(0.16)} strokeWidth="0.7" />
          </Bloom>
        ))}
      </g>
    );
  }
  return <g aria-hidden="true">{tiers}</g>;
}

// ── Selectable geometry figures ──────────────────────────────────────────
// Each figure is a full, sharp, whole-wheel construction anchored to the same
// 12-fold sign grid the placements sit on, so the lines actually correspond to
// the points. Scaled to `size` (the SVG viewBox), reaching just inside the gate
// ring (size * 0.42) so they enclose the placement ring (size * 0.35).

/** Closed SVG path through a list of [x, y] points. */
const closedPath = (points) => `M ${points.map(([x, y]) => `${x} ${y}`).join(" L ")} Z`;

/** {12/5} star polygon: step around 12 outer points, five at a time. */
const star12Order = (outer) => {
  const order = [];
  let idx = 0;
  for (let i = 0; i < 12; i++) { order.push(outer[idx]); idx = (idx + 5) % 12; }
  return order;
};

/** 01 — Twelve-pointed star on the sign grid; one point per sign division. */
export function DodecagramFigure({ cx, cy, size }) {
  const R = size * 0.42;
  const Ri = size * 0.2;
  const outer = ringPoints(cx, cy, R, 12, 0);
  return (
    <g aria-hidden="true">
      {outer.map(([x, y], i) => (
        <line key={`spoke-${i}`} x1={cx} y1={cy} x2={x} y2={y} stroke={cream(0.1)} strokeWidth="0.6" />
      ))}
      <circle cx={cx} cy={cy} r={R} fill="none" stroke={cream(0.2)} strokeWidth="0.7" />
      <DrawPath d={closedPath(outer)} delay={0.15} stroke={cream(0.45)} strokeWidth="0.9" />
      <DrawPath d={closedPath(star12Order(outer))} delay={0.35} stroke="var(--gh-gold)" strokeWidth="1.35" opacity="0.9" />
      <DrawPath d={closedPath(ringPoints(cx, cy, Ri, 12, 0))} delay={0.7} stroke={cream(0.38)} strokeWidth="0.8" />
      <Bloom delay={0.9}><circle cx={cx} cy={cy} r="3" fill="var(--gh-gold)" /></Bloom>
    </g>
  );
}

/** 02 — Grand-trine hexagram: two element-trine triangles + a shared hexagon. */
export function HexagramFigure({ cx, cy, size }) {
  const R = size * 0.41;
  const triA = ringPoints(cx, cy, R, 3, 0);
  const triB = ringPoints(cx, cy, R, 3, 60);
  const hex = ringPoints(cx, cy, R, 6, 0);
  const innerHex = ringPoints(cx, cy, (R / Math.sqrt(3)) * 0.92, 6, 30);
  return (
    <g aria-hidden="true">
      <DrawPath d={closedPath(hex)} delay={0.15} stroke={cream(0.3)} strokeWidth="0.9" />
      <DrawPath d={closedPath(triA)} delay={0.3} stroke="var(--gh-gold)" strokeWidth="1.4" opacity="0.92" />
      <DrawPath d={closedPath(triB)} delay={0.5} stroke={cream(0.7)} strokeWidth="1.4" />
      <DrawPath d={closedPath(innerHex)} delay={0.7} stroke={cream(0.28)} strokeWidth="0.8" />
      <Bloom delay={0.9}>
        <circle cx={cx} cy={cy} r={size * 0.085} fill="none" stroke="rgba(253,201,78,0.5)" strokeWidth="0.9" />
      </Bloom>
    </g>
  );
}

/** 03 — Metatron's Cube: the 13-circle Fruit of Life with every centre joined. */
export function MetatronFigure({ cx, cy, size }) {
  const step = size * 0.205;
  const centers = [[cx, cy], ...ringPoints(cx, cy, step, 6, 30), ...ringPoints(cx, cy, step * 2, 6, 30)];
  const lines = [];
  for (let i = 0; i < centers.length; i++) {
    for (let j = i + 1; j < centers.length; j++) lines.push([centers[i], centers[j]]);
  }
  return (
    <g aria-hidden="true">
      {lines.map(([a, b], i) => (
        <line key={`m-${i}`} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={cream(0.14)} strokeWidth="0.55" />
      ))}
      <DrawPath d={closedPath(ringPoints(cx, cy, step * 2, 6, 30))} delay={0.3} stroke="var(--gh-gold)" strokeWidth="1.1" opacity="0.8" />
      {centers.map(([x, y], i) => (
        <Bloom key={`c-${i}`} delay={0.2 + i * 0.04}>
          <circle cx={x} cy={y} r={step} fill="none" stroke={cream(i === 0 ? 0.32 : 0.18)} strokeWidth="0.75" />
        </Bloom>
      ))}
      <circle cx={cx} cy={cy} r="2.6" fill="var(--gh-gold)" />
    </g>
  );
}

// Major aspects, drawn between any two placements the right angle apart.
const WEB_ASPECTS = [
  { ang: 180, color: "var(--gh-amber)", width: 1.0 },
  { ang: 120, color: "var(--gh-peach)", width: 1.25 },
  { ang: 90, color: "var(--gh-rose)", width: 1.0 },
  { ang: 60, color: "var(--gh-gold)", width: 0.9 },
];
const aspectOf = (a, b) => {
  let d = Math.abs(a - b) % 360;
  if (d > 180) d = 360 - d;
  return WEB_ASPECTS.find((x) => Math.abs(d - x.ang) <= 3) || null;
};

/** 04 — Aspect Web: lines generated from the placements themselves. */
export function AspectWebFigure({ cx, cy, size, nodes = [] }) {
  const wheel = nodes.filter((n) => n.ring === "wheel" && n.wheelDeg != null);
  const links = [];
  for (let i = 0; i < wheel.length; i++) {
    for (let j = i + 1; j < wheel.length; j++) {
      const asp = aspectOf(wheel[i].wheelDeg, wheel[j].wheelDeg);
      if (!asp) continue;
      const a = wheel[i];
      const b = wheel[j];
      const mx = (a.x + b.x) / 2 + (cx - (a.x + b.x) / 2) * 0.32;
      const my = (a.y + b.y) / 2 + (cy - (a.y + b.y) / 2) * 0.32;
      links.push({ d: `M ${a.x} ${a.y} Q ${mx} ${my} ${b.x} ${b.y}`, ...asp });
    }
  }
  return (
    <g aria-hidden="true">
      <circle cx={cx} cy={cy} r={size * 0.35} fill="none" stroke={cream(0.14)} strokeWidth="0.6" />
      <path d={closedPath(ringPoints(cx, cy, size * 0.35, 12, 0))} fill="none" stroke={cream(0.1)} strokeWidth="0.6" />
      {links.map((l, i) => (
        <DrawPath key={`a-${i}`} d={l.d} delay={0.2 + i * 0.1} stroke={l.color} strokeWidth={l.width} opacity="0.85" />
      ))}
    </g>
  );
}

/** Dispatcher: render the geometry figure the user has chosen. */
export function LoomFigure({ style, cx, cy, size, nodes }) {
  switch (style) {
    case "dodecagram": return <DodecagramFigure cx={cx} cy={cy} size={size} />;
    case "metatron": return <MetatronFigure cx={cx} cy={cy} size={size} />;
    case "aspects": return <AspectWebFigure cx={cx} cy={cy} size={size} nodes={nodes} />;
    case "hexagram":
    default: return <HexagramFigure cx={cx} cy={cy} size={size} />;
  }
}
