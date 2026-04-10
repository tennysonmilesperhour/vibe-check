import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

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

// Popup menu rendered as SVG foreignObject
function NodeMenu({ node, onClose, onEdit, onDeepDive }) {
  const [lx, ly] = polarXY(node.angle, R + 30);
  // Shift menu so it stays inside SVG viewBox
  const mx = Math.max(30, Math.min(lx - 70, 200));
  const my = Math.max(10, Math.min(ly - 10, 240));

  return (
    <foreignObject x={mx} y={my} width="140" height="80">
      <div xmlns="http://www.w3.org/1999/xhtml"
        style={{
          background: 'rgba(14,10,35,0.96)',
          border: `1px solid ${node.color}40`,
          borderRadius: 8,
          padding: '6px 4px',
          boxShadow: `0 0 20px ${node.color}30`,
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
        }}>
        <button onClick={onEdit}
          style={{ fontSize: 11, color: 'rgba(220,210,240,0.9)', background: `${node.color}18`, border: `1px solid ${node.color}30`, borderRadius: 5, padding: '4px 8px', cursor: 'pointer', textAlign: 'left' }}>
          ✏️ Edit Data
        </button>
        <button onClick={onDeepDive}
          style={{ fontSize: 11, color: node.color, background: `${node.color}12`, border: `1px solid ${node.color}30`, borderRadius: 5, padding: '4px 8px', cursor: 'pointer', textAlign: 'left' }}>
          ✦ Deep Dive
        </button>
        <button onClick={onClose}
          style={{ fontSize: 10, color: 'rgba(180,170,210,0.4)', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'center', marginTop: 2 }}>
          close
        </button>
      </div>
    </foreignObject>
  );
}

export default function CosmicBlueprint({ enabledSystems = [], profile = {} }) {
  const navigate = useNavigate();
  const [activeMenu, setActiveMenu] = useState(null); // node id

  const nodes = SYSTEMS.map(s => {
    const [x, y] = polarXY(s.angle);
    const isEnabled = enabledSystems.includes(s.id);
    const hasFilled = isEnabled && s.check(profile[s.id]);
    return { ...s, x, y, isEnabled, hasFilled };
  });

  const completedCount = nodes.filter(n => n.hasFilled).length;

  const handleNodeClick = (node) => {
    if (node.hasFilled) {
      // Toggle menu
      setActiveMenu(prev => prev === node.id ? null : node.id);
    } else {
      // Go to systems/profile tab to enable or fill in
      navigate(createPageUrl("CosmicAddons") + (node.isEnabled ? "?tab=profile" : "?tab=systems"));
    }
  };

  const goEdit = (node) => {
    setActiveMenu(null);
    navigate(createPageUrl("CosmicAddons") + "?tab=profile");
  };

  const goDeepDive = (node) => {
    setActiveMenu(null);
    navigate(createPageUrl("CosmicAddons") + "?tab=deepdive");
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <svg viewBox="0 0 320 320" width="300" height="300" className="overflow-visible"
          onClick={(e) => { if (e.target.tagName === 'svg') setActiveMenu(null); }}>
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

          {/* ── Progressive background complexity ── */}
          {/* Layer 1 (1+ systems): outer ring */}
          {completedCount >= 1 && (
            <circle cx={CX} cy={CY} r={R * 1.55} fill="none" stroke="rgba(192,132,252,0.08)" strokeWidth="0.6" />
          )}
          {/* Layer 2 (2+ systems): second outer ring + 6 petals */}
          {completedCount >= 2 && (
            <>
              <circle cx={CX} cy={CY} r={R * 1.95} fill="none" stroke="rgba(139,92,246,0.07)" strokeWidth="0.5" />
              {nodes.map((n, i) => {
                const [px, py] = polarXY(n.angle, R * 1.55);
                return <circle key={`p2-${i}`} cx={px} cy={py} r={R * 0.55} fill="none" stroke="rgba(192,132,252,0.07)" strokeWidth="0.5" />;
              })}
            </>
          )}
          {/* Layer 3 (3+ systems): inner triangles */}
          {completedCount >= 3 && (
            <>
              <polygon
                points={[0,2,4].map(i => { const [x,y] = polarXY(nodes[i].angle, R * 1.1); return `${x},${y}`; }).join(' ')}
                fill="rgba(139,92,246,0.04)" stroke="rgba(139,92,246,0.12)" strokeWidth="0.6" />
              <polygon
                points={[1,3,5].map(i => { const [x,y] = polarXY(nodes[i].angle, R * 1.1); return `${x},${y}`; }).join(' ')}
                fill="rgba(56,189,248,0.03)" stroke="rgba(56,189,248,0.10)" strokeWidth="0.6" />
            </>
          )}
          {/* Layer 4 (4+ systems): more petals at mid radius */}
          {completedCount >= 4 && (
            <>
              {nodes.map((n, i) => {
                const [px, py] = polarXY(n.angle + 30, R * 0.9);
                return <circle key={`p4-${i}`} cx={px} cy={py} r={R * 0.7} fill="none" stroke="rgba(244,114,182,0.06)" strokeWidth="0.5" />;
              })}
              <circle cx={CX} cy={CY} r={R * 0.7} fill="none" stroke="rgba(192,132,252,0.1)" strokeWidth="0.5" />
            </>
          )}
          {/* Layer 5 (5+ systems): outer star polygon + corner circles */}
          {completedCount >= 5 && (
            <>
              <polygon
                points={nodes.map(n => { const [x,y] = polarXY(n.angle, R * 1.38); return `${x},${y}`; }).join(' ')}
                fill="rgba(251,191,36,0.03)" stroke="rgba(251,191,36,0.12)" strokeWidth="0.7" />
              {nodes.map((n, i) => {
                const [px, py] = polarXY(n.angle, R * 1.75);
                return <circle key={`p5-${i}`} cx={px} cy={py} r={R * 0.4} fill="none" stroke="rgba(251,191,36,0.06)" strokeWidth="0.4" />;
              })}
            </>
          )}
          {/* Layer 6 (all 6): full Flower of Life — corner + fill rings */}
          {completedCount === 6 && (
            <>
              {nodes.map((n, i) => {
                const [px, py] = polarXY(n.angle, R * 2.1);
                return <circle key={`p6a-${i}`} cx={px} cy={py} r={R} fill="none" stroke="rgba(192,132,252,0.06)" strokeWidth="0.4" />;
              })}
              {nodes.map((n, i) => {
                const [px, py] = polarXY(n.angle + 30, R * 1.78);
                return <circle key={`p6b-${i}`} cx={px} cy={py} r={R * 0.55} fill="none" stroke="rgba(56,189,248,0.06)" strokeWidth="0.4" />;
              })}
              <circle cx={CX} cy={CY} r={R * 2.3} fill="none" stroke="rgba(192,132,252,0.07)" strokeWidth="0.5" />
              <polygon
                points={nodes.map(n => { const [x,y] = polarXY(n.angle, R * 1.7); return `${x},${y}`; }).join(' ')}
                fill="rgba(139,92,246,0.04)" stroke="rgba(139,92,246,0.1)" strokeWidth="0.5" />
            </>
          )}

          {/* Flower of Life — background circles */}
          {nodes.map(n => (
            <circle key={`bg-${n.id}`} cx={n.x} cy={n.y} r={R}
              fill="none"
              stroke={n.hasFilled ? n.color : "rgba(255,255,255,0.06)"}
              strokeWidth={n.hasFilled ? "0.8" : "0.5"}
              opacity={n.hasFilled ? 0.35 : 0.15} />
          ))}
          <circle cx={CX} cy={CY} r={R} fill="none" stroke="rgba(192,132,252,0.12)" strokeWidth="0.5" />

          {/* Spokes */}
          {nodes.map(n => (
            <line key={`spoke-${n.id}`}
              x1={CX} y1={CY} x2={n.x} y2={n.y}
              stroke={n.hasFilled ? n.color : "rgba(255,255,255,0.08)"}
              strokeWidth={n.hasFilled ? "1.5" : "0.6"}
              opacity={n.hasFilled ? 0.5 : 0.3}
              strokeDasharray={n.isEnabled && !n.hasFilled ? "4 4" : "none"} />
          ))}

          {/* Outer ring */}
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
            points={nodes.map(n => { const [x, y] = polarXY(n.angle, R * 0.45); return `${x},${y}`; }).join(" ")}
            fill="rgba(139,92,246,0.04)" stroke="rgba(139,92,246,0.15)" strokeWidth="0.8" />

          {/* Center node */}
          <circle cx={CX} cy={CY} r={22} fill="url(#grad-center)" stroke="rgba(192,132,252,0.3)" strokeWidth="1" />
          <text x={CX} y={CY + 1} textAnchor="middle" dominantBaseline="middle" fontSize="14" fill="rgba(255,255,255,0.85)">✦</text>
          <text x={CX} y={CY + 34} textAnchor="middle" fontSize="8" fill="rgba(192,132,252,0.6)" letterSpacing="2">BLUEPRINT</text>

          {/* System nodes */}
          {nodes.map(n => {
            const labelR = R + 30;
            const [lx, ly] = polarXY(n.angle, labelR);
            const isMenuOpen = activeMenu === n.id;
            return (
              <g key={n.id} filter={n.hasFilled ? "url(#glow)" : undefined}
                onClick={() => handleNodeClick(n)}
                style={{ cursor: 'pointer' }}>
                {/* Hover/active pulse ring */}
                {isMenuOpen && (
                  <circle cx={n.x} cy={n.y} r={30} fill="none" stroke={n.color} strokeWidth="1.5" opacity="0.6" />
                )}
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

          {/* Context menu overlay for filled nodes */}
          {activeMenu && (() => {
            const node = nodes.find(n => n.id === activeMenu);
            if (!node) return null;
            return (
              <NodeMenu
                node={node}
                onClose={() => setActiveMenu(null)}
                onEdit={() => goEdit(node)}
                onDeepDive={() => goDeepDive(node)}
              />
            );
          })()}
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
        {completedCount === 0 ? "Tap any node to enable or fill in your profile" :
         completedCount === 6 ? "✦ Your full blueprint is activated" :
         `${completedCount} of 6 systems activated — tap to explore`}
      </p>
    </div>
  );
}