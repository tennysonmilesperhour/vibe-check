import { useCallback, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { filterEntries, buildReport, validDateKey } from '@/lib/living-patterns';
import { encryptJson } from '@/lib/crypto';
import { todayKey } from '@/lib/dates';
import ConfirmIdentity from '@/features/safety/ConfirmIdentity';
import { downloadJson } from '@/features/export/download';
import { entryPeople, peopleNameReplacer, personLabels } from '@/lib/people';
import ExportPassword, { exportPasswordError } from '@/features/export/ExportPassword';

// Past this length the preview takes a moment to lay out, so the rest waits
// to be asked for. The download always holds everything.
const PREVIEW_LIMIT = 200000;
// Fields the person writes in, where a first or last name on its own is
// replaced too. Elsewhere only whole names are, so a fixed answer such as
// "More settled" stays as it is.
const FREE_TEXT = new Set(['notes', 'description', 'gratitude', 'situation', 'response', 'need', 'intention', 'before_notes', 'after_notes']);

export default function ExportHistory({ data, initial, onClose }) {
  const [start, setStart] = useState(initial.start || data.entries.at(-1)?.date || todayKey());
  const [end, setEnd] = useState(initial.end || todayKey());
  const [excluded, setExcluded] = useState([]);
  const [redact, setRedact] = useState(true);
  const [includePractices, setIncludePractices] = useState(false);
  const [includeReflections, setIncludeReflections] = useState(false);
  const [password, setPassword] = useState('');
  const [repeat, setRepeat] = useState('');
  const [encrypt, setEncrypt] = useState(false);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState(false);
  const [fullPreview, setFullPreview] = useState(false);
  const [error, setError] = useState('');
  // The preview and the download ask for the password (unless confirmed
  // recently), so someone holding an unlocked device can't walk away with it.
  const [identityOk, setIdentityOk] = useState(false);
  const confirmIdentity = useCallback(() => setIdentityOk(true), []);
  const valid = validDateKey(start) && validDateKey(end) && start <= end && end <= todayKey();
  const candidates = filterEntries(data.entries, { start, end });
  // The same labels and matching as the summary to share, built once per
  // record: saved people in the order they were added, people since removed
  // by the ids still on entries, and their ids and old emails too.
  const replaceNames = useMemo(() => {
    const ids = data.entries.flatMap(entryPeople);
    const labels = personLabels(data.people, ids);
    const removed = [...new Set(ids)].filter((id) => !data.people.some((person) => person.id === id)).map((id) => ({ id }));
    return peopleNameReplacer([...data.people, ...removed], (person) => labels.get(person.id), (person) => [person.id, person.linked_user_email]);
  }, [data.people, data.entries]);
  // Built only to preview and download it: names are replaced in every
  // string, and words of a longer name only in what the person wrote.
  const payload = useMemo(() => {
    if (!preview || !identityOk) return null;
    const rows = candidates.filter((entry) => !excluded.includes(entry.key));
    const practices = includePractices ? data.sessions.filter((entry) => entry.date >= start && entry.date <= end) : [];
    const reflections = includeReflections ? data.reflections.filter((entry) => entry.period_key >= start && entry.period_key <= end) : [];
    const references = (value) => {
      if (Array.isArray(value)) return value.map(references);
      if (value && typeof value === 'object') {
        if (value.key && ['day', 'journal'].includes(value.kind)) return { entry_key: value.key };
        return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, references(child)]));
      }
      return value;
    };
    const document = { app: 'Vibe Check', format_version: 1, range: { start, end }, scope: 'User-selected entries; unselected entries are excluded.', entries: rows, practice_sessions: practices, report_reflections: reflections,
      ...(initial.report ? { report: references(buildReport(rows, { type: initial.report.type, start, end }, practices, data.people, data.preferences.pattern_feedback)) } : {}) };
    const clean = (value, key = '') => {
      if (Array.isArray(value)) return value.map((child) => clean(child, key));
      if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).filter(([name]) => name !== 'user_id').map(([name, child]) => [name, clean(child, name)]));
      if (redact && typeof value === 'string') return replaceNames(value, { parts: FREE_TEXT.has(key) });
      return value;
    };
    return clean(document);
  }, [data, start, end, excluded, redact, includePractices, includeReflections, initial.report, preview, identityOk, replaceNames]);
  async function download() {
    if (!valid || !payload) { setError('Choose a valid date range through today.'); return; }
    const passwordError = encrypt ? exportPasswordError(password, repeat) : '';
    if (passwordError) { setError(passwordError); return; }
    setBusy(true); setError('');
    try {
      downloadJson(encrypt ? await encryptJson(payload, password) : payload, `vibe-check-${start}-${end}${encrypt ? '.encrypted' : ''}.json`);
    } catch (err) { setError(err.message); }
    setBusy(false);
  }
  const previewText = useMemo(() => (payload ? JSON.stringify(payload, null, 2) : ''), [payload]);
  const hidePreview = () => { setPreview(false); setFullPreview(false); };
  const change = (setter) => (value) => { setter(value); hidePreview(); };
  return <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}><DialogContent className="living-dialog"><DialogHeader><DialogTitle>Choose what leaves your journal</DialogTitle><DialogDescription>Preview the complete contents before downloading. Nothing is emailed or sent to an AI provider.</DialogDescription></DialogHeader>
    <div className="space-y-5"><div className="grid sm:grid-cols-2 gap-3"><label className="living-label">From<input className="living-input mt-2" type="date" max={todayKey()} value={start} onChange={(e) => change(setStart)(e.target.value)} /></label><label className="living-label">Through<input className="living-input mt-2" type="date" max={todayKey()} value={end} onChange={(e) => change(setEnd)(e.target.value)} /></label></div>
      <details><summary className="living-label cursor-pointer">Choose entries · {candidates.filter((entry) => !excluded.includes(entry.key)).length} of {candidates.length} selected</summary><div className="max-h-52 overflow-y-auto mt-3 space-y-2">{candidates.map((entry) => <label className="flex gap-2 items-start text-sm" key={entry.key}><input type="checkbox" checked={!excluded.includes(entry.key)} onChange={() => { hidePreview(); setExcluded((items) => items.includes(entry.key) ? items.filter((key) => key !== entry.key) : [...items, entry.key]); }} /><span>{entry.date} · {entry.kind === 'day' ? 'Check-in' : 'Journal'} · {(entry.notes || entry.low_moment?.description || entry.high_moment?.description || 'Recorded feelings').slice(0, 70)}</span></label>)}</div></details>
      <label className="flex gap-3 text-sm"><input type="checkbox" checked={redact} onChange={(e) => change(setRedact)(e.target.checked)} /><span>Replace known people’s names and identifiers with private labels.<span className="living-muted block text-xs mt-1">Saved names are replaced in any letter case, in your words too, and a first or last name on its own when it starts with a capital. A name spelled another way can remain. Review the preview before sharing.</span></span></label>
      <label className="flex gap-3 text-sm"><input type="checkbox" checked={includePractices} onChange={(e) => change(setIncludePractices)(e.target.checked)} />Include practice responses within these dates</label>
      <label className="flex gap-3 text-sm"><input type="checkbox" checked={includeReflections} onChange={(e) => change(setIncludeReflections)(e.target.checked)} />Include saved report reflections whose period starts within these dates</label>
      <label className="flex gap-3 text-sm"><input type="checkbox" checked={encrypt} onChange={(e) => setEncrypt(e.target.checked)} />Encrypt the downloaded file with a password</label>
      {encrypt && <ExportPassword password={password} repeat={repeat} onPassword={setPassword} onRepeat={setRepeat} note="The preview below stays readable on this screen." />}
      {!valid && <p className="living-error" role="alert">Choose a valid date range through today.</p>}
      {error && <p className="living-error" role="alert">{error}</p>}
      <button className="living-secondary" disabled={!valid} onClick={() => setPreview(true)}>Preview complete export</button>
      {preview && (identityOk
        ? <><pre className="export-preview" aria-label="Complete export preview">{fullPreview ? previewText : previewText.slice(0, PREVIEW_LIMIT)}</pre>{!fullPreview && previewText.length > PREVIEW_LIMIT && <p className="living-muted text-xs">The preview shows the first {PREVIEW_LIMIT.toLocaleString()} characters of {previewText.length.toLocaleString()}. <button type="button" className="underline" onClick={() => setFullPreview(true)}>Show all of it</button></p>}<button className="ink-button" disabled={busy || !valid} onClick={download}>{busy ? 'Preparing file…' : encrypt ? 'Download encrypted JSON' : 'Download JSON'}</button><p className="living-muted text-xs">A portable copy for your own records or a tool you choose. No external account is required.</p></>
        : <ConfirmIdentity action="see and download your export" onConfirmed={confirmIdentity} />)}
    </div>
  </DialogContent></Dialog>;
}
