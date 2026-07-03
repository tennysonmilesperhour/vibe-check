import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Copy, Mail, Check } from "lucide-react";

export default function InviteModal({ open, onClose }) {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [copied, setCopied] = useState(false);

  const inviteUrl = window.location.origin;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Link copied!", description: "Share it with your friend." });
  };

  const handleSendInvite = async () => {
    if (!email.trim()) return;
    setSending(true);
    await base44.users.inviteUser(email.trim(), "user");
    setSending(false);
    setEmail("");
    toast({ title: "✦ Invitation sent", description: `${email} has been invited to join your constellation.` });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent style={{ background: 'rgba(255,255,255,0.98)', border: '1px solid rgba(138,114,184,0.25)', maxWidth: 420 }}>
        <DialogHeader>
          <DialogTitle className="gradient-text" style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 18 }}>
            ✦ Invite to Your Constellation
          </DialogTitle>
        </DialogHeader>

        <p className="text-sm mb-5" style={{ color: 'rgba(105,95,128,0.7)' }}>
          Invite a friend to join Vibe Check. Once they create their cosmic profile, you can add them to your constellation for synergy readings.
        </p>

        {/* Copy link */}
        <div className="mb-5">
          <Label className="text-xs mb-2 block" style={{ color: 'rgba(82,72,104,0.7)' }}>Share your invite link</Label>
          <div className="flex gap-2">
            <div className="flex-1 px-3 py-2 rounded-lg text-xs truncate"
              style={{ background: 'rgba(255,255,255,0.64)', border: '1px solid rgba(61,52,80,0.12)', color: 'rgba(105,95,128,0.8)' }}>
              {inviteUrl}
            </div>
            <Button onClick={handleCopyLink} size="sm" variant="outline"
              style={{ border: '1px solid rgba(138,114,184,0.3)', color: copied ? '#C9834B' : '#8A72B8', background: 'rgba(138,114,184,0.08)' }}>
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Email invite */}
        <div>
          <Label className="text-xs mb-2 block" style={{ color: 'rgba(82,72,104,0.7)' }}>Or send an email invitation</Label>
          <div className="flex gap-2">
            <Input
              placeholder="friend@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSendInvite()}
              className="flex-1"
            />
            <Button onClick={handleSendInvite} disabled={!email.trim() || sending} className="btn-cosmic rounded-lg px-4">
              <Mail className="w-4 h-4 mr-1.5" />
              {sending ? "Sending..." : "Invite"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}