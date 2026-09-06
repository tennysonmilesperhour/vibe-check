import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { generateCosmicWisdom } from "@/functions/generateCosmicWisdom";
import { Button } from "@/components/ui/button";
import { Sparkles, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import { getPeriodKey, todayKey } from "@/lib/dates";
import { resonanceGraph, summarizeGraph } from "@/lib/resonance/graph";

const buildResonanceSummary = (user) => {
    try {
        return summarizeGraph(resonanceGraph(user?.cosmic_profile || {}, todayKey()));
    } catch {
        return "";
    }
};

const PERIOD_CONFIG = {
    daily:   { label: "Today",      emoji: "☀️" },
    weekly:  { label: "This week",  emoji: "🌙" },
    monthly: { label: "This month", emoji: "🌊" },
    yearly:  { label: "This year",  emoji: "⭐" },
};

export default function CosmicWisdomCard({ periodType = "daily" }) {
    const cfg = PERIOD_CONFIG[periodType];
    const [wisdom, setWisdom] = useState(null);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [expanded, setExpanded] = useState(false);
    const [hasProfile, setHasProfile] = useState(false);
    const [error, setError] = useState(null);
    const [me, setMe] = useState(null);

    useEffect(() => {
        checkAndLoad();
    }, [periodType]);

    const checkAndLoad = async () => {
        setLoading(true);
        setError(null);
        try {
            const user = await base44.auth.me();
            setMe(user);
            const enabled = user?.cosmic_profile?.enabled_systems || [];
            if (enabled.length === 0) { setLoading(false); return; }
            setHasProfile(true);

            // Try to load existing via the function (it checks cache first)
            const res = await generateCosmicWisdom({ period_type: periodType, period_key: getPeriodKey(periodType), force_regenerate: false, resonance_summary: buildResonanceSummary(user) });
            if (res?.data?.wisdom) {
                setWisdom(res.data.wisdom);
            }
        } catch (e) {
            const msg = e?.response?.data?.error || e?.message || 'Something went wrong';
            setError(msg);
        }
        setLoading(false);
    };

    const generate = async (force = false) => {
        setGenerating(true);
        setError(null);
        try {
            const res = await generateCosmicWisdom({ period_type: periodType, period_key: getPeriodKey(periodType), force_regenerate: force, resonance_summary: buildResonanceSummary(me) });
            if (res?.data?.wisdom) setWisdom(res.data.wisdom);
            else if (res?.data?.stub) setError('AI is not configured yet. Add the ANTHROPIC_API_KEY secret in Supabase to enable wisdom.');
        } catch (e) {
            const msg = e?.response?.data?.error || e?.message || 'Generation failed';
            setError(msg);
        }
        setGenerating(false);
    };

    const markRead = async () => {
        if (wisdom && !wisdom.is_read) {
            try {
                await base44.entities.CosmicWisdom.update(wisdom.id, { is_read: true });
                setWisdom(prev => ({ ...prev, is_read: true }));
            } catch {
                // read receipt is best-effort
            }
        }
        setExpanded(e => !e);
    };

    const isUnread = wisdom && !wisdom.is_read;

    if (!hasProfile && !loading) return null;

    return (
        <div
            className="rounded-lg p-5 transition-colors duration-200"
            style={{
                background: isUnread ? 'var(--gh-cream)' : 'var(--gh-field)',
                border: `1px solid ${isUnread ? 'var(--gh-accent)' : 'hsl(var(--border))'}`,
            }}
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <span className="text-xl">{cfg.emoji}</span>
                    <div>
                        <span className="text-xs font-bold" style={{ color: 'var(--gh-accent)' }}>
                            {cfg.label}
                        </span>
                        {isUnread && (
                            <span className="ml-2 text-xs px-1.5 py-0.5 rounded-full font-semibold animate-pulse"
                                style={{ background: 'rgba(194,80,60,0.12)', color: 'var(--gh-accent)' }}>
                                New ✦
                            </span>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    {wisdom && (
                        <Button variant="ghost" size="icon" className="h-11 w-11"
                            disabled={generating}
                            onClick={() => generate(true)}
                            aria-label={`Refresh ${cfg.label.toLowerCase()}`}
                            style={{ color: 'var(--gh-ink-muted)' }}>
                            <RefreshCw className={`w-3 h-3 ${generating ? 'animate-spin' : ''}`} />
                        </Button>
                    )}
                    {wisdom && (
                        <Button variant="ghost" size="icon" className="h-11 w-11" onClick={markRead}
                            aria-label={expanded ? `Collapse ${cfg.label.toLowerCase()}` : `Expand ${cfg.label.toLowerCase()}`}
                            style={{ color: 'var(--gh-ink-muted)' }}>
                            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </Button>
                    )}
                </div>
            </div>

            {/* Content */}
            {(loading || generating) ? (
                <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 shrink-0"
                        style={{ border: '2px solid rgba(194,80,60,0.2)', borderTopColor: 'var(--gh-accent)' }} />
                    <p className="text-xs" style={{ color: 'var(--gh-ink-muted)' }}>
                        {generating ? "Generating reflection. This can take up to 20 seconds." : "Loading reflection…"}
                    </p>
                </div>
            ) : error ? (
                <div className="flex items-center justify-between gap-3">
                    <p className="text-xs" style={{ color: 'rgba(217,92,80,0.7)' }}>{error}</p>
                    <Button size="sm" onClick={() => generate(false)} className="min-h-11 text-xs rounded-lg shrink-0"
                        style={{ background: 'rgba(194,80,60,0.1)', color: 'var(--gh-accent)', border: '1px solid rgba(194,80,60,0.35)' }}>
                        <RefreshCw className="w-3 h-3 mr-1" /> Retry
                    </Button>
                </div>
            ) : !hasProfile ? null : !wisdom ? (
                <div className="flex items-center justify-between gap-3">
                    <p className="text-xs" style={{ color: 'var(--gh-ink-muted)' }}>No reflection generated yet</p>
                    <Button size="sm" onClick={() => generate(false)} className="min-h-11 text-xs rounded-lg"
                        style={{ background: 'rgba(194,80,60,0.1)', color: 'var(--gh-accent)', border: '1px solid rgba(194,80,60,0.35)' }}>
                        <Sparkles className="w-3 h-3 mr-1" /> Generate reflection
                    </Button>
                </div>
            ) : (
                <div>
                    {wisdom.theme && (
                        <p className="font-sans text-sm font-semibold mb-2" style={{ color: 'var(--gh-ink)' }}>
                            {wisdom.theme}
                        </p>
                    )}
                    {/* Preview line always visible */}
                    {!expanded && (
                        <p className="text-xs leading-relaxed line-clamp-2" style={{ color: 'var(--gh-ink-muted)' }}>
                            {wisdom.wisdom}
                        </p>
                    )}
                    {/* Full content when expanded */}
                    {expanded && (
                        <div className="space-y-3 mt-1">
                            <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: 'var(--gh-ink)' }}>
                                {wisdom.wisdom}
                            </p>
                            {wisdom.contemplation && (
                                <div className="p-3 rounded-lg mt-2"
                                    style={{ background: 'rgba(194,80,60,0.06)', border: '1px solid rgba(194,80,60,0.22)' }}>
                                    <p className="text-xs font-semibold mb-1" style={{ color: 'var(--gh-accent)' }}>
                                        Contemplation
                                    </p>
                                    <p className="text-sm leading-relaxed" style={{ color: 'var(--gh-ink-soft)' }}>
                                        {wisdom.contemplation}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
