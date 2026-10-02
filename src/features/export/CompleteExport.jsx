import { useCallback, useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import ConfirmIdentity from '@/features/safety/ConfirmIdentity';
import { encryptJson } from '@/lib/crypto';
import { exportCounts } from '@/lib/export-file';
import { todayKey } from '@/lib/dates';
import { collectCompleteExport } from './collect';
import { downloadJson } from './download';
import ExportPassword, { exportPasswordError } from './ExportPassword';
import LoadingState from '@/features/shell/LoadingState';

/** Download everything Vibe Check keeps for the account, after the password check. */
export default function CompleteExport({ onClose }) {
  const [identityOk, setIdentityOk] = useState(false);
  const confirmIdentity = useCallback(() => setIdentityOk(true), []);
  const [file, setFile] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [encrypt, setEncrypt] = useState(true);
  const [password, setPassword] = useState('');
  const [repeat, setRepeat] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const counts = useMemo(() => (file ? exportCounts(file) : []), [file]);

  useEffect(() => {
    if (!identityOk) return undefined;
    const reading = new AbortController();
    setFile(null); setLoadError('');
    collectCompleteExport({ signal: reading.signal }).then(
      (document) => { if (!reading.signal.aborted) setFile(document); },
      () => { if (!reading.signal.aborted) setLoadError('Part of your record could not be loaded, so nothing was prepared. Try again.'); },
    );
    return () => reading.abort();
  }, [identityOk, attempt]);

  async function download() {
    const passwordError = encrypt ? exportPasswordError(password, repeat) : '';
    if (passwordError) { setError(passwordError); return; }
    setBusy(true); setError('');
    try {
      downloadJson(encrypt ? await encryptJson(file, password) : file, `vibe-check-complete-${todayKey()}${encrypt ? '.encrypted' : ''}.json`);
    } catch (err) { setError(err.message); }
    setBusy(false);
  }

  return <Dialog open onOpenChange={(open) => { if (!open && !busy) onClose(); }}><DialogContent className="living-dialog">
    <DialogHeader><DialogTitle>Download everything</DialogTitle><DialogDescription>A complete copy of what Vibe Check keeps for your account, as one file you can keep, move to another tool, or open here later. Not included: settings kept only on this device, such as an app lock, and the dates of requests to retired AI features.</DialogDescription></DialogHeader>
    {!identityOk ? <ConfirmIdentity action="download everything" onConfirmed={confirmIdentity} /> : <div className="space-y-5">
      {loadError && <p className="living-error" role="alert">{loadError} <button type="button" className="underline" onClick={() => setAttempt((count) => count + 1)}>Try again</button></p>}
      {!file && !loadError && <LoadingState label="Gathering your record…" />}
      {file && <>
        <ul className="text-sm grid grid-cols-2 gap-x-4 gap-y-1" aria-label="What the file holds">
          {counts.map(({ key, label, count }) => <li key={key} className="flex justify-between gap-2"><span>{label}</span><span className="living-muted">{count}</span></li>)}
        </ul>
        <p className="living-muted text-xs">Plus your profile: account email, name, low-mood settings and any optional systems you set up.</p>
        <label className="flex gap-3 text-sm"><input type="checkbox" checked={encrypt} onChange={(e) => setEncrypt(e.target.checked)} />Encrypt the file with a password</label>
        {encrypt
          ? <ExportPassword password={password} repeat={repeat} onPassword={setPassword} onRepeat={setRepeat} />
          : <p className="living-muted text-xs">Without a password, anyone who gets the file can read everything in it, including your journal and safety plan.</p>}
        {error && <p className="living-error" role="alert">{error}</p>}
        <button className="ink-button" disabled={busy} onClick={download}>{busy ? 'Preparing file…' : encrypt ? 'Download encrypted file' : 'Download file'}</button>
      </>}
    </div>}
  </DialogContent></Dialog>;
}
