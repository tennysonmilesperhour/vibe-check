import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Copy, Share2, Check } from "lucide-react";
import { isNativeApp, shareApp } from "@/lib/native";
import { PUBLIC_APP_URL } from "@/lib/publicConfig";

export default function InviteModal({ open, onClose }) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const inviteUrl = PUBLIC_APP_URL || (!isNativeApp ? window.location.origin : "");

  const handleCopyLink = async () => {
    if (!inviteUrl) {
      toast({ title: "Sharing is not configured", description: "The app owner needs to add the public website URL.", variant: "destructive" });
      return;
    }
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: "Link copied", description: "Share it however you like." });
    } catch {
      toast({ title: "Could not copy the link", description: inviteUrl, variant: "destructive" });
    }
  };

  const handleShare = async () => {
    if (!inviteUrl) return handleCopyLink();
    try {
      if (!await shareApp(inviteUrl)) return handleCopyLink();
    } catch (error) {
      if (error?.name !== "AbortError") await handleCopyLink();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent style={{ background: 'rgba(255,255,255,0.98)', border: '1px solid rgba(194,80,60,0.25)', maxWidth: 420 }}>
        <DialogHeader>
          <DialogTitle className="font-sans" style={{ color: 'var(--gh-ink)', fontSize: 18 }}>
            Share Vibe Check
          </DialogTitle>
        </DialogHeader>

        <p className="text-sm mb-5" style={{ color: 'var(--gh-ink-soft)' }}>
          Send someone the app link. Sharing does not connect accounts or expose either person's private profile.
        </p>

        {/* Copy link */}
        <div className="mb-5">
          <Label className="text-xs mb-2 block" style={{ color: 'var(--gh-ink-muted)' }}>App link</Label>
          <div className="flex gap-2">
            <div className="flex-1 px-3 py-2 rounded-lg text-xs truncate"
              style={{ background: 'var(--gh-field)', border: '1px solid hsl(var(--border))', color: 'var(--gh-ink-soft)' }}>
              {inviteUrl || "Public website URL not configured"}
            </div>
            <Button onClick={handleCopyLink} size="icon" variant="outline" aria-label="Copy app link"
              style={{ border: '1px solid rgba(194,80,60,0.3)', color: copied ? '#C9834B' : '#C2503C', background: 'rgba(194,80,60,0.08)' }}>
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        <Button onClick={handleShare} className="btn-cosmic w-full" disabled={!inviteUrl}>
          <Share2 className="w-4 h-4" aria-hidden="true" /> Share app
        </Button>
      </DialogContent>
    </Dialog>
  );
}
