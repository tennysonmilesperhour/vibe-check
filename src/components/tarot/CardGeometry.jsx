import React from "react";

// ── Sacred Geometry renderer — one per card archetype ───────────────────────
// All shapes are original SVG geometry, no text/emoji, purely symbolic

import { polar, starPoints, pts } from "@/lib/geometry";

const π = Math.PI;
const cos = Math.cos, sin = Math.sin;

export default function CardGeometry({ type, color, size = 36 }) {
  const s = size;
  const cx = s / 2, cy = s / 2, r = s * 0.42;

  const stroke = color;
  const fill = `${color}18`;
  const fillMid = `${color}30`;
  const sw = s * 0.028; // strokeWidth base
  const sw2 = sw * 0.6;

  const geo = {

    // ── Major Arcana ─────────────────────────────────────────────────────────

    // 0 The Fool — open spiral path launching off a cliff edge (beginning)
    "open-spiral": () => {
      let d = `M ${cx} ${cy}`;
      for (let i = 0; i < 540; i += 6) {
        const a = (i - 90) * π / 180;
        const rr = (i / 540) * r * 0.85;
        d += ` L ${cx + rr * cos(a)} ${cy + rr * sin(a)}`;
      }
      return (
        <g>
          <path d={d} fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round" opacity="0.85"/>
          <circle cx={cx} cy={cy} r={sw} fill={stroke} opacity="0.9"/>
          {/* launch dot at tip */}
          {(() => { const a = (450-90)*π/180; const rr=r*0.85; return <circle cx={cx+rr*cos(a)} cy={cy+rr*sin(a)} r={sw*1.5} fill={stroke} opacity="0.9"/>; })()}
        </g>
      );
    },

    // I The Magician — caduceus: two serpents around a staff, infinity above
    "caduceus": () => {
      const staffX = cx;
      return (
        <g>
          {/* Staff */}
          <line x1={staffX} y1={cy-r} x2={staffX} y2={cy+r} stroke={stroke} strokeWidth={sw} strokeLinecap="round"/>
          {/* Lemniscate ∞ above */}
          {(() => {
            const a = r * 0.28, b = r * 0.14, yy = cy - r * 0.72;
            const d = `M ${cx} ${yy} C ${cx+a} ${yy-b} ${cx+a*2} ${yy+b} ${cx} ${yy} C ${cx-a*2} ${yy-b} ${cx-a} ${yy+b} ${cx} ${yy}`;
            return <path d={d} fill="none" stroke={stroke} strokeWidth={sw2} opacity="0.85"/>;
          })()}
          {/* Two serpent waves */}
          {[1, -1].map((dir, i) => {
            const segs = 8;
            let d = `M ${staffX + dir * r * 0.3} ${cy - r * 0.65}`;
            for (let j = 0; j <= segs; j++) {
              const t = j / segs;
              const yy = cy - r * 0.65 + t * r * 1.3;
              const wave = dir * r * 0.28 * cos(t * π * 3);
              d += ` L ${staffX + wave} ${yy}`;
            }
            return <path key={i} d={d} fill="none" stroke={stroke} strokeWidth={sw2} strokeLinecap="round" opacity="0.65"/>;
          })}
        </g>
      );
    },

    // II High Priestess — thin crescent with triple pillar lines between
    "crescent-pillars": () => {
      const moonR = r * 0.8;
      const start = (210 - 90) * π/180, end = (330 - 90) * π/180;
      const x1 = cx + moonR * cos(start), y1 = cy + moonR * sin(start);
      const x2 = cx + moonR * cos(end), y2 = cy + moonR * sin(end);
      return (
        <g>
          {/* Crescent arc */}
          <path d={`M ${x1} ${y1} A ${moonR} ${moonR} 0 0 1 ${x2} ${y2}`}
            fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round"/>
          {/* Inner crescent offset */}
          <path d={`M ${x1+sw*0.8} ${y1} A ${moonR*0.7} ${moonR*0.7} 0 0 1 ${x2+sw*0.8} ${y2}`}
            fill="none" stroke={stroke} strokeWidth={sw2} strokeLinecap="round" opacity="0.4"/>
          {/* Veil — three vertical lines */}
          {[-r*0.25, 0, r*0.25].map((dx, i) => (
            <line key={i} x1={cx+dx} y1={cy-r*0.1} x2={cx+dx} y2={cy+r*0.7}
              stroke={stroke} strokeWidth={sw2} opacity={0.35 + i * 0.1}/>
          ))}
          {/* Star at crown */}
          <polygon points={pts(starPoints(cx, cy-r*0.85, r*0.1, r*0.04, 5))} fill={stroke} opacity="0.8"/>
        </g>
      );
    },

    // III The Empress — Venus symbol: circle with cross below + spiral
    "venus-spiral": () => {
      const spiralSteps = 360;
      let d = '';
      for (let i = 0; i <= spiralSteps; i++) {
        const t = i / spiralSteps;
        const a = t * 3 * π * 2 - π/2;
        const rr = r * 0.5 * t;
        const x = cx + rr * cos(a), y = cy - r*0.2 + rr * sin(a);
        d += i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
      }
      return (
        <g>
          {/* Circle of Venus */}
          <circle cx={cx} cy={cy - r*0.3} r={r*0.45} fill="none" stroke={stroke} strokeWidth={sw}/>
          {/* Cross below */}
          <line x1={cx} y1={cy+r*0.15} x2={cx} y2={cy+r*0.75} stroke={stroke} strokeWidth={sw}/>
          <line x1={cx-r*0.28} y1={cy+r*0.45} x2={cx+r*0.28} y2={cy+r*0.45} stroke={stroke} strokeWidth={sw}/>
          {/* Spiral center */}
          <path d={d} fill="none" stroke={stroke} strokeWidth={sw2} opacity="0.5"/>
        </g>
      );
    },

    // IV The Emperor — upward triangle within square, stability geometry
    "triangle-square": () => {
      const sq = r * 0.85;
      const triH = r * 0.75;
      return (
        <g>
          {/* Square */}
          <rect x={cx-sq} y={cy-sq} width={sq*2} height={sq*2} fill={fill} stroke={stroke} strokeWidth={sw}/>
          {/* Inner triangle */}
          <polygon points={pts([[cx, cy-triH*0.9], [cx+triH*0.78, cy+triH*0.45], [cx-triH*0.78, cy+triH*0.45]])}
            fill={fillMid} stroke={stroke} strokeWidth={sw}/>
          {/* Center point */}
          <circle cx={cx} cy={cy} r={sw*1.5} fill={stroke} opacity="0.9"/>
          {/* Corner marks */}
          {[[-sq,-sq],[sq,-sq],[sq,sq],[-sq,sq]].map(([dx,dy],i) => (
            <circle key={i} cx={cx+dx} cy={cy+dy} r={sw} fill={stroke} opacity="0.6"/>
          ))}
        </g>
      );
    },

    // V The Hierophant — double cross (papal cross) with three bars
    "papal-cross": () => {
      const h = r * 1.8, staffX = cx;
      const bars = [r*0.7, r*0.2, -r*0.3];
      const widths = [r*0.75, r*0.55, r*0.35];
      return (
        <g>
          <line x1={staffX} y1={cy+h/2} x2={staffX} y2={cy-h/2} stroke={stroke} strokeWidth={sw} strokeLinecap="round"/>
          {bars.map((dy, i) => (
            <line key={i} x1={staffX - widths[i]} y1={cy - dy} x2={staffX + widths[i]} y2={cy - dy}
              stroke={stroke} strokeWidth={sw * (1 - i * 0.15)} strokeLinecap="round" opacity={1 - i * 0.1}/>
          ))}
          {/* Keystone at top */}
          <circle cx={cx} cy={cy - h/2 + sw} r={sw * 2} fill={stroke} opacity="0.7"/>
        </g>
      );
    },

    // VI The Lovers — vesica piscis (two overlapping circles = sacred union)
    "vesica": () => {
      const offset = r * 0.42;
      return (
        <g>
          <circle cx={cx - offset} cy={cy} r={r*0.75} fill={fill} stroke={stroke} strokeWidth={sw} opacity="0.9"/>
          <circle cx={cx + offset} cy={cy} r={r*0.75} fill={fill} stroke={stroke} strokeWidth={sw} opacity="0.9"/>
          {/* Vesica center glow */}
          <ellipse cx={cx} cy={cy} rx={offset*0.62} ry={r*0.68} fill={fillMid} stroke={stroke} strokeWidth={sw2} opacity="0.7"/>
          {/* Top and bottom points of vesica */}
          {[cy-r*0.68, cy+r*0.68].map((yy,i) => (
            <circle key={i} cx={cx} cy={yy} r={sw*1.3} fill={stroke} opacity="0.8"/>
          ))}
        </g>
      );
    },

    // VII The Chariot — cube in perspective with motion lines
    "cube-motion": () => {
      const front = { x1:cx-r*0.5, y1:cy, x2:cx+r*0.5, y2:cy+r*0.8 };
      const offset = r * 0.3;
      return (
        <g>
          {/* Front face */}
          <rect x={cx-r*0.5} y={cy} width={r} height={r*0.8} fill={fill} stroke={stroke} strokeWidth={sw}/>
          {/* Top face */}
          <polygon points={pts([[cx-r*0.5,cy],[cx+r*0.5,cy],[cx+r*0.5+offset,cy-offset],[cx-r*0.5+offset,cy-offset]])}
            fill={fillMid} stroke={stroke} strokeWidth={sw}/>
          {/* Right face */}
          <polygon points={pts([[cx+r*0.5,cy],[cx+r*0.5,cy+r*0.8],[cx+r*0.5+offset,cy+r*0.8-offset],[cx+r*0.5+offset,cy-offset]])}
            fill={fill} stroke={stroke} strokeWidth={sw}/>
          {/* Motion streaks left */}
          {[-r*0.2, -r*0.05, r*0.05].map((dy, i) => (
            <line key={i} x1={cx-r*0.7} y1={cy+dy} x2={cx-r*1.1} y2={cy+dy}
              stroke={stroke} strokeWidth={sw2} opacity={0.6 - i*0.15}/>
          ))}
        </g>
      );
    },

    // VIII Strength — lemniscate (infinity loop) with downward weight
    "lemniscate": () => {
      const a = r * 0.75, b = r * 0.32, yBase = cy;
      const d = `M ${cx} ${yBase}
        C ${cx+a} ${yBase-b} ${cx+a*2} ${yBase+b} ${cx} ${yBase}
        C ${cx-a*2} ${yBase-b} ${cx-a} ${yBase+b} ${cx} ${yBase}`;
      return (
        <g>
          <path d={d} fill={fill} stroke={stroke} strokeWidth={sw} opacity="0.9"/>
          {/* Small vertical line of gentle grounding */}
          <line x1={cx} y1={yBase} x2={cx} y2={cy+r*0.65} stroke={stroke} strokeWidth={sw2} opacity="0.5"/>
          <circle cx={cx} cy={cy+r*0.65} r={sw*2} fill={stroke} opacity="0.6"/>
          {/* Center crossing dot */}
          <circle cx={cx} cy={yBase} r={sw*1.5} fill={stroke} opacity="0.85"/>
        </g>
      );
    },

    // IX The Hermit — hexagon lantern shape with single ray upward
    "lantern": () => {
      const hex = Array.from({length:6}, (_,i) => polar(cx, cy+r*0.1, r*0.6, i*60));
      return (
        <g>
          {/* Hexagon body */}
          <polygon points={pts(hex)} fill={fill} stroke={stroke} strokeWidth={sw}/>
          {/* Inner hex */}
          <polygon points={pts(Array.from({length:6}, (_,i) => polar(cx, cy+r*0.1, r*0.35, i*60+30)))}
            fill="none" stroke={stroke} strokeWidth={sw2} opacity="0.45"/>
          {/* Flame ray upward */}
          <line x1={cx} y1={cy-r*0.5} x2={cx} y2={cy-r*0.98} stroke={stroke} strokeWidth={sw} strokeLinecap="round"/>
          {/* Small diamond at tip */}
          <polygon points={pts([[cx,cy-r],[cx+sw*2,cy-r*0.82],[cx,cy-r*0.65],[cx-sw*2,cy-r*0.82]])} fill={stroke} opacity="0.85"/>
          {/* Staff */}
          <line x1={cx+r*0.55} y1={cy-r*0.5} x2={cx+r*0.55} y2={cy+r}
            stroke={stroke} strokeWidth={sw2} strokeLinecap="round" opacity="0.55"/>
        </g>
      );
    },

    // X Wheel of Fortune — spoked wheel with alchemical symbols at quarters
    "spoked-wheel": () => {
      const spokes = 8;
      return (
        <g>
          <circle cx={cx} cy={cy} r={r*0.9} fill="none" stroke={stroke} strokeWidth={sw}/>
          <circle cx={cx} cy={cy} r={r*0.55} fill={fill} stroke={stroke} strokeWidth={sw2} opacity="0.7"/>
          <circle cx={cx} cy={cy} r={r*0.15} fill={stroke} opacity="0.8"/>
          {Array.from({length:spokes}, (_,i) => {
            const [x1,y1] = polar(cx, cy, r*0.15, i*(360/spokes));
            const [x2,y2] = polar(cx, cy, r*0.9, i*(360/spokes));
            return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={stroke} strokeWidth={sw2} opacity="0.75"/>;
          })}
          {/* Four cardinal diamonds */}
          {[0,90,180,270].map((a,i) => {
            const [x,y] = polar(cx, cy, r*0.72, a);
            return <polygon key={i} points={pts([[x,y-sw*2.5],[x+sw*2.5,y],[x,y+sw*2.5],[x-sw*2.5,y]])} fill={stroke} opacity="0.75"/>;
          })}
        </g>
      );
    },

    // XI Justice — balanced scale geometry: beam + two pans
    "scales": () => {
      const beamY = cy - r*0.15;
      return (
        <g>
          {/* Pillar */}
          <line x1={cx} y1={cy+r*0.85} x2={cx} y2={cy-r*0.65} stroke={stroke} strokeWidth={sw} strokeLinecap="round"/>
          {/* Beam */}
          <line x1={cx-r*0.8} y1={beamY} x2={cx+r*0.8} y2={beamY} stroke={stroke} strokeWidth={sw} strokeLinecap="round"/>
          {/* Chains */}
          {[-1,1].map(dir => (
            <line key={dir} x1={cx+dir*r*0.8} y1={beamY} x2={cx+dir*r*0.8} y2={beamY+r*0.5}
              stroke={stroke} strokeWidth={sw2} strokeDasharray={`${sw*2} ${sw*1.5}`} opacity="0.7"/>
          ))}
          {/* Pans */}
          {[-1,1].map(dir => (
            <path key={dir} d={`M ${cx+dir*r*1.0} ${beamY+r*0.5} A ${r*0.2} ${r*0.12} 0 0 0 ${cx+dir*r*0.6} ${beamY+r*0.5}`}
              fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round"/>
          ))}
          {/* Crown at top */}
          <polygon points={pts([[cx,cy-r*0.85],[cx-r*0.14,cy-r*0.65],[cx+r*0.14,cy-r*0.65]])} fill={stroke} opacity="0.75"/>
        </g>
      );
    },

    // XII Hanged Man — downward triangle with single point, suspended
    "triangle-down-suspended": () => {
      const triR = r*0.7;
      const ty = cy + r*0.15;
      return (
        <g>
          {/* Crossbeam */}
          <line x1={cx-r*0.85} y1={cy-r*0.8} x2={cx+r*0.85} y2={cy-r*0.8} stroke={stroke} strokeWidth={sw} strokeLinecap="round"/>
          {/* Suspension cord */}
          <line x1={cx} y1={cy-r*0.8} x2={cx} y2={ty-triR*0.87}
            stroke={stroke} strokeWidth={sw2} strokeDasharray={`${sw*2} ${sw}`} opacity="0.65"/>
          {/* Inverted triangle */}
          <polygon points={pts([[cx-triR*0.87, ty-triR*0.5],[cx+triR*0.87, ty-triR*0.5],[cx, ty+triR*0.5]])}
            fill={fill} stroke={stroke} strokeWidth={sw}/>
          {/* Radiance from apex (bottom) */}
          {[-35,-20,0,20,35].map((a,i) => {
            const [x2,y2] = polar(cx, ty+triR*0.5, r*0.22, a+180);
            return <line key={i} x1={cx} y1={ty+triR*0.5} x2={x2} y2={y2}
              stroke={stroke} strokeWidth={sw2} opacity={0.7-i*0.05} strokeLinecap="round"/>;
          })}
        </g>
      );
    },

    // XIII Death — scythe: arc blade + staff, rose at base
    "scythe": () => {
      return (
        <g>
          {/* Staff diagonal */}
          <line x1={cx-r*0.1} y1={cy+r*0.9} x2={cx+r*0.4} y2={cy-r*0.9}
            stroke={stroke} strokeWidth={sw} strokeLinecap="round"/>
          {/* Scythe blade arc */}
          <path d={`M ${cx+r*0.4} ${cy-r*0.9} A ${r*0.9} ${r*0.9} 0 0 1 ${cx-r*0.75} ${cy-r*0.1}`}
            fill="none" stroke={stroke} strokeWidth={sw*1.3} strokeLinecap="round"/>
          {/* Blade inner arc (taper) */}
          <path d={`M ${cx+r*0.25} ${cy-r*0.75} A ${r*0.7} ${r*0.7} 0 0 1 ${cx-r*0.58} ${cy-r*0.12}`}
            fill="none" stroke={stroke} strokeWidth={sw2} opacity="0.45"/>
          {/* White rose (circle + petals) at base */}
          <circle cx={cx-r*0.1} cy={cy+r*0.9} r={r*0.12} fill={fill} stroke={stroke} strokeWidth={sw2}/>
          {[0,72,144,216,288].map((a,i) => {
            const [px,py] = polar(cx-r*0.1, cy+r*0.9, r*0.2, a);
            return <circle key={i} cx={px} cy={py} r={r*0.07} fill="none" stroke={stroke} strokeWidth={sw2} opacity="0.55"/>;
          })}
        </g>
      );
    },

    // XIV Temperance — two triangles with flowing wave between (alchemy: water poured)
    "flow-triangles": () => {
      const waveY = cy;
      let wavePath = `M ${cx-r*0.85} ${waveY}`;
      for (let i = 0; i <= 20; i++) {
        const t = i / 20;
        const x = cx - r*0.85 + t * r * 1.7;
        const y = waveY + sin(t * π * 3) * r * 0.28;
        wavePath += ` L ${x} ${y}`;
      }
      return (
        <g>
          {/* Upper triangle (fire/active) */}
          <polygon points={pts([[cx, cy-r*0.95],[cx-r*0.65,cy-r*0.1],[cx+r*0.65,cy-r*0.1]])}
            fill={fill} stroke={stroke} strokeWidth={sw}/>
          {/* Lower triangle (water/passive) inverted */}
          <polygon points={pts([[cx, cy+r*0.95],[cx-r*0.65,cy+r*0.1],[cx+r*0.65,cy+r*0.1]])}
            fill={fill} stroke={stroke} strokeWidth={sw}/>
          {/* Flow wave */}
          <path d={wavePath} fill="none" stroke={stroke} strokeWidth={sw*1.3} strokeLinecap="round" opacity="0.85"/>
          {/* Center iris */}
          <circle cx={cx} cy={cy} r={r*0.12} fill={stroke} opacity="0.7"/>
        </g>
      );
    },

    // XV The Devil — inverted pentagram in circle
    "inverted-pentagram": () => {
      const pts5 = Array.from({length:5}, (_,i) => polar(cx, cy, r*0.78, i*72 + 180));
      const inner5 = Array.from({length:5}, (_,i) => polar(cx, cy, r*0.78*0.382, i*72 + 180 + 36));
      const starPath = pts5.flatMap((p,i) => [p, inner5[i]]);
      return (
        <g>
          <circle cx={cx} cy={cy} r={r*0.92} fill={fill} stroke={stroke} strokeWidth={sw}/>
          <polygon points={pts(starPath)} fill={fillMid} stroke={stroke} strokeWidth={sw}/>
          {/* Chain links at bottom — two interlocking rings */}
          {[-r*0.3, r*0.3].map((dx,i) => (
            <circle key={i} cx={cx+dx} cy={cy+r*0.85} r={r*0.13} fill="none" stroke={stroke} strokeWidth={sw2}/>
          ))}
          <line x1={cx-r*0.17} y1={cy+r*0.85} x2={cx+r*0.17} y2={cy+r*0.85}
            stroke={stroke} strokeWidth={sw} opacity="0.6"/>
        </g>
      );
    },

    // XVI The Tower — tall rectangle struck by diagonal lightning bolt
    "tower-lightning": () => {
      const tw = r*0.5, th = r*1.5, tx = cx-tw/2, ty = cy-th/2;
      return (
        <g>
          {/* Tower */}
          <rect x={tx} y={ty} width={tw} height={th} fill={fill} stroke={stroke} strokeWidth={sw}/>
          {/* Battlements */}
          {[-tw*0.35, -tw*0.05, tw*0.25].map((dx,i) => (
            <rect key={i} x={tx+tw*0.5+dx+tw*0.15-tw*0.4} y={ty-r*0.12} width={tw*0.22} height={r*0.13}
              fill={fill} stroke={stroke} strokeWidth={sw2}/>
          ))}
          {/* Lightning bolt across tower */}
          <polyline points={`${cx+r*0.8},${cy-r*0.85} ${cx+r*0.1},${cy-r*0.1} ${cx+r*0.55},${cy+r*0.05} ${cx-r*0.15},${cy+r*0.85}`}
            fill="none" stroke={stroke} strokeWidth={sw*1.5} strokeLinejoin="round" strokeLinecap="round" opacity="0.9"/>
          {/* Impact sparks */}
          {[[-r*0.15,r*0.15],[r*0.2,-r*0.05],[-r*0.3,-r*0.3]].map(([dx,dy],i) => (
            <circle key={i} cx={cx+dx} cy={cy+dy} r={sw*1.5} fill={stroke} opacity="0.7"/>
          ))}
        </g>
      );
    },

    // XVII The Star — 8-pointed star (Star of Ishtar) with central glow
    "star-8": () => {
      const outer = r*0.88, inner = r*0.38;
      const star8 = Array.from({length:16}, (_,i) => polar(cx, cy, i%2===0 ? outer : inner, i*22.5));
      return (
        <g>
          <polygon points={pts(star8)} fill={fill} stroke={stroke} strokeWidth={sw}/>
          {/* Inner circle */}
          <circle cx={cx} cy={cy} r={r*0.22} fill={fillMid} stroke={stroke} strokeWidth={sw2}/>
          {/* Central dot */}
          <circle cx={cx} cy={cy} r={sw*2} fill={stroke} opacity="0.9"/>
          {/* 4 small outer stars at cardinal points */}
          {[0,90,180,270].map((a,i) => {
            const [x,y] = polar(cx, cy, r*1.05, a);
            const s4 = Array.from({length:8}, (_,j) => polar(x,y,j%2===0?r*0.1:r*0.04,j*45));
            return <polygon key={i} points={pts(s4)} fill={stroke} opacity="0.65"/>;
          })}
        </g>
      );
    },

    // XVIII The Moon — full circle + crescent overlap + twin pillars + reflection pool
    "moon-full": () => {
      return (
        <g>
          {/* Full moon circle */}
          <circle cx={cx} cy={cy-r*0.3} r={r*0.52} fill={fill} stroke={stroke} strokeWidth={sw}/>
          {/* Crescent shadow */}
          <circle cx={cx+r*0.25} cy={cy-r*0.3} r={r*0.48} fill="rgba(4,2,14,0.85)" stroke="none"/>
          {/* Twin pillars */}
          {[-1,1].map(dir => (
            <rect key={dir} x={cx+dir*r*0.75-r*0.1} y={cy+r*0.1} width={r*0.18} height={r*0.75}
              fill={fill} stroke={stroke} strokeWidth={sw2}/>
          ))}
          {/* Reflection ripples */}
          {[0.45, 0.6, 0.72].map((scale,i) => (
            <ellipse key={i} cx={cx} cy={cy+r*0.9} rx={r*scale} ry={r*0.06*(i+1)*0.5}
              fill="none" stroke={stroke} strokeWidth={sw2} opacity={0.5-i*0.1}/>
          ))}
          {/* Path/road to moon */}
          <path d={`M ${cx-r*0.06} ${cy+r*0.95} L ${cx-r*0.18} ${cy+r*0.35} L ${cx+r*0.18} ${cy+r*0.35} L ${cx+r*0.06} ${cy+r*0.95}`}
            fill={fill} stroke={stroke} strokeWidth={sw2} opacity="0.4"/>
        </g>
      );
    },

    // XIX The Sun — circle with double ring of alternating long/short rays
    "sun-rays": () => {
      const innerR = r*0.42;
      return (
        <g>
          <circle cx={cx} cy={cy} r={innerR} fill={fillMid} stroke={stroke} strokeWidth={sw}/>
          <circle cx={cx} cy={cy} r={innerR*0.55} fill={stroke} opacity="0.35"/>
          {/* 16 rays alternating */}
          {Array.from({length:16}, (_,i) => {
            const long = i%2===0;
            const [x1,y1] = polar(cx, cy, innerR+sw, i*22.5);
            const [x2,y2] = polar(cx, cy, long ? r*0.95 : r*0.72, i*22.5);
            return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
              stroke={stroke} strokeWidth={long ? sw : sw2} strokeLinecap="round" opacity={long ? 0.9 : 0.55}/>;
          })}
          {/* Joy dot in center */}
          <circle cx={cx} cy={cy} r={sw*2} fill={stroke} opacity="0.95"/>
        </g>
      );
    },

    // XX Judgement — angel trumpet shape (horn) with radiating sound waves
    "trumpet": () => {
      return (
        <g>
          {/* Trumpet bell */}
          <path d={`M ${cx+r*0.1} ${cy-r*0.5} Q ${cx+r*0.9} ${cy-r*0.2} ${cx+r*0.9} ${cy+r*0.35} A ${r*0.35} ${r*0.35} 0 0 1 ${cx+r*0.2} ${cy+r*0.35}`}
            fill={fill} stroke={stroke} strokeWidth={sw}/>
          {/* Mouthpiece tube */}
          <line x1={cx-r*0.7} y1={cy-r*0.65} x2={cx+r*0.1} y2={cy-r*0.5}
            stroke={stroke} strokeWidth={sw*1.2} strokeLinecap="round"/>
          {/* Sound waves emanating */}
          {[r*0.45, r*0.62, r*0.78].map((rr,i) => {
            const startA = (210-90)*π/180, endA = (330-90)*π/180;
            const x1b = cx+r*0.9+rr*cos(startA)*0.4, y1b = cy+r*0.35+rr*sin(startA)*0.4;
            const x2b = cx+r*0.9+rr*cos(endA)*0.4, y2b = cy+r*0.35+rr*sin(endA)*0.4;
            return <path key={i} d={`M ${cx+r*0.9-rr*0.35} ${cy-rr*0.55} A ${rr*0.6} ${rr*0.6} 0 0 1 ${cx+r*0.9-rr*0.35} ${cy+rr*0.55}`}
              fill="none" stroke={stroke} strokeWidth={sw2} opacity={0.7-i*0.15}/>;
          })}
          {/* Cross on banner */}
          <line x1={cx-r*0.3} y1={cy-r*0.7} x2={cx-r*0.3} y2={cy-r*0.3} stroke={stroke} strokeWidth={sw2}/>
          <line x1={cx-r*0.5} y1={cy-r*0.58} x2={cx-r*0.1} y2={cy-r*0.58} stroke={stroke} strokeWidth={sw2}/>
          {/* Rising figures (triangles from below) */}
          {[-r*0.5, 0, r*0.5].map((dx,i) => (
            <polygon key={i} points={pts([[cx+dx-r*0.08, cy+r*0.85],[cx+dx+r*0.08,cy+r*0.85],[cx+dx,cy+r*0.45]])}
              fill={fill} stroke={stroke} strokeWidth={sw2} opacity="0.7"/>
          ))}
        </g>
      );
    },

    // XXI The World — ouroboros (snake eating tail) encircling a 4-element diamond
    "ouroboros": () => {
      const oR = r*0.82;
      // Serpent body as thick arc with head and tail meeting
      const gapDeg = 20;
      const startA = (gapDeg/2 - 90)*π/180, endA = (360 - gapDeg/2 - 90)*π/180;
      const x1 = cx+oR*cos(startA), y1 = cy+oR*sin(startA);
      const x2 = cx+oR*cos(endA), y2 = cy+oR*sin(endA);
      return (
        <g>
          {/* Ouroboros ring */}
          <path d={`M ${x1} ${y1} A ${oR} ${oR} 0 1 1 ${x2} ${y2}`}
            fill="none" stroke={stroke} strokeWidth={sw*2.2} strokeLinecap="round" opacity="0.6"/>
          {/* Inner thin ring */}
          <circle cx={cx} cy={cy} r={oR} fill="none" stroke={stroke} strokeWidth={sw2} opacity="0.3"/>
          {/* Head at gap */}
          <circle cx={x2} cy={y2} r={sw*3} fill={stroke} opacity="0.8"/>
          {/* 4-element diamond inside */}
          <polygon points={pts([[cx,cy-oR*0.55],[cx+oR*0.55,cy],[cx,cy+oR*0.55],[cx-oR*0.55,cy]])}
            fill={fill} stroke={stroke} strokeWidth={sw}/>
          {/* Centered dot */}
          <circle cx={cx} cy={cy} r={sw*2} fill={stroke} opacity="0.9"/>
          {/* 4 elemental marks at diamond tips */}
          {[0,90,180,270].map((a,i) => {
            const [x,y] = polar(cx, cy, oR*0.55, a);
            const symbols = ['▲','▷','▼','◁'];
            return null; // pure geo: tiny circles
          })}
          {[0,90,180,270].map((a,i) => {
            const [x,y] = polar(cx, cy, oR*0.55, a);
            return <circle key={i} cx={x} cy={y} r={sw*2} fill={stroke} opacity="0.75"/>;
          })}
        </g>
      );
    },

    // ── Minor Arcana suits ────────────────────────────────────────────────────

    // Wands — upward flame: equilateral triangle with inner fire lines
    "flame-wand": () => {
      return (
        <g>
          {/* Main upward triangle */}
          <polygon points={pts([[cx,cy-r*0.9],[cx+r*0.78,cy+r*0.45],[cx-r*0.78,cy+r*0.45]])}
            fill={fill} stroke={stroke} strokeWidth={sw}/>
          {/* Inner ascending lines — fire flicker */}
          {[-r*0.28, 0, r*0.28].map((dx,i) => {
            const h = r * (0.6 + i % 2 * 0.12);
            return <line key={i} x1={cx+dx} y1={cy+r*0.35} x2={cx+dx*0.3} y2={cy+r*0.35-h}
              stroke={stroke} strokeWidth={sw2} strokeLinecap="round" opacity={0.6+i*0.08}/>;
          })}
          {/* Wand staff below */}
          <line x1={cx} y1={cy+r*0.45} x2={cx} y2={cy+r*0.92}
            stroke={stroke} strokeWidth={sw} strokeLinecap="round"/>
          <circle cx={cx} cy={cy+r*0.92} r={sw*1.5} fill={stroke} opacity="0.7"/>
        </g>
      );
    },

    // Cups — chalice shape: two arcs + base + stem
    "chalice": () => {
      return (
        <g>
          {/* Cup bowl */}
          <path d={`M ${cx-r*0.55} ${cy-r*0.55} Q ${cx-r*0.65} ${cy+r*0.1} ${cx-r*0.15} ${cy+r*0.35} L ${cx+r*0.15} ${cy+r*0.35} Q ${cx+r*0.65} ${cy+r*0.1} ${cx+r*0.55} ${cy-r*0.55} Z`}
            fill={fill} stroke={stroke} strokeWidth={sw}/>
          {/* Rim */}
          <line x1={cx-r*0.6} y1={cy-r*0.55} x2={cx+r*0.6} y2={cy-r*0.55}
            stroke={stroke} strokeWidth={sw} strokeLinecap="round"/>
          {/* Stem */}
          <line x1={cx} y1={cy+r*0.35} x2={cx} y2={cy+r*0.7}
            stroke={stroke} strokeWidth={sw} strokeLinecap="round"/>
          {/* Base */}
          <line x1={cx-r*0.38} y1={cy+r*0.7} x2={cx+r*0.38} y2={cy+r*0.7}
            stroke={stroke} strokeWidth={sw} strokeLinecap="round"/>
          {/* Three droplets inside */}
          {[-r*0.18, 0, r*0.18].map((dx,i) => (
            <circle key={i} cx={cx+dx} cy={cy-r*0.18+i*r*0.02} r={sw*1.8} fill={stroke} opacity="0.5"/>
          ))}
        </g>
      );
    },

    // Swords — two crossed diagonal blades
    "crossed-swords": () => {
      const blade = (x1,y1,x2,y2,gx1,gy1,gx2,gy2) => (
        <g>
          <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={stroke} strokeWidth={sw*1.3} strokeLinecap="round"/>
          {/* Guard */}
          <line x1={gx1} y1={gy1} x2={gx2} y2={gy2} stroke={stroke} strokeWidth={sw*0.9} strokeLinecap="round" opacity="0.7"/>
          {/* Pommel */}
          <circle cx={x2} cy={y2} r={sw*2} fill={stroke} opacity="0.7"/>
        </g>
      );
      return (
        <g>
          {blade(cx-r*0.75,cy+r*0.75, cx+r*0.75,cy-r*0.75, cx-r*0.32,cy+r*0.32, cx+r*0.32,cy+r*0.32)}
          {blade(cx+r*0.75,cy+r*0.75, cx-r*0.75,cy-r*0.75, cx+r*0.32,cy+r*0.32, cx-r*0.32,cy+r*0.32)}
          {/* Center crossing diamond */}
          <polygon points={pts([[cx,cy-sw*3],[cx+sw*3,cy],[cx,cy+sw*3],[cx-sw*3,cy]])} fill={stroke} opacity="0.85"/>
        </g>
      );
    },

    // Pentacles — perfect pentagram in circle
    "pentagram": () => {
      const outer = r*0.82, inner = r*0.82*0.382;
      const star5 = Array.from({length:10}, (_,i) => polar(cx, cy, i%2===0 ? outer : inner, i*36-90));
      return (
        <g>
          <circle cx={cx} cy={cy} r={r*0.9} fill={fill} stroke={stroke} strokeWidth={sw}/>
          <polygon points={pts(star5)} fill={fillMid} stroke={stroke} strokeWidth={sw}/>
          {/* Center */}
          <circle cx={cx} cy={cy} r={sw*2} fill={stroke} opacity="0.85"/>
          {/* 5 outer marks */}
          {Array.from({length:5}, (_,i) => {
            const [x,y] = polar(cx, cy, outer, i*72-90);
            return <circle key={i} cx={x} cy={y} r={sw*1.5} fill={stroke} opacity="0.7"/>;
          })}
        </g>
      );
    },

  };

  const render = geo[type];
  if (!render) return null;

  return (
    <svg viewBox={`0 0 ${s} ${s}`} width={s} height={s} overflow="visible">
      <defs>
        <filter id={`geo-glow-${type}`}>
          <feGaussianBlur stdDeviation="1.5" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      <g filter={`url(#geo-glow-${type})`}>
        {render()}
      </g>
    </svg>
  );
}