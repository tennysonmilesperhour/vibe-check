import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { DailyCheckIn, BoundaryAlert, CheckInDraft } from "@/entities/all";
import { useQueryClient } from '@tanstack/react-query';
import StressFields from './StressFields';
import PersonPicker from '@/features/people/PersonPicker';
import { useToast } from "@/components/ui/use-toast";
import SkyField from "@/features/shell/SkyField";
import { ScaleStep, ChipsStep, FeelingsStep, MomentStep, ReflectionStep } from "./CeremonySteps";
import { EMOTIONS, ACTIVITIES } from "./vocab";
import { ALL_STEPS, chooseSteps } from "./check-in-steps";
import { usePreferences } from "@/features/patterns/useLivingData";
import { evaluateBoundaries, dedupeAlerts } from "@/lib/boundaries";
import { daysKeptThisMonth, daysKeptLabel } from "@/lib/record-days";
import { formatDay, todayKey } from "@/lib/dates";
import { useAuth } from "@/lib/AuthContext";
import { readBuffer, clearBuffer, bufferRestorable, latestVersion, isNewerVersion } from "@/lib/writing-buffer";
import useWritingBuffer from "@/hooks/use-writing-buffer";
import useBeforeUnload from "@/hooks/use-before-unload";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import LoadingState from "@/features/shell/LoadingState";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

// Autosave waits for a pause in typing before writing the server draft.
const AUTOSAVE_DELAY_MS = 1500;
const AUTOSAVE_RETRY_MS = 10000;


// Which questions a kept day asked is bookkeeping in
// stress_context.asked_steps, written only when the day is kept (see save).
// The form, drafts and tab copies hold answers alone, and drop the
// visited_steps that preview builds wrote.
const BOOKKEEPING = ['asked_steps', 'visited_steps'];
const answersOnly = (value) => {
  if (!BOOKKEEPING.some((key) => value?.stress_context?.[key])) return value;
  const stress = Object.fromEntries(Object.entries(value.stress_context).filter(([key]) => !BOOKKEEPING.includes(key)));
  return { ...value, stress_context: stress };
};

/**
 * The daily check-in, at any time of day: one question per screen, the sky
 * deepening as you go. Saves as a single DailyCheckIn; runs opt-in notices.
 */
const formFrom = (existing) => answersOnly({
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
// Words the person typed themselves, beside the preset chips.
const customFrom = (items = [], presets) => items.filter((item) => !presets.some((preset) => preset.label === item)).join(', ');
const withCustom = (items, presets, text) => [...new Set([...items.filter((item) => presets.some((preset) => preset.label === item)), ...text.split(',').map((item) => item.trim()).filter(Boolean)])];

export default function CheckInCeremony({ dateKey = todayKey(), existing = null, onDone, onCancel }) {
  const { toast } = useToast();
  const reduced = useReducedMotion();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const bufferKey = user?.id ? `ceremony:${user.id}:${dateKey}` : null;
  // Every write names the account this check-in opened in, so a write still
  // under way when another account signs in is refused, never kept there.
  const ownerId = useRef(user?.id).current;
  const [stepIndex, setStepIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [draftLoading, setDraftLoading] = useState(true);
  const [draftMessage, setDraftMessage] = useState('');
  const [restored, setRestored] = useState(false); // a saved draft or tab copy was brought back
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const discardButtonRef = useRef(null);
  // Unsaved words from this tab that can't be proven newer than the server copy.
  const [heldBuffer, setHeldBuffer] = useState(null);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [autosave, setAutosave] = useState('idle'); // idle | saving | saved | offline | local
  const [retry, setRetry] = useState(0);
  // The newest server version for this date (check-in or draft). Tab copies
  // record it, so a restore compares server times and never the device clock.
  const [serverVersion, setServerVersion] = useState(existing?.updated_at || null);
  const [form, setForm] = useState(() => formFrom(existing));
  const [customHabits, setCustomHabits] = useState(() => customFrom(existing?.activities, ACTIVITIES));
  const [customFeelings, setCustomFeelings] = useState(() => customFrom(existing?.emotions, EMOTIONS));
  // Which questions to ask, settled once the draft and preferences have loaded.
  const prefs = usePreferences();
  const [stepIds, setStepIds] = useState(null);
  const stepRegionRef = useRef(null);
  const formRef = useRef(form);
  // What the server already holds; anything different is unsaved.
  const baselineRef = useRef(null);
  const draftIdRef = useRef(null);
  // The draft this visit started from, so "Discard changes" can put it back.
  const visitStartDraftRef = useRef(null);
  // False when the saved draft couldn't be loaded: never autosave over a
  // draft this tab has not seen.
  const draftKnownRef = useRef(true);
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
    const answers = answersOnly(payload);
    setForm((previous) => ({ ...previous, ...answers }));
    setCustomHabits(customFrom(answers.activities, ACTIVITIES));
    setCustomFeelings(customFrom(answers.emotions, EMOTIONS));
  };

  useEffect(() => {
    let active = true;
    const initial = formFrom(existing);
    baselineRef.current = JSON.stringify(initial);
    visitStartDraftRef.current = null;
    const buffer = readBuffer(bufferKey);
    // Restore a tab copy that is provably newest; otherwise offer it back
    // rather than dropping words that may still be the latest.
    const takeBuffer = (shown, ...serverTimes) => {
      if (!buffer) return false;
      if (bufferRestorable(buffer, ...serverTimes)) {
        restoreForm(buffer.value);
        setRestored(true);
        return true;
      }
      if (JSON.stringify({ ...shown, ...answersOnly(buffer.value) }) !== JSON.stringify(shown)) setHeldBuffer(buffer.value);
      return false;
    };
    CheckInDraft.filter({ date: dateKey }).then(([draft]) => {
      if (!active) return;
      draftKnownRef.current = true;
      if (draft) draftIdRef.current = draft.id;
      const draftIsNewer = Boolean(draft) && isNewerVersion(draft.updated_at, existing?.updated_at);
      const shown = draftIsNewer ? { ...initial, ...answersOnly(draft.payload) } : initial;
      setServerVersion(latestVersion(existing?.updated_at, draft?.updated_at));
      if (draftIsNewer) {
        baselineRef.current = JSON.stringify(shown);
        visitStartDraftRef.current = draft.payload;
      }
      if (takeBuffer(shown, existing?.updated_at, draft?.updated_at)) {
        setDraftMessage('Your unsaved check-in is here.');
      } else if (draftIsNewer) {
        restoreForm(draft.payload);
        setRestored(true);
        setDraftMessage('Your saved draft is here.');
      }
    }).catch(() => {
      if (!active) return;
      draftKnownRef.current = false;
      if (takeBuffer(initial, existing?.updated_at)) {
        setDraftMessage('Your unsaved check-in is here. We could not reach your saved drafts, so it is kept in this tab until you keep the day.');
      } else {
        setDraftMessage('Could not check for a saved draft. What you write is kept in this tab; reload before continuing if you were resuming one.');
      }
    }).finally(() => { if (active) setDraftLoading(false); });
    return () => { active = false; };
  }, [dateKey, existing?.id, bufferKey]);

  // Keep a tab copy immediately and a server draft after a pause, so a tab
  // switch, reload, or dropped connection never takes the words.
  const snapshot = JSON.stringify(form);
  const dirty = !draftLoading && baselineRef.current !== null && snapshot !== baselineRef.current;
  useWritingBuffer(bufferKey, snapshot, { enabled: dirty && !finishedRef.current, basedOn: serverVersion });
  // Edits taken back to where the visit started leave nothing to restore.
  useEffect(() => {
    if (!draftLoading && !dirty && editedRef.current && !heldBuffer) clearBuffer(bufferKey);
  }, [dirty, draftLoading, heldBuffer, bufferKey]);
  useEffect(() => {
    if (!dirty || finishedRef.current) return undefined;
    if (!draftKnownRef.current) {
      setAutosave('local');
      return undefined;
    }
    autosaveTimerRef.current = setTimeout(() => {
      if (finishedRef.current) return;
      setAutosave('saving');
      const sent = snapshot;
      const payload = form;
      chainRef.current = chainRef.current.catch(() => {}).then(async () => {
        if (finishedRef.current) return;
        try {
          const draft = await CheckInDraft.upsertFor(ownerId, { date: dateKey, payload });
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
  // While the check-in is open, the phone's tab bar steps aside (index.css).
  useEffect(() => {
    document.body.classList.add("ceremony-open");
    return () => document.body.classList.remove("ceremony-open");
  }, []);

  /**
   * Never write over a draft this tab has not seen. Returns a reason to stop,
   * or null when it's safe to write. The words stay in the tab either way.
   */
  async function unseenDraftBlocks() {
    if (draftKnownRef.current) return null;
    let serverDraft;
    try {
      [serverDraft] = await CheckInDraft.filter({ date: dateKey });
    } catch {
      return 'Saved drafts are out of reach';
    }
    if (serverDraft && isNewerVersion(serverDraft.updated_at, existing?.updated_at)) return 'This day already has a saved draft';
    draftKnownRef.current = true;
    if (serverDraft) draftIdRef.current = serverDraft.id;
    return null;
  }

  async function saveDraft() {
    setSaving(true);
    try {
      await settleAutosave();
      const blocked = await unseenDraftBlocks();
      if (blocked) {
        toast({ title: blocked, description: 'Your words are kept in this tab. Reopen the day to continue or compare.' });
        setSaving(false);
        onCancel?.();
        return;
      }
      const draft = await CheckInDraft.upsertFor(ownerId, { date: dateKey, payload: form });
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

  /** Run a draft change after autosave settles. Returns true when it worked. */
  async function changeDrafts(work, failureTitle) {
    setSaving(true);
    try {
      await settleAutosave();
      await work();
      clearBuffer(bufferKey);
      return true;
    } catch (err) {
      resumeAutosave();
      toast({ title: failureTitle, description: err.message, variant: 'destructive' });
      return false;
    } finally {
      setSaving(false);
    }
  }

  // Leave-prompt "Discard changes": undo this visit only. A draft saved on an
  // earlier visit is put back; a draft this visit created is removed.
  const discardVisit = () => changeDrafts(async () => {
    if (visitStartDraftRef.current) await CheckInDraft.upsertFor(ownerId, { date: dateKey, payload: visitStartDraftRef.current });
    else if (draftIdRef.current) {
      await CheckInDraft.delete(draftIdRef.current);
      draftIdRef.current = null;
    }
  }, 'Could not discard the changes');

  // "Discard draft" on a restored draft: remove the whole draft for this day.
  async function discardRestored() {
    const done = await changeDrafts(async () => {
      if (draftIdRef.current) await CheckInDraft.delete(draftIdRef.current);
      draftIdRef.current = null;
    }, 'Could not discard the draft');
    if (!done) return false;
    const initial = formFrom(existing);
    baselineRef.current = JSON.stringify(initial);
    visitStartDraftRef.current = null;
    setForm(initial);
    setCustomHabits(customFrom(initial.activities, ACTIVITIES));
    setCustomFeelings(customFrom(initial.emotions, EMOTIONS));
    setServerVersion(existing?.updated_at || null);
    setRestored(false);
    setAutosave('idle');
    setDraftMessage('Draft discarded.');
    editedRef.current = false;
    finishedRef.current = false;
    return true;
  }

  function acceptHeldBuffer() {
    editedRef.current = true;
    restoreForm(heldBuffer);
    // Any question those words answer is asked again, so nothing is kept unseen.
    if (stepIds) {
      const needed = chooseSteps(tracking, { ...formRef.current, ...heldBuffer });
      const next = ALL_STEPS.filter((id) => stepIds.includes(id) || needed.includes(id));
      setStepIndex(Math.max(0, next.indexOf(stepIds[stepIndex])));
      setStepIds(next);
    }
    setHeldBuffer(null);
    setDraftMessage('Your unsaved words from this tab are back.');
  }

  function dismissHeldBuffer() {
    setHeldBuffer(null);
    if (!editedRef.current) clearBuffer(bufferKey);
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

  // Choices saved before the check-in followed them didn't ask for that, so
  // only choices saved since shape it.
  const tracking = prefs.data?.tracking_shapes_check_in ? prefs.data.tracking || [] : [];
  // Which questions this visit put to the person, added to what the kept day
  // already recorded (an edit never takes one away), and written only when
  // the day is kept. Patterns compare only days that asked about states and
  // about people and habits, so no answer may decide it: only the person's
  // usual questions count, not one shown because it already holds an answer
  // or revealed with "Show all questions", and a draft never adds to it,
  // since only visits that change something leave one.
  const askedRef = useRef(/** @type {Set<string> | null} */ (null));
  if (!askedRef.current) askedRef.current = new Set(existing?.stress_context?.asked_steps || []);
  const usualRef = useRef(ALL_STEPS);
  useEffect(() => {
    if (stepIds || draftLoading || prefs.isLoading) return;
    usualRef.current = chooseSteps(tracking);
    setStepIds(chooseSteps(tracking, formRef.current));
  }, [stepIds, draftLoading, prefs.isLoading, prefs.data]);
  const stepOrder = stepIds || ALL_STEPS;
  const stepId = stepOrder[stepIndex];
  useEffect(() => {
    if (stepIds && stepId && usualRef.current.includes(stepId)) askedRef.current.add(stepId);
  }, [stepIds, stepId]);
  const showAllSteps = () => {
    setStepIds(ALL_STEPS);
    setStepIndex(ALL_STEPS.indexOf(stepId));
    // The button goes away; keep focus on the question, whose label gives the new count.
    requestAnimationFrame(() => stepRegionRef.current?.focus());
  };
  const depth = Math.min(4, 1 + Math.floor(stepIndex / 2));
  const canAdvance = stepId === "mood" ? form.mood_score != null : true;

  const progress = (stepIndex + 1) / stepOrder.length;

  const save = async () => {
    setSaving(true);
    await settleAutosave();
    // The profile only holds the person's notice settings; never let a
    // profile hiccup block keeping the day. A check-in keeps what the person
    // recorded, nothing from the optional systems.
    const me = await base44.auth.me().catch(() => null);
    let saved;
    try {
      const personIds = [
        ...new Set([...(form.person_ids || []), ...(form.high_moment?.person_ids || []), ...(form.low_moment?.person_ids || [])]),
      ];
      const asked = askedRef.current;
      const payload = {
        ...form,
        date: dateKey,
        person_ids: personIds,
        stress_context: { ...form.stress_context, asked_steps: ALL_STEPS.filter((id) => asked.has(id)) },
      };
      // Single atomic write on (user_id, date): a second tab or a re-entered
      // ceremony can't race a read-then-create into a unique violation.
      saved = await DailyCheckIn.upsertFor(ownerId, payload);
    } catch (e) {
      resumeAutosave();
      toast({ title: "Could not save", description: e?.message || "Please try again. Your words are still here.", variant: "destructive" });
      setSaving(false);
      return;
    }

    // The day is kept. Nothing below may bring a draft back or report the
    // save as failed.
    baselineRef.current = JSON.stringify(form);
    clearBuffer(bufferKey);
    if (draftIdRef.current) await CheckInDraft.delete(draftIdRef.current).catch(() => {});
    await queryClient.invalidateQueries({ queryKey: ['living'] }).catch(() => {});

    // Automatic boundary pass. Skipped when the profile could not load:
    // without the person's own thresholds, a default line must not be
    // described as theirs.
    let newAlerts = [];
    if (me) {
      try {
        const recent = await DailyCheckIn.list("-date", 30);
        const candidates = evaluateBoundaries(recent, me.boundary_settings || {});
        const existingAlerts = await BoundaryAlert.list("-created_date", 50);
        newAlerts = dedupeAlerts(candidates, existingAlerts);
        for (const alert of newAlerts) {
          await BoundaryAlert.createFor(ownerId, { ...alert, is_acknowledged: false });
        }
      } catch {
        // boundary check must never block the save
      }
    }

    // A plain acknowledgement: no confetti and no run to keep, since a hard
    // day recorded honestly counts the same as any other.
    const title = existing ? "This day is updated" : "The day is kept";
    try {
      const label = daysKeptLabel(daysKeptThisMonth(await DailyCheckIn.list("-date", 31), todayKey()), todayKey());
      toast(label ? { title, description: `${label}.` } : { title });
    } catch {
      toast({ title });
    }

    setSaving(false);
    onDone?.(saved, { newAlerts });
  };

  const steps = useMemo(() => ({
    mood: <ScaleStep field="mood_score" question="How did today feel?" value={form.mood_score} onChange={set("mood_score")} />,
    energy: <ScaleStep field="energy_level" question="How was your energy?" value={form.energy_level} onChange={set("energy_level")} />,
    sleep: <ScaleStep field="sleep_quality" question="How did you sleep?" value={form.sleep_quality} onChange={set("sleep_quality")} />,
    emotions: <><FeelingsStep selected={form.emotions} onToggle={toggleIn("emotions")} /><div className="ceremony-stress"><label className="living-label">In your own words<input className="living-input mt-2" value={customFeelings} maxLength={1000} placeholder="Any feeling, in the words that fit, separated by commas" onChange={(e) => { const text = e.target.value; setCustomFeelings(text); edit((previous) => ({ ...previous, emotions: withCustom(previous.emotions, EMOTIONS, text) })); }} /></label></div></>,
    activities: <><ChipsStep question="What did you give time to?" options={ACTIVITIES} selected={form.activities} onToggle={toggleIn("activities")} /><div className="ceremony-stress space-y-4"><label className="living-label">Your own habits or activities<input className="living-input mt-2" value={customHabits} maxLength={1000} placeholder="Coffee, late work, a walk… separated by commas" onChange={(e) => { const text = e.target.value; setCustomHabits(text); edit((previous) => ({ ...previous, activities: withCustom(previous.activities, ACTIVITIES, text) })); }} /></label><div><p className="living-label mb-2">People in your day · optional</p><PersonPicker value={form.person_ids} onChange={set('person_ids')} /></div></div></>,
    stress: <><h1 className="text-4xl md:text-5xl" style={{ color: 'var(--gh-cream)' }}>Where did you feel stress?</h1><p className="mt-3" style={{ color: 'var(--gh-cream)' }}>Optional. Keep the cues, your response, and what you needed.</p><div className="ceremony-stress"><StressFields value={form.stress_context} onChange={set('stress_context')} when="day" /></div></>,
    high: <MomentStep kind="high" question="What was the high point?" value={form.high_moment} onChange={set("high_moment")} />,
    low: <MomentStep kind="low" question="What was the hardest moment?" value={form.low_moment} onChange={set("low_moment")} />,
    reflection: <ReflectionStep value={{ gratitude: form.gratitude, notes: form.notes }} onChange={(v) => edit((f) => ({ ...f, ...v }))} />,
  }), [form, customHabits, customFeelings]);

  const isLast = stepIndex === stepOrder.length - 1;

  if (draftLoading || !stepIds) return <div className="living-page"><LoadingState variant="page" label="Opening your check-in…" /></div>;

  return (
    <SkyField depth={depth} className="ceremony-surface">
      <div className="ceremony-column max-w-3xl mx-auto px-6 py-10 flex flex-col">
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
          <span>{stepIndex + 1} of {stepOrder.length}</span>
          <span className="flex items-center gap-4">
            <span role="status" aria-live="polite" className="text-xs">{autosave === 'saving' ? 'Saving draft…' : autosave === 'saved' && !dirty ? 'Draft saved' : autosave === 'offline' ? 'Not saved yet. Your words stay in this tab.' : autosave === 'local' ? 'Kept in this tab' : ''}</span>
            <button type="button" onClick={saveDraft} disabled={saving} className="underline underline-offset-4">{saving ? 'Saving…' : 'Save draft and close'}</button>
          </span>
        </div>
        <p className="mt-4 text-sm" style={{ color: 'var(--gh-cream)' }}>{formatDay(dateKey, { style: 'long' })} · A mood is enough. Every detail after it is optional.{stepOrder.length < ALL_STEPS.length && <> Some questions are left out to match what you chose to notice. <button type="button" className="underline underline-offset-4" onClick={showAllSteps}>Show all questions</button></>}</p>
        {draftMessage && <p className="mt-2 text-sm" role="status" style={{ color: 'var(--gh-cream)' }}>{draftMessage}{restored && <button ref={discardButtonRef} type="button" className="danger-link ml-3" disabled={saving} onClick={() => setConfirmDiscard(true)}>Discard draft</button>}</p>}
        <AlertDialog open={confirmDiscard} onOpenChange={(open) => { if (!open && !saving) setConfirmDiscard(false); }}>
          <AlertDialogContent onCloseAutoFocus={(e) => { e.preventDefault(); (discardButtonRef.current || stepRegionRef.current)?.focus(); }}>
            <AlertDialogHeader>
              <AlertDialogTitle>Discard this draft?</AlertDialogTitle>
              <AlertDialogDescription>What the draft for {formatDay(dateKey, { style: "long" })} holds is deleted, and the check-in goes back to what was last kept. Check-ins you have kept are not affected.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={saving}>Keep the draft</AlertDialogCancel>
              <AlertDialogAction variant="destructive" aria-disabled={saving} onClick={async (e) => { e.preventDefault(); if (saving) return; if (await discardRestored()) setConfirmDiscard(false); }}>{saving ? "Discarding…" : "Discard draft"}</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        {heldBuffer && (
          <p className="mt-2 text-sm" role="status" style={{ color: 'var(--gh-cream)' }}>
            This tab also kept unsaved words that may be newer than what is shown.
            <button type="button" className="underline underline-offset-4 ml-3" onClick={acceptHeldBuffer}>Use them</button>
            <button type="button" className="underline underline-offset-4 ml-3" onClick={dismissHeldBuffer}>Dismiss</button>
          </p>
        )}

        <div className="flex-1 flex items-center py-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={stepId}
              ref={stepRegionRef}
              tabIndex={-1}
              role="group"
              aria-label={`Step ${stepIndex + 1} of ${stepOrder.length}`}
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
              <button type="button" className="danger-outline text-sm" disabled={saving} onClick={async () => { if (await discardVisit()) onCancel?.(); }}>Discard changes</button>
              <button type="button" className="underline underline-offset-4" onClick={() => setConfirmLeave(false)}>Keep editing</button>
            </div>
          </div>
        )}
        {/* On a phone, Back and the short save share a row and the next step
            takes the full width below, in reading order. */}
        <div className="grid grid-cols-[auto_1fr] items-center gap-3 pb-6 sm:flex sm:flex-wrap sm:justify-between">
          <button
            type="button"
            onClick={() => (stepIndex === 0 ? requestLeave() : setStepIndex((i) => i - 1))}
            className="ghost-cream-button inline-flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" /> Back
          </button>
          {isLast ? (
            <button type="button" onClick={save} disabled={saving} className="cream-button inline-flex items-center gap-2 col-span-2 sm:col-span-1">
              <Check className="w-4 h-4" aria-hidden="true" /> {saving ? "Keeping the day…" : "Keep this day"}
            </button>
          ) : (
            <div className="contents sm:flex sm:flex-wrap sm:gap-3"><button type="button" disabled={saving || form.mood_score == null} className="ghost-cream-button text-sm justify-self-end" onClick={save}>{saving ? 'Saving…' : 'Keep short check-in'}</button><button
              type="button"
              onClick={() => setStepIndex((i) => i + 1)}
              disabled={!canAdvance || saving}
              className="cream-button inline-flex items-center gap-2 col-span-2 sm:col-span-1"
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
