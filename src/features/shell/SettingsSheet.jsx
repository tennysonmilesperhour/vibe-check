import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { BoundaryAlert } from '@/api/entities';
import { useAuth } from '@/lib/AuthContext';
import { usePreferences } from '@/features/patterns/useLivingData';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/components/ui/use-toast';
import { clearLegacyDrafts } from '@/lib/legacy-drafts';
import { queryClientInstance } from '@/lib/query-client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { NOTICE_DEFAULTS } from '@/lib/boundaries';
import { removeAppLock } from '@/lib/app-lock';
import AppLockSettings from '@/features/safety/AppLockSettings';
import ConfirmIdentity from '@/features/safety/ConfirmIdentity';

const DEFAULTS = NOTICE_DEFAULTS;

export default function SettingsSheet({ open, onOpenChange }) {
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
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [confirmation, setConfirmation] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [deletionFinished, setDeletionFinished] = useState(false);
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
      setSettings({ ...DEFAULTS, ...me.boundary_settings });
      savedSettings.current = me.boundary_settings || {};
      setSettingsLoaded(true);
      setError('');
    }).catch((err) => { if (active) setError(err.message); });
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
  async function signOut(scope) {
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
        await base44.auth.deleteAccount();
        erased = true;
        setDeletionFinished(true);
        if (user?.id) removeAppLock(user.id);
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
  return <><Sheet open={open} onOpenChange={onOpenChange}><SheetContent className="overflow-y-auto living-settings">
    <SheetHeader><SheetTitle className="font-display text-2xl">Settings & privacy</SheetTitle><SheetDescription>Your record, your preferences, and who can see this device.</SheetDescription></SheetHeader>
    <div className="space-y-7 mt-6">
      {error && <p className="living-error" role="alert">{error}{!settingsLoaded && <> Your low-mood lines are paused until they load; other settings still save. <button type="button" className="underline" onClick={() => setLoadAttempt((count) => count + 1)}>Try again</button></>}</p>}
      <section className="space-y-5" aria-labelledby="settings-reflections"><h3 id="settings-reflections" className="font-semibold">Reflections & reports</h3>
        <label className="flex items-start gap-3">
          <input type="checkbox" className="mt-1 h-5 w-5 shrink-0" checked={Boolean(settings.notices_enabled)} disabled={!settingsLoaded} onChange={(event) => setSettings({ ...settings, notices_enabled: event.target.checked })} />
          <span><span className="font-medium block">Notice low-mood days</span><span className="living-muted text-xs block mt-1">Off unless you turn it on. When on, a gentle notice appears after you keep a day at or below the line you choose, with a practice and support options nearby. Notices start from the day you turn this on.</span></span>
        </label>
        {settings.notices_enabled && <>
        <div><Label>Low mood line: {settings.mood_threshold}</Label><Slider disabled={!settingsLoaded} min={1} max={7} step={1} value={[settings.mood_threshold]} onValueChange={([value]) => setSettings({ ...settings, mood_threshold: value })} className="mt-3" aria-label="Low mood threshold" /><p className="living-muted text-xs mt-2">A day at or below this gets a gentle notice when you save a check-in.</p></div>
        <div><Label>Declining run: {settings.consecutive_days} days</Label><Slider disabled={!settingsLoaded} min={2} max={7} step={1} value={[settings.consecutive_days]} onValueChange={([value]) => setSettings({ ...settings, consecutive_days: value })} className="mt-3" aria-label="Consecutive declining days" /></div>
        </>}
        <label className="living-label">Your week begins<select className="living-input mt-2" value={weekStart} disabled={prefs.data === undefined || saving} onChange={(event) => setWeekStart(Number(event.target.value))}><option value={1}>Monday</option><option value={0}>Sunday</option></select></label>
        <button className="ink-button" onClick={save} disabled={saving || prefs.isLoading}>{saving ? 'Saving…' : 'Save settings'}</button>
      </section>
      <section className="space-y-3 hairline pt-6"><h3 className="font-semibold">Your private record</h3><p className="living-muted text-sm">Check-ins, journal entries, people, and practice responses are saved to your account. Adding someone to your orbit does not invite them or share your entries.</p><p className="living-muted text-sm">Choose a date range and individual entries, remove saved people’s names, and preview the exact contents before downloading. Password encryption is available in the export preview.</p><button className="living-secondary" onClick={() => { onOpenChange(false); navigate('/Analytics?export=1'); }}>Choose & preview an export</button><p className="living-muted text-sm">Edit or delete individual records from their history. Reports update with those changes. Your patterns, full history, and reports stay free.</p></section>
      <section className="space-y-3 hairline pt-6"><h3 className="font-semibold">On a shared device</h3><label className="flex items-start gap-3"><input type="checkbox" className="mt-1 h-5 w-5 shrink-0" checked={quickExitChoice ?? Boolean(prefs.data?.quick_exit)} disabled={prefs.data === undefined || quickExitChoice !== null} onChange={(event) => changeQuickExit(event.target.checked)} /><span><span className="font-medium block">Show a quick exit button</span><span className="living-muted text-xs block mt-1">Leaves Vibe Check at once for a neutral page. It doesn't erase your browser history.</span></span></label><p className="living-muted text-sm">Sign out to close access to your account on this device. Downloaded files and browser history remain on the device.</p><div className="flex flex-wrap gap-3"><button className="living-secondary" disabled={saving} onClick={() => signOut('local')}>Sign out on this device</button><button className="living-secondary" disabled={saving} onClick={() => signOut('global')}>Sign out on all devices</button></div><p className="living-muted text-xs">Other sessions are revoked immediately; an already issued access token may remain valid until it expires.</p></section>
      <AppLockSettings />
      <section className="space-y-3 hairline pt-6"><h3 className="font-semibold">Support & account deletion</h3><a className="living-text-link" href="/support-now">Support now: crisis and safety services</a><a className="living-text-link break-all" href="mailto:morphiclabsdata@gmail.com">morphiclabsdata@gmail.com</a><div className="flex flex-wrap gap-4"><a className="living-text-link" href="/privacy">Privacy</a><a className="living-text-link" href="/terms">Terms</a><a className="living-text-link" href="/support">Support</a></div><button className="living-secondary" onClick={() => { setConfirmation(''); setDeleteError(''); setDeletionFinished(false); setIdentityOk(false); setDeleteOpen(true); }}>Delete Vibe Check account</button></section>
    </div>
  </SheetContent></Sheet><Dialog open={deleteOpen} onOpenChange={(value) => { if (!deleting) setDeleteOpen(value); }}><DialogContent className="living-dialog"><DialogHeader><DialogTitle>Delete your Vibe Check account?</DialogTitle><DialogDescription>This permanently deletes your Vibe Check check-ins, journal, people, readings, practice responses, report notes, preferences, and saved drafts. Any Campground or Daily Digest records and their shared sign-in remain. Downloaded exports remain on your device.</DialogDescription></DialogHeader><p className="living-muted">Export anything you want to keep before continuing.</p>{!identityOk && !deletionFinished ? <ConfirmIdentity action="delete your account" onConfirmed={confirmIdentity} /> : <label className="living-label">Type DELETE to confirm<input className="living-input mt-2" value={confirmation} disabled={deleting || deletionFinished} onChange={(event) => setConfirmation(event.target.value)} autoComplete="off" /></label>}{deleteError && <p className="living-error" role="alert">{deleteError}</p>}<div className="flex flex-wrap gap-3"><button className="living-secondary" disabled={deleting} onClick={() => setDeleteOpen(false)}>Cancel</button><button className="ink-button" disabled={(!identityOk && !deletionFinished) || confirmation !== 'DELETE' || deleting} onClick={deleteAccount}>{deleting ? 'Working…' : deletionFinished ? 'Retry sign-out' : 'Permanently delete Vibe Check account'}</button></div></DialogContent></Dialog></>;
}
