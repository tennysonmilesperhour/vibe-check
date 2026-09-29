import { STRESS_STATES, BODY_CUES, ALIGNMENTS } from '@/lib/practices';
import { usePreferences } from '@/features/patterns/useLivingData';

/** `when`: 'moment' for one journal moment, 'day' for the whole day's check-in. */
export default function StressFields({ value = {}, onChange, compact = false, when = 'moment' }) {
  const personalValues = usePreferences().data?.personal_values || [];
  const update = (patch) => onChange({ ...value, ...patch });
  const toggle = (field, id) => update({ [field]: (value[field] || []).includes(id) ? value[field].filter((item) => item !== id) : [...(value[field] || []), id] });
  // Choosing a state and choosing "None of these" exclude each other.
  const toggleState = (id) => { const next = (value.state_ids || []).includes(id) ? value.state_ids.filter((item) => item !== id) : [...(value.state_ids || []), id]; update({ state_ids: next, none_present: next.length ? undefined : value.none_present }); };
  return <div className="stress-fields space-y-5">
    <fieldset><legend className="living-label">What feels present? <span className="font-normal">Optional</span></legend>
      <div className="living-chips">{STRESS_STATES.map((state) => <button type="button" key={state.id} className="living-chip" aria-pressed={(value.state_ids || []).includes(state.id)} onClick={() => toggleState(state.id)}>{state.label}</button>)}<button type="button" className="living-chip" aria-pressed={Boolean(value.none_present)} onClick={() => update({ none_present: value.none_present ? undefined : true, state_ids: [] })}>None of these</button></div>
    </fieldset>
    {!compact && <>
      <label className="living-label">{when === 'day' ? 'Highest stress today' : 'Stress in this moment'} <select className="living-input mt-2" value={value.stress_score ?? ''} onChange={(e) => update({ stress_score: e.target.value === '' ? null : Number(e.target.value), ...(when === 'day' ? { stress_measure: e.target.value === '' ? undefined : 'highest-today' } : {}) })}><option value="">Not recorded</option>{Array.from({ length: 11 }, (_, n) => <option key={n} value={n}>{n} / 10{n === 0 ? ' · none' : n === 10 ? ' · very high' : ''}</option>)}</select></label>
      <fieldset><legend className="living-label">What did you notice in your body?</legend><div className="living-chips">{BODY_CUES.map((cue) => <button key={cue} type="button" className="living-chip" aria-pressed={(value.body_cues || []).includes(cue)} onClick={() => toggle('body_cues', cue)}>{cue}</button>)}</div></fieldset>
      {[['situation', 'What happened just before?'], ['response', 'How did you respond?'], ['need', 'What did you need or want to do?']].map(([field, label]) => <label key={field} className="living-label">{label}<textarea className="living-input mt-2" rows={2} maxLength={5000} value={value[field] || ''} onChange={(e) => update({ [field]: e.target.value })} /></label>)}
      <label className="living-label">Did your response feel like you?<select className="living-input mt-2" value={value.alignment || ''} onChange={(e) => update({ alignment: e.target.value || null })}><option value="">Not recorded</option>{ALIGNMENTS.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}</select><span className="living-muted block mt-1">Your needs and values define this. Discomfort can be part of an honest choice.</span>{personalValues.length > 0 && <span className="living-muted block mt-1">Your values: {personalValues.join(' · ')}</span>}</label>
    </>}
  </div>;
}
