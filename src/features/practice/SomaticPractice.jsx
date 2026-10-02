import { useEffect, useRef, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { ArrowRight, Clock3, Leaf, Check, X } from 'lucide-react';
import { PracticeSession } from '@/api/entities';
import { useLivingData } from '@/features/patterns/useLivingData';
import { useAuth } from '@/lib/AuthContext';
import PlantVoice from '@/features/shell/PlantVoice';
import { STRESS_STATES, PRACTICES, PRACTICE_SOURCES, ALIGNMENTS, OUTCOMES, stateById, practiceById, recommendPractices, hiddenPractices, hiddenPracticesPatch, UNCOMFORTABLE_KEPT_HIDDEN, PLANT_COMPANIONS } from '@/lib/practices';
import { formatDay, todayKey } from '@/lib/dates';
import useBeforeUnload from '@/hooks/use-before-unload';
import LoadingState from '@/features/shell/LoadingState';

export function PlantCompanions() {
  const [chosen, setChosen] = useState(null);
  return <section className="living-card space-y-5" aria-labelledby="plant-companions-heading">
    <div><p className="sanctuary-eyebrow">AN OPTIONAL DEEPER LAYER</p><h2 id="plant-companions-heading">The plants beside you</h2><p className="living-muted mt-2">Seven chakra companions, offered as creative invitations for reflection.</p></div>
    <div className="living-chips">{PLANT_COMPANIONS.map((plant) => <button type="button" className="living-chip" aria-pressed={chosen?.plant === plant.plant} key={plant.plant} onClick={() => setChosen(plant)}>{plant.plant}<span className="text-xs ml-2 opacity-75">{plant.chakra}</span></button>)}</div>
    {chosen && <div className="living-inset"><p className="sanctuary-eyebrow">{chosen.plant} · {chosen.focus}</p><p className="text-xl font-display my-3">{chosen.question}</p><Link className="living-text-link" to={`/Analytics?tab=journal&compose=1&prompt=${encodeURIComponent(chosen.question)}`}>Reflect in your journal <ArrowRight size={15} /></Link></div>}
    <p className="living-muted text-xs">These pairings are authored for Vibe Check. They are symbolic, carry no medical claim, and require no plant use or consumption.</p>
  </section>;
}

export default function SomaticPractice() {
  const living = useLivingData();
  // Saves name the account this page opened in (see CheckInCeremony).
  const { user } = useAuth();
  const ownerId = useRef(user?.id).current;
  const [params, setParams] = useSearchParams();
  const state = stateById(params.get('state'));
  const activeId = params.get('practice');
  const [before, setBefore] = useState('');
  const [after, setAfter] = useState('');
  const [intention, setIntention] = useState('');
  const [outcome, setOutcome] = useState('');
  const [alignment, setAlignment] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [showHistory, setShowHistory] = useState(20);
  const [deleting, setDeleting] = useState(null);
  const [editSession, setEditSession] = useState(null);
  // After a practice felt more uncomfortable: ask, rather than hide it for them.
  const [askStop, setAskStop] = useState(null);
  const askStopRef = useRef(null);
  const noticeRef = useRef(null);
  useEffect(() => { if (askStop) askStopRef.current?.focus(); }, [askStop]);
  // When the prompt closes, focus goes to what it said, not to the top of the page.
  const announce = (text) => { setNotice(text); requestAnimationFrame(() => noticeRef.current?.focus()); };
  const data = living.data;
  const sessions = data?.sessions || [];
  const hidden = hiddenPractices(data?.preferences, sessions);
  const blocked = new Set(hidden);
  // Save the earlier promise as explicit hidden entries, once, so it shows
  // under Hidden practices with Unhide. The patch works from what is stored,
  // so another device's newer choices are never overwritten.
  const promiseSaved = Boolean(data?.preferences?.[UNCOMFORTABLE_KEPT_HIDDEN]);
  const keepPromise = () => living.savePreferences(hiddenPracticesPatch(sessions));
  useEffect(() => {
    if (living.isSuccess && !promiseSaved) keepPromise().catch(() => {});
  }, [living.isSuccess, promiseSaved]);
  const suggestions = state ? recommendPractices(state.id, sessions, hidden) : [];
  const active = living.isSuccess && activeId && !blocked.has(activeId) ? practiceById(activeId) : null;
  useBeforeUnload(Boolean(active) && Boolean(before.trim() || after.trim()));

  useEffect(() => {
    setBefore(''); setAfter(''); setOutcome(''); setAlignment('');
    setIntention(living.data?.preferences?.intention || '');
    setError('');
  }, [activeId, living.data?.preferences?.intention]);

  function chooseState(id) {
    setNotice(''); setAskStop(null);
    setParams((previous) => { const next = new URLSearchParams(previous); next.set('tab', 'somatic'); next.set('state', id); next.delete('practice'); next.delete('pattern'); next.delete('sources'); return next; });
  }
  function choosePractice(id) {
    setNotice(''); setAskStop(null);
    setParams((previous) => { const next = new URLSearchParams(previous); next.set('practice', id); return next; });
  }
  function closePractice() {
    setParams((previous) => { const next = new URLSearchParams(previous); next.delete('practice'); return next; });
  }
  async function save(status = 'completed') {
    if (!active || !state) return;
    setBusy(true); setError('');
    try {
      // The promise covers responses from before this visit only: settle it
      // before saving a new one, which then asks instead.
      const promiseKept = promiseSaved || await keepPromise().then(() => true, () => false);
      await PracticeSession.createFor(ownerId, { date: todayKey(), practice_id: active.id, state_id: state.id, status, intention, before_notes: before, after_notes: after, outcome: outcome || null, alignment: alignment || null, source_pattern: params.get('pattern') || null, source_entry_keys: (params.get('sources') || '').split(',').filter(Boolean) });
      const stored = await living.refresh({ withPreferences: true }); closePractice();
      // Say what now holds: an earlier promise that timed out may still have
      // been stored, and under it this response doesn't hide the practice.
      const hiddenNow = stored ? hiddenPractices(stored.preferences, stored.sessions).includes(active.id) : !promiseKept;
      if (outcome === 'More uncomfortable' && !hiddenNow) { setNotice(''); setAskStop(active.id); }
      else if (outcome === 'More uncomfortable') setNotice('Your response is kept. This practice will no longer be suggested.');
      else setNotice('Your experience is kept. It will be included in your weekly and monthly reports.');
    } catch (err) { setError(err.message || 'Could not save. Your words are still here; please try again.'); }
    setBusy(false);
  }
  // From the prompt: hide it, without touching any practice now open.
  async function stopSuggesting(id) {
    setBusy(true); setError('');
    try { await living.savePreferences(hiddenPracticesPatch(sessions, (list) => [...new Set([...list, id])])); setAskStop(null); announce(`${practiceById(id)?.title} won't be suggested. You can unhide it below.`); }
    catch (err) { setError(err.message); }
    setBusy(false);
  }
  async function hidePractice(id) {
    setBusy(true); setError('');
    try { await living.savePreferences(hiddenPracticesPatch(sessions, (list) => [...new Set([...list, id])])); closePractice(); setAskStop(null); setNotice('This practice is hidden from recommendations.'); }
    catch (err) { setError(err.message); }
    setBusy(false);
  }
  async function removeSession(id) {
    setBusy(true); setError('');
    try { await PracticeSession.delete(id); await living.refresh(); setDeleting(null); setNotice('Practice entry removed from history and reports.'); }
    catch (err) { setError(err.message); }
    setBusy(false);
  }
  async function updateSession() {
    setBusy(true); setError('');
    try { await PracticeSession.update(editSession.id, { outcome: editSession.outcome || null, after_notes: editSession.after_notes, alignment: editSession.alignment || null }); await living.refresh(); setEditSession(null); setNotice('Practice response updated in your history and reports.'); }
    catch (err) { setError(err.message); }
    setBusy(false);
  }

  return <div className="living-page space-y-8">
    <header><p className="sanctuary-eyebrow">A LITTLE ROOM TO CHOOSE · ALWAYS FREE</p><h1>Come back to yourself.</h1><p className="living-muted mt-3 max-w-xl">Find an action for this moment. Over time, notice what helps you respond in a way that feels like you.</p></header>
    <PlantVoice>{state ? state.invitation : 'We are the plants, here beside you. Begin wherever you are. Choose what feels present, and we will take one small step.'}</PlantVoice>
    {living.isError && <div className="living-error" role="alert">Your saved history could not load. Retry to load practices with your saved preferences. <button className="underline" onClick={() => living.refetch()}>Retry history</button></div>}
    {living.reloadFailed && <div className="living-error" role="alert">Your record couldn't refresh, so what shows may be out of date. <button className="underline" onClick={() => living.refetch()}>{living.isFetching ? 'Trying…' : 'Retry'}</button></div>}
    {notice && <p ref={noticeRef} tabIndex={-1} role="status" className="living-success outline-none">{notice}</p>}
    {askStop && <div ref={askStopRef} tabIndex={-1} className="living-inset space-y-3 outline-none" role="group" aria-labelledby="ask-stop-text"><p id="ask-stop-text">Your response is kept. Stop suggesting {practiceById(askStop)?.title.toLowerCase()}? It felt more uncomfortable this time. You can keep it available if it might fit another day.</p><div className="flex flex-wrap gap-3"><button type="button" className="living-secondary" disabled={busy} onClick={() => stopSuggesting(askStop)}>Stop suggesting it</button><button type="button" className="underline text-sm" disabled={busy} onClick={() => { setAskStop(null); announce('It stays available.'); }}>Keep it available</button></div></div>}
    {error && <p role="alert" className="living-error">{error}</p>}
    <section aria-labelledby="current-feeling-heading"><h2 id="current-feeling-heading" className="mb-4">What feels present?</h2><div className="state-grid">{STRESS_STATES.map((item, index) => <button key={item.id} type="button" className="state-card" aria-pressed={state?.id === item.id} onClick={() => chooseState(item.id)}><span className="state-number" aria-hidden="true">0{index + 1}</span><strong>{item.label}</strong><span>{item.description}</span></button>)}</div><p className="living-muted text-xs mt-3">Choose your own description. These words do not diagnose a condition.</p><p className="mt-4"><Link className="living-text-link" to="/support-now">I might not be safe right now <ArrowRight size={15} /></Link></p></section>
    {state && !living.isSuccess && (living.isError ? <p className="living-muted" role="status">Retry your history to use your practice preferences.</p> : <LoadingState label="Checking your practice preferences…" />)}
    {state && living.isSuccess && !active && <section className="living-card space-y-5" aria-labelledby="practice-options-heading">
      <div><p className="sanctuary-eyebrow">FOR {state.label}</p><h2 id="practice-options-heading">One small invitation</h2><p className="living-muted mt-2">You chose {state.label.toLowerCase()}. Pick an option that fits your surroundings and what you need.</p></div>
      {params.get('pattern') && <p className="living-muted">Suggested from a recurring pattern in your report. <Link className="underline" to="/Analytics?tab=reports">Return to reports</Link></p>}
      {suggestions.length ? <div className="grid sm:grid-cols-2 gap-4">{suggestions.map((practice) => <div key={practice.id} className="practice-option"><span className="living-duration"><Clock3 size={14} /> About {practice.minutes} {practice.minutes === 1 ? 'minute' : 'minutes'}</span><h3>{practice.title}</h3><p className="living-muted">{practice.purpose}</p><p className="text-xs mt-2">{practice.reason}</p><button type="button" className="ink-button text-sm mt-4" onClick={() => choosePractice(practice.id)}>Try {practice.title.toLowerCase()} <ArrowRight size={15} /></button></div>)}</div> : <p className="living-muted">The suggestions for this feeling are hidden. You can unhide them below, choose another feeling, or pick any practice.</p>}
      <details><summary className="living-text-link cursor-pointer">Choose another practice</summary><div className="living-chips mt-4">{PRACTICES.filter((practice) => !blocked.has(practice.id)).map((practice) => <button type="button" className="living-chip" key={practice.id} onClick={() => choosePractice(practice.id)}>{practice.title}</button>)}</div></details>
    </section>}
    {active && state && <section className="living-card practice-active space-y-6" aria-labelledby="active-practice-heading">
      <div className="flex justify-between gap-4"><div><span className="living-duration"><Clock3 size={15} /> About {active.minutes} {active.minutes === 1 ? 'minute' : 'minutes'}</span><h2 id="active-practice-heading" className="mt-2">{active.title}</h2><p className="living-muted mt-2">{active.purpose}</p></div><button type="button" className="living-icon-button self-start" aria-label="Close practice without saving" onClick={closePractice}><X size={20} /></button></div>
      <label className="living-label">What would you like more room for?<input className="living-input mt-2" value={intention} maxLength={1000} onChange={(e) => setIntention(e.target.value)} placeholder="My needs, a boundary, time to decide… (optional)" /></label>
      <label className="living-label">Before you begin<textarea className="living-input mt-2" rows={2} value={before} maxLength={5000} onChange={(e) => setBefore(e.target.value)} placeholder="How does this moment feel? (optional)" /></label>
      <ol className="practice-steps">{active.steps.map((step, index) => <li key={step}><span aria-hidden="true">{index + 1}</span><p>{step}</p></li>)}</ol>
      <div className="living-inset"><strong className="text-sm">Make it fit you</strong><p className="living-muted mt-1">{active.alternative} You can stop at any time.</p></div>
      <div className="hairline pt-6 space-y-4"><h3>What changed, if anything?</h3><div className="living-chips">{OUTCOMES.map((item) => <button className="living-chip" type="button" key={item} aria-pressed={outcome === item} onClick={() => setOutcome(outcome === item ? '' : item)}>{item}</button>)}</div>
        <label className="living-label">{active.reflection}<textarea className="living-input mt-2" rows={3} value={after} maxLength={5000} onChange={(e) => setAfter(e.target.value)} placeholder="Your own words, if you want to keep them." /></label>
        <label className="living-label">Did your response feel like you?<select className="living-input mt-2" value={alignment} onChange={(e) => setAlignment(e.target.value)}><option value="">Not recorded</option>{ALIGNMENTS.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select>{data?.preferences?.personal_values?.length > 0 && <span className="living-muted block mt-1">Your values: {data.preferences.personal_values.join(' · ')}</span>}</label>
        <div className="flex flex-wrap gap-3"><button className="ink-button" type="button" disabled={busy || living.isLoading} onClick={() => save('completed')}><Check size={16} />{busy ? 'Saving…' : 'Keep this practice experience'}</button><button type="button" className="living-secondary" disabled={busy} onClick={() => save('stopped')}>I stopped · keep my response</button></div>
        <p className="living-muted text-xs">Feedback is optional. Closing this practice saves nothing. A practice can leave you unsettled and a choice can still respect your values.</p>
      </div>
      <div className="flex flex-wrap justify-between gap-4 text-xs"><a className="underline" href={PRACTICE_SOURCES[active.source].url} target="_blank" rel="noreferrer">Practice background · {PRACTICE_SOURCES[active.source].title}</a><button type="button" className="underline" disabled={busy} onClick={() => hidePractice(active.id)}>Do not suggest this practice</button></div>
    </section>}
    <section className="living-card space-y-4" aria-labelledby="practice-history-heading"><div className="flex flex-wrap justify-between gap-3"><div><p className="sanctuary-eyebrow">YOUR EXPERIENCE OVER TIME</p><h2 id="practice-history-heading">Practice history</h2></div><Link className="living-text-link" to="/Analytics?tab=reports">See your reports <ArrowRight size={15} /></Link></div>
      {living.isLoading ? <LoadingState label="Loading your practice history…" /> : sessions.length === 0 ? <p className="living-muted">Your first saved practice will appear here. There is no streak to maintain.</p> : sessions.slice(0, showHistory).map((session) => <article key={session.id} className="practice-history-row">
        <div className="flex flex-wrap justify-between gap-2"><strong>{practiceById(session.practice_id)?.title || session.practice_id}</strong><span className="living-muted text-xs">{formatDay(session.date)}{session.is_demo ? ' · Demo' : ''}</span></div><p className="living-muted text-sm">{stateById(session.state_id)?.label || session.state_id} · {session.status === 'stopped' ? 'Stopped' : 'Tried'} · {session.outcome || 'No outcome recorded'}</p>
        {session.alignment && <p className="text-sm mt-1">{ALIGNMENTS.find((a) => a.id === session.alignment)?.label}</p>}{session.after_notes && <p className="text-sm whitespace-pre-wrap mt-2">{session.after_notes}</p>}
        {editSession?.id === session.id ? <div className="space-y-3 mt-3"><label className="living-label">Correct the outcome<select className="living-input" value={editSession.outcome || ''} onChange={(e) => setEditSession({ ...editSession, outcome: e.target.value })}><option value="">Not recorded</option>{OUTCOMES.map((item) => <option key={item}>{item}</option>)}</select></label><label className="living-label">Practice notes<textarea className="living-input" value={editSession.after_notes || ''} onChange={(e) => setEditSession({ ...editSession, after_notes: e.target.value })} /></label><label className="living-label">Alignment<select className="living-input" value={editSession.alignment || ''} onChange={(e) => setEditSession({ ...editSession, alignment: e.target.value })}><option value="">Not recorded</option>{ALIGNMENTS.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label><button className="living-secondary" onClick={updateSession} disabled={busy}>Save correction</button> <button className="underline text-sm" onClick={() => setEditSession(null)}>Cancel</button></div> : <div className="flex gap-4 mt-2 text-xs"><button className="underline" onClick={() => setEditSession(session)}>Edit response</button><button className="danger-link" onClick={() => setDeleting(session.id)}>Delete entry</button></div>}
        {deleting === session.id && <div className="living-inset mt-3"><p className="text-sm mb-2">Remove this practice entry from history and reports?</p><button className="danger-button" onClick={() => removeSession(session.id)} disabled={busy}>Delete practice entry</button> <button className="underline text-sm" onClick={() => setDeleting(null)}>Keep it</button></div>}
      </article>)}
      {sessions.length > showHistory && <button className="living-secondary" onClick={() => setShowHistory((count) => count + 20)}>Show more practice history</button>}
      {hidden.length > 0 && <details><summary className="text-sm cursor-pointer">Hidden practices ({hidden.length})</summary><div className="mt-3 space-y-2">{hidden.map((id) => <div className="flex justify-between gap-3 text-sm" key={id}><span>{practiceById(id)?.title || id}</span><button type="button" className="underline" disabled={busy} onClick={async () => { setBusy(true); try { await living.savePreferences(hiddenPracticesPatch(sessions, (list) => list.filter((item) => item !== id))); } catch (err) { setError(err.message); } setBusy(false); }}>Unhide</button></div>)}<p className="living-muted text-xs mt-2">Hidden practices are not suggested. Unhide one to see it again.</p></div></details>}
    </section>
    <PlantCompanions />
    <p className="living-muted text-xs flex items-start gap-2"><Leaf size={16} className="shrink-0" />These are optional body-based and practical invitations. If a practice increases discomfort, stop or choose another. Your safety and your account of what happened come first.</p>
  </div>;
}
