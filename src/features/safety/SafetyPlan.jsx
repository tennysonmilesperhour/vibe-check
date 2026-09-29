import { useEffect, useRef, useState } from 'react';
import { useLivingData } from '@/features/patterns/useLivingData';
import useBeforeUnload from '@/hooks/use-before-unload';

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
  const living = useLivingData();
  const saved = living.data?.preferences?.safety_plan || {};
  const [plan, setPlan] = useState(saved);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  // A refetch must never replace words the person is still writing.
  const [dirty, setDirty] = useState(false);
  const dirtyRef = useRef(false);
  const markDirty = (value) => { dirtyRef.current = value; setDirty(value); };
  const serverPlan = living.data?.preferences?.safety_plan;
  useEffect(() => { if (!dirtyRef.current) setPlan(serverPlan || {}); }, [serverPlan]);
  useBeforeUnload(dirty);
  async function save() {
    setBusy(true); setMessage('');
    try {
      await living.savePreferences({ safety_plan: plan });
      markDirty(false); // the fields are read-only while saving, so nothing newer was typed
      setMessage('Your safety plan is saved to your account.');
    } catch (err) {
      setMessage(`Could not save: ${err.message}`);
    }
    setBusy(false);
  }
  return (
    <section className="living-card space-y-5" aria-labelledby="safety-plan-heading">
      <div>
        <p className="sanctuary-eyebrow">FOR HARD MOMENTS</p>
        <h2 id="safety-plan-heading">Your safety plan</h2>
        <p className="living-muted mt-2">Write this when things are calmer, so it's ready when they aren't. Every part is optional and private to your account.</p>
      </div>
      {living.isLoading ? <p className="living-muted" role="status">Loading your plan…</p> : FIELDS.map(([key, label, placeholder]) => (
        <label key={key} className="living-label block">
          {label}
          <textarea className="living-input mt-2" rows={2} maxLength={2000} readOnly={busy} value={plan[key] || ''} placeholder={placeholder} onChange={(event) => { markDirty(true); setPlan((current) => ({ ...current, [key]: event.target.value })); }} />
        </label>
      ))}
      <button type="button" className="ink-button" disabled={busy || living.isLoading || !living.isSuccess} onClick={save}>{busy ? 'Saving…' : 'Save my safety plan'}</button>
      {message && <p className="living-muted" role="status">{message}</p>}
    </section>
  );
}
