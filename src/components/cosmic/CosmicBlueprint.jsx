import React from "react";

const SYSTEMS = [
  { id: "astrology",       label: "Astrology",      emoji: "♈", color: "#f472b6", check: d => d?.sun_sign,        angle: -90 },
  { id: "human_design",    label: "Human Design",   emoji: "⬡", color: "#c084fc", check: d => d?.type,            angle: -30 },
  { id: "gene_keys",       label: "Gene Keys",      emoji: "🧬", color: "#38bdf8", check: d => d?.life_work,      angle: 30  },
  { id: "numerology",      label: "Numerology",     emoji: "∞", color: "#2dd4bf", check: d => d?.life_path,       angle: 90  },
  { id: "tarot_archetype", label: "Tarot",          emoji: "✦", color: "#fbbf24", check: d => d?.birth_card,      angle: 150 },
  { id: "chakras",         label: "Chakras",        emoji: "◎", color: "#a78bfa", check: d => d?.dominant_center, angle: 210 },
];

const DEG = Math.PI / 180;
const CX = 160, CY = 160, R = 82;

function polarXY(angleDeg, r = R) {
  return [CX + r * Math.cos(angleDeg * DEG), CY + r * Math.sin(angleDeg * DEG)];
}

export default function CosmicBlueprint({ enabledSystems = [], profile = {} }) {
  const nodes = SYSTEMS.map(s => {
    const [x, y] = polarXY(s.angle);
    const isEnabled = enabledSystems.includes(s.id);
    const hasFilled = isEnabled && s.check(profile[s.id]);
    return { ...s, x, y, isEnabled, hasFilled };
  });

  const completedCount = nodes.filter(n => n.hasFilled).length;

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <svg viewBox="0 0 320 320" width="300" height="300" className="overflow-visible">
          <defs>
            {SYSTEMS.map(s => (
              <radialGradient key={s.id} id={`grad-${s.id}`} cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor={s.color} stopOpacity="0.9" />
                <stop offset="100%" stopColor={s.color} stopOpacity="0.4" />
              </radialGradient>
            ))}
            <radialGradient id="grad-center" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#c084fc" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.1" />
            </radialGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          {/* Flower of Life — background circles */}
          {nodes.map(n => (
            <circle key={`bg-${n.id}`} cx={n.x} cy={n.y} r={R}
              fill="none"
              stroke={n.hasFilled ? n.color : "rgba(255,255,255,0.06)"}
              strokeWidth={n.hasFilled ? "0.8" : "0.5"}
              opacity={n.hasFilled ? 0.35 : 0.15} />
          ))}
          {/* Center flower circle */}
          <circle cx={CX} cy={CY} r={R} fill="none" stroke="rgba(192,132,252,0.12)" strokeWidth="0.5" />

          {/* Spoke lines from center to nodes */}
          {nodes.map(n => (
            <line key={`spoke-${n.id}`}
              x1={CX} y1={CY} x2={n.x} y2={n.y}
              stroke={n.hasFilled ? n.color : "rgba(255,255,255,0.08)"}
              strokeWidth={n.hasFilled ? "1.5" : "0.6"}
              opacity={n.hasFilled ? 0.5 : 0.3}
              strokeDasharray={n.isEnabled && !n.hasFilled ? "4 4" : "none"} />
          ))}

          {/* Outer connecting ring lines */}
          {nodes.map((n, i) => {
            const next = nodes[(i + 1) % nodes.length];
            const bothFilled = n.hasFilled && next.hasFilled;
            return (
              <line key={`ring-${i}`}
                x1={n.x} y1={n.y} x2={next.x} y2={next.y}
                stroke={bothFilled ? `url(#grad-${n.id})` : "rgba(255,255,255,0.07)"}
                strokeWidth={bothFilled ? "1.5" : "0.5"}
                opacity={bothFilled ? 0.6 : 0.25} />
            );
          })}

          {/* Inner hexagon */}
          <polygon
            points={nodes.map(n => {
              const [x, y] = polarXY(n.angle, R * 0.45);
              return `${x},${y}`;
            }).join(" ")}
            fill="rgba(139,92,246,0.04)"
            stroke="rgba(139,92,246,0.15)"
            strokeWidth="0.8" />

          {/* Center node */}
          <circle cx={CX} cy={CY} r={22} fill="url(#grad-center)" stroke="rgba(192,132,252,0.3)" strokeWidth="1" />
          <text x={CX} y={CY + 1} textAnchor="middle" dominantBaseline="middle" fontSize="14" fill="rgba(255,255,255,0.85)">✦</text>
          <text x={CX} y={CY + 34} textAnchor="middle" fontSize="8" fill="rgba(192,132,252,0.6)" letterSpacing="2">BLUEPRINT</text>

          {/* System nodes */}
          {nodes.map(n => {
            const labelR = R + 30;
            const [lx, ly] = polarXY(n.angle, labelR);
            return (
              <g key={n.id} filter={n.hasFilled ? "url(#glow)" : undefined}>
                {/* Outer ring for filled nodes */}
                {n.hasFilled && (
                  <circle cx={n.x} cy={n.y} r={26} fill="none" stroke={n.color} strokeWidth="1" opacity="0.4" />
                )}
                {/* Main node circle */}
                <circle cx={n.x} cy={n.y} r={20}
                  fill={n.hasFilled ? `url(#grad-${n.id})` : n.isEnabled ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.02)"}
                  stroke={n.hasFilled ? n.color : n.isEnabled ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.08)"}
                  strokeWidth={n.hasFilled ? "1.5" : "1"} />
                {/* Emoji */}
                <text x={n.x} y={n.y + 1} textAnchor="middle" dominantBaseline="middle"
                  fontSize="12"
                  fill={n.hasFilled ? "white" : n.isEnabled ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.15)"}>
                  {n.emoji}
                </text>
                {/* Label */}
                <text x={lx} y={ly} textAnchor="middle" dominantBaseline="middle"
                  fontSize="7.5" letterSpacing="0.5"
                  fill={n.hasFilled ? n.color : n.isEnabled ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.18)"}>
                  {n.label.toUpperCase()}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs" style={{ color: 'rgba(180,170,210,0.5)' }}>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full inline-block" style={{ background: 'rgba(255,255,255,0.15)' }} />
          Not enabled
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full inline-block" style={{ border: '1px solid rgba(255,255,255,0.3)' }} />
          Enabled, needs data
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full inline-block" style={{ background: '#c084fc' }} />
          Active & filled
        </span>
      </div>

      <p className="text-xs text-center" style={{ color: 'rgba(180,170,210,0.4)', maxWidth: 260 }}>
        {completedCount === 0 ? "Enable systems and fill in your profile to illuminate your blueprint" :
         completedCount === 6 ? "✦ Your full blueprint is activated" :
         `${completedCount} of 6 systems activated`}
      </p>
    </div>
  );
}