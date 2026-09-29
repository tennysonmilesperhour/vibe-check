import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { useLivingData } from '@/features/patterns/useLivingData';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/components/ui/use-toast';
import { clearLegacyDrafts } from '@/lib/legacy-drafts';
import { queryClientInstance } from '@/lib/query-client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

const DEFAULTS = { mood_threshold: 4, consecutive_days: 3 };

export default function SettingsSheet({ open, onOpenChange }) {
  const { toast } = useToast();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const living = useLivingData();
  const [settings, setSettings] = useState(DEFAULTS);
  const [weekStart, setWeekStart] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  // Saving waits until the real thresholds load, so defaults never overwrite them.
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [confirmation, setConfirmation] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [deletionFinished, setDeletionFinished] = useState(false);
  useEffect(() => {
    if (!open) return;
    let active = true;
    setSettingsLoaded(false);
    base44.auth.me().then((me) => {
      if (!active) return;
      setSettings({ ...DEFAULTS, ...me.boundary_settings });
      setSettingsLoaded(true);
      setError('');
    }).catch((err) => { if (active) setError(err.message); });
    return () => { active = false; };
  }, [open, loadAttempt]);
  useEffect(() => { setWeekStart(living.data?.preferences?.week_start ?? 1); }, [living.data?.preferences?.week_start]);
  async function save() {
    if (!settingsLoaded) return;
    setSaving(true); setError('');
    try {
      await base44.auth.updateMe({ boundary_settings: settings });
      await living.savePreferences({ week_start: weekStart });
      toast({ title: 'Settings saved' });
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
      {error && <p className="living-error" role="alert">{error}{!settingsLoaded && <> Saving is paused until your settings load. <button type="button" className="underline" onClick={() => setLoadAttempt((count) => count + 1)}>Try again</button></>}</p>}
      <section className="space-y-5" aria-labelledby="settings-reflections"><h3 id="settings-reflections" className="font-semibold">Reflections & reports</h3>
        <div><Label>Low mood line: {settings.mood_threshold}</Label><Slider min={1} max={7} step={1} value={[settings.mood_threshold]} onValueChange={([value]) => setSettings({ ...settings, mood_threshold: value })} className="mt-3" aria-label="Low mood threshold" /><p className="living-muted text-xs mt-2">A day at or below this gets a gentle notice when you save a check-in.</p></div>
        <div><Label>Declining run: {settings.consecutive_days} days</Label><Slider min={2} max={7} step={1} value={[settings.consecutive_days]} onValueChange={([value]) => setSettings({ ...settings, consecutive_days: value })} className="mt-3" aria-label="Consecutive declining days" /></div>
        <label className="living-label">Your week begins<select className="living-input mt-2" value={weekStart} onChange={(event) => setWeekStart(Number(event.target.value))}><option value={1}>Monday</option><option value={0}>Sunday</option></select></label>
        <button className="ink-button" onClick={save} disabled={saving || living.isLoading || !settingsLoaded}>{saving ? 'Saving…' : 'Save settings'}</button>
      </section>
      <section className="space-y-3 hairline pt-6"><h3 className="font-semibold">Your private record</h3><p className="living-muted text-sm">Check-ins, journal entries, people, and practice responses are saved to your account. Adding someone to your orbit does not invite them or share your entries.</p><p className="living-muted text-sm">Choose a date range and individual entries, remove saved people’s names, and preview the exact contents before downloading. Password encryption is available in the export preview.</p><button className="living-secondary" onClick={() => { onOpenChange(false); navigate('/Analytics?export=1'); }}>Choose & preview an export</button><p className="living-muted text-sm">Edit or delete individual records from their history. Reports update with those changes. Your patterns, full history, and reports stay free.</p></section>
      <section className="space-y-3 hairline pt-6"><h3 className="font-semibold">On a shared device</h3><p className="living-muted text-sm">Sign out to close access to your account on this device. Downloaded files and browser history remain on the device.</p><div className="flex flex-wrap gap-3"><button className="living-secondary" disabled={saving} onClick={() => signOut('local')}>Sign out on this device</button><button className="living-secondary" disabled={saving} onClick={() => signOut('global')}>Sign out on all devices</button></div><p className="living-muted text-xs">Other sessions are revoked immediately; an already issued access token may remain valid until it expires.</p></section>
      <section className="space-y-3 hairline pt-6"><h3 className="font-semibold">Support & account deletion</h3><a className="living-text-link break-all" href="mailto:morphiclabsdata@gmail.com">morphiclabsdata@gmail.com</a><div className="flex flex-wrap gap-4"><a className="living-text-link" href="/privacy">Privacy</a><a className="living-text-link" href="/terms">Terms</a><a className="living-text-link" href="/support">Support</a></div><button className="living-secondary" onClick={() => { setConfirmation(''); setDeleteError(''); setDeletionFinished(false); setDeleteOpen(true); }}>Delete Vibe Check account</button></section>
    </div>
  </SheetContent></Sheet><Dialog open={deleteOpen} onOpenChange={(value) => { if (!deleting) setDeleteOpen(value); }}><DialogContent className="living-dialog"><DialogHeader><DialogTitle>Delete your Vibe Check account?</DialogTitle><DialogDescription>This permanently deletes your Vibe Check check-ins, journal, people, readings, practice responses, report notes, preferences, and saved drafts. Any Campground or Daily Digest records and their shared sign-in remain. Downloaded exports remain on your device.</DialogDescription></DialogHeader><p className="living-muted">Export anything you want to keep before continuing.</p><label className="living-label">Type DELETE to confirm<input className="living-input mt-2" value={confirmation} disabled={deleting || deletionFinished} onChange={(event) => setConfirmation(event.target.value)} autoComplete="off" /></label>{deleteError && <p className="living-error" role="alert">{deleteError}</p>}<div className="flex flex-wrap gap-3"><button className="living-secondary" disabled={deleting} onClick={() => setDeleteOpen(false)}>Cancel</button><button className="ink-button" disabled={confirmation !== 'DELETE' || deleting} onClick={deleteAccount}>{deleting ? 'Working…' : deletionFinished ? 'Retry sign-out' : 'Permanently delete Vibe Check account'}</button></div></DialogContent></Dialog></>;
}
