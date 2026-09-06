import React, { useMemo, useState } from "react";
import { Reading, DailyCheckIn } from "@/entities/all";
import { InvokeLLM } from "@/integrations/Core";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import TarotCard from "@/components/tarot/TarotCard";
import { FULL_DECK, SPREADS } from "@/components/tarot/tarotDeck";
import { ORACLE_DECK } from "@/components/tarot/oracleDeck";
import { todayKey } from "@/lib/dates";
import { resonanceGraph, summarizeGraph } from "@/lib/resonance/graph";
import { Shuffle, Eye, BookOpen, RotateCcw } from "lucide-react";
import ReadingArchive from "./ReadingArchive";
import InsightReading from "@/features/shell/InsightReading";

const duskInk = "var(--gh-dusk-ink)";
const duskInkSoft = "rgba(245,229,216,0.7)";

function drawSpread(deckId, spread) {
  const deck = deckId === "tarot" ? FULL_DECK : ORACLE_DECK;
  const rand = Math.random;
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
  const [drawn, setDrawn] = useState(null); // [{card, position, reversed}]
  const [flipped, setFlipped] = useState({});
  const [savedReading, setSavedReading] = useState(null);
  const [interpretation, setInterpretation] = useState(null);
  const [interpreting, setInterpreting] = useState(false);

  const spread = useMemo(() => SPREADS.find((s) => s.id === spreadId) || SPREADS[0], [spreadId]);
  const availableSpreads = deckId === "oracle" ? SPREADS.filter((s) => s.positions.length <= 3) : SPREADS;
  const allFlipped = drawn && drawn.every((_, i) => flipped[i]);

  const deal = async () => {
    const cards = drawSpread(deckId, spread);
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
      setSavedReading(null);
      toast({
        title: "Reading opened but not saved",
        description: "Check your connection before leaving if you want this reading in your archive.",
        variant: "destructive",
      });
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

        {!drawn && <ReadingArchive />}

        {!drawn && (
          <div className="max-w-xl mx-auto mt-10 space-y-6">
            <div className="flex justify-center gap-2" role="group" aria-label="Choose a deck">
              {[["tarot", "Tarot"], ["oracle", "Oracle"]].map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  aria-pressed={deckId === id}
                  onClick={() => { setDeckId(id); if (id === "oracle" && spread.positions.length > 3) setSpreadId("single"); }}
                  className="min-h-11 px-5 py-2.5 text-sm font-bold"
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

            <div>
              <Label htmlFor="reading-question" style={{ color: duskInk }}>Question (optional)</Label>
              <Input
                id="reading-question"
                value={question}
                maxLength={240}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="What would you like to reflect on?"
                className="mt-1 bg-transparent text-center"
                style={{ borderColor: "rgba(245,229,216,0.35)", color: duskInk }}
              />
            </div>

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

            <div className="flex flex-wrap justify-center gap-3 mt-6">
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
              <div className="tarot-marginalia max-w-3xl mx-auto mt-8">
                {drawn.map((item, i) => (
                  <article key={i}>
                    <div className="tarot-marginalia__position">{item.position}</div>
                    <h3 className="font-display text-xl mt-0.5" style={{ color: duskInk }}>
                      {item.card.name}{item.reversed ? " · reversed" : ""}
                    </h3>
                    <p className="text-sm mt-1" style={{ color: duskInkSoft }}>
                      {item.reversed && item.card.reversed ? item.card.reversed : item.card.meaning}
                    </p>
                  </article>
                ))}

                {interpretation && (
                  <div className="tarot-marginalia__weave">
                    <InsightReading
                      tone="dusk"
                      title="The story between the cards"
                      text={interpretation}
                      evidence={[`${drawn.length} revealed ${deckId} cards`, "Up to 7 recent check-ins", "Your optional Loom resonances"]}
                      note="Optional AI reflection. The draw itself is random and the reading is not a prediction."
                    />
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
