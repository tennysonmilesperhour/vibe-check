import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Shuffle, RefreshCw, Hash, ChevronDown, ChevronUp, Info } from "lucide-react";
import TarotCard from "@/components/tarot/TarotCard";
import { FULL_DECK, SPREADS } from "@/components/tarot/tarotDeck";
import { ORACLE_DECK } from "@/components/tarot/oracleDeck";

// Two distinct decks: tarot (78 archetypal cards, reversals, deeper arcs)
// and oracle (44 cards, present-moment guidance, never reversed)
const DECKS = {
  tarot: {
    id: "tarot",
    name: "Tarot",
    emoji: "🃏",
    tagline: "78 cards · archetypal journeys, past & future arcs",
    cards: FULL_DECK,
    allowReversals: true,
    title: "Tarot Reading",
    eyebrow: "✦ The Cards Speak",
    subtitle: "Shuffle the deck, choose your spread, and let the cards reveal their wisdom",
    color: "#8A72B8",
  },
  oracle: {
    id: "oracle",
    name: "Oracle",
    emoji: "✨",
    tagline: "44 cards · present-moment guidance & affirmation",
    cards: ORACLE_DECK,
    allowReversals: false,
    title: "Oracle Reading",
    eyebrow: "✦ The Oracle Speaks",
    subtitle: "Oracle cards meet you in the present — draw for gentle guidance on right now",
    color: "#C9834B",
  },
};

// ── Seeded shuffle using a number as seed ───────────────────────────────────
function seededShuffle(arr, seed) {
  const a = [...arr];
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 16807) % 2147483647;
    const j = s % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function randomShuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── Spread layout renderer ───────────────────────────────────────────────────
function SpreadLayout({ spread, drawnCards, onFlip }) {
  const isCeltic = spread.id === "celtic";

  return (
    <div className="relative w-full" style={{ paddingBottom: isCeltic ? '80%' : spread.positions.length <= 3 ? '55%' : '70%', minHeight: 260 }}>
      {spread.positions.map((pos, i) => {
        const card = drawnCards[i];
        if (!card) return null;
        const isRotated = pos.rotate;

        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${pos.x}%`,
              top: `${pos.y}%`,
              transform: `translate(-50%, -50%)${isRotated ? ' rotate(90deg)' : ''}`,
              zIndex: isRotated ? 2 : 1,
            }}
          >
            <TarotCard
              card={card.card}
              reversed={card.reversed}
              size={spread.positions.length <= 3 ? "lg" : spread.positions.length <= 5 ? "md" : "sm"}
              label={pos.label}
              onClick={() => onFlip(i)}
            />
          </div>
        );
      })}
    </div>
  );
}

// ── Reading detail panel ─────────────────────────────────────────────────────
function ReadingDetail({ drawnCards, spread }) {
  const [open, setOpen] = useState(true);
  const flippedCount = drawnCards.filter(d => d?.flipped).length;
  if (flippedCount === 0) return null;

  return (
    <div className="glass-card mt-6" style={{ border: '1px solid rgba(138,114,184,0.25)' }}>
      <button className="w-full flex items-center justify-between p-5" onClick={() => setOpen(o => !o)}>
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4" style={{ color: '#8A72B8' }} />
          <span className="font-semibold text-sm" style={{ color: 'rgba(61,52,80,0.9)', fontFamily: 'Space Grotesk, sans-serif' }}>
            Reading Interpretations ({flippedCount} revealed)
          </span>
        </div>
        {open ? <ChevronUp className="w-4 h-4" style={{color:'rgba(105,95,128,0.6)'}}/> : <ChevronDown className="w-4 h-4" style={{color:'rgba(105,95,128,0.6)'}}/>}
      </button>
      {open && (
        <div className="px-5 pb-5 space-y-4">
          {drawnCards.map((drawn, i) => {
            if (!drawn?.flipped) return null;
            const pos = spread.positions[i];
            return (
              <div key={i} className="p-4 rounded-xl" style={{ background: `${drawn.card.color}0d`, border: `1px solid ${drawn.card.color}25` }}>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="text-lg">{drawn.card.symbol}</span>
                  <div>
                    <span className="text-sm font-bold" style={{ color: drawn.card.color, fontFamily: 'Space Grotesk, sans-serif' }}>
                      {drawn.card.name}
                    </span>
                    {drawn.reversed && (
                      <span className="ml-2 text-xs px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(194,94,143,0.15)', color: '#C25E8F' }}>
                        Reversed
                      </span>
                    )}
                  </div>
                  <Badge className="text-xs ml-auto" style={{ background: 'rgba(138,114,184,0.12)', color: 'rgba(105,95,128,0.8)', border: '1px solid rgba(138,114,184,0.2)' }}>
                    {pos.label}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {drawn.card.keywords.map(k => (
                    <span key={k} className="text-xs px-2 py-0.5 rounded-full" style={{ background: `${drawn.card.color}15`, color: drawn.card.color, border: `1px solid ${drawn.card.color}25` }}>
                      {k}
                    </span>
                  ))}
                </div>
                <p className="text-sm leading-relaxed" style={{ color: 'rgba(70,60,92,0.8)' }}>
                  {drawn.reversed ? drawn.card.reversed : drawn.card.meaning}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function TarotReading() {
  const [deckId, setDeckId] = useState("tarot"); // "tarot" | "oracle"
  const [selectedSpread, setSelectedSpread] = useState(null);
  const [drawnCards, setDrawnCards] = useState([]);
  const [shuffleMode, setShuffleMode] = useState("auto"); // "auto" | "manual"
  const [seedInput, setSeedInput] = useState("");
  const [shuffled, setShuffled] = useState(false);
  const [isShuffling, setIsShuffling] = useState(false);
  const [animatingCards, setAnimatingCards] = useState(false);

  const deck = DECKS[deckId];

  const switchDeck = (id) => {
    if (id === deckId) return;
    setDeckId(id);
    setSelectedSpread(null);
    setDrawnCards([]);
    setShuffled(false);
  };

  const handleShuffle = async () => {
    setIsShuffling(true);
    await new Promise(r => setTimeout(r, 600));
    setShuffled(true);
    setDrawnCards([]);
    setIsShuffling(false);
  };

  const dealSpread = (spread) => {
    let cards;
    if (shuffleMode === "manual" && seedInput) {
      cards = seededShuffle(deck.cards, parseInt(seedInput, 10) || Date.now());
    } else {
      cards = randomShuffle(deck.cards);
    }

    const drawn = spread.positions.map((_, i) => ({
      card: cards[i],
      reversed: deck.allowReversals && Math.random() < 0.25,
      flipped: false,
    }));

    setSelectedSpread(spread);
    setDrawnCards(drawn);
    setAnimatingCards(true);
    setTimeout(() => setAnimatingCards(false), 800);
  };

  const handleFlip = (index) => {
    setDrawnCards(prev => prev.map((d, i) => i === index ? { ...d, flipped: true } : d));
  };

  const handleRevealAll = () => {
    setDrawnCards(prev => prev.map(d => ({ ...d, flipped: true })));
  };

  const reset = () => {
    setSelectedSpread(null);
    setDrawnCards([]);
    setShuffled(false);
    setSeedInput("");
  };

  const allFlipped = drawnCards.length > 0 && drawnCards.every(d => d.flipped);
  const anyFlipped = drawnCards.some(d => d.flipped);

  return (
    <div className="p-4 space-y-6 min-h-screen relative">
      <div className="orb-purple" style={{ top: '-60px', right: '10%' }} />
      <div className="orb-blue" style={{ bottom: '20%', left: '-20px' }} />

      <div className="max-w-4xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'rgba(138,114,184,0.7)' }}>{deck.eyebrow}</p>
          <h1 className="text-4xl font-bold gradient-text mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            {deck.title}
          </h1>
          <p className="text-base" style={{ color: 'rgba(105,95,128,0.75)' }}>
            {deck.subtitle}
          </p>
        </div>

        {!selectedSpread ? (
          <>
            {/* Deck Selection */}
            <div className="glass-card p-6 mb-6">
              <h2 className="text-base font-bold mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'rgba(61,52,80,0.9)' }}>
                ✦ Choose Your Deck
              </h2>
              <p className="text-sm mb-4" style={{ color: 'rgba(105,95,128,0.6)' }}>
                Tarot maps the deeper archetypal journey · Oracle offers direct guidance for the present moment
              </p>
              <div className="grid grid-cols-2 gap-3">
                {Object.values(DECKS).map(d => {
                  const active = d.id === deckId;
                  return (
                    <button key={d.id} onClick={() => switchDeck(d.id)}
                      className="p-4 rounded-xl text-left transition-all"
                      style={{
                        background: active ? `${d.color}20` : 'rgba(255,255,255,0.64)',
                        border: `1px solid ${active ? `${d.color}70` : 'rgba(61,52,80,0.1)'}`,
                      }}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xl">{d.emoji}</span>
                        <span className="font-bold text-sm" style={{ color: active ? d.color : 'rgba(70,60,92,0.75)', fontFamily: 'Space Grotesk, sans-serif' }}>
                          {d.name}
                        </span>
                        {active && (
                          <Badge className="text-xs ml-auto" style={{ background: `${d.color}20`, color: d.color, border: `1px solid ${d.color}40` }}>
                            Selected
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs" style={{ color: 'rgba(105,95,128,0.6)' }}>{d.tagline}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Shuffle Controls */}
            <div className="glass-card p-6 mb-6">
              <h2 className="text-base font-bold mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'rgba(61,52,80,0.9)' }}>
                ✦ Prepare the Deck
              </h2>

              {/* Mode toggle */}
              <div className="flex gap-2 mb-4">
                <button onClick={() => setShuffleMode("auto")}
                  className="flex-1 py-2 rounded-xl text-sm font-medium transition-all"
                  style={{
                    background: shuffleMode === "auto" ? 'rgba(138,114,184,0.25)' : 'rgba(255,255,255,0.64)',
                    border: `1px solid ${shuffleMode === "auto" ? 'rgba(138,114,184,0.5)' : 'rgba(61,52,80,0.1)'}`,
                    color: shuffleMode === "auto" ? '#8A72B8' : 'rgba(105,95,128,0.6)',
                  }}>
                  <Shuffle className="w-4 h-4 inline mr-2" />
                  Auto Shuffle
                </button>
                <button onClick={() => setShuffleMode("manual")}
                  className="flex-1 py-2 rounded-xl text-sm font-medium transition-all"
                  style={{
                    background: shuffleMode === "manual" ? 'rgba(107,149,200,0.15)' : 'rgba(255,255,255,0.64)',
                    border: `1px solid ${shuffleMode === "manual" ? 'rgba(107,149,200,0.4)' : 'rgba(61,52,80,0.1)'}`,
                    color: shuffleMode === "manual" ? '#6B95C8' : 'rgba(105,95,128,0.6)',
                  }}>
                  <Hash className="w-4 h-4 inline mr-2" />
                  True Random (seed)
                </button>
              </div>

              {shuffleMode === "manual" && (
                <div className="mb-4">
                  <p className="text-xs mb-2" style={{ color: 'rgba(105,95,128,0.65)' }}>
                    Enter any number as your seed — close your eyes and let a number come to you, or use a date, a lucky number, anything meaningful.
                  </p>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="Enter your sacred number..."
                      value={seedInput}
                      onChange={e => setSeedInput(e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>
              )}

              <Button
                onClick={handleShuffle}
                disabled={isShuffling || (shuffleMode === "manual" && !seedInput)}
                className="w-full btn-cosmic rounded-xl font-semibold"
                style={{ height: 48 }}
              >
                {isShuffling ? (
                  <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Shuffling the cosmic deck...</>
                ) : shuffled ? (
                  <><RefreshCw className="w-4 h-4 mr-2" /> Reshuffle the Deck</>
                ) : (
                  <><Shuffle className="w-4 h-4 mr-2" /> Shuffle the Deck</>
                )}
              </Button>

              {shuffled && (
                <p className="text-center text-xs mt-3" style={{ color: 'rgba(201,131,75,0.7)' }}>
                  ✦ The deck is ready — choose your spread below
                </p>
              )}
            </div>

            {/* Spread Selection */}
            <div className="glass-card p-6">
              <h2 className="text-base font-bold mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'rgba(61,52,80,0.9)' }}>
                Choose Your Spread
              </h2>
              <p className="text-sm mb-5" style={{ color: 'rgba(105,95,128,0.6)' }}>
                Each spread asks different questions of the oracle
              </p>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                {SPREADS.map(spread => (
                  <button
                    key={spread.id}
                    onClick={() => shuffled ? dealSpread(spread) : null}
                    disabled={!shuffled}
                    className="p-4 rounded-xl text-left transition-all"
                    style={{
                      background: shuffled ? 'rgba(138,114,184,0.08)' : 'rgba(255,255,255,0.5)',
                      border: `1px solid ${shuffled ? 'rgba(138,114,184,0.3)' : 'rgba(255,255,255,0.72)'}`,
                      opacity: shuffled ? 1 : 0.45,
                      cursor: shuffled ? 'pointer' : 'not-allowed',
                    }}
                    onMouseEnter={e => { if (shuffled) e.currentTarget.style.background = 'rgba(138,114,184,0.18)'; }}
                    onMouseLeave={e => { if (shuffled) e.currentTarget.style.background = 'rgba(138,114,184,0.08)'; }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-sm" style={{ color: 'rgba(61,52,80,0.9)', fontFamily: 'Space Grotesk, sans-serif' }}>
                        {spread.name}
                      </span>
                      <Badge className="text-xs shrink-0" style={{ background: 'rgba(138,114,184,0.15)', color: '#8A72B8', border: '1px solid rgba(138,114,184,0.25)' }}>
                        {spread.positions.length} card{spread.positions.length > 1 ? 's' : ''}
                      </Badge>
                    </div>
                    <p className="text-xs" style={{ color: 'rgba(105,95,128,0.6)' }}>{spread.description}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {spread.positions.slice(0, 4).map(p => (
                        <span key={p.label} className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.64)', color: 'rgba(105,95,128,0.55)', fontSize: 9 }}>
                          {p.label}
                        </span>
                      ))}
                      {spread.positions.length > 4 && (
                        <span className="text-xs px-1.5 py-0.5 rounded" style={{ color: 'rgba(138,114,184,0.5)', fontSize: 9 }}>
                          +{spread.positions.length - 4} more
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Active Reading */}
            <div className="glass-card p-5 mb-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h2 className="text-lg font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'rgba(61,52,80,0.95)' }}>
                    {selectedSpread.name}
                  </h2>
                  <p className="text-xs" style={{ color: 'rgba(105,95,128,0.6)' }}>{selectedSpread.description}</p>
                </div>
                <div className="flex gap-2">
                  {!allFlipped && anyFlipped && (
                    <Button size="sm" onClick={handleRevealAll} className="rounded-xl text-xs"
                      style={{ background: 'rgba(107,149,200,0.15)', border: '1px solid rgba(107,149,200,0.3)', color: '#6B95C8' }}>
                      Reveal All
                    </Button>
                  )}
                  <Button size="sm" onClick={reset} variant="outline" className="rounded-xl text-xs"
                    style={{ borderColor: 'rgba(138,114,184,0.3)', color: '#8A72B8', background: 'rgba(138,114,184,0.08)' }}>
                    New Reading
                  </Button>
                </div>
              </div>

              {!anyFlipped && (
                <p className="text-xs py-2 px-3 rounded-lg mb-2" style={{ background: 'rgba(138,114,184,0.08)', color: 'rgba(138,114,184,0.7)', border: '1px solid rgba(138,114,184,0.15)' }}>
                  ✦ Hold your question in your heart, then tap each card to reveal its message
                </p>
              )}
            </div>

            {/* Spread */}
            <div className="glass-card p-4">
              <SpreadLayout
                spread={selectedSpread}
                drawnCards={drawnCards}
                onFlip={handleFlip}
              />
            </div>

            {/* Reading details */}
            <ReadingDetail drawnCards={drawnCards} spread={selectedSpread} />

            {allFlipped && (
              <div className="text-center mt-6">
                <Button onClick={reset} className="btn-cosmic rounded-xl">
                  <Shuffle className="w-4 h-4 mr-2" /> Begin a New Reading
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}