import React, { useState } from "react";
import CardGeometry from "./CardGeometry";

// ── Card Back: original cosmic SVG design ───────────────────────────────────
function CardBack() {
  return (
    <svg viewBox="0 0 120 200" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
      <defs>
        <radialGradient id="bg-back" cx="50%" cy="50%" r="70%">
          <stop offset="0%" stopColor="#2E1418"/>
          <stop offset="100%" stopColor="#1A0A0E"/>
        </radialGradient>
        <radialGradient id="glow-center" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#D96A45" stopOpacity="0.6"/>
          <stop offset="100%" stopColor="#D96A45" stopOpacity="0"/>
        </radialGradient>
      </defs>
      {/* Background */}
      <rect width="120" height="200" rx="7" fill="url(#bg-back)"/>
      {/* Border */}
      <rect x="3" y="3" width="114" height="194" rx="5" fill="none" stroke="#C99A3F" strokeWidth="1.2" opacity="0.7"/>
      <rect x="6" y="6" width="108" height="188" rx="4" fill="none" stroke="#E8975A" strokeWidth="0.5" opacity="0.4"/>
      {/* Glow orb */}
      <circle cx="60" cy="100" r="52" fill="url(#glow-center)"/>
      {/* Flower of Life: 7 overlapping circles */}
      {[
        [60,100],[60,79],[79,89.5],[79,110.5],[60,121],[41,110.5],[41,89.5]
      ].map(([cx,cy],i) => (
        <circle key={i} cx={cx} cy={cy} r="21" fill="none" stroke="#FDC94E" strokeWidth="0.7" opacity="0.45"/>
      ))}
      {/* Outer circle */}
      <circle cx="60" cy="100" r="42" fill="none" stroke="#F5A25E" strokeWidth="0.8" opacity="0.3"/>
      <circle cx="60" cy="100" r="52" fill="none" stroke="#FDC94E" strokeWidth="0.5" opacity="0.2"/>
      {/* 12-pointed star */}
      {Array.from({length:12}).map((_,i) => {
        const a = (i*30) * Math.PI/180;
        const a2 = ((i*30)+15) * Math.PI/180;
        const x1=60+42*Math.cos(a), y1=100+42*Math.sin(a);
        const x2=60+48*Math.cos(a2), y2=100+48*Math.sin(a2);
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#38bdf8" strokeWidth="0.6" opacity="0.35"/>;
      })}
      {/* 6-pointed star (Star of David) */}
      <polygon points="60,62 70.4,79.5 49.6,79.5" fill="none" stroke="#FDC94E" strokeWidth="0.8" opacity="0.5"/>
      <polygon points="60,138 70.4,120.5 49.6,120.5" fill="none" stroke="#FDC94E" strokeWidth="0.8" opacity="0.5"/>
      {/* Center dot */}
      <circle cx="60" cy="100" r="4" fill="#FDC94E" opacity="0.7"/>
      <circle cx="60" cy="100" r="2" fill="#FFFDF6" opacity="0.9"/>
      {/* Corner stars */}
      {[[12,18],[108,18],[12,182],[108,182]].map(([cx,cy],i) => (
        <g key={i} transform={`translate(${cx},${cy})`}>
          <line x1="0" y1="-5" x2="0" y2="5" stroke="#F5A25E" strokeWidth="0.8" opacity="0.6"/>
          <line x1="-5" y1="0" x2="5" y2="0" stroke="#F5A25E" strokeWidth="0.8" opacity="0.6"/>
          <line x1="-3.5" y1="-3.5" x2="3.5" y2="3.5" stroke="#F5A25E" strokeWidth="0.6" opacity="0.4"/>
          <line x1="3.5" y1="-3.5" x2="-3.5" y2="3.5" stroke="#F5A25E" strokeWidth="0.6" opacity="0.4"/>
          <circle cx="0" cy="0" r="1.2" fill="#FDC94E" opacity="0.8"/>
        </g>
      ))}
      {/* Bottom label */}
      <text x="60" y="192" textAnchor="middle" fontSize="5" fill="#C99A3F" opacity="0.7" letterSpacing="2" fontFamily="serif">✦ COSMIC WISDOM ✦</text>
    </svg>
  );
}

// ── Card Front: geometry-based SVG art ─────────────────────────────────────
function CardFront({ card, reversed }) {
  const c = card.color;
  const isMajor = card.id < 22;

  return (
    <svg viewBox="0 0 120 200" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%"
      style={{ transform: reversed ? 'rotate(180deg)' : 'none' }}>
      <defs>
        <radialGradient id={`bg-${card.id}`} cx="50%" cy="45%" r="70%">
          <stop offset="0%" stopColor="#2E1418"/>
          <stop offset="100%" stopColor="#180A0D"/>
        </radialGradient>
        <radialGradient id={`glow-${card.id}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={c} stopOpacity="0.25"/>
          <stop offset="100%" stopColor={c} stopOpacity="0"/>
        </radialGradient>
      </defs>
      {/* Background */}
      <rect width="120" height="200" rx="7" fill={`url(#bg-${card.id})`}/>
      <rect width="120" height="200" rx="7" fill={c} opacity="0.05"/>
      {/* Border */}
      <rect x="3" y="3" width="114" height="194" rx="5" fill="none" stroke={c} strokeWidth="1.2" opacity="0.55"/>
      <rect x="6" y="6" width="108" height="188" rx="4" fill="none" stroke={c} strokeWidth="0.5" opacity="0.25"/>
      {/* Top roman numeral */}
      <text x="60" y="20" textAnchor="middle" fontSize="9" fill={c} opacity="0.75"
        fontFamily="Georgia, serif" fontWeight="bold">{card.roman}</text>
      <line x1="15" y1="24" x2="105" y2="24" stroke={c} strokeWidth="0.5" opacity="0.25"/>
      {/* Glow */}
      <circle cx="60" cy="100" r="46" fill={`url(#glow-${card.id})`}/>
      {/* Sacred geometry: rendered via CardGeometry as foreignObject */}
      <foreignObject x="12" y="30" width="96" height="110">
        <div
          style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <CardGeometry type={card.geoType} color={c} size={88}/>
        </div>
      </foreignObject>
      {/* Bottom section */}
      <line x1="15" y1="145" x2="105" y2="145" stroke={c} strokeWidth="0.5" opacity="0.25"/>
      <text x="60" y="159" textAnchor="middle" fontSize="8" fill={c}
        fontFamily="Georgia, serif" fontWeight="bold" opacity="0.88">
        {card.name.length > 17 ? card.name.slice(0,16)+'…' : card.name}
      </text>
      <text x="60" y="171" textAnchor="middle" fontSize="5.8" fill={c} opacity="0.5"
        fontFamily="Georgia, serif">
        {card.keywords.slice(0,2).join('  ·  ')}
      </text>
      {reversed && (
        <text x="60" y="184" textAnchor="middle" fontSize="5.5" fill="#f472b6" opacity="0.65"
          fontFamily="serif" letterSpacing="1">▽ REVERSED</text>
      )}
      {/* Corner marks */}
      {[[10,13],[110,13],[10,189],[110,189]].map(([x,y],i) => (
        <line key={i}
          x1={x-(i%2===0?2:-2)} y1={y}
          x2={x+(i%2===0?2:-2)} y2={y}
          stroke={c} strokeWidth="0.8" opacity="0.35"/>
      ))}
      {[[10,13],[110,13],[10,189],[110,189]].map(([x,y],i) => (
        <line key={`v${i}`} x1={x} y1={y-2} x2={x} y2={y+2}
          stroke={c} strokeWidth="0.8" opacity="0.35"/>
      ))}
    </svg>
  );
}

// ── The Flipping Card ────────────────────────────────────────────────────────
// Controlled when a `flipped` prop is provided (lets "Reveal all" actually
// flip the faces: the old internal-only state could not be driven from
// outside); falls back to self-managed flipping when uncontrolled.
export default function TarotCard({ card, reversed = false, size = "md", onClick, disabled = false, label, flipped: flippedProp }) {
  const [flippedSelf, setFlippedSelf] = useState(false);
  const isControlled = flippedProp !== undefined;
  const flipped = isControlled ? flippedProp : flippedSelf;

  const sizes = {
    sm: { w: 60,  h: 100 },
    md: { w: 80,  h: 133 },
    lg: { w: 110, h: 183 },
    xl: { w: 140, h: 233 },
  };
  const { w, h } = sizes[size] || sizes.md;

  const handleClick = () => {
    if (disabled) return;
    if (!flipped) {
      if (!isControlled) setFlippedSelf(true);
      if (onClick) onClick(card, reversed);
    }
  };

  return (
    <div className="flex flex-col items-center gap-1.5">
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled || flipped}
        aria-label={flipped ? `${card.name}${reversed ? ", reversed" : ""}, revealed` : `Reveal ${label || "card"}`}
        className="tarot-card-button"
        style={{
          width: w, height: h,
          cursor: disabled ? 'default' : flipped ? 'default' : 'pointer',
          perspective: '800px',
          flexShrink: 0,
        }}
      >
        <div style={{
          width: '100%', height: '100%',
          position: 'relative',
          transformStyle: 'preserve-3d',
          transition: 'transform 0.42s cubic-bezier(0.22, 1, 0.36, 1)',
          transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}>
          {/* Back face */}
          <div style={{
            position: 'absolute', width: '100%', height: '100%',
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            borderRadius: 10,
            overflow: 'hidden',
            boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
          }}>
            {!flipped && (
              <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0, height: '30%',
                background: 'linear-gradient(to top, rgba(253,201,78,0.15), transparent)',
                pointerEvents: 'none', borderRadius: '0 0 10px 10px',
              }}/>
            )}
            <CardBack />
          </div>
          {/* Front face */}
          <div style={{
            position: 'absolute', width: '100%', height: '100%',
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            borderRadius: 10,
            overflow: 'hidden',
            boxShadow: `0 4px 28px rgba(0,0,0,0.6), 0 0 20px ${card?.color || '#D96A45'}30`,
          }}>
            <CardFront card={card} reversed={reversed} />
          </div>
        </div>
      </button>
      {label && (
        <span style={{ fontSize: 10, color: 'rgba(245,229,216,0.55)', textAlign: 'center', maxWidth: w, fontFamily: 'Space Grotesk, sans-serif' }}>
          {label}
        </span>
      )}
    </div>
  );
}
