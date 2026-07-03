import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { DailyCheckIn, BoundaryAlert } from "@/entities/all";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { encryptJson, fetchAllPages } from "@/lib/crypto";
import { todayKey } from "@/lib/dates";
import { Download } from "lucide-react";

const DEFAULTS = { mood_threshold: 4, consecutive_days: 3, password_protection: false };

/** App settings: boundary thresholds and honest data export. */
export default function SettingsSheet({ open, onOpenChange }) {
  const { toast } = useToast();
  const [settings, setSettings] = useState(DEFAULTS);
  const [exportPassword, setExportPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (!open) return;
    base44.auth.me().then((me) => {
      if (me?.boundary_settings) setSettings({ ...DEFAULTS, ...me.boundary_settings });
    }).catch(() => {});
  }, [open]);

  const save = async () => {
    setSaving(true);
    try {
      await base44.auth.updateMe({ boundary_settings: settings });
      toast({ title: "Settings saved" });
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
      const [checkIns, alerts, me] = await Promise.all([
        fetchAllPages((limit, offset) => DailyCheckIn.list("-date", limit, offset)),
        fetchAllPages((limit, offset) => BoundaryAlert.list("-created_date", limit, offset)).catch(() => []),
        base44.auth.me(),
      ]);
      const payload = { export_date: new Date().toISOString(), cosmic_profile: me?.cosmic_profile || null, check_ins: checkIns, alerts };
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

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="font-display text-2xl">Settings</SheetTitle>
          <SheetDescription>Boundaries and your data. Detection runs automatically when you save a check-in.</SheetDescription>
        </SheetHeader>

        <div className="space-y-8 mt-6">
          <section aria-labelledby="s-boundaries">
            <h3 id="s-boundaries" className="text-sm font-bold tracking-wide" style={{ color: "var(--gh-ink-muted)" }}>BOUNDARIES</h3>
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
              <button type="button" className="ink-button text-sm py-2" onClick={save} disabled={saving}>
                {saving ? "Saving…" : "Save settings"}
              </button>
            </div>
          </section>

          <section aria-labelledby="s-export" className="hairline pt-6">
            <h3 id="s-export" className="text-sm font-bold tracking-wide" style={{ color: "var(--gh-ink-muted)" }}>YOUR DATA</h3>
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
        </div>
      </SheetContent>
    </Sheet>
  );
}
