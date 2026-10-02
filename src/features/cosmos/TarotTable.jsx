import React, { useEffect, useMemo, useState } from "react";
import { Reading } from "@/api/entities";
import { tarotReading } from "@/lib/wisdom/readings";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import SanctuaryMark from "@/features/shell/SanctuaryMark";
import TarotCard from "@/components/tarot/TarotCard";
import { FULL_DECK, SPREADS } from "@/components/tarot/tarotDeck";
import { ORACLE_DECK } from "@/components/tarot/oracleDeck";
import { todayKey } from "@/lib/dates";
import { resonanceGraph, summarizeGraph } from "@/lib/resonance/graph";
import { Shuffle, Eye, BookOpen, RotateCcw } from "lucide-react";

const duskInk = "var(--gh-dusk-ink)";
const duskInkSoft = "rgba(245,229,216,0.7)";

/** Track a CSS media query so we can lean the card up big on desktop. */
function useMediaQuery(query) {
  const [matches, setMatches] = useState(
    () => typeof window !== "undefined" && window.matchMedia(query).matches
  );
  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const mql = window.matchMedia(query);
    const onChange = (e) => setMatches(e.matches);
    setMatches(mql.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [query]);
  return matches;
}

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function drawSpread(deckId, spread, seedText) {
  const deck = deckId === "tarot" ? FULL_DECK : ORACLE_DECK;
  const rand = seedText
    ? mulberry32([...seedText].reduce((a, ch) => a * 31 + ch.charCodeAt(0), 7) >>> 0)
    : Math.random;
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return spread.positions.map((pos, i) => ({
    card: shuffled[i],
    position: pos.label,
    reversed: deckId === "tarot" ? rand() < 0.3 : false,
  }));
}

/** The tarot & oracle table: honest shuffle, persisted readings, woven interpretation. */
export default function TarotTable() {
  const { toast } = useToast();
  const [deckId, setDeckId] = useState("tarot");
  const [spreadId, setSpreadId] = useState("single");
  const [question, setQuestion] = useState("");
  const [seed, setSeed] = useState("");
  const [drawn, setDrawn] = useState(null); // [{card, position, reversed}]
  const [flipped, setFlipped] = useState({});
  const [savedReading, setSavedReading] = useState(null);
  const [interpretation, setInterpretation] = useState(null);
  const [interpreting, setInterpreting] = useState(false);

  const spread = useMemo(() => SPREADS.find((s) => s.id === spreadId) || SPREADS[0], [spreadId]);
  const availableSpreads = deckId === "oracle" ? SPREADS.filter((s) => s.positions.length <= 3) : SPREADS;
  const allFlipped = drawn && drawn.every((_, i) => flipped[i]);
  const isDesktop = useMediaQuery("(min-width: 768px)");

  // Cards were tiny on desktop. Give the single daily draw a real presence and
  // enlarge the three-card spread too; leave the dense spreads alone so their
  // percentage-positioned cards don't collide.
  const cardCount = spread ? spread.positions.length : 1;
  const cardSize = cardCount > 5 ? "sm"
    : cardCount > 3 ? "md"
    : cardCount > 1 ? (isDesktop ? "lg" : "md")
    : (isDesktop ? "xxl" : "lg");
  const tableHeight = cardCount > 5 ? 560
    : cardCount > 3 ? 460
    : cardCount > 1 ? (isDesktop ? 460 : 420)
    : (isDesktop ? 640 : 380);
  const tableMaxWidth = cardCount > 1 ? 720 : (isDesktop ? 420 : 320);
  // Cards too close together for their names are numbered, and the positions,
  // with each card's name once it is turned, are listed under the table.
  const numbered = cardCount > 3 || (cardCount > 1 && !isDesktop);

  const deal = async () => {
    const cards = drawSpread(deckId, spread, seed.trim() || null);
    setDrawn(cards);
    setFlipped({});
    setInterpretation(null);
    try {
      const saved = await Reading.create({
        date: todayKey(),
        deck: deckId,
        spread: spread.id,
        question: question.trim() || undefined,
        cards: cards.map((c) => ({ card_id: c.card.id, position: c.position, reversed: c.reversed })),
      });
      setSavedReading(saved);
    } catch {
      setSavedReading(null); // reading still usable, just not archived
    }
  };

  const reset = () => { setDrawn(null); setFlipped({}); setInterpretation(null); setSavedReading(null); };

  const interpret = async () => {
    if (!drawn) return;
    setInterpreting(true);
    try {
      const me = await base44.auth.me().catch(() => null);
      const chart = me?.cosmic_profile;
      const resonance = chart?.enabled_systems?.length ? summarizeGraph(resonanceGraph(chart, todayKey())) : "";

      // Woven locally from the cards and your chart, never from your journal.
      const result = tarotReading({
        spreadName: spread.name,
        deck: deckId,
        cards: drawn,
        question: question.trim(),
        resonanceSummary: resonance,
      });
      setInterpretation(result);
      if (savedReading?.id) {
        await Reading.update(savedReading.id, { interpretation: result }).catch(() => {});
      }
    } catch (e) {
      toast({ title: "The reading resisted", description: e?.message || "Try again in a moment.", variant: "destructive" });
    }
    setInterpreting(false);
  };

  return (
    <div className="dusk-surface rounded-[var(--radius)]">
      <div className="max-w-4xl mx-auto px-6 py-10">
        <header className="text-center">
          <SanctuaryMark size={52} className="mx-auto mb-5 text-[var(--gh-gold)]" />
          <h1 className="text-4xl md:text-5xl" style={{ color: duskInk }}>The table is set</h1>
          <p className="text-sm mt-2" style={{ color: duskInkSoft }}>
            {deckId === "tarot" ? "78 cards, reversals included" : "44 oracle cards, always upright"}
          </p>
          <p className="text-xs mt-3 max-w-xl mx-auto" style={{ color: duskInkSoft }}>
            {deckId === "tarot"
              ? "Tarot began as a card game in fifteenth-century Italy; this deck follows the Rider-Waite-Smith deck of 1909. The meanings are written for Vibe Check as prompts for reflection, not predictions."
              : "This oracle deck was written for Vibe Check. Its cards are prompts for reflection, not predictions."}
            {" "}No reading can decide whether someone is safe to be with.
          </p>
        </header>

        {!drawn && <div aria-hidden="true" className="tarot-preview">
          {[0,1,2].map((index) => <div key={index} style={{ transform: `translateY(${index === 1 ? -7 : 5}px) rotate(${(index - 1) * 12}deg)` }}><TarotCard card={FULL_DECK[index]} size="sm" disabled /></div>)}
        </div>}
        {!drawn && (
          <div className="max-w-xl mx-auto mt-10 space-y-6">
            <div className="flex justify-center gap-2" role="group" aria-label="Choose a deck">
              {[["tarot", "Tarot"], ["oracle", "Oracle"]].map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  aria-pressed={deckId === id}
                  onClick={() => { setDeckId(id); if (id === "oracle" && spread.positions.length > 3) setSpreadId("single"); }}
                  className="px-5 py-2.5 text-sm font-bold"
                  style={deckId === id
                    ? { background: "var(--gh-gold)", color: "var(--gh-dusk-deep)", borderRadius: "calc(var(--radius) - 3px)", boxShadow: "var(--shadow-soft)" }
                    : { border: "1px solid rgba(245,229,216,0.4)", color: duskInk, borderRadius: "calc(var(--radius) - 3px)" }}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="grid sm:grid-cols-2 gap-2" role="group" aria-label="Choose a spread">
              {availableSpreads.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  aria-pressed={spreadId === s.id}
                  onClick={() => setSpreadId(s.id)}
                  className="text-left p-3"
                  style={spreadId === s.id
                    ? { background: "rgba(185,154,85,0.15)", border: "1px solid var(--gh-gold)", borderRadius: "var(--radius)", boxShadow: "0 6px 24px rgba(185,154,85,0.16)" }
                    : { border: "1px solid rgba(245,229,216,0.25)", borderRadius: "var(--radius)" }}
                >
                  <div className="text-sm font-bold" style={{ color: duskInk }}>{s.name}</div>
                  <div className="text-xs mt-0.5" style={{ color: duskInkSoft }}>{s.description}</div>
                </button>
              ))}
            </div>

            <Input
              aria-label="Your question (optional)"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="A question to hold, if you have one (optional)"
              className="bg-transparent text-center"
              style={{ borderColor: "rgba(245,229,216,0.35)", color: duskInk }}
            />
            <Input
              aria-label="Ritual seed (optional)"
              value={seed}
              onChange={(e) => setSeed(e.target.value)}
              placeholder="Ritual seed (optional: the same words deal the same cards)"
              className="bg-transparent text-center text-xs"
              style={{ borderColor: "rgba(245,229,216,0.2)", color: duskInkSoft }}
            />

            <div className="text-center">
              <button type="button" onClick={deal} className="cream-button inline-flex items-center gap-2">
                <Shuffle className="w-4 h-4" aria-hidden="true" /> Shuffle and deal
              </button>
            </div>
          </div>
        )}

        {drawn && (
          <>
            <div className="relative mx-auto mt-8" style={{ height: tableHeight, maxWidth: tableMaxWidth }}>
              {drawn.map((item, i) => {
                const pos = spread.positions[i];
                return (
                  <div
                    key={i}
                    className="absolute"
                    style={{
                      left: `${pos.x}%`,
                      top: `${pos.y}%`,
                      transform: `translate(-50%, -50%)${pos.rotate ? " rotate(90deg)" : ""}`,
                      zIndex: pos.rotate ? 2 : 1,
                    }}
                  >
                    <TarotCard
                      card={item.card}
                      reversed={item.reversed}
                      size={cardSize}
                      flipped={!!flipped[i]}
                      onClick={() => setFlipped((f) => ({ ...f, [i]: true }))}
                      label={pos.label}
                      number={numbered ? i + 1 : undefined}
                      showCaption={!pos.rotate}
                    />
                  </div>
                );
              })}
            </div>

            {numbered && (
              <ol className="max-w-xl mx-auto mt-6 grid sm:grid-cols-2 gap-x-6 gap-y-1 text-sm" aria-label="Positions in this spread" style={{ color: duskInkSoft }}>
                {spread.positions.map((pos, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="font-bold" style={{ color: "var(--gh-gold)" }}>{i + 1}</span>
                    <span>
                      {pos.label}{pos.rotate ? `, across ${i}` : ""}
                      {flipped[i] && <span style={{ color: duskInk }}> · {drawn[i].card.name}{drawn[i].reversed ? ", reversed" : ""}</span>}
                    </span>
                  </li>
                ))}
              </ol>
            )}

            <div className="flex justify-center gap-3 mt-6">
              {!allFlipped && (
                <button
                  type="button"
                  className="ghost-cream-button inline-flex items-center gap-2 text-sm"
                  onClick={() => setFlipped(Object.fromEntries(drawn.map((_, i) => [i, true])))}
                >
                  <Eye className="w-4 h-4" aria-hidden="true" /> Reveal all
                </button>
              )}
              {allFlipped && (
                <button type="button" className="cream-button inline-flex items-center gap-2 text-sm" onClick={interpret} disabled={interpreting}>
                  <BookOpen className="w-4 h-4" aria-hidden="true" /> {interpreting ? "Weaving the story…" : "Weave the reading"}
                </button>
              )}
              <button type="button" className="ghost-cream-button inline-flex items-center gap-2 text-sm" onClick={reset}>
                <RotateCcw className="w-4 h-4" aria-hidden="true" /> New reading
              </button>
            </div>

            {allFlipped && (
              <div className="max-w-2xl mx-auto mt-8 space-y-3">
                {drawn.map((item, i) => (
                  <div key={i} className="p-4" style={{ background: "rgba(245,229,216,0.07)", border: "1px solid rgba(245,229,216,0.15)", borderRadius: "var(--radius)" }}>
                    <div className="text-xs font-bold tracking-wide" style={{ color: "var(--gh-gold)" }}>{numbered ? `${i + 1} · ` : ""}{item.position.toUpperCase()}</div>
                    <div className="font-display text-xl mt-0.5" style={{ color: duskInk }}>
                      {item.card.name}{item.reversed ? " · reversed" : ""}
                    </div>
                    <p className="text-sm mt-1" style={{ color: duskInkSoft }}>
                      {item.reversed && item.card.reversed ? item.card.reversed : item.card.meaning}
                    </p>
                  </div>
                ))}

                {interpretation && (
                  <div className="p-5 whitespace-pre-line text-sm" style={{ background: "rgba(185,154,85,0.1)", border: "1px solid rgba(185,154,85,0.4)", color: duskInk, borderRadius: "var(--radius)" }}>
                    {interpretation}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
