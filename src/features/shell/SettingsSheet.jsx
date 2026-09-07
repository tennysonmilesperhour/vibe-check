import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { DailyCheckIn, BoundaryAlert, Person, Reading, CosmicWisdom, HealingProgress } from "@/entities/all";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { encryptJson, fetchAllPages } from "@/lib/crypto";
import { todayKey } from "@/lib/dates";
import { Download, LogOut, Trash2 } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { isNativeApp, scheduleDailyReminder } from "@/lib/native";

const DEFAULTS = { mood_threshold: 4, consecutive_days: 3, password_protection: false, reminder_enabled: false, reminder_time: "20:30" };

/** App settings: boundary thresholds and honest data export. */
export default function SettingsSheet({ open, onOpenChange }) {
  const { toast } = useToast();
  const { logout } = useAuth();
  const [settings, setSettings] = useState(DEFAULTS);
  const [exportPassword, setExportPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [account, setAccount] = useState(null);

  useEffect(() => {
    if (!open) return;
    base44.auth.me().then((me) => {
      setAccount(me);
      if (me?.boundary_settings) setSettings({ ...DEFAULTS, ...me.boundary_settings });
    }).catch(() => {});
  }, [open]);

  const save = async () => {
    setSaving(true);
    try {
      await scheduleDailyReminder(settings.reminder_enabled, settings.reminder_time);
      await base44.auth.updateMe({ boundary_settings: settings });
      window.dispatchEvent(new CustomEvent("vibe-check:settings-saved", {
        detail: { reminderEnabled: settings.reminder_enabled },
      }));
      toast({ title: "Settings saved", description: "Your notice thresholds and reminder are up to date." });
    } catch (e) {
      toast({ title: "Could not save", description: e?.message, variant: "destructive" });
    }
    setSaving(false);
  };

  const exportData = async () => {
    if (settings.password_protection && !exportPassword) {
      toast({ title: "Enter a password to encrypt the export", variant: "destructive" });
      return;
    }
    setExporting(true);
    try {
      const [checkIns, alerts, people, readings, wisdom, healing, me] = await Promise.all([
        fetchAllPages((limit, offset) => DailyCheckIn.list("-date", limit, offset)),
        fetchAllPages((limit, offset) => BoundaryAlert.list("-created_date", limit, offset)).catch(() => []),
        fetchAllPages((limit, offset) => Person.list("-created_date", limit, offset)).catch(() => []),
        fetchAllPages((limit, offset) => Reading.list("-date", limit, offset)).catch(() => []),
        fetchAllPages((limit, offset) => CosmicWisdom.list("-created_date", limit, offset)).catch(() => []),
        fetchAllPages((limit, offset) => HealingProgress.list("-created_date", limit, offset)).catch(() => []),
        base44.auth.me(),
      ]);
      const payload = {
        export_date: new Date().toISOString(),
        profile: { full_name: me?.full_name || null, cosmic_profile: me?.cosmic_profile || null, boundary_settings: me?.boundary_settings || null },
        check_ins: checkIns,
        people,
        readings,
        wisdom,
        boundary_alerts: alerts,
        legacy_healing_items: healing,
      };
      let body;
      let filename = `vibe-check-export-${todayKey()}`;
      if (settings.password_protection) {
        body = JSON.stringify(await encryptJson(payload, exportPassword), null, 2);
        filename += ".enc.json";
      } else {
        body = JSON.stringify(payload, null, 2);
        filename += ".json";
      }
      const url = URL.createObjectURL(new Blob([body], { type: "application/json" }));
      const link = Object.assign(document.createElement("a"), { href: url, download: filename });
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      toast({
        title: "Export complete",
        description: settings.password_protection
          ? "Encrypted with your password. It cannot be recovered if lost."
          : `${checkIns.length} check-ins downloaded.`,
      });
    } catch (e) {
      toast({ title: "Export failed", description: e?.message, variant: "destructive" });
    }
    setExporting(false);
  };

  const signOut = async () => {
    try {
      await logout();
      onOpenChange(false);
    } catch (e) {
      toast({ title: "Could not sign out", description: e?.message, variant: "destructive" });
    }
  };

  const deleteAccount = async () => {
    setDeleting(true);
    try {
      await base44.auth.deleteAccount();
      setDeleteOpen(false);
      onOpenChange(false);
      window.location.assign('/');
    } catch (e) {
      toast({ title: "Account was not deleted", description: e?.message || "Try again or contact support.", variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="font-display text-2xl">Settings</SheetTitle>
          <SheetDescription>Personal notices, reminders, and your data. Detection runs automatically when you save a check-in.</SheetDescription>
        </SheetHeader>

        <div className="space-y-8 mt-6">
          <section aria-labelledby="s-boundaries">
            <h3 id="s-boundaries" className="text-sm font-bold" style={{ color: "var(--gh-ink-muted)" }}>Personal notice thresholds</h3>
            <div className="mt-4 space-y-5">
              <div>
                <Label>Low mood line: {settings.mood_threshold}</Label>
                <Slider min={1} max={7} step={1} value={[settings.mood_threshold]}
                  onValueChange={([v]) => setSettings({ ...settings, mood_threshold: v })} className="mt-2"
                  aria-label="Low mood threshold" />
                <p className="text-xs mt-1" style={{ color: "var(--gh-ink-muted)" }}>A day at or under this gets a gentle notice.</p>
              </div>
              <div>
                <Label>Declining run: {settings.consecutive_days} days</Label>
                <Slider min={2} max={7} step={1} value={[settings.consecutive_days]}
                  onValueChange={([v]) => setSettings({ ...settings, consecutive_days: v })} className="mt-2"
                  aria-label="Consecutive declining days" />
              </div>
            </div>
          </section>

          <section aria-labelledby="s-export" className="hairline pt-6">
            <h3 id="s-export" className="text-sm font-bold" style={{ color: "var(--gh-ink-muted)" }}>Your data</h3>
            <div className="mt-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Encrypt exports</Label>
                  <p className="text-xs" style={{ color: "var(--gh-ink-muted)" }}>AES-256 with a password entered at export time. Never stored.</p>
                </div>
                <Switch checked={settings.password_protection}
                  onCheckedChange={(c) => setSettings({ ...settings, password_protection: c })}
                  aria-label="Encrypt exports" />
              </div>
              {settings.password_protection && (
                <Input type="password" value={exportPassword} onChange={(e) => setExportPassword(e.target.value)}
                  placeholder="Export password" autoComplete="new-password" />
              )}
              <button type="button" className="ink-button text-sm py-2 inline-flex items-center gap-2" onClick={exportData} disabled={exporting}>
                <Download className="w-4 h-4" aria-hidden="true" /> {exporting ? "Gathering everything…" : "Export full history"}
              </button>
            </div>
          </section>

          <section aria-labelledby="s-reminders" className="hairline pt-6">
            <h3 id="s-reminders" className="text-sm font-bold" style={{ color: "var(--gh-ink-muted)" }}>Evening reminder</h3>
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <Label>Remind me to check in</Label>
                  <p className="text-xs mt-1" style={{ color: "var(--gh-ink-muted)" }}>{isNativeApp ? "Scheduled privately on this device." : "Available in the iPhone app."}</p>
                </div>
                <Switch checked={settings.reminder_enabled} disabled={!isNativeApp}
                  onCheckedChange={(value) => setSettings({ ...settings, reminder_enabled: value })}
                  aria-label="Enable evening reminder" />
              </div>
              {settings.reminder_enabled && isNativeApp && (
                <div>
                  <Label htmlFor="reminder-time">Reminder time</Label>
                  <Input id="reminder-time" type="time" className="mt-1" value={settings.reminder_time}
                    onChange={(event) => setSettings({ ...settings, reminder_time: event.target.value })} />
                </div>
              )}
            </div>
          </section>

          <button type="button" className="ink-button w-full text-sm" onClick={save} disabled={saving}>
            {saving ? "Saving settings…" : "Save notices and reminder"}
          </button>

          <section aria-labelledby="s-account" className="hairline pt-6 pb-8">
            <h3 id="s-account" className="text-sm font-bold" style={{ color: "var(--gh-ink-muted)" }}>Account</h3>
            {account?.email && <p className="text-sm mt-2 break-all" style={{ color: "var(--gh-ink-soft)" }}>{account.email}</p>}
            <div className="mt-4 flex flex-col items-start gap-3">
              <button type="button" className="secondary-action inline-flex items-center gap-2" onClick={signOut}>
                <LogOut className="w-4 h-4" aria-hidden="true" /> Sign out
              </button>
              <button type="button" className="danger-action inline-flex items-center gap-2" onClick={() => setDeleteOpen(true)}>
                <Trash2 className="w-4 h-4" aria-hidden="true" /> Delete account
              </button>
            </div>
            <nav aria-label="Legal and support" className="mt-6 flex flex-wrap gap-4 text-sm">
              <a href="/privacy" className="underline underline-offset-4">Privacy policy</a>
              <a href="/terms" className="underline underline-offset-4">Terms</a>
              <a href="/support" className="underline underline-offset-4">Support</a>
            </nav>
          </section>
        </div>
      </SheetContent>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete your Vibe Check account?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes your Vibe Check check-ins, journal text, people, readings, and cosmic profile. If you also use Campground, your Campground work and shared sign-in remain. Export anything you want to keep first. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Keep account</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground" onClick={deleteAccount} disabled={deleting}>
              {deleting ? "Deleting account…" : "Delete account"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Sheet>
  );
}
