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
import { useAuth } from "@/lib/AuthContext";
import { readBuffer, clearBuffer, bufferRestorable } from "@/lib/writing-buffer";
import useWritingBuffer from "@/hooks/use-writing-buffer";
import useBeforeUnload from "@/hooks/use-before-unload";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";

// Autosave waits for a pause in typing before writing the server draft.
const AUTOSAVE_DELAY_MS = 1500;
const AUTOSAVE_RETRY_MS = 10000;

const STEP_IDS = ["mood", "energy", "sleep", "emotions", "activities", "stress", "high", "low", "reflection"];

/**
 * The evening ritual: one question per screen, the sky deepening as you go.
 * Saves as a single DailyCheckIn; runs boundary detection; celebrates streaks.
 */
const formFrom = (existing) => ({
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
});
const customHabitsFrom = (activities = []) => activities.filter((item) => !ACTIVITIES.some((preset) => preset.label === item)).join(', ');

export default function CheckInCeremony({ dateKey = todayKey(), existing = null, onDone, onCancel }) {
  const { toast } = useToast();
  const reduced = useReducedMotion();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const bufferKey = user?.id ? `ceremony:${user.id}:${dateKey}` : null;
  const [stepIndex, setStepIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [draftLoading, setDraftLoading] = useState(true);
  const [draftMessage, setDraftMessage] = useState('');
  const [restored, setRestored] = useState(false); // a saved draft or tab copy was brought back
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [autosave, setAutosave] = useState('idle'); // idle | saving | saved | offline
  const [retry, setRetry] = useState(0);
  // The newest server version for this date (check-in or draft). Tab copies
  // record it, so a restore compares server times and never the device clock.
  const [serverVersion, setServerVersion] = useState(existing?.updated_at || null);
  const [form, setForm] = useState(() => formFrom(existing));
  const [customHabits, setCustomHabits] = useState(() => customHabitsFrom(existing?.activities));
  const stepRegionRef = useRef(null);
  const formRef = useRef(form);
  // What the server already holds; anything different is unsaved.
  const baselineRef = useRef(null);
  const draftIdRef = useRef(null);
  // Draft writes run one at a time, in order, so an older draft can never land
  // after a newer one or after the day is kept.
  const chainRef = useRef(Promise.resolve());
  const finishedRef = useRef(false);
  const editedRef = useRef(false);
  const autosaveTimerRef = useRef(null);
  const retryTimerRef = useRef(null);
  useEffect(() => { formRef.current = form; }, [form]);

  // Keyboard and screen-reader users track progress: each step change moves
  // focus to the new step's region (which carries the question heading).
  useEffect(() => {
    stepRegionRef.current?.focus();
  }, [stepIndex]);

  const restoreForm = (payload) => {
    setForm((previous) => ({ ...previous, ...payload }));
    setCustomHabits(customHabitsFrom(payload.activities));
  };

  useEffect(() => {
    let active = true;
    const initial = formFrom(existing);
    baselineRef.current = JSON.stringify(initial);
    const buffer = readBuffer(bufferKey);
    const restoreBuffer = (message) => {
      restoreForm(buffer.value);
      setRestored(true);
      setDraftMessage(message);
    };
    CheckInDraft.filter({ date: dateKey }).then(([draft]) => {
      if (!active) return;
      if (draft) draftIdRef.current = draft.id;
      const draftIsNewer = Boolean(draft) && (!existing || draft.updated_at > existing.updated_at);
      setServerVersion([existing?.updated_at, draft?.updated_at].filter(Boolean).sort().at(-1) || null);
      if (draftIsNewer) baselineRef.current = JSON.stringify({ ...initial, ...draft.payload });
      if (bufferRestorable(buffer, existing?.updated_at, draft?.updated_at)) {
        restoreBuffer('Your unsaved check-in is here.');
      } else if (draftIsNewer) {
        restoreForm(draft.payload);
        setRestored(true);
        setDraftMessage('Your saved draft is here.');
      }
    }).catch(() => {
      if (!active) return;
      if (bufferRestorable(buffer, existing?.updated_at)) {
        restoreBuffer('Your unsaved check-in is here. We could not reach your saved drafts, so keep this tab open until it saves.');
      } else {
        setDraftMessage('Could not check for a saved draft. Reload before continuing if you were resuming one.');
      }
    }).finally(() => { if (active) setDraftLoading(false); });
    return () => { active = false; };
  }, [dateKey, existing?.id, bufferKey]);

  // Keep a tab copy immediately and a server draft after a pause, so a tab
  // switch, reload, or dropped connection never takes the words.
  const snapshot = JSON.stringify(form);
  const dirty = !draftLoading && baselineRef.current !== null && snapshot !== baselineRef.current;
  useWritingBuffer(bufferKey, form, { enabled: dirty && !finishedRef.current, basedOn: serverVersion });
  useEffect(() => {
    if (!dirty || finishedRef.current) return undefined;
    autosaveTimerRef.current = setTimeout(() => {
      if (finishedRef.current) return;
      setAutosave('saving');
      const sent = snapshot;
      const payload = form;
      chainRef.current = chainRef.current.catch(() => {}).then(async () => {
        if (finishedRef.current) return;
        try {
          const draft = await CheckInDraft.upsert({ date: dateKey, payload });
          // Record the id even if the final save started meanwhile, so it can
          // delete this draft once the day is kept.
          draftIdRef.current = draft.id;
          if (finishedRef.current) return;
          setServerVersion(draft.updated_at || null);
          baselineRef.current = sent;
          // The server now holds these words; keep a tab copy only for newer ones.
          if (JSON.stringify(formRef.current) === sent) clearBuffer(bufferKey);
          setAutosave('saved');
        } catch {
          if (finishedRef.current) return;
          setAutosave('offline');
          clearTimeout(retryTimerRef.current);
          retryTimerRef.current = setTimeout(() => setRetry((count) => count + 1), AUTOSAVE_RETRY_MS);
        }
      });
    }, AUTOSAVE_DELAY_MS);
    return () => clearTimeout(autosaveTimerRef.current);
  }, [snapshot, dirty, dateKey, bufferKey, retry]);

  // Retry a failed autosave as soon as the connection returns.
  useEffect(() => {
    const onOnline = () => setRetry((count) => count + 1);
    window.addEventListener('online', onOnline);
    return () => {
      window.removeEventListener('online', onOnline);
      clearTimeout(retryTimerRef.current);
    };
  }, []);

  /** Stop scheduled autosaves and wait for every draft write already sent. */
  async function settleAutosave() {
    finishedRef.current = true;
    clearTimeout(autosaveTimerRef.current);
    clearTimeout(retryTimerRef.current);
    await chainRef.current.catch(() => {});
  }

  /** After a failed save, keep autosaving what is still unsaved. */
  function resumeAutosave() {
    finishedRef.current = false;
    setRetry((count) => count + 1);
  }

  useBeforeUnload(dirty && !finishedRef.current);

  async function saveDraft() {
    setSaving(true);
    try {
      await settleAutosave();
      const draft = await CheckInDraft.upsert({ date: dateKey, payload: form });
      draftIdRef.current = draft.id;
      clearBuffer(bufferKey);
      toast({ title: 'Draft saved', description: 'Return to this date to continue.' });
      onCancel?.();
    } catch (err) {
      resumeAutosave();
      toast({ title: 'Could not save the draft', description: err.message, variant: 'destructive' });
    }
    setSaving(false);
  }

  /** Remove this session's draft and tab copy. Returns true when done. */
  async function discardDraft() {
    setSaving(true);
    try {
      await settleAutosave();
      if (draftIdRef.current) await CheckInDraft.delete(draftIdRef.current);
      draftIdRef.current = null;
      clearBuffer(bufferKey);
      return true;
    } catch (err) {
      resumeAutosave();
      toast({ title: 'Could not discard the draft', description: err.message, variant: 'destructive' });
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function discardRestored() {
    if (!(await discardDraft())) return;
    const initial = formFrom(existing);
    baselineRef.current = JSON.stringify(initial);
    setForm(initial);
    setCustomHabits(customHabitsFrom(initial.activities));
    setServerVersion(existing?.updated_at || null);
    setRestored(false);
    setAutosave('idle');
    setDraftMessage('Draft discarded.');
    editedRef.current = false;
    finishedRef.current = false;
  }

  // Leaving from the first step: ask only if this visit changed something.
  function requestLeave() {
    if (dirty || editedRef.current) setConfirmLeave(true);
    else onCancel?.();
  }

  const edit = (updater) => {
    editedRef.current = true;
    setForm(updater);
  };

  const set = (key) => (val) => edit((f) => ({ ...f, [key]: val }));
  const toggleIn = (key) => (label) =>
    edit((f) => ({
      ...f,
      [key]: f[key].includes(label) ? f[key].filter((x) => x !== label) : [...f[key], label],
    }));

  const stepId = STEP_IDS[stepIndex];
  const depth = Math.min(4, 1 + Math.floor(stepIndex / 2));
  const canAdvance = stepId === "mood" ? form.mood_score != null : true;

  const progress = (stepIndex + 1) / STEP_IDS.length;

  const save = async () => {
    setSaving(true);
    await settleAutosave();
    try {
      // The profile only adds an optional personal-day number; never let a
      // profile hiccup block keeping the day.
      const me = await base44.auth.me().catch(() => null);
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
      clearBuffer(bufferKey);
      if (draftIdRef.current) await CheckInDraft.delete(draftIdRef.current).catch(() => {});
      await queryClient.invalidateQueries({ queryKey: ['living'] });

      // Automatic boundary pass — the old app made you press a button on another page.
      // Skipped when the profile could not load: without the person's own
      // thresholds, a default line must not be described as theirs.
      let newAlerts = [];
      if (me) try {
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
          confetti({ particleCount: 90, spread: 75, origin: { y: 0.7 }, colors: ["#929B78", "#B59B79", "#A58E66", "#E9E2CD"] });
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
      resumeAutosave();
      toast({ title: "Could not save", description: e?.message || "Please try again. Your words are still here.", variant: "destructive" });
    }
    setSaving(false);
  };

  const steps = useMemo(() => ({
    mood: <ScaleStep field="mood_score" question="How did today feel?" value={form.mood_score} onChange={set("mood_score")} />,
    energy: <ScaleStep field="energy_level" question="How was your energy?" value={form.energy_level} onChange={set("energy_level")} />,
    sleep: <ScaleStep field="sleep_quality" question="How did you sleep?" value={form.sleep_quality} onChange={set("sleep_quality")} />,
    emotions: <ChipsStep question="Which feelings moved through?" hint="Choose any that visited, even briefly." options={EMOTIONS} selected={form.emotions} onToggle={toggleIn("emotions")} />,
    activities: <><ChipsStep question="What did you give time to?" options={ACTIVITIES} selected={form.activities} onToggle={toggleIn("activities")} /><div className="ceremony-stress space-y-4"><label className="living-label">Your own habits or activities<input className="living-input mt-2" value={customHabits} maxLength={1000} placeholder="Coffee, late work, a walk… separated by commas" onChange={(e) => { const text = e.target.value; setCustomHabits(text); edit((previous) => ({ ...previous, activities: [...new Set([...previous.activities.filter((item) => ACTIVITIES.some((preset) => preset.label === item)), ...text.split(',').map((item) => item.trim()).filter(Boolean)])] })); }} /></label><div><p className="living-label mb-2">People in your day · optional</p><PersonPicker value={form.person_ids} onChange={set('person_ids')} /></div></div></>,
    stress: <><h1 className="text-4xl md:text-5xl" style={{ color: 'var(--gh-cream)' }}>Where did you feel stress?</h1><p className="mt-3" style={{ color: 'var(--gh-cream)' }}>Optional. Keep the cues, your response, and what you needed.</p><div className="ceremony-stress"><StressFields value={form.stress_context} onChange={set('stress_context')} /></div></>,
    high: <MomentStep kind="high" question="What was the high point?" value={form.high_moment} onChange={set("high_moment")} />,
    low: <MomentStep kind="low" question="What was the hardest moment?" value={form.low_moment} onChange={set("low_moment")} />,
    reflection: <ReflectionStep value={{ gratitude: form.gratitude, notes: form.notes }} onChange={(v) => edit((f) => ({ ...f, ...v }))} />,
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
          <span className="flex items-center gap-4">
            <span role="status" aria-live="polite" className="text-xs">{autosave === 'saving' ? 'Saving draft…' : autosave === 'saved' && !dirty ? 'Draft saved' : autosave === 'offline' ? 'Not saved yet. Your words stay in this tab.' : ''}</span>
            <button type="button" onClick={saveDraft} disabled={saving} className="underline underline-offset-4">{saving ? 'Saving…' : 'Save draft and close'}</button>
          </span>
        </div>
        <p className="mt-4 text-sm" style={{ color: 'var(--gh-cream)' }}>{dateKey} · A mood is enough. Every detail after it is optional.</p>
        {draftMessage && <p className="mt-2 text-sm" role="status" style={{ color: 'var(--gh-cream)' }}>{draftMessage}{restored && <button type="button" className="underline underline-offset-4 ml-3" disabled={saving} onClick={discardRestored}>Discard draft</button>}</p>}

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

        {confirmLeave && (
          <div className="mb-4 p-4 text-sm" role="alert" style={{ color: 'var(--gh-cream)', border: '1px solid rgba(255,253,246,0.45)', borderRadius: 'var(--radius)' }}>
            <p className="mb-3">Keep your changes to this day as a draft?</p>
            <div className="flex flex-wrap items-center gap-3">
              <button type="button" className="cream-button text-sm" disabled={saving} onClick={saveDraft}>Keep as draft</button>
              <button type="button" className="ghost-cream-button text-sm" disabled={saving} onClick={async () => { if (await discardDraft()) onCancel?.(); }}>Discard changes</button>
              <button type="button" className="underline underline-offset-4" onClick={() => setConfirmLeave(false)}>Keep editing</button>
            </div>
          </div>
        )}
        <div className="flex flex-wrap gap-3 items-center justify-between pb-6">
          <button
            type="button"
            onClick={() => (stepIndex === 0 ? requestLeave() : setStepIndex((i) => i - 1))}
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
