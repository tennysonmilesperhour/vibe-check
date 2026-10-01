import { useCallback, useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import ConfirmIdentity from '@/features/safety/ConfirmIdentity';
import { encryptJson } from '@/lib/crypto';
import { EXPORT_TABLES } from '@/lib/export-file';
import { todayKey } from '@/lib/dates';
import { collectCompleteExport } from './collect';
import { downloadJson } from './download';

/** Download everything Vibe Check keeps for the account, after the password check. */
export default function CompleteExport({ onClose }) {
  const [identityOk, setIdentityOk] = useState(false);
  const confirmIdentity = useCallback(() => setIdentityOk(true), []);
  const [file, setFile] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [encrypt, setEncrypt] = useState(true);
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!identityOk) return undefined;
    let active = true;
    setFile(null); setLoadError('');
    collectCompleteExport().then(
      (document) => { if (active) setFile(document); },
      () => { if (active) setLoadError('Part of your record could not be loaded, so nothing was prepared. Try again.'); },
    );
    return () => { active = false; };
  }, [identityOk, attempt]);

  async function download() {
    if (encrypt && password.length < 8) { setError('Use an export password with at least eight characters.'); return; }
    setBusy(true); setError('');
    try {
      downloadJson(encrypt ? await encryptJson(file, password) : file, `vibe-check-complete-${todayKey()}${encrypt ? '.encrypted' : ''}.json`);
    } catch (err) { setError(err.message); }
    setBusy(false);
  }

  return <Dialog open onOpenChange={(open) => { if (!open && !busy) onClose(); }}><DialogContent className="living-dialog">
    <DialogHeader><DialogTitle>Download everything</DialogTitle><DialogDescription>A complete copy of what Vibe Check keeps for your account, as one file you can keep, move to another tool, or open here later. Settings kept only on this device, such as an app lock, are not included.</DialogDescription></DialogHeader>
    {!identityOk ? <ConfirmIdentity action="download everything" onConfirmed={confirmIdentity} /> : <div className="space-y-5">
      {loadError && <p className="living-error" role="alert">{loadError} <button type="button" className="underline" onClick={() => setAttempt((count) => count + 1)}>Try again</button></p>}
      {!file && !loadError && <p className="living-muted text-sm" role="status">Gathering your record…</p>}
      {file && <>
        <ul className="text-sm grid grid-cols-2 gap-x-4 gap-y-1" aria-label="What the file holds">
          {EXPORT_TABLES.map(([key, label]) => <li key={key} className="flex justify-between gap-2"><span>{label}</span><span className="living-muted">{file.counts[key]}</span></li>)}
        </ul>
        <p className="living-muted text-xs">Plus your profile: account email, name, low-mood settings and any optional systems you set up.</p>
        <label className="flex gap-3 text-sm"><input type="checkbox" checked={encrypt} onChange={(e) => setEncrypt(e.target.checked)} />Encrypt the file with a password</label>
        {encrypt
          ? <label className="living-label">Export password<input className="living-input mt-2" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} /><span className="living-muted text-xs">At least eight characters. It is not stored and cannot be recovered, and you will need it to open the file.</span></label>
          : <p className="living-muted text-xs">Without a password, anyone who gets the file can read everything in it, including your journal and safety plan.</p>}
        {error && <p className="living-error" role="alert">{error}</p>}
        <button className="ink-button" disabled={busy} onClick={download}>{busy ? 'Preparing file…' : encrypt ? 'Download encrypted file' : 'Download file'}</button>
      </>}
    </div>}
  </DialogContent></Dialog>;
}
