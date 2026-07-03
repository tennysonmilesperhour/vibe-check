import React, { useMemo, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { DailyCheckIn, BoundaryAlert } from "@/entities/all";
import { useToast } from "@/components/ui/use-toast";
import SkyField from "@/features/shell/SkyField";
import { ScaleStep, ChipsStep, MomentStep, ReflectionStep } from "./CeremonySteps";
import { EMOTIONS, ACTIVITIES } from "./vocab";
import { moonPhase } from "@/lib/resonance/moon";
import { personalDay } from "@/lib/resonance/numerology";
import { evaluateBoundaries, dedupeAlerts } from "@/lib/boundaries";
import { computeStreak, isMilestone } from "@/lib/streaks";
import { todayKey } from "@/lib/dates";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";

const STEP_IDS = ["mood", "energy", "sleep", "emotions", "activities", "high", "low", "reflection"];

/**
 * The evening ritual: one question per screen, the sky deepening as you go.
 * Saves as a single DailyCheckIn; runs boundary detection; celebrates streaks.
 */
export default function CheckInCeremony({ dateKey = todayKey(), existing = null, onDone, onCancel }) {
  const { toast } = useToast();
  const reduced = useReducedMotion();
  const [stepIndex, setStepIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(() => ({
    mood_score: existing?.mood_score ?? null,
    energy_level: existing?.energy_level ?? null,
    sleep_quality: existing?.sleep_quality ?? null,
    emotions: existing?.emotions ?? [],
    activities: existing?.activities ?? [],
    high_moment: existing?.high_moment ?? null,
    low_moment: existing?.low_moment ?? null,
    gratitude: existing?.gratitude ?? "",
    notes: existing?.notes ?? "",
    person_ids: existing?.person_ids ?? [],
  }));

  const set = (key) => (val) => setForm((f) => ({ ...f, [key]: val }));
  const toggleIn = (key) => (label) =>
    setForm((f) => ({
      ...f,
      [key]: f[key].includes(label) ? f[key].filter((x) => x !== label) : [...f[key], label],
    }));

  const stepId = STEP_IDS[stepIndex];
  const depth = Math.min(4, 1 + Math.floor(stepIndex / 2));
  const canAdvance = stepId === "mood" ? form.mood_score != null
    : stepId === "energy" ? form.energy_level != null
    : stepId === "sleep" ? form.sleep_quality != null
    : true;

  const progress = (stepIndex + 1) / STEP_IDS.length;

  const save = async () => {
    setSaving(true);
    try {
      const me = await base44.auth.me();
      const birthDate = me?.cosmic_profile?.birth_date || null;
      const moon = moonPhase(dateKey);
      const personIds = [
        ...new Set([...(form.high_moment?.person_ids || []), ...(form.low_moment?.person_ids || [])]),
      ];
      const payload = {
        ...form,
        date: dateKey,
        moon_phase: moon.name,
        ...(birthDate ? { personal_day: personalDay(birthDate, dateKey) } : {}),
        person_ids: personIds,
      };

      const saved = existing?.id
        ? await DailyCheckIn.update(existing.id, payload)
        : await DailyCheckIn.create(payload);

      // Automatic boundary pass — the old app made you press a button on another page.
      let newAlerts = [];
      try {
        const recent = await DailyCheckIn.list("-date", 30);
        const settings = me?.boundary_settings || {};
        const candidates = evaluateBoundaries(recent, settings);
        const existingAlerts = await BoundaryAlert.list("-created_date", 50);
        newAlerts = dedupeAlerts(candidates, existingAlerts);
        for (const alert of newAlerts) {
          await BoundaryAlert.create({ ...alert, is_acknowledged: false });
        }
      } catch {
        // boundary check must never block the save
      }

      // Streak celebration (respect reduced motion).
      try {
        const recent = await DailyCheckIn.list("-date", 120);
        const streak = computeStreak(recent, todayKey());
        if (isMilestone(streak) && !reduced && !existing) {
          const confetti = (await import("canvas-confetti")).default;
          confetti({ particleCount: 90, spread: 75, origin: { y: 0.7 }, colors: ["#F48CA0", "#FAB05E", "#FDC94E", "#FFFDF6"] });
        }
        toast({
          title: existing ? "Today, updated" : "The day is kept",
          description: streak > 1 ? `${streak} evenings in a row.` : "Your first evening of a new run.",
        });
      } catch {
        toast({ title: existing ? "Today, updated" : "The day is kept" });
      }

      onDone?.(saved, { newAlerts });
    } catch (e) {
      toast({ title: "Could not save", description: e?.message || "Please try again.", variant: "destructive" });
    }
    setSaving(false);
  };

  const steps = useMemo(() => ({
    mood: <ScaleStep field="mood_score" question="How did today actually feel?" value={form.mood_score} onChange={set("mood_score")} />,
    energy: <ScaleStep field="energy_level" question="How much of you was available?" value={form.energy_level} onChange={set("energy_level")} />,
    sleep: <ScaleStep field="sleep_quality" question="How did last night hold you?" value={form.sleep_quality} onChange={set("sleep_quality")} />,
    emotions: <ChipsStep question="Which feelings moved through?" hint="Choose any that visited, even briefly." options={EMOTIONS} selected={form.emotions} onToggle={toggleIn("emotions")} />,
    activities: <ChipsStep question="What did you give time to?" options={ACTIVITIES} selected={form.activities} onToggle={toggleIn("activities")} />,
    high: <MomentStep kind="high" question="What was the high point?" value={form.high_moment} onChange={set("high_moment")} />,
    low: <MomentStep kind="low" question="What was the hardest moment?" value={form.low_moment} onChange={set("low_moment")} />,
    reflection: <ReflectionStep value={{ gratitude: form.gratitude, notes: form.notes }} onChange={(v) => setForm((f) => ({ ...f, ...v }))} />,
  }), [form]);

  const isLast = stepIndex === STEP_IDS.length - 1;

  return (
    <SkyField depth={depth} className="min-h-screen" veilIntensity={0.8}>
      <div className="max-w-3xl mx-auto px-6 py-10 min-h-screen flex flex-col">
        {/* progress: a thin gold line filling across */}
        <div className="h-px w-full" style={{ background: "rgba(255,253,246,0.25)" }} aria-hidden="true">
          <motion.div
            className="h-px"
            style={{ background: "var(--gh-cream)", transformOrigin: "left" }}
            animate={{ scaleX: progress }}
            initial={false}
            transition={{ duration: reduced ? 0 : 0.4, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
        <div className="flex justify-between items-center mt-4 text-sm" style={{ color: "rgba(255,253,246,0.8)" }}>
          <span>{stepIndex + 1} of {STEP_IDS.length}</span>
          <button type="button" onClick={onCancel} className="underline underline-offset-4">Save for later</button>
        </div>

        <div className="flex-1 flex items-center py-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={stepId}
              initial={{ opacity: 0, x: reduced ? 0 : 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: reduced ? 0 : -24 }}
              transition={{ duration: reduced ? 0 : 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="w-full"
            >
              {steps[stepId]}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex items-center justify-between pb-6">
          <button
            type="button"
            onClick={() => (stepIndex === 0 ? onCancel?.() : setStepIndex((i) => i - 1))}
            className="ghost-cream-button inline-flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" /> Back
          </button>
          {isLast ? (
            <button type="button" onClick={save} disabled={saving} className="cream-button inline-flex items-center gap-2">
              <Check className="w-4 h-4" aria-hidden="true" /> {saving ? "Keeping the day…" : "Keep this day"}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setStepIndex((i) => i + 1)}
              disabled={!canAdvance}
              className="cream-button inline-flex items-center gap-2"
              style={{ opacity: canAdvance ? 1 : 0.45 }}
            >
              Continue <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
    </SkyField>
  );
}
