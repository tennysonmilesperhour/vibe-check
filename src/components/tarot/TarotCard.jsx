import React, { useState } from "react";

// ── Card Back — original cosmic SVG design ───────────────────────────────────
function CardBack() {
  return (
    <svg viewBox="0 0 120 200" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
      <defs>
        <radialGradient id="bg-back" cx="50%" cy="50%" r="70%">
          <stop offset="0%" stopColor="#1e0a3c"/>
          <stop offset="100%" stopColor="#04021a"/>
        </radialGradient>
        <radialGradient id="glow-center" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.6"/>
          <stop offset="100%" stopColor="#7c3aed" stopOpacity="0"/>
        </radialGradient>
      </defs>
      {/* Background */}
      <rect width="120" height="200" rx="7" fill="url(#bg-back)"/>
      {/* Border */}
      <rect x="3" y="3" width="114" height="194" rx="5" fill="none" stroke="#6d28d9" strokeWidth="1.2" opacity="0.7"/>
      <rect x="6" y="6" width="108" height="188" rx="4" fill="none" stroke="#8b5cf6" strokeWidth="0.5" opacity="0.4"/>
      {/* Glow orb */}
      <circle cx="60" cy="100" r="52" fill="url(#glow-center)"/>
      {/* Flower of Life — 7 overlapping circles */}
      {[
        [60,100],[60,79],[79,89.5],[79,110.5],[60,121],[41,110.5],[41,89.5]
      ].map(([cx,cy],i) => (
        <circle key={i} cx={cx} cy={cy} r="21" fill="none" stroke="#c084fc" strokeWidth="0.7" opacity="0.45"/>
      ))}
      {/* Outer circle */}
      <circle cx="60" cy="100" r="42" fill="none" stroke="#818cf8" strokeWidth="0.8" opacity="0.3"/>
      <circle cx="60" cy="100" r="52" fill="none" stroke="#c084fc" strokeWidth="0.5" opacity="0.2"/>
      {/* 12-pointed star */}
      {Array.from({length:12}).map((_,i) => {
        const a = (i*30) * Math.PI/180;
        const a2 = ((i*30)+15) * Math.PI/180;
        const x1=60+42*Math.cos(a), y1=100+42*Math.sin(a);
        const x2=60+48*Math.cos(a2), y2=100+48*Math.sin(a2);
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#38bdf8" strokeWidth="0.6" opacity="0.35"/>;
      })}
      {/* 6-pointed star (Star of David) */}
      <polygon points="60,62 70.4,79.5 49.6,79.5" fill="none" stroke="#c084fc" strokeWidth="0.8" opacity="0.5"/>
      <polygon points="60,138 70.4,120.5 49.6,120.5" fill="none" stroke="#c084fc" strokeWidth="0.8" opacity="0.5"/>
      {/* Center dot */}
      <circle cx="60" cy="100" r="4" fill="#c084fc" opacity="0.7"/>
      <circle cx="60" cy="100" r="2" fill="#f0e6ff" opacity="0.9"/>
      {/* Corner stars */}
      {[[12,18],[108,18],[12,182],[108,182]].map(([cx,cy],i) => (
        <g key={i} transform={`translate(${cx},${cy})`}>
          <line x1="0" y1="-5" x2="0" y2="5" stroke="#818cf8" strokeWidth="0.8" opacity="0.6"/>
          <line x1="-5" y1="0" x2="5" y2="0" stroke="#818cf8" strokeWidth="0.8" opacity="0.6"/>
          <line x1="-3.5" y1="-3.5" x2="3.5" y2="3.5" stroke="#818cf8" strokeWidth="0.6" opacity="0.4"/>
          <line x1="3.5" y1="-3.5" x2="-3.5" y2="3.5" stroke="#818cf8" strokeWidth="0.6" opacity="0.4"/>
          <circle cx="0" cy="0" r="1.2" fill="#c084fc" opacity="0.8"/>
        </g>
      ))}
      {/* Bottom label */}
      <text x="60" y="192" textAnchor="middle" fontSize="5" fill="#6d28d9" opacity="0.7" letterSpacing="2" fontFamily="serif">✦ COSMIC WISDOM ✦</text>
    </svg>
  );
}

// ── Card Front — original symbolic SVG art ───────────────────────────────────
function CardFront({ card, reversed }) {
  const isMajor = card.id < 22;
  const c = card.color;

  // Hex to RGB helper for gradient stops
  const hexAlpha = (hex, alpha) => {
    const r = parseInt(hex.slice(1,3),16);
    const g = parseInt(hex.slice(3,5),16);
    const b = parseInt(hex.slice(5,7),16);
    return `rgba(${r},${g},${b},${alpha})`;
  };

  return (
    <svg viewBox="0 0 120 200" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%"
      style={{ transform: reversed ? 'rotate(180deg)' : 'none' }}>
      <defs>
        <radialGradient id={`bg-${card.id}`} cx="50%" cy="45%" r="70%">
          <stop offset="0%" stopColor="#1a0a32"/>
          <stop offset="100%" stopColor="#04020e"/>
        </radialGradient>
        <radialGradient id={`glow-${card.id}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={c} stopOpacity="0.3"/>
          <stop offset="100%" stopColor={c} stopOpacity="0"/>
        </radialGradient>
      </defs>
      {/* Background */}
      <rect width="120" height="200" rx="7" fill={`url(#bg-${card.id})`}/>
      {/* Subtle color wash */}
      <rect width="120" height="200" rx="7" fill={c} opacity="0.06"/>
      {/* Border */}
      <rect x="3" y="3" width="114" height="194" rx="5" fill="none" stroke={c} strokeWidth="1.2" opacity="0.6"/>
      <rect x="6" y="6" width="108" height="188" rx="4" fill="none" stroke={c} strokeWidth="0.5" opacity="0.3"/>
      {/* Top roman numeral / court label */}
      <text x="60" y="20" textAnchor="middle" fontSize="9" fill={c} opacity="0.8" fontFamily="Georgia, serif" fontWeight="bold">
        {card.roman}
      </text>
      {/* Divider */}
      <line x1="15" y1="24" x2="105" y2="24" stroke={c} strokeWidth="0.5" opacity="0.3"/>
      {/* Center glow */}
      <circle cx="60" cy="100" r="42" fill={`url(#glow-${card.id})`}/>
      {/* Decorative circle rings */}
      <circle cx="60" cy="100" r="38" fill="none" stroke={c} strokeWidth="0.6" opacity="0.25"/>
      <circle cx="60" cy="100" r="28" fill="none" stroke={c} strokeWidth="0.8" opacity="0.2"/>
      {/* Symbol — large central glyph */}
      <text x="60" y="115" textAnchor="middle" fontSize="36" dominantBaseline="middle" opacity="0.9">
        {card.symbol}
      </text>
      {/* For major arcana: decorative radial lines */}
      {isMajor && Array.from({length:8}).map((_,i) => {
        const a = (i*45) * Math.PI/180;
        const x1=60+30*Math.cos(a), y1=100+30*Math.sin(a);
        const x2=60+40*Math.cos(a), y2=100+40*Math.sin(a);
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={c} strokeWidth="0.8" opacity="0.35"/>;
      })}
      {/* Bottom divider */}
      <line x1="15" y1="143" x2="105" y2="143" stroke={c} strokeWidth="0.5" opacity="0.3"/>
      {/* Card name */}
      <text x="60" y="158" textAnchor="middle" fontSize="8.5" fill={c} fontFamily="Georgia, serif" fontWeight="bold" opacity="0.9">
        {card.name.length > 16 ? card.name.slice(0,15)+'…' : card.name}
      </text>
      {/* Keywords */}
      <text x="60" y="171" textAnchor="middle" fontSize="6" fill={c} opacity="0.55" fontFamily="Georgia, serif">
        {card.keywords.slice(0,2).join('  ·  ')}
      </text>
      {/* Reversed indicator */}
      {reversed && (
        <text x="60" y="185" textAnchor="middle" fontSize="5.5" fill="#f472b6" opacity="0.7" fontFamily="serif" letterSpacing="1">
          ▽ REVERSED
        </text>
      )}
      {/* Corner ornaments */}
      {[[10,12],[110,12],[10,188],[110,188]].map(([cx,cy],i) => (
        <text key={i} x={cx} y={cy} textAnchor="middle" fontSize="6" fill={c} opacity="0.4" fontFamily="serif">✦</text>
      ))}
    </svg>
  );
}

// ── The Flipping Card ────────────────────────────────────────────────────────
export default function TarotCard({ card, reversed = false, size = "md", onClick, disabled = false, label }) {
  const [flipped, setFlipped] = useState(false);

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
      setFlipped(true);
      if (onClick) onClick(card, reversed);
    }
  };

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div
        onClick={handleClick}
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
          transition: 'transform 0.65s cubic-bezier(0.4, 0, 0.2, 1)',
          transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}>
          {/* Back face */}
          <div style={{
            position: 'absolute', width: '100%', height: '100%',
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            borderRadius: 7,
            overflow: 'hidden',
            boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
          }}>
            {!flipped && (
              <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0, height: '30%',
                background: 'linear-gradient(to top, rgba(124,58,237,0.15), transparent)',
                pointerEvents: 'none', borderRadius: '0 0 7px 7px',
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
            borderRadius: 7,
            overflow: 'hidden',
            boxShadow: `0 4px 28px rgba(0,0,0,0.6), 0 0 20px ${card?.color || '#7c3aed'}30`,
          }}>
            <CardFront card={card} reversed={reversed} />
          </div>
        </div>
      </div>
      {label && (
        <span style={{ fontSize: 10, color: 'rgba(180,170,210,0.55)', textAlign: 'center', maxWidth: w, fontFamily: 'Space Grotesk, sans-serif' }}>
          {label}
        </span>
      )}
    </div>
  );
}