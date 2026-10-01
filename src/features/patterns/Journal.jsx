import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Plus, ArrowUpRight } from 'lucide-react';
import { JournalEntry, DailyCheckIn } from '@/api/entities';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import PersonPicker from '@/features/people/PersonPicker';
import StressFields from '@/features/today/StressFields';
import { todayKey } from '@/lib/dates';
import { validDateKey } from '@/lib/living-patterns';
import { useAuth } from '@/lib/AuthContext';
import { readBuffer, clearBuffer, bufferRestorable } from '@/lib/writing-buffer';
import useWritingBuffer from '@/hooks/use-writing-buffer';
import SupportCard from '@/features/safety/SupportCard';
import EntryCard from './EntryCard';
import useBeforeUnload from '@/hooks/use-before-unload';

export function EntryLink({ entry, children }) {
  return <Link className="living-text-link" to={`/Analytics?tab=journal&entry=${encodeURIComponent(entry.key)}`}>{children || entry.date}<ArrowUpRight size={13} aria-hidden="true" /></Link>;
}

/** Short, stable key for a prompt's text (djb2). */
function promptKey(text) {
  let hash = 5381;
  for (let i = 0; i < text.length; i += 1) hash = ((hash << 5) + hash + text.charCodeAt(i)) >>> 0;
  return hash.toString(36);
}

export function JournalComposer({ open, existing = null, prompt = '', onClose, onSaved }) {
  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [confirmClose, setConfirmClose] = useState(false);
  // Unsaved words from this tab that can't be proven newer than the saved entry.
  const [heldBuffer, setHeldBuffer] = useState(null);
  const baselineRef = useRef(null);
  const touchedRef = useRef(false);
  const { user } = useAuth();
  // New entries name the account the composer opened in (see CheckInCeremony).
  const ownerId = useRef(user?.id).current;
  // New entries started from a prompt get their own key, so a prompt is never
  // replaced by older free-form words (and vice versa).
  const bufferKey = user?.id ? `composer:${user.id}:${existing?.id || (prompt ? `prompt-${promptKey(prompt)}` : 'new')}` : null;
  useEffect(() => {
    if (open) {
      const initial = existing ? { ...existing, kind: existing.entry_kind || (['reflection', 'interaction'].includes(existing.kind) ? existing.kind : 'reflection'), emotions_text: (existing.emotions || []).join(', '), time: existing.occurred_at ? new Date(existing.occurred_at).toTimeString().slice(0, 5) : '', activities_text: (existing.activities || []).join(', ') } : { date: todayKey(), kind: 'reflection', time: '', emotions_text: '', notes: prompt, mood_score: null, person_ids: [], activities_text: '', stress_context: {}, interaction_feeling: '', boundary_respected: '' };
      baselineRef.current = JSON.stringify(initial);
      touchedRef.current = false;
      const buffer = readBuffer(bufferKey);
      const restore = bufferRestorable(buffer, existing?.updated_at);
      setForm(restore ? buffer.value : initial);
      setHeldBuffer(!restore && buffer && JSON.stringify(buffer.value) !== JSON.stringify(initial) ? buffer.value : null);
      setNotice(restore ? 'Your unsaved words are back.' : '');
      setConfirmClose(false);
      setError('');
    }
    // Restore once per opening; later edits must not re-run this.
  }, [open, existing, prompt, bufferKey]);
  const serializedForm = form ? JSON.stringify(form) : null;
  const dirty = Boolean(open && form && baselineRef.current !== null && serializedForm !== baselineRef.current);
  // Buffer only what the person actually typed; clear it on save or discard,
  // or when they take their edits back to where they started.
  useWritingBuffer(bufferKey, serializedForm, { enabled: Boolean(open && form && touchedRef.current && dirty), basedOn: existing?.updated_at || null });
  useEffect(() => {
    if (open && form && touchedRef.current && !dirty && !heldBuffer) clearBuffer(bufferKey);
  }, [open, form, dirty, heldBuffer, bufferKey]);
  useBeforeUnload(dirty);
  const update = (patch) => { touchedRef.current = true; setForm((previous) => ({ ...previous, ...patch })); };
  const canKeepAsDraft = !existing || existing.is_draft;
  function requestClose() {
    if (busy) return;
    if (dirty) { setConfirmClose(true); return; }
    onClose();
  }
  function discard() {
    clearBuffer(bufferKey);
    baselineRef.current = null;
    setConfirmClose(false);
    onClose();
  }
  async function save(asDraft = false) {
    if (!validDateKey(form.date) || form.date > todayKey()) { setError('Choose a valid date up to today.'); return; }
    if (!asDraft && !form.notes.trim() && !form.stress_context?.state_ids?.length && form.mood_score == null && !form.interaction_feeling) { setError('Add a few words, a feeling, or a mood to keep this entry.'); return; }
    setBusy(true); setError('');
    try {
      const payload = { date: form.date, occurred_at: form.time ? new Date(`${form.date}T${form.time}:00`).toISOString() : null, emotions: [...new Set(form.emotions_text.split(',').map((value) => value.trim()).filter(Boolean))], kind: form.kind, notes: form.notes, mood_score: form.mood_score, person_ids: form.person_ids || [], activities: [...new Set(form.activities_text.split(',').map((value) => value.trim()).filter(Boolean))], stress_context: form.stress_context || {}, interaction_feeling: form.kind === 'interaction' ? form.interaction_feeling || null : null, boundary_respected: form.kind === 'interaction' ? form.boundary_respected || null : null, is_draft: asDraft };
      if (existing?.id) await JournalEntry.update(existing.id, payload); else await JournalEntry.createFor(ownerId, payload);
      clearBuffer(bufferKey);
      baselineRef.current = null;
      setConfirmClose(false);
      await onSaved?.(payload); onClose();
    } catch (err) { setError(err.message || 'Could not save. Your words are still here.'); }
    setBusy(false);
  }
  return <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) requestClose(); }}><DialogContent className="living-dialog"><DialogHeader><DialogTitle>{existing ? 'Revisit your words' : 'Keep a moment'}</DialogTitle><DialogDescription>Your private journal. People you add are not notified.</DialogDescription></DialogHeader>
    {form && <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); save(); }}>
      {notice && <p className="living-success" role="status">{notice}</p>}
      {heldBuffer && <div className="living-inset flex flex-wrap items-center justify-between gap-3" role="status"><p className="text-sm">This tab kept unsaved words that may be newer than this entry.</p><span className="flex gap-3"><button type="button" className="living-secondary" onClick={() => { touchedRef.current = true; setForm(heldBuffer); setHeldBuffer(null); setNotice('Your unsaved words are back.'); }}>Use them</button><button type="button" className="underline text-sm" onClick={() => { setHeldBuffer(null); if (!touchedRef.current) clearBuffer(bufferKey); }}>Dismiss</button></span></div>}
      <div className="grid sm:grid-cols-2 gap-4"><label className="living-label">Date of the experience<input className="living-input mt-2" type="date" required max={todayKey()} value={form.date} onChange={(e) => update({ date: e.target.value })} /></label><label className="living-label">Kind of entry<select className="living-input mt-2" value={form.kind} onChange={(e) => update({ kind: e.target.value })}><option value="reflection">Reflection</option><option value="interaction">An interaction</option></select></label></div>
      <label className="living-label">Time of the experience · optional<input className="living-input mt-2" type="time" value={form.time} onChange={(e) => update({ time: e.target.value })} /></label>
      <label className="living-label">What do you want to remember?<textarea className="living-input mt-2" rows={5} maxLength={30000} value={form.notes} onChange={(e) => update({ notes: e.target.value })} placeholder="What happened? How did it leave you feeling?" /></label>
      <label className="living-label">Mood in this moment<select className="living-input mt-2" value={form.mood_score ?? ''} onChange={(e) => update({ mood_score: e.target.value ? Number(e.target.value) : null })}><option value="">Not recorded</option>{Array.from({ length: 10 }, (_, i) => <option value={i + 1} key={i}>{i + 1} / 10</option>)}</select><span className="living-muted text-xs">This stays separate from your overall daily mood.</span></label>
      <div><p className="living-label mb-2">People involved · optional</p><PersonPicker value={form.person_ids} onChange={(ids) => update({ person_ids: ids })} /></div>
      {form.kind === 'interaction' && <div className="grid sm:grid-cols-2 gap-4"><label className="living-label">How did the interaction feel?<select className="living-input mt-2" value={form.interaction_feeling || ''} onChange={(e) => update({ interaction_feeling: e.target.value })}><option value="">Not recorded</option>{['supportive', 'strained', 'unsafe', 'mixed', 'unsure'].map((value) => <option key={value}>{value}</option>)}</select></label><label className="living-label">Was your boundary respected?<select className="living-input mt-2" value={form.boundary_respected || ''} onChange={(e) => update({ boundary_respected: e.target.value })}><option value="">Not recorded</option>{['yes', 'no', 'unsure'].map((value) => <option key={value}>{value}</option>)}</select></label></div>}
      <label className="living-label">Feelings in your own words<input className="living-input mt-2" value={form.emotions_text} onChange={(e) => update({ emotions_text: e.target.value })} maxLength={1000} placeholder="Hopeful, frustrated, relieved… separated by commas" /></label>
      <label className="living-label">Habits or activities<input className="living-input mt-2" value={form.activities_text} onChange={(e) => update({ activities_text: e.target.value })} maxLength={1000} placeholder="A walk, late work, coffee… separated by commas" /></label>
      <details open={Boolean(existing?.stress_context?.state_ids?.length)}><summary className="living-label cursor-pointer mb-4">Stress, body cues, and feeling like yourself · optional</summary><StressFields value={form.stress_context} onChange={(value) => update({ stress_context: value })} /></details>
      {error && <p className="living-error" role="alert">{error}</p>}
      {confirmClose && <div className="living-inset" role="alert"><p className="text-sm mb-3">{canKeepAsDraft ? 'These words are not saved yet.' : 'Your changes to this entry are not saved yet.'}</p><div className="flex flex-wrap items-center gap-3"><button type="button" className="living-secondary" onClick={() => setConfirmClose(false)}>Keep writing</button>{canKeepAsDraft ? <button type="button" className="living-secondary" disabled={busy} onClick={() => save(true)}>Save as a draft</button> : <button type="button" className="living-secondary" disabled={busy} onClick={() => save(false)}>Save changes</button>}<button type="button" className="underline text-sm" onClick={discard}>{canKeepAsDraft ? 'Discard these words' : 'Discard changes'}</button></div></div>}
      <div className="flex flex-wrap gap-3"><button type="submit" className="ink-button" disabled={busy}>{busy ? 'Keeping your words…' : 'Save journal entry'}</button><button type="button" className="living-secondary" disabled={busy} onClick={() => save(true)}>Save as a draft</button></div>
    </form>}
  </DialogContent></Dialog>;
}

export default function Journal({ data, entries, onChanged }) {
  const [params, setParams] = useSearchParams();
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [limit, setLimit] = useState(20);
  // After someone records an unsafe interaction or a crossed boundary, offer
  // support quietly beside their words; they decide whether to open it.
  const [supportFor, setSupportFor] = useState(null);
  const selectedKey = params.get('entry');
  const selected = data.entries.find((entry) => entry.key === selectedKey);
  const open = params.get('compose') === '1' || Boolean(editing);
  const close = () => { setEditing(null); setParams((previous) => { const next = new URLSearchParams(previous); next.delete('compose'); next.delete('prompt'); return next; }); };
  const compose = () => setParams((previous) => { const next = new URLSearchParams(previous); next.set('compose', '1'); return next; });
  async function remove() {
    setBusy(true); setError('');
    try { await (deleting.kind === 'day' ? DailyCheckIn : JournalEntry).delete(deleting.id); await onChanged(); setDeleting(null); }
    catch (err) { setError(err.message); }
    setBusy(false);
  }
  const edit = (entry) => { if (entry.kind === 'day') window.location.assign(`/Today?date=${entry.date}`); else setEditing(entry); };
  const drafts = data.journal.filter((entry) => entry.is_draft);
  return <section className="space-y-5" aria-labelledby="journal-heading">
    <div className="flex flex-wrap justify-between items-end gap-4"><div><p className="sanctuary-eyebrow">YOUR WORDS, KEPT TOGETHER</p><h2 id="journal-heading">Journal & history</h2><p className="living-muted mt-2">{entries.length} entries in this view. A good day belongs beside everything that came before.</p></div><button className="ink-button" onClick={compose}><Plus size={16} />Keep a moment</button></div>
    {error && <p className="living-error" role="alert">{error}</p>}
    {supportFor && <SupportCard focus="relationship" title={supportFor === 'unsafe' ? 'You marked that interaction as unsafe.' : 'You noted that a boundary was not respected.'} onDismiss={() => setSupportFor(null)}>Your record is kept exactly as you wrote it. If it would help to talk it through or plan for your safety, these services are free and confidential.</SupportCard>}
    {drafts.length > 0 && <div className="living-inset"><p className="living-label mb-2">Saved drafts</p><div className="living-chips">{drafts.map((draft) => <button key={draft.id} className="living-chip" onClick={() => setEditing(draft)}>Resume {draft.date} draft</button>)}</div></div>}
    {selectedKey && !selected && <p className="living-muted">This entry is no longer in your saved history.</p>}
    {selected && <div><p className="living-label mb-2">Entry opened from your report or chart</p><EntryCard entry={selected} people={data.people} selected onEdit={edit} onDelete={setDeleting} /></div>}
    {entries.filter((entry) => entry.key !== selectedKey).slice(0, limit).map((entry) => <EntryCard key={entry.key} entry={entry} people={data.people} onEdit={edit} onDelete={setDeleting} />)}
    {!entries.length && <p className="living-muted py-6">No entries match this view. Adjust the filters or keep a new moment.</p>}
    {entries.length > limit && <button className="living-secondary" onClick={() => setLimit((count) => count + 20)}>Show more history</button>}
    <JournalComposer open={open} existing={editing} prompt={params.get('prompt') || ''} onClose={close} onSaved={async (saved) => { await onChanged(); if (saved?.interaction_feeling === 'unsafe') setSupportFor('unsafe'); else if (saved?.boundary_respected === 'no') setSupportFor('boundary'); }} />
    <Dialog open={Boolean(deleting)} onOpenChange={(isOpen) => { if (!isOpen && !busy) setDeleting(null); }}><DialogContent><DialogHeader><DialogTitle>Delete this entry?</DialogTitle><DialogDescription>This removes the entry from your journal, charts, and reports. This cannot be undone.</DialogDescription></DialogHeader><div className="flex gap-3"><button className="living-secondary" onClick={() => setDeleting(null)}>Keep it</button><button className="ink-button" disabled={busy} onClick={remove}>{busy ? 'Deleting…' : 'Delete entry'}</button></div></DialogContent></Dialog>
  </section>;
}
