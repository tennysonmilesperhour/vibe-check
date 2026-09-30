import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { Copy, Check, Share2 } from "lucide-react";

/**
 * Share the app link. Email invites need server-side sending that does not
 * exist yet, so this offers only what actually works: copy, or the native
 * share sheet where the browser has one.
 */
export default function InviteModal({ open, onClose }) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const inviteUrl = window.location.origin;
  const canNativeShare = typeof navigator !== "undefined" && !!navigator.share;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: "Link copied", description: "Send it to your friend." });
    } catch {
      toast({ title: "Could not copy", description: "Select the link and copy it by hand.", variant: "destructive" });
    }
  };

  const handleNativeShare = async () => {
    try {
      await navigator.share({
        title: "Vibe Check",
        text: "A private journal for noticing your own patterns. Nothing of mine is shared with you, and nothing of yours with me.",
        url: inviteUrl,
      });
    } catch {
      // person closed the share sheet; nothing to do
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent style={{ background: "var(--gh-field)", border: "1px solid hsl(var(--border))", maxWidth: 420 }}>
        <DialogHeader>
          <DialogTitle className="font-display text-xl" style={{ color: "var(--gh-ink)" }}>
            Invite a friend
          </DialogTitle>
        </DialogHeader>

        <p className="text-sm mb-4" style={{ color: "var(--gh-ink-soft)" }}>
          Share Vibe Check with someone. Their journal and patterns stay
          private to them, and nothing of yours is shared.
        </p>

        <div className="flex gap-2">
          <div className="flex-1 px-3 py-2 text-xs truncate flex items-center"
            style={{ background: "var(--gh-cream)", border: "1px solid hsl(var(--border))", borderRadius: "var(--radius)", boxShadow: "var(--shadow-soft)", color: "var(--gh-ink-soft)" }}>
            {inviteUrl}
          </div>
          <button type="button" onClick={handleCopyLink} aria-label="Copy invite link"
            className="px-3 flex items-center transition-colors"
            style={{ border: "1px solid hsl(var(--border))", borderRadius: "calc(var(--radius) - 3px)", color: "var(--gh-accent)", background: "transparent" }}>
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>

        {canNativeShare && (
          <button type="button" onClick={handleNativeShare} className="ink-button w-full text-sm mt-3 inline-flex items-center justify-center gap-2">
            <Share2 className="w-4 h-4" /> Share the link
          </button>
        )}
      </DialogContent>
    </Dialog>
  );
}
