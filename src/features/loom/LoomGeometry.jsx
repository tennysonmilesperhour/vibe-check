import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { polar, ringPoints, pts } from "@/lib/geometry";
import { ZODIAC_SIGNS, GATE_WHEEL } from "@/lib/resonance/tables";

const GLYPHS = { Aries: "♈", Taurus: "♉", Gemini: "♊", Cancer: "♋", Leo: "♌", Virgo: "♍", Libra: "♎", Scorpio: "♏", Sagittarius: "♐", Capricorn: "♑", Aquarius: "♒", Pisces: "♓" };

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
            <text x={gx} y={gy} textAnchor="middle" dominantBaseline="central" fontSize={rZodiac * 0.075} fill={cream(0.8)}>
              {GLYPHS[sign]}
            </text>
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
 * A single sevenfold construction for the seven systems. The outer heptagon,
 * {7/2} star, and seven-circle rosette all share the same rotational axis.
 * Inner profile placements use the seven star vertices as stable seats.
 */
export function SevenfoldGeometry({ cx, cy, r }) {
  const vertices = ringPoints(cx, cy, r, 7, 0);
  const starOrder = [0, 2, 4, 6, 1, 3, 5].map((index) => vertices[index]);
  const petalRadius = r * 0.43;
  const petalCenters = ringPoints(cx, cy, petalRadius, 7, 0);

  return (
    <g aria-hidden="true">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={cream(0.2)} strokeWidth="0.7" />
      <polygon points={pts(vertices)} fill="none" stroke={cream(0.18)} strokeWidth="0.65" />
      <polygon points={pts(starOrder)} fill="none" stroke={cream(0.34)} strokeWidth="0.85" />

      <circle cx={cx} cy={cy} r={petalRadius} fill="none" stroke={cream(0.2)} strokeWidth="0.65" />
      {petalCenters.map(([x, y], index) => (
        <circle key={index} cx={x} cy={y} r={petalRadius} fill="none" stroke={cream(0.14)} strokeWidth="0.6" />
      ))}

      {vertices.map(([x, y], index) => (
        <circle key={index} cx={x} cy={y} r="2.1" fill="var(--gh-ink)" stroke={cream(0.52)} strokeWidth="0.7" />
      ))}
      <circle cx={cx} cy={cy} r="3" fill="var(--gh-gold)" opacity="0.72" />
      <circle cx={cx} cy={cy} r="6.5" fill="none" stroke={cream(0.28)} strokeWidth="0.7" />
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
