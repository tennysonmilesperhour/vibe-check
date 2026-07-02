import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

const SYSTEMS = [
  { id: "astrology",       label: "Astrology",      emoji: "♈", color: "#C25E8F", check: d => d?.sun_sign        },
  { id: "human_design",    label: "Human Design",   emoji: "⬡", color: "#8A72B8", check: d => d?.type            },
  { id: "gene_keys",       label: "Gene Keys",      emoji: "🧬", color: "#6B95C8", check: d => d?.life_work      },
  { id: "numerology",      label: "Numerology",     emoji: "∞", color: "#C9834B", check: d => d?.life_path       },
  { id: "tarot_archetype", label: "Tarot",          emoji: "✦", color: "#B8902F", check: d => d?.birth_card      },
  { id: "enneagram",       label: "Enneagram",      emoji: "９", color: "#C07A3E", check: d => d?.type            },
  { id: "chakras",         label: "Chakras",        emoji: "◎", color: "#9179C9", check: d => d?.dominant_center },
].map((s, i, arr) => ({ ...s, angle: -90 + i * (360 / arr.length) }));

const TOTAL = SYSTEMS.length;

const DEG = Math.PI / 180;
const CX = 160, CY = 160, R = 82;

function polarXY(angleDeg, r = R) {
  return [CX + r * Math.cos(angleDeg * DEG), CY + r * Math.sin(angleDeg * DEG)];
}

// Tooltip rendered as SVG foreignObject — used for both hover (desktop) and tap (mobile)
function NodeTooltip({ node, isMobile, onClose, onNavigate }) {
  const [lx, ly] = polarXY(node.angle, R + 28);
  const mx = Math.max(20, Math.min(lx - 70, 210));
  const my = Math.max(8, Math.min(ly - 8, isMobile ? 230 : 235));
  const height = isMobile ? 90 : 52;

  const label = node.isEnabled
    ? `Fill in ${node.label} data`
    : `Enable ${node.label} system`;
  const dest = node.isEnabled ? "?tab=profile" : "?tab=systems";

  return (
    <foreignObject x={mx} y={my} width="148" height={height} style={{ pointerEvents: isMobile ? 'all' : 'none' }}>
      <div xmlns="http://www.w3.org/1999/xhtml"
        style={{
          background: 'rgba(255,255,255,0.97)',
          border: `1px solid ${node.color}50`,
          borderRadius: 8,
          padding: '7px 9px',
          boxShadow: `0 0 20px ${node.color}25`,
          fontSize: 11,
          color: 'rgba(61,52,80,0.85)',
          lineHeight: 1.4,
        }}>
        <div style={{ fontWeight: 600, color: node.color, marginBottom: 3, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          {node.label}
        </div>
        <div style={{ marginBottom: isMobile ? 7 : 0 }}>{label}</div>
        {isMobile && (
          <div style={{ display: 'flex', gap: 5, marginTop: 4 }}>
            <button onClick={() => onNavigate(dest)}
              style={{ flex: 1, fontSize: 10, color: 'white', background: node.color, border: 'none', borderRadius: 5, padding: '4px 6px', cursor: 'pointer', fontWeight: 600 }}>
              Go →
            </button>
            <button onClick={onClose}
              style={{ fontSize: 10, color: 'rgba(105,95,128,0.6)', background: 'rgba(255,255,255,0.68)', border: '1px solid rgba(61,52,80,0.12)', borderRadius: 5, padding: '4px 8px', cursor: 'pointer' }}>
              ✕
            </button>
          </div>
        )}
      </div>
    </foreignObject>
  );
}

// Menu for filled nodes
function NodeMenu({ node, onClose, onEdit, onDeepDive }) {
  const [lx, ly] = polarXY(node.angle, R + 28);
  const mx = Math.max(20, Math.min(lx - 70, 210));
  const my = Math.max(8, Math.min(ly - 8, 230));

  return (
    <foreignObject x={mx} y={my} width="144" height="84" style={{ pointerEvents: 'all' }}>
      <div xmlns="http://www.w3.org/1999/xhtml"
        style={{
          background: 'rgba(255,255,255,0.97)',
          border: `1px solid ${node.color}40`,
          borderRadius: 8,
          padding: '6px 5px',
          boxShadow: `0 0 22px ${node.color}30`,
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
        }}>
        <button onClick={onEdit}
          style={{ fontSize: 11, color: 'rgba(61,52,80,0.9)', background: `${node.color}18`, border: `1px solid ${node.color}30`, borderRadius: 5, padding: '4px 8px', cursor: 'pointer', textAlign: 'left' }}>
          ✏️ Edit Data
        </button>
        <button onClick={onDeepDive}
          style={{ fontSize: 11, color: node.color, background: `${node.color}12`, border: `1px solid ${node.color}30`, borderRadius: 5, padding: '4px 8px', cursor: 'pointer', textAlign: 'left' }}>
          ✦ Deep Dive
        </button>
        <button onClick={onClose}
          style={{ fontSize: 10, color: 'rgba(105,95,128,0.45)', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'center', marginTop: 1 }}>
          close
        </button>
      </div>
    </foreignObject>
  );
}

export default function CosmicBlueprint({ enabledSystems = [], profile = {} }) {
  const navigate = useNavigate();
  // activeMenu = id of filled node showing edit/deepdive menu
  const [activeMenu, setActiveMenu] = useState(null);
  // tooltip = { id, mobile: bool } for unfilled nodes
  const [tooltip, setTooltip] = useState(null);

  const nodes = SYSTEMS.map(s => {
    const [x, y] = polarXY(s.angle);
    const isEnabled = enabledSystems.includes(s.id);
    // hasFilled based on data alone — independent of enabledSystems toggle
    const hasFilled = !!s.check(profile[s.id]);
    return { ...s, x, y, isEnabled, hasFilled };
  });

  const completedCount = nodes.filter(n => n.hasFilled).length;

  const handleNodeClick = (node, e) => {
    if (node.hasFilled) {
      setTooltip(null);
      setActiveMenu(prev => prev === node.id ? null : node.id);
      return;
    }
    // For unfilled: on mobile (touch) show tap tooltip; on desktop navigate immediately
    const isTouch = e.nativeEvent?.pointerType === 'touch' || ('ontouchstart' in window && window.innerWidth < 768);
    if (isTouch) {
      setActiveMenu(null);
      setTooltip(prev => prev?.id === node.id ? null : { id: node.id, mobile: true });
    } else {
      navigate(createPageUrl("CosmicAddons") + (node.isEnabled ? "?tab=profile" : "?tab=systems"));
    }
  };

  const handleNodeHover = (node, entering) => {
    if (node.hasFilled) return;
    if (entering) {
      setTooltip({ id: node.id, mobile: false });
    } else {
      setTooltip(prev => (prev && !prev.mobile) ? null : prev);
    }
  };

  const handleNavigate = (dest) => {
    setTooltip(null);
    setActiveMenu(null);
    navigate(createPageUrl("CosmicAddons") + dest);
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <svg viewBox="0 0 320 320" width="300" height="300" className="overflow-visible"
          onClick={(e) => { if (e.target.tagName === 'svg') { setActiveMenu(null); setTooltip(null); } }}>
          <defs>
            {SYSTEMS.map(s => (
              <radialGradient key={s.id} id={`grad-${s.id}`} cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor={s.color} stopOpacity="0.9" />
                <stop offset="100%" stopColor={s.color} stopOpacity="0.4" />
              </radialGradient>
            ))}
            <radialGradient id="grad-center" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#8A72B8" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#6B95C8" stopOpacity="0.1" />
            </radialGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <filter id="glow-soft">
              <feGaussianBlur stdDeviation="5" result="coloredBlur" />
              <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          {/* ── Progressive background complexity ── */}
          {/* Layer 1 (1+ filled): single outer ring */}
          {completedCount >= 1 && (
            <circle cx={CX} cy={CY} r={R * 1.52} fill="none" stroke="rgba(138,114,184,0.22)" strokeWidth="0.8" />
          )}

          {/* Layer 2 (2+ filled): second ring + 6 petal circles */}
          {completedCount >= 2 && (
            <>
              <circle cx={CX} cy={CY} r={R * 1.9} fill="none" stroke="rgba(138,114,184,0.18)" strokeWidth="0.7" />
              {nodes.map((n, i) => {
                const [px, py] = polarXY(n.angle, R * 1.52);
                return <circle key={`p2-${i}`} cx={px} cy={py} r={R * 0.52} fill="none" stroke="rgba(138,114,184,0.16)" strokeWidth="0.6" />;
              })}
            </>
          )}

          {/* Layer 3 (3+ filled): two interlocking triangles (Star of David) */}
          {completedCount >= 3 && (
            <>
              <polygon
                points={[0,2,4].map(i => { const [x,y] = polarXY(nodes[i].angle, R * 1.08); return `${x},${y}`; }).join(' ')}
                fill="rgba(138,114,184,0.07)" stroke="rgba(138,114,184,0.28)" strokeWidth="0.8" />
              <polygon
                points={[1,3,5].map(i => { const [x,y] = polarXY(nodes[i].angle, R * 1.08); return `${x},${y}`; }).join(' ')}
                fill="rgba(107,149,200,0.05)" stroke="rgba(107,149,200,0.22)" strokeWidth="0.8" />
            </>
          )}

          {/* Layer 4 (4+ filled): inner petal ring + mid circle */}
          {completedCount >= 4 && (
            <>
              {nodes.map((n, i) => {
                const [px, py] = polarXY(n.angle + 30, R * 0.88);
                return <circle key={`p4-${i}`} cx={px} cy={py} r={R * 0.68} fill="none" stroke="rgba(194,94,143,0.14)" strokeWidth="0.6" />;
              })}
              <circle cx={CX} cy={CY} r={R * 0.68} fill="none" stroke="rgba(138,114,184,0.2)" strokeWidth="0.7" />
            </>
          )}

          {/* Layer 5 (5+ filled): outer star hexagon + satellite circles */}
          {completedCount >= 5 && (
            <>
              <polygon
                points={nodes.map(n => { const [x,y] = polarXY(n.angle, R * 1.35); return `${x},${y}`; }).join(' ')}
                fill="rgba(184,144,47,0.05)" stroke="rgba(184,144,47,0.26)" strokeWidth="0.9" />
              {nodes.map((n, i) => {
                const [px, py] = polarXY(n.angle, R * 1.72);
                return <circle key={`p5-${i}`} cx={px} cy={py} r={R * 0.38} fill="none" stroke="rgba(184,144,47,0.14)" strokeWidth="0.5" />;
              })}
            </>
          )}

          {/* Final layer (all systems): full Flower of Life expansion */}
          {completedCount === TOTAL && (
            <>
              {nodes.map((n, i) => {
                const [px, py] = polarXY(n.angle, R * 2.05);
                return <circle key={`p6a-${i}`} cx={px} cy={py} r={R} fill="none" stroke="rgba(138,114,184,0.13)" strokeWidth="0.5" />;
              })}
              {nodes.map((n, i) => {
                const [px, py] = polarXY(n.angle + 30, R * 1.75);
                return <circle key={`p6b-${i}`} cx={px} cy={py} r={R * 0.52} fill="none" stroke="rgba(107,149,200,0.13)" strokeWidth="0.5" />;
              })}
              <circle cx={CX} cy={CY} r={R * 2.25} fill="none" stroke="rgba(138,114,184,0.14)" strokeWidth="0.6" />
              <polygon
                points={nodes.map(n => { const [x,y] = polarXY(n.angle, R * 1.68); return `${x},${y}`; }).join(' ')}
                fill="rgba(138,114,184,0.06)" stroke="rgba(138,114,184,0.2)" strokeWidth="0.7" />
            </>
          )}

          {/* Flower of Life — per-node background circles */}
          {nodes.map(n => (
            <circle key={`bg-${n.id}`} cx={n.x} cy={n.y} r={R}
              fill="none"
              stroke={n.hasFilled ? n.color : "rgba(255,255,255,0.76)"}
              strokeWidth={n.hasFilled ? "1" : "0.5"}
              opacity={n.hasFilled ? 0.4 : 0.18} />
          ))}
          <circle cx={CX} cy={CY} r={R} fill="none" stroke="rgba(138,114,184,0.15)" strokeWidth="0.6" />

          {/* Spokes */}
          {nodes.map(n => (
            <line key={`spoke-${n.id}`}
              x1={CX} y1={CY} x2={n.x} y2={n.y}
              stroke={n.hasFilled ? n.color : "rgba(61,52,80,0.11)"}
              strokeWidth={n.hasFilled ? "1.5" : "0.6"}
              opacity={n.hasFilled ? 0.55 : 0.35}
              strokeDasharray={n.isEnabled && !n.hasFilled ? "4 4" : "none"} />
          ))}

          {/* Outer ring connectors */}
          {nodes.map((n, i) => {
            const next = nodes[(i + 1) % nodes.length];
            const bothFilled = n.hasFilled && next.hasFilled;
            return (
              <line key={`ring-${i}`}
                x1={n.x} y1={n.y} x2={next.x} y2={next.y}
                stroke={bothFilled ? n.color : "rgba(61,52,80,0.1)"}
                strokeWidth={bothFilled ? "1.5" : "0.5"}
                opacity={bothFilled ? 0.65 : 0.28} />
            );
          })}

          {/* Inner hexagon */}
          <polygon
            points={nodes.map(n => { const [x, y] = polarXY(n.angle, R * 0.44); return `${x},${y}`; }).join(" ")}
            fill="rgba(138,114,184,0.05)" stroke="rgba(138,114,184,0.18)" strokeWidth="0.9" />

          {/* Center node */}
          <circle cx={CX} cy={CY} r={22} fill="url(#grad-center)" stroke="rgba(138,114,184,0.35)" strokeWidth="1" filter={completedCount >= 3 ? "url(#glow-soft)" : undefined} />
          <text x={CX} y={CY + 1} textAnchor="middle" dominantBaseline="middle" fontSize="14" fill="rgba(61,52,80,0.88)">✦</text>
          <text x={CX} y={CY + 34} textAnchor="middle" fontSize="8" fill="rgba(138,114,184,0.6)" letterSpacing="2">BLUEPRINT</text>

          {/* System nodes */}
          {nodes.map(n => {
            const labelR = R + 30;
            const [lx, ly] = polarXY(n.angle, labelR);
            const isMenuOpen = activeMenu === n.id;
            const isTooltipOpen = tooltip?.id === n.id;

            return (
              <g key={n.id}
                filter={n.hasFilled ? "url(#glow)" : undefined}
                onClick={(e) => handleNodeClick(n, e)}
                onMouseEnter={() => handleNodeHover(n, true)}
                onMouseLeave={() => handleNodeHover(n, false)}
                style={{ cursor: 'pointer' }}>
                {/* Active ring */}
                {(isMenuOpen || isTooltipOpen) && (
                  <circle cx={n.x} cy={n.y} r={30} fill="none" stroke={n.color} strokeWidth="1.5" opacity="0.55" />
                )}
                {/* Outer glow ring for filled nodes */}
                {n.hasFilled && (
                  <circle cx={n.x} cy={n.y} r={26} fill="none" stroke={n.color} strokeWidth="1" opacity="0.4" />
                )}
                {/* Main node */}
                <circle cx={n.x} cy={n.y} r={20}
                  fill={n.hasFilled ? `url(#grad-${n.id})` : n.isEnabled ? "rgba(255,255,255,0.68)" : "rgba(255,255,255,0.5)"}
                  stroke={n.hasFilled ? n.color : n.isEnabled ? "rgba(61,52,80,0.28)" : "rgba(61,52,80,0.11)"}
                  strokeWidth={n.hasFilled ? "1.5" : "1"} />
                {/* Emoji */}
                <text x={n.x} y={n.y + 1} textAnchor="middle" dominantBaseline="middle" fontSize="12"
                  fill={n.hasFilled ? "white" : n.isEnabled ? "rgba(61,52,80,0.53)" : "rgba(61,52,80,0.21)"}>
                  {n.emoji}
                </text>
                {/* Label */}
                <text x={lx} y={ly} textAnchor="middle" dominantBaseline="middle"
                  fontSize="7.5" letterSpacing="0.5"
                  fill={n.hasFilled ? n.color : n.isEnabled ? "rgba(61,52,80,0.47)" : "rgba(61,52,80,0.25)"}>
                  {n.label.toUpperCase()}
                </text>
              </g>
            );
          })}

          {/* Overlays (rendered last so they're on top) */}
          {activeMenu && (() => {
            const node = nodes.find(n => n.id === activeMenu);
            if (!node) return null;
            return (
              <NodeMenu
                node={node}
                onClose={() => setActiveMenu(null)}
                onEdit={() => { setActiveMenu(null); navigate(createPageUrl("CosmicAddons") + "?tab=profile"); }}
                onDeepDive={() => { setActiveMenu(null); navigate(createPageUrl("CosmicAddons") + "?tab=deepdive"); }}
              />
            );
          })()}

          {tooltip && (() => {
            const node = nodes.find(n => n.id === tooltip.id);
            if (!node || node.hasFilled) return null;
            return (
              <NodeTooltip
                node={node}
                isMobile={tooltip.mobile}
                onClose={() => setTooltip(null)}
                onNavigate={handleNavigate}
              />
            );
          })()}
        </svg>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs" style={{ color: 'rgba(105,95,128,0.6)' }}>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full inline-block" style={{ background: 'rgba(61,52,80,0.17)' }} />
          Not enabled
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full inline-block" style={{ border: '1px solid rgba(61,52,80,0.38)' }} />
          Enabled, needs data
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full inline-block" style={{ background: '#8A72B8' }} />
          Active & filled
        </span>
      </div>

      <p className="text-xs text-center" style={{ color: 'rgba(105,95,128,0.5)', maxWidth: 260 }}>
        {completedCount === 0 ? "Tap any node to enable or fill in your profile" :
         completedCount === TOTAL ? "✦ Your full blueprint is activated" :
         `${completedCount} of ${TOTAL} systems activated — tap to explore`}
      </p>
    </div>
  );
}