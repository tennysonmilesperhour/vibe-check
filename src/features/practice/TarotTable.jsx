import React, { useMemo, useState } from "react";
import { Reading, DailyCheckIn } from "@/entities/all";
import { InvokeLLM } from "@/integrations/Core";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import TarotCard from "@/components/tarot/TarotCard";
import { FULL_DECK, SPREADS } from "@/components/tarot/tarotDeck";
import { ORACLE_DECK } from "@/components/tarot/oracleDeck";
import { todayKey } from "@/lib/dates";
import { resonanceGraph, summarizeGraph } from "@/lib/resonance/graph";
import { Shuffle, Eye, BookOpen, RotateCcw } from "lucide-react";

const duskInk = "var(--gh-dusk-ink)";
const duskInkSoft = "rgba(245,229,216,0.7)";

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
      const resonance = me?.cosmic_profile ? summarizeGraph(resonanceGraph(me.cosmic_profile, todayKey())) : "";
      const recent = await DailyCheckIn.list("-date", 7).catch(() => []);
      const week = recent.map((c) => `${c.date}: mood ${c.mood_score}${c.emotions?.length ? `, felt ${c.emotions.join("/")}` : ""}`).join("; ");
      const cardsText = drawn.map((c) => `${c.position}: ${c.card.name}${c.reversed ? " (reversed)" : ""} [${c.card.keywords.join(", ")}]`).join("\n");

      const text = await InvokeLLM({
        prompt: `You are a wise, plainspoken tarot reader. Spread: ${spread.name}.${question.trim() ? ` The question held: "${question.trim()}".` : ""}

Cards drawn:
${cardsText}
${week ? `\nTheir actual week: ${week}` : ""}
${resonance ? `\nTheir chart resonances:\n${resonance}` : ""}

Read the spread as one story, woven with their real week where it genuinely connects. Speak directly to them. Grounded, specific, kind but honest. No em dashes. 3-4 short paragraphs, then one closing line beginning "Carry this:".`,
      });
      const result = typeof text === "string" ? text : text?.response || "";
      setInterpretation(result);
      if (savedReading?.id) {
        await Reading.update(savedReading.id, { interpretation: result, linked_checkin_date: todayKey() }).catch(() => {});
      }
    } catch (e) {
      toast({ title: "The reading resisted", description: e?.message || "Try again in a moment.", variant: "destructive" });
    }
    setInterpreting(false);
  };

  return (
    <div className="dusk-surface min-h-screen">
      <div className="max-w-4xl mx-auto px-6 py-10">
        <header className="text-center">
          <h1 className="text-4xl md:text-5xl" style={{ color: duskInk }}>The table is set</h1>
          <p className="text-sm mt-2" style={{ color: duskInkSoft }}>
            {deckId === "tarot" ? "78 cards, reversals included" : "44 oracle cards, always upright"}
          </p>
        </header>

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
                    ? { background: "var(--gh-gold)", color: "var(--gh-dusk-deep)" }
                    : { border: "1px solid rgba(245,229,216,0.4)", color: duskInk }}
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
                    ? { background: "rgba(253,201,78,0.15)", border: "1px solid var(--gh-gold)" }
                    : { border: "1px solid rgba(245,229,216,0.25)" }}
                >
                  <div className="text-sm font-bold" style={{ color: duskInk }}>{s.name}</div>
                  <div className="text-xs mt-0.5" style={{ color: duskInkSoft }}>{s.description}</div>
                </button>
              ))}
            </div>

            <Input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="A question to hold, if you have one (optional)"
              className="bg-transparent text-center"
              style={{ borderColor: "rgba(245,229,216,0.35)", color: duskInk }}
            />
            <Input
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
            <div className="relative mx-auto mt-8" style={{ height: spread.positions.length > 5 ? 560 : spread.positions.length > 1 ? 420 : 320, maxWidth: 720 }}>
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
                      size={spread.positions.length > 5 ? "sm" : "md"}
                      flipped={!!flipped[i]}
                      onClick={() => setFlipped((f) => ({ ...f, [i]: true }))}
                      label={pos.label}
                    />
                  </div>
                );
              })}
            </div>

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
                  <div key={i} className="p-4" style={{ background: "rgba(245,229,216,0.07)", border: "1px solid rgba(245,229,216,0.15)" }}>
                    <div className="text-xs font-bold tracking-wide" style={{ color: "var(--gh-gold)" }}>{item.position.toUpperCase()}</div>
                    <div className="font-display text-xl mt-0.5" style={{ color: duskInk }}>
                      {item.card.name}{item.reversed ? " · reversed" : ""}
                    </div>
                    <p className="text-sm mt-1" style={{ color: duskInkSoft }}>
                      {item.reversed && item.card.reversed ? item.card.reversed : item.card.meaning}
                    </p>
                  </div>
                ))}

                {interpretation && (
                  <div className="p-5 whitespace-pre-line text-sm" style={{ background: "rgba(253,201,78,0.1)", border: "1px solid rgba(253,201,78,0.4)", color: duskInk }}>
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
