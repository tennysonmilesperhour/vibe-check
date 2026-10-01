import { Component, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import EntryCard from '@/features/patterns/EntryCard';
import { openExportFile, summarizeExport } from '@/lib/export-file';
import { parseLocalDate } from '@/lib/dates';

const PAGE = 50;
const exportDate = (iso) => {
  if (!iso) return '';
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
};
const longDay = (key) => parseLocalDate(key).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });

function aboutFile(summary) {
  const made = exportDate(summary.exportedAt);
  if (summary.kind === 'complete') return `A complete export${made ? ` from ${made}` : ''}.`;
  if (summary.kind === 'earlier') return `An earlier Vibe Check export${made ? ` from ${made}` : ''}.`;
  return `Chosen entries${summary.range ? ` from ${longDay(summary.range.start)} through ${longDay(summary.range.end)}` : ''}.`;
}

// A file can be edited by hand; one entry that cannot be shown leaves the rest.
class EntryFallback extends Component {
  constructor(props) { super(props); this.state = { failed: false }; }
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? <p className="living-muted text-sm">This entry could not be shown. It is still in the file.</p> : this.props.children; }
}

/** Opens a Vibe Check export on this device to read it. Nothing is uploaded or saved. */
export default function OpenExport({ onClose }) {
  const [fileName, setFileName] = useState('');
  const [text, setText] = useState(null);
  const [needsPassword, setNeedsPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [summary, setSummary] = useState(null);
  const [shown, setShown] = useState(PAGE);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  // Only the latest file or password attempt may show its result.
  const attempt = useRef(0);

  async function open(fileText, filePassword) {
    const id = ++attempt.current;
    setBusy(true); setError('');
    try {
      const result = await openExportFile(fileText, filePassword);
      if (id !== attempt.current) return;
      if ('encrypted' in result) setNeedsPassword(true);
      else { setSummary(summarizeExport(result.document)); setNeedsPassword(false); setPassword(''); }
    } catch (err) { if (id === attempt.current) setError(err.message); }
    if (id === attempt.current) setBusy(false);
  }

  async function choose(event) {
    const chosen = event.target.files?.[0];
    // Cleared, so choosing the same file again opens it again.
    event.target.value = '';
    if (!chosen) return;
    const id = ++attempt.current;
    setFileName(chosen.name); setSummary(null); setNeedsPassword(false); setPassword(''); setShown(PAGE); setError(''); setBusy(false);
    let fileText;
    try { fileText = await chosen.text(); } catch { if (id === attempt.current) setError('This file could not be read.'); return; }
    if (id !== attempt.current) return;
    setText(fileText);
    await open(fileText);
  }

  return <Dialog open onOpenChange={(value) => { if (!value) onClose(); }}><DialogContent className="living-dialog">
    <DialogHeader><DialogTitle>Open an export</DialogTitle><DialogDescription>Read a Vibe Check export file on this device. It is not uploaded, saved, or added to your account.</DialogDescription></DialogHeader>
    <div className="space-y-5">
      <label className="living-label">{fileName ? 'Choose another export file' : 'Export file'}<input className="living-input mt-2" type="file" accept="application/json,.json" onChange={choose} /></label>
      {fileName && <p className="text-sm break-all">File: {fileName}</p>}
      {needsPassword && <form className="space-y-3" onSubmit={(event) => { event.preventDefault(); open(text, password); }}>
        <label className="living-label">This file is encrypted. Its password<input className="living-input mt-2" type="password" autoComplete="off" value={password} onChange={(e) => setPassword(e.target.value)} /></label>
        <button className="living-secondary" type="submit" disabled={busy || !password}>{busy ? 'Opening…' : 'Open file'}</button>
      </form>}
      {error && <p className="living-error" role="alert">{error}</p>}
      {summary && <section className="space-y-4" aria-label="Export contents">
        <p className="text-sm">{aboutFile(summary)}</p>
        <ul className="text-sm grid grid-cols-2 gap-x-4 gap-y-1">
          {summary.counts.map(({ key, label, count }) => <li key={key} className="flex justify-between gap-2"><span>{label}</span><span className="living-muted">{count}</span></li>)}
        </ul>
        {summary.entries.length > 0 && <div className="space-y-3" role="list" aria-label="Check-ins and journal entries">
          {summary.entries.slice(0, shown).map((entry, i) => <div role="listitem" key={i}><EntryFallback><EntryCard entry={entry} people={summary.people} /></EntryFallback></div>)}
        </div>}
        {summary.entries.length > shown && <button type="button" className="living-secondary" onClick={() => setShown((count) => count + PAGE)}>Show {Math.min(PAGE, summary.entries.length - shown)} more</button>}
      </section>}
    </div>
  </DialogContent></Dialog>;
}
