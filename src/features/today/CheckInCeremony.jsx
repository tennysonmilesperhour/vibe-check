import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { DailyCheckIn, BoundaryAlert, CheckInDraft } from "@/entities/all";
import { useQueryClient } from '@tanstack/react-query';
import StressFields from './StressFields';
import PersonPicker from '@/features/people/PersonPicker';
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

const STEP_IDS = ["mood", "energy", "sleep", "emotions", "activities", "stress", "high", "low", "reflection"];

/**
 * The evening ritual: one question per screen, the sky deepening as you go.
 * Saves as a single DailyCheckIn; runs boundary detection; celebrates streaks.
 */
export default function CheckInCeremony({ dateKey = todayKey(), existing = null, onDone, onCancel }) {
  const { toast } = useToast();
  const reduced = useReducedMotion();
  const queryClient = useQueryClient();
  const [stepIndex, setStepIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [draftLoading, setDraftLoading] = useState(true);
  const [draftId, setDraftId] = useState(null);
  const [draftMessage, setDraftMessage] = useState('');
  const [customHabits, setCustomHabits] = useState((existing?.activities || []).filter((item) => !ACTIVITIES.some((preset) => preset.label === item)).join(', '));
  const stepRegionRef = useRef(null);

  // Keyboard and screen-reader users track progress: each step change moves
  // focus to the new step's region (which carries the question heading).
  useEffect(() => {
    stepRegionRef.current?.focus();
  }, [stepIndex]);
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
    stress_context: existing?.stress_context ?? {},
  }));

  useEffect(() => {
    let active = true;
    CheckInDraft.filter({ date: dateKey }).then(([draft]) => {
      if (!active || !draft) return;
      setDraftId(draft.id);
      if (!existing || draft.updated_at > existing.updated_at) {
        setForm((previous) => ({ ...previous, ...draft.payload }));
        setCustomHabits((draft.payload.activities || []).filter((item) => !ACTIVITIES.some((preset) => preset.label === item)).join(', '));
        setDraftMessage('Your saved draft is here.');
      }
    }).catch(() => { if (active) setDraftMessage('Could not check for a saved draft. Reload before continuing if you were resuming one.'); }).finally(() => { if (active) setDraftLoading(false); });
    return () => { active = false; };
  }, [dateKey, existing?.id]);

  async function saveDraft() {
    setSaving(true);
    try {
      await CheckInDraft.upsert({ date: dateKey, payload: form });
      toast({ title: 'Draft saved', description: 'Return to this date to continue.' });
      onCancel?.();
    } catch (err) { toast({ title: 'Could not save the draft', description: err.message, variant: 'destructive' }); }
    setSaving(false);
  }

  const set = (key) => (val) => setForm((f) => ({ ...f, [key]: val }));
  const toggleIn = (key) => (label) =>
    setForm((f) => ({
      ...f,
      [key]: f[key].includes(label) ? f[key].filter((x) => x !== label) : [...f[key], label],
    }));

  const stepId = STEP_IDS[stepIndex];
  const depth = Math.min(4, 1 + Math.floor(stepIndex / 2));
  const canAdvance = stepId === "mood" ? form.mood_score != null : true;

  const progress = (stepIndex + 1) / STEP_IDS.length;

  const save = async () => {
    setSaving(true);
    try {
      const me = await base44.auth.me();
      const birthDate = me?.cosmic_profile?.birth_date || null;
      const moon = moonPhase(dateKey);
      const personIds = [
        ...new Set([...(form.person_ids || []), ...(form.high_moment?.person_ids || []), ...(form.low_moment?.person_ids || [])]),
      ];
      const payload = {
        ...form,
        date: dateKey,
        moon_phase: moon.name,
        ...(birthDate ? { personal_day: personalDay(birthDate, dateKey) } : {}),
        person_ids: personIds,
      };

      // Single atomic write on (user_id, date): a second tab or a re-entered
      // ceremony can't race a read-then-create into a unique violation.
      const saved = await DailyCheckIn.upsert(payload);
      if (draftId) await CheckInDraft.delete(draftId).catch(() => {});
      await queryClient.invalidateQueries({ queryKey: ['living'] });

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
          confetti({ particleCount: 90, spread: 75, origin: { y: 0.7 }, colors: ["#A8B69A", "#D0B999", "#B99A55", "#F5F0E5"] });
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
    mood: <ScaleStep field="mood_score" question="How did today feel?" value={form.mood_score} onChange={set("mood_score")} />,
    energy: <ScaleStep field="energy_level" question="How was your energy?" value={form.energy_level} onChange={set("energy_level")} />,
    sleep: <ScaleStep field="sleep_quality" question="How did you sleep?" value={form.sleep_quality} onChange={set("sleep_quality")} />,
    emotions: <ChipsStep question="Which feelings moved through?" hint="Choose any that visited, even briefly." options={EMOTIONS} selected={form.emotions} onToggle={toggleIn("emotions")} />,
    activities: <><ChipsStep question="What did you give time to?" options={ACTIVITIES} selected={form.activities} onToggle={toggleIn("activities")} /><div className="ceremony-stress space-y-4"><label className="living-label">Your own habits or activities<input className="living-input mt-2" value={customHabits} maxLength={1000} placeholder="Coffee, late work, a walk… separated by commas" onChange={(e) => { const text = e.target.value; setCustomHabits(text); setForm((previous) => ({ ...previous, activities: [...new Set([...previous.activities.filter((item) => ACTIVITIES.some((preset) => preset.label === item)), ...text.split(',').map((item) => item.trim()).filter(Boolean)])] })); }} /></label><div><p className="living-label mb-2">People in your day · optional</p><PersonPicker value={form.person_ids} onChange={set('person_ids')} /></div></div></>,
    stress: <><h1 className="text-4xl md:text-5xl" style={{ color: 'var(--gh-cream)' }}>Where did you feel stress?</h1><p className="mt-3" style={{ color: 'var(--gh-cream)' }}>Optional. Keep the cues, your response, and what you needed.</p><div className="ceremony-stress"><StressFields value={form.stress_context} onChange={set('stress_context')} /></div></>,
    high: <MomentStep kind="high" question="What was the high point?" value={form.high_moment} onChange={set("high_moment")} />,
    low: <MomentStep kind="low" question="What was the hardest moment?" value={form.low_moment} onChange={set("low_moment")} />,
    reflection: <ReflectionStep value={{ gratitude: form.gratitude, notes: form.notes }} onChange={(v) => setForm((f) => ({ ...f, ...v }))} />,
  }), [form, customHabits]);

  const isLast = stepIndex === STEP_IDS.length - 1;

  if (draftLoading) return <div className="living-page" role="status">Opening your check-in…</div>;

  return (
    <SkyField depth={depth} className="min-h-screen ceremony-surface">
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
          <button type="button" onClick={saveDraft} disabled={saving} className="underline underline-offset-4">{saving ? 'Saving…' : 'Save draft and close'}</button>
        </div>
        <p className="mt-4 text-sm" style={{ color: 'var(--gh-cream)' }}>{dateKey} · A mood is enough. Every detail after it is optional.</p>
        {draftMessage && <p className="mt-2 text-sm" role="status" style={{ color: 'var(--gh-cream)' }}>{draftMessage}</p>}

        <div className="flex-1 flex items-center py-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={stepId}
              ref={stepRegionRef}
              tabIndex={-1}
              role="group"
              aria-label={`Step ${stepIndex + 1} of ${STEP_IDS.length}`}
              initial={{ opacity: 0, x: reduced ? 0 : 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: reduced ? 0 : -24 }}
              transition={{ duration: reduced ? 0 : 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="w-full outline-none"
            >
              {steps[stepId]}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex flex-wrap gap-3 items-center justify-between pb-6">
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
            <div className="flex flex-wrap gap-3"><button type="button" disabled={saving || form.mood_score == null} className="ghost-cream-button text-sm" onClick={save}>{saving ? 'Saving…' : 'Keep short check-in'}</button><button
              type="button"
              onClick={() => setStepIndex((i) => i + 1)}
              disabled={!canAdvance || saving}
              className="cream-button inline-flex items-center gap-2"
              style={{ opacity: canAdvance ? 1 : 0.45 }}
            >
              {stepId === 'mood' ? 'Add details' : 'Continue'} <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button></div>
          )}
        </div>
      </div>
    </SkyField>
  );
}
