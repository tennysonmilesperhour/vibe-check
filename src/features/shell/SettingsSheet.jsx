import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { useLivingData } from '@/features/patterns/useLivingData';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/components/ui/use-toast';

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
  useEffect(() => {
    if (!open) return;
    let active = true;
    base44.auth.me().then((me) => { if (active) setSettings({ ...DEFAULTS, ...me.boundary_settings }); }).catch((err) => { if (active) setError(err.message); });
    return () => { active = false; };
  }, [open]);
  useEffect(() => { setWeekStart(living.data?.preferences?.week_start ?? 1); }, [living.data?.preferences?.week_start]);
  async function save() {
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
  return <Sheet open={open} onOpenChange={onOpenChange}><SheetContent className="overflow-y-auto living-settings">
    <SheetHeader><SheetTitle className="font-display text-2xl">Settings & privacy</SheetTitle><SheetDescription>Your record, your preferences, and who can see this device.</SheetDescription></SheetHeader>
    <div className="space-y-7 mt-6">
      {error && <p className="living-error" role="alert">{error}</p>}
      <section className="space-y-5" aria-labelledby="settings-reflections"><h3 id="settings-reflections" className="font-semibold">Reflections & reports</h3>
        <div><Label>Low mood line: {settings.mood_threshold}</Label><Slider min={1} max={7} step={1} value={[settings.mood_threshold]} onValueChange={([value]) => setSettings({ ...settings, mood_threshold: value })} className="mt-3" aria-label="Low mood threshold" /><p className="living-muted text-xs mt-2">A day at or below this gets a gentle notice when you save a check-in.</p></div>
        <div><Label>Declining run: {settings.consecutive_days} days</Label><Slider min={2} max={7} step={1} value={[settings.consecutive_days]} onValueChange={([value]) => setSettings({ ...settings, consecutive_days: value })} className="mt-3" aria-label="Consecutive declining days" /></div>
        <label className="living-label">Your week begins<select className="living-input mt-2" value={weekStart} onChange={(event) => setWeekStart(Number(event.target.value))}><option value={1}>Monday</option><option value={0}>Sunday</option></select></label>
        <button className="ink-button" onClick={save} disabled={saving || living.isLoading}>{saving ? 'Saving…' : 'Save settings'}</button>
      </section>
      <section className="space-y-3 hairline pt-6"><h3 className="font-semibold">Your private record</h3><p className="living-muted text-sm">Check-ins, journal entries, people, and practice responses are saved to your account. Adding someone to your orbit does not invite them or share your entries.</p><p className="living-muted text-sm">Choose a date range and individual entries, remove saved people’s names, and preview the exact contents before downloading. Password encryption is available in the export preview.</p><button className="living-secondary" onClick={() => { onOpenChange(false); navigate('/Analytics?export=1'); }}>Choose & preview an export</button><p className="living-muted text-sm">Edit or delete individual records from their history. Reports update with those changes. Your patterns, full history, and reports stay free.</p></section>
      <section className="space-y-3 hairline pt-6"><h3 className="font-semibold">On a shared device</h3><p className="living-muted text-sm">Sign out to close access to your account on this device. Downloaded files and browser history remain on the device.</p><div className="flex flex-wrap gap-3"><button className="living-secondary" disabled={saving} onClick={() => signOut('local')}>Sign out on this device</button><button className="living-secondary" disabled={saving} onClick={() => signOut('global')}>Sign out on all devices</button></div><p className="living-muted text-xs">Other sessions are revoked immediately; an already issued access token may remain valid until it expires.</p></section>
      <section className="space-y-2 hairline pt-6"><h3 className="font-semibold">Support & account deletion</h3><a className="living-text-link break-all" href="mailto:morphiclabsdata@gmail.com">morphiclabsdata@gmail.com</a></section>
    </div>
  </SheetContent></Sheet>;
}
