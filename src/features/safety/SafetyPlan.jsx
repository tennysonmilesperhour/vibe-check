import { useEffect, useRef, useState } from 'react';
import { usePreferences } from '@/features/patterns/useLivingData';
import useBeforeUnload from '@/hooks/use-before-unload';
import { saveProblem } from '@/lib/preference-store';
import LoadingState from '@/features/shell/LoadingState';
import RetryButton from '@/features/shell/RetryButton';

// Structure follows the widely used Stanley-Brown safety plan, in plain words.
const FIELDS = [
  ['warning_signs', 'Signs that a hard time may be starting', 'Thoughts, feelings, or situations you notice first'],
  ['own_coping', 'Things I can do on my own to get through it', 'A walk, music, a shower, holding something familiar…'],
  ['people_places', 'People and places that help me feel a little better', 'Somewhere to go or someone to be around, without having to explain'],
  ['ask_for_help', 'People I can ask for help', 'Names and how to reach them'],
  ['services', 'Services and professionals I can contact', 'A counselor, a doctor, a helpline'],
  ['safer_surroundings', 'Making my surroundings safer', 'Things to put away or places to avoid for now'],
  ['what_matters', 'What matters to me', 'People, places, plans, or reasons that are worth holding on to'],
];

/** A private plan for hard moments, saved only to the person's account. */
export default function SafetyPlan() {
  const prefs = usePreferences();
  const [plan, setPlan] = useState(() => prefs.data?.safety_plan || {});
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  // A refetch must never replace words the person is still writing.
  const [dirty, setDirty] = useState(false);
  const dirtyRef = useRef(false);
  const markDirty = (value) => { dirtyRef.current = value; setDirty(value); };
  const serverPlan = prefs.data?.safety_plan;
  // The plan as it stood when this editing began: only fields changed since
  // are saved, so a field saved from another device meanwhile stays.
  const loadedRef = useRef(serverPlan || {});
  // Also once a save finishes: the stored plan may hold fields from elsewhere.
  useEffect(() => {
    if (dirtyRef.current) return;
    loadedRef.current = serverPlan || {};
    setPlan(serverPlan || {});
  }, [serverPlan, dirty]);
  useBeforeUnload(dirty);
  async function save() {
    setBusy(true); setMessage('');
    try {
      const changed = Object.fromEntries(Object.entries(plan).filter(([key, value]) => value !== (loadedRef.current[key] ?? '')));
      await prefs.savePreferences((stored) => ({ safety_plan: { ...(stored.safety_plan || {}), ...changed } }));
      markDirty(false); // the fields are read-only while saving, so nothing newer was typed
      setMessage('Your safety plan is saved to your account.');
    } catch (err) {
      setMessage(saveProblem(err));
    }
    setBusy(false);
  }
  return (
    <section className="living-card space-y-5" aria-labelledby="safety-plan-heading">
      <div>
        <p className="sanctuary-eyebrow">FOR HARD MOMENTS</p>
        <h2 id="safety-plan-heading" tabIndex={-1} className="outline-none">Your safety plan</h2>
        <p className="living-muted mt-2">Write this when things are calmer, so it's ready when they aren't. Every part is optional and private to your account.</p>
      </div>
      {/* Without the saved plan, a save could replace it, so nothing is editable until it loads.
          A later refresh that fails keeps the loaded plan on screen. */}
      {prefs.isLoading ? <LoadingState label="Loading your plan…" /> : !prefs.data ? (
        <div className="space-y-3" role="alert">
          <p className="living-error">Your safety plan couldn't load. Check your connection.</p>
          <RetryButton className="living-secondary" busy={prefs.retrying} onRetry={prefs.retry} />
        </div>
      ) : FIELDS.map(([key, label, placeholder]) => (
        <label key={key} className="living-label block">
          {label}
          <textarea className="living-input mt-2" rows={2} maxLength={2000} readOnly={busy} value={plan[key] || ''} placeholder={placeholder} onChange={(event) => { markDirty(true); setPlan((current) => ({ ...current, [key]: event.target.value })); }} />
        </label>
      ))}
      {prefs.data && <button type="button" className="ink-button" disabled={busy} onClick={save}>{busy ? 'Saving…' : 'Save my safety plan'}</button>}
      {message && <p className="living-muted" role="status">{message}</p>}
    </section>
  );
}
