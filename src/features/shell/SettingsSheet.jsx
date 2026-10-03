import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { BoundaryAlert } from '@/api/entities';
import { useAuth } from '@/lib/AuthContext';
import { usePreferences } from '@/features/patterns/useLivingData';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { clearLegacyDrafts } from '@/lib/legacy-drafts';
import { queryClientInstance } from '@/lib/query-client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { NOTICE_DEFAULTS } from '@/lib/boundaries';
import { removeAppLock } from '@/lib/app-lock';
import AppLockSettings from '@/features/safety/AppLockSettings';
import ConfirmIdentity from '@/features/safety/ConfirmIdentity';
import RetryButton from './RetryButton';
import { useKeptSaves } from './KeptSaves';
import { clearKeptSaves, holdKeptSaves } from '@/lib/kept-saves';
import { clearWeekSeen } from '@/lib/week-ready';

const DEFAULTS = NOTICE_DEFAULTS;
// Older versions saved lines the range controls can't show (half steps, or
// past their ends). Moods are whole numbers, so a line of 5.5 already acted
// as 5: rounding down keeps what it did, and the controls show what's saved.
const fit = (value, min, max, fallback) => (value != null && Number.isFinite(Number(value)) ? Math.min(max, Math.max(min, Math.floor(Number(value)))) : fallback);
const withinRange = (settings) => ({
  ...settings,
  mood_threshold: fit(settings.mood_threshold, 1, 7, DEFAULTS.mood_threshold),
  consecutive_days: fit(settings.consecutive_days, 2, 7, DEFAULTS.consecutive_days),
});
// The export dialogs load when first opened, which keeps them off the first load.
const loadCompleteExport = () => import('@/features/export/CompleteExport');
const loadOpenExport = () => import('@/features/export/OpenExport');

export default function SettingsSheet({ open, onOpenChange, onCloseAutoFocus }) {
  const { toast } = useToast();
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const prefs = usePreferences();
  const [settings, setSettings] = useState(DEFAULTS);
  const [weekStart, setWeekStart] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  // Saving waits until the real thresholds load, so defaults never overwrite them.
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const savedSettings = useRef({}); // what the account has now, to notice notices being turned on
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [settingsRetrying, setSettingsRetrying] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [confirmation, setConfirmation] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [deletionFinished, setDeletionFinished] = useState(false);
  const [ExportDialog, setExportDialog] = useState(null);
  const [exportLoadError, setExportLoadError] = useState('');
  // Only the last button pressed opens its dialog, and only while Settings is open.
  const exportRequest = useRef(0);
  useEffect(() => { if (!open) exportRequest.current += 1; }, [open]);
  async function showExportDialog(load) {
    const request = ++exportRequest.current;
    setExportLoadError('');
    try {
      const { default: dialog } = await load();
      if (request === exportRequest.current) setExportDialog(() => dialog);
    } catch {
      if (request === exportRequest.current) setExportLoadError('This part of Vibe Check did not load. Reload the app and try again.');
    }
  }
  // Deleting asks for the password first (see ConfirmIdentity).
  const [identityOk, setIdentityOk] = useState(false);
  // Shows the new quick exit choice at once, before the save comes back.
  const [quickExitChoice, setQuickExitChoice] = useState(null);
  const changeQuickExit = async (value) => {
    setQuickExitChoice(value);
    try { await prefs.savePreferences({ quick_exit: value }); }
    catch (err) { setError(err.message); }
    setQuickExitChoice(null);
  };
  const confirmIdentity = useCallback(() => setIdentityOk(true), []);
  useEffect(() => {
    if (!open) return;
    let active = true;
    setSettingsLoaded(false);
    base44.auth.me().then((me) => {
      if (!active) return;
      setSettings(withinRange({ ...DEFAULTS, ...me.boundary_settings }));
      savedSettings.current = me.boundary_settings || {};
      setSettingsLoaded(true);
      setError('');
    }).catch((err) => { if (active) setError(err.message); }).finally(() => { if (active) setSettingsRetrying(false); });
    return () => { active = false; };
  }, [open, loadAttempt]);
  useEffect(() => { setWeekStart(prefs.data?.week_start ?? 1); }, [prefs.data?.week_start]);
  async function save() {
    setSaving(true);
    // Keep the "thresholds not loaded" notice and its retry visible.
    if (settingsLoaded) setError('');
    try {
      // Thresholds save only once the real ones loaded; the week start does
      // not depend on them.
      if (settingsLoaded && settings.notices_enabled && !savedSettings.current.notices_enabled) {
        // Older notices were never asked for; turning notices on starts fresh.
        await BoundaryAlert.updateWhere({ user_id: user.id, is_acknowledged: false }, { is_acknowledged: true });
      }
      if (settingsLoaded) {
        await base44.auth.updateMe({ boundary_settings: settings });
        savedSettings.current = settings;
      }
      // Only a week start chosen here: this sheet can stay open for hours,
      // and a stored choice from another device must not be written back.
      const weekChanged = prefs.data !== undefined && weekStart !== (prefs.data.week_start ?? 1);
      if (weekChanged) await prefs.savePreferences({ week_start: weekStart });
      toast(settingsLoaded
        ? { title: 'Settings saved' }
        : { title: weekChanged ? 'Week start saved' : 'Nothing was changed', description: 'Your low-mood lines were not changed because they have not loaded yet.' });
    } catch (err) { setError(err.message); }
    setSaving(false);
  }
  // Saves kept on this device while offline are deleted by signing out, so
  // the person is told first and chooses.
  const keptCount = useKeptSaves(user?.id).length;
  const [confirmSignOut, setConfirmSignOut] = useState(null);
  // Sent while the warning was open: there's nothing left to warn about.
  useEffect(() => { if (!keptCount) setConfirmSignOut(null); }, [keptCount]);
  async function signOut(scope, { confirmed = false } = {}) {
    if (keptCount && !confirmed) { setConfirmSignOut(scope); return; }
    setConfirmSignOut(null);
    setSaving(true); setError('');
    try { await logout(scope); onOpenChange(false); }
    catch (err) { setError(err.message); }
    setSaving(false);
  }
  async function deleteAccount() {
    if (confirmation !== 'DELETE' || deleting) return;
    setDeleting(true); setDeleteError('');
    let erased = deletionFinished;
    try {
      if (!erased) {
        // Nothing kept on this device may reach the account once deletion
        // begins: no tab sends while it runs, and what's kept goes with it.
        await holdKeptSaves(user?.id, async () => {
          try {
            await base44.auth.deleteAccount();
          } catch (err) {
            if (err.recordsDeleted) clearKeptSaves(user?.id);
            throw err;
          }
          clearKeptSaves(user?.id);
        }, { waitMs: 10_000 });
        erased = true;
        setDeletionFinished(true);
        if (user?.id) removeAppLock(user.id);
        clearWeekSeen(user?.id);
        clearLegacyDrafts();
        queryClientInstance.clear();
      }
      await logout('local');
      setDeleteOpen(false); onOpenChange(false);
      navigate('/', { replace: true });
      toast({ title: 'Your Vibe Check records were deleted', description: 'Any Campground or Daily Digest records and their shared sign-in are preserved.' });
    } catch (err) {
      if (err.recordsDeleted) {
        setDeletionFinished(true);
        clearLegacyDrafts();
        queryClientInstance.clear();
        setDeleteError('Your Vibe Check records were deleted, but sign-in removal did not finish. Sign out below and contact support if you need help removing the remaining sign-in.');
      } else {
        setDeleteError(erased ? 'Your Vibe Check records were deleted, but sign-out did not finish. Reconnect and retry signing out.' : err.message);
      }
    }
    setDeleting(false);
  }
  return <><Sheet open={open} onOpenChange={onOpenChange}><SheetContent onCloseAutoFocus={onCloseAutoFocus}>
    <SheetHeader><SheetTitle className="font-display text-2xl">Settings & privacy</SheetTitle><SheetDescription>Your record, your preferences, and who can see this device.</SheetDescription></SheetHeader>
    <div className="space-y-7 mt-6">
      {error && <p className="living-error" role="alert">{error}{!settingsLoaded && <> Your low-mood lines are paused until they load; other settings still save. <RetryButton busy={settingsRetrying} onRetry={() => { setSettingsRetrying(true); setLoadAttempt((count) => count + 1); }} /></>}</p>}
      <section className="space-y-5" aria-labelledby="settings-reflections"><h3 id="settings-reflections" className="text-xl">Reflections & reports</h3>
        <label className="flex items-start gap-3">
          <input type="checkbox" className="mt-1 h-5 w-5 shrink-0" checked={Boolean(settings.notices_enabled)} disabled={!settingsLoaded} onChange={(event) => setSettings({ ...settings, notices_enabled: event.target.checked })} />
          <span><span className="font-medium block">Notice low-mood days</span><span className="living-muted text-xs block mt-1">Off unless you turn it on. When on, a gentle notice appears after you keep a day at or below the line you choose, with a practice and support options nearby. Notices start from the day you turn this on.</span></span>
        </label>
        {settings.notices_enabled && <>
        <div><Label htmlFor="settings-mood-line">Low mood line: {settings.mood_threshold}</Label><input id="settings-mood-line" type="range" className="living-range mt-3" disabled={!settingsLoaded} min={1} max={7} step={1} value={settings.mood_threshold} onChange={(event) => setSettings({ ...settings, mood_threshold: Number(event.target.value) })} /><p className="living-muted text-xs mt-2">A day at or below this gets a gentle notice when you save a check-in.</p></div>
        <div><Label htmlFor="settings-declining-run">Declining run: {settings.consecutive_days} days</Label><input id="settings-declining-run" type="range" className="living-range mt-3" disabled={!settingsLoaded} min={2} max={7} step={1} value={settings.consecutive_days} onChange={(event) => setSettings({ ...settings, consecutive_days: Number(event.target.value) })} /></div>
        </>}
        <label className="living-label">Your week begins<select className="living-input mt-2" value={weekStart} disabled={prefs.data === undefined || saving} onChange={(event) => setWeekStart(Number(event.target.value))}><option value={1}>Monday</option><option value={0}>Sunday</option></select></label>
        <button className="ink-button" onClick={save} disabled={saving || prefs.isLoading}>{saving ? 'Saving…' : 'Save settings'}</button>
      </section>
      <section className="space-y-3 hairline pt-6"><h3 className="text-xl">Your private record</h3><p className="living-muted text-sm">Check-ins, journal entries, people, and practice responses are saved to your account. Adding someone to your orbit does not invite them or share your entries.</p><p className="living-muted text-sm">Download everything as one file, encrypted with a password unless you choose otherwise. To share part of your record, choose a date range and entries, remove saved people’s names, and preview the exact contents first.</p><div className="flex flex-wrap gap-3"><button className="living-secondary" onClick={() => showExportDialog(loadCompleteExport)}>Download everything</button><button className="living-secondary" onClick={() => { onOpenChange(false); navigate('/Analytics?export=1'); }}>Choose & preview an export</button></div><p className="living-muted text-sm">A summary to share gathers chosen dates into a short record you can print or save as a PDF and bring to a therapist, a doctor, or anyone you choose.</p><button className="living-secondary" onClick={() => { onOpenChange(false); navigate('/Summary'); }}>A summary to share</button><p className="living-muted text-sm">Read an export file here, encrypted or not. It stays on this device.</p><button className="living-secondary" onClick={() => showExportDialog(loadOpenExport)}>Open an export file</button>{exportLoadError && <p className="living-error" role="alert">{exportLoadError}</p>}<p className="living-muted text-sm">Edit or delete individual records from their history. Reports update with those changes. Your patterns, full history, and reports stay free.</p></section>
      <section className="space-y-3 hairline pt-6"><h3 className="text-xl">On a shared device</h3><label className="flex items-start gap-3"><input type="checkbox" className="mt-1 h-5 w-5 shrink-0" checked={quickExitChoice ?? Boolean(prefs.data?.quick_exit)} disabled={prefs.data === undefined || quickExitChoice !== null} onChange={(event) => changeQuickExit(event.target.checked)} /><span><span className="font-medium block">Show a quick exit button</span><span className="living-muted text-xs block mt-1">Leaves Vibe Check at once for a neutral page. It doesn't erase your browser history.</span></span></label><p className="living-muted text-sm">Sign out to close access to your account on this device. Downloaded files and browser history remain on the device.</p><div className="flex flex-wrap gap-3"><button className="living-secondary" disabled={saving} onClick={() => signOut('local')}>Sign out on this device</button><button className="living-secondary" disabled={saving} onClick={() => signOut('global')}>Sign out on all devices</button></div>{confirmSignOut && keptCount > 0 && <div className="living-inset space-y-3" role="alert"><p className="text-sm">{keptCount === 1 ? "1 entry kept on this device hasn't" : `${keptCount} entries kept on this device haven't`} been saved to your account yet. Signing out deletes {keptCount === 1 ? 'it' : 'them'} from this device.</p><div className="flex flex-wrap gap-3"><button type="button" className="living-secondary" onClick={() => setConfirmSignOut(null)}>Stay signed in</button><button type="button" className="danger-link text-sm" disabled={saving} onClick={() => signOut(confirmSignOut, { confirmed: true })}>Sign out and delete {keptCount === 1 ? 'it' : 'them'}</button></div></div>}<p className="living-muted text-xs">Other sessions are revoked immediately; an already issued access token may remain valid until it expires.</p></section>
      <AppLockSettings />
      <section className="space-y-3 hairline pt-6"><h3 className="text-xl">Support & account deletion</h3><a className="living-text-link" href="/support-now">Support now: crisis and safety services</a><a className="living-text-link break-all" href="mailto:morphiclabsdata@gmail.com">morphiclabsdata@gmail.com</a><div className="flex flex-wrap gap-4"><a className="living-text-link" href="/privacy">Privacy</a><a className="living-text-link" href="/terms">Terms</a><a className="living-text-link" href="/support">Support</a></div><button className="danger-outline" onClick={() => { setConfirmation(''); setDeleteError(''); setDeletionFinished(false); setIdentityOk(false); setDeleteOpen(true); }}>Delete Vibe Check account</button></section>
    </div>
  </SheetContent></Sheet><Dialog open={deleteOpen} onOpenChange={(value) => { if (!deleting) setDeleteOpen(value); }}><DialogContent><DialogHeader><DialogTitle>Delete your Vibe Check account?</DialogTitle><DialogDescription>This permanently deletes your Vibe Check check-ins, journal, people, readings, practice responses, report notes, preferences, and saved drafts. Any Campground or Daily Digest records and their shared sign-in remain. Downloaded exports remain on your device.</DialogDescription></DialogHeader><p className="living-muted">Export anything you want to keep before continuing.</p>{!identityOk && !deletionFinished ? <ConfirmIdentity action="delete your account" onConfirmed={confirmIdentity} /> : <label className="living-label">Type DELETE to confirm<input className="living-input mt-2" value={confirmation} disabled={deleting || deletionFinished} onChange={(event) => setConfirmation(event.target.value)} autoComplete="off" /></label>}{deleteError && <p className="living-error" role="alert">{deleteError}</p>}<div className="flex flex-wrap gap-3"><button className="living-secondary" disabled={deleting} onClick={() => setDeleteOpen(false)}>Cancel</button><button className="danger-button" disabled={(!identityOk && !deletionFinished) || confirmation !== 'DELETE' || deleting} onClick={deleteAccount}>{deleting ? 'Working…' : deletionFinished ? 'Retry sign-out' : 'Permanently delete Vibe Check account'}</button></div></DialogContent></Dialog>{ExportDialog && <ExportDialog onClose={() => setExportDialog(null)} />}</>;
}
