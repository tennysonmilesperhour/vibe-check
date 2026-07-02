import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { generateCosmicWisdom } from "@/functions/generateCosmicWisdom";
import { Button } from "@/components/ui/button";
import { Sparkles, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import { getPeriodKey } from "@/lib/dates";

const PERIOD_CONFIG = {
    daily:   { label: "Today",      emoji: "☀️",  color: "var(--gh-gold)",   glow: "rgba(253,201,78,0.35)" },
    weekly:  { label: "This Week",  emoji: "🌙",  color: "var(--gh-rose)",   glow: "rgba(244,140,160,0.35)" },
    monthly: { label: "This Month", emoji: "🌊",  color: "var(--gh-peach)",  glow: "rgba(247,158,126,0.35)" },
    yearly:  { label: "This Year",  emoji: "⭐",  color: "var(--gh-amber)",  glow: "rgba(250,176,94,0.35)" },
};

export default function CosmicWisdomCard({ periodType = "daily" }) {
    const cfg = PERIOD_CONFIG[periodType];
    const [wisdom, setWisdom] = useState(null);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [expanded, setExpanded] = useState(false);
    const [hasProfile, setHasProfile] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        checkAndLoad();
    }, [periodType]);

    const checkAndLoad = async () => {
        setLoading(true);
        setError(null);
        try {
            const user = await base44.auth.me();
            const enabled = user?.cosmic_profile?.enabled_systems || [];
            if (enabled.length === 0) { setLoading(false); return; }
            setHasProfile(true);

            // Try to load existing via the function (it checks cache first)
            const res = await generateCosmicWisdom({ period_type: periodType, period_key: getPeriodKey(periodType), force_regenerate: false });
            if (res?.data?.wisdom) {
                setWisdom(res.data.wisdom);
            }
        } catch (e) {
            const msg = e?.response?.data?.error || e?.message || 'Something went wrong';
            setError(msg);
            console.error('CosmicWisdom error:', msg);
        }
        setLoading(false);
    };

    const generate = async (force = false) => {
        setGenerating(true);
        setError(null);
        try {
            const res = await generateCosmicWisdom({ period_type: periodType, period_key: getPeriodKey(periodType), force_regenerate: force });
            if (res?.data?.wisdom) setWisdom(res.data.wisdom);
        } catch (e) {
            const msg = e?.response?.data?.error || e?.message || 'Generation failed';
            setError(msg);
            console.error(e);
        }
        setGenerating(false);
    };

    const markRead = async () => {
        if (wisdom && !wisdom.is_read) {
            try {
                await base44.entities.CosmicWisdom.update(wisdom.id, { is_read: true });
                setWisdom(prev => ({ ...prev, is_read: true }));
            } catch (e) {}
        }
        setExpanded(e => !e);
    };

    const isUnread = wisdom && !wisdom.is_read;

    if (!hasProfile && !loading) return null;

    return (
        <div
            className="rounded-2xl p-5 transition-all duration-500 cursor-pointer"
            onClick={!wisdom ? undefined : markRead}
            style={{
                background: isUnread
                    ? `linear-gradient(135deg, rgba(253,251,247,0.95), rgba(255,255,255,0.95))`
                    : 'rgba(255,255,255,0.5)',
                border: `1px solid ${isUnread ? cfg.color : 'rgba(61,52,80,0.1)'}`,
                boxShadow: isUnread ? `0 0 30px ${cfg.glow}, 0 0 60px ${cfg.glow}40` : 'none',
                animation: isUnread ? 'pulse-border 2.5s ease-in-out infinite' : 'none',
            }}
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <span className="text-xl">{cfg.emoji}</span>
                    <div>
                        <span className="text-xs font-bold uppercase tracking-widest" style={{ color: cfg.color }}>
                            {cfg.label}
                        </span>
                        {isUnread && (
                            <span className="ml-2 text-xs px-1.5 py-0.5 rounded-full font-semibold animate-pulse"
                                style={{ background: `${cfg.color}25`, color: cfg.color }}>
                                New ✦
                            </span>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                    {wisdom && (
                        <Button variant="ghost" size="icon" className="h-7 w-7"
                            disabled={generating}
                            onClick={() => generate(true)}
                            style={{ color: 'rgba(105,95,128,0.5)' }}>
                            <RefreshCw className={`w-3 h-3 ${generating ? 'animate-spin' : ''}`} />
                        </Button>
                    )}
                    {wisdom && (
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={markRead}
                            style={{ color: 'rgba(105,95,128,0.6)' }}>
                            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </Button>
                    )}
                </div>
            </div>

            {/* Content */}
            {(loading || generating) ? (
                <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 shrink-0"
                        style={{ border: `2px solid ${cfg.color}30`, borderTopColor: cfg.color }} />
                    <p className="text-xs" style={{ color: 'rgba(105,95,128,0.6)' }}>
                        {generating ? "Channeling your cosmic wisdom..." : "Loading..."}
                    </p>
                </div>
            ) : error ? (
                <div className="flex items-center justify-between gap-3" onClick={e => e.stopPropagation()}>
                    <p className="text-xs" style={{ color: 'rgba(194,94,143,0.7)' }}>{error}</p>
                    <Button size="sm" onClick={() => generate(false)} className="h-7 text-xs rounded-lg shrink-0"
                        style={{ background: `${cfg.color}20`, color: cfg.color, border: `1px solid ${cfg.color}40` }}>
                        <RefreshCw className="w-3 h-3 mr-1" /> Retry
                    </Button>
                </div>
            ) : !hasProfile ? null : !wisdom ? (
                <div className="flex items-center justify-between" onClick={e => e.stopPropagation()}>
                    <p className="text-xs" style={{ color: 'rgba(105,95,128,0.6)' }}>No wisdom generated yet</p>
                    <Button size="sm" onClick={() => generate(false)} className="h-7 text-xs rounded-lg"
                        style={{ background: `${cfg.color}20`, color: cfg.color, border: `1px solid ${cfg.color}40` }}>
                        <Sparkles className="w-3 h-3 mr-1" /> Generate
                    </Button>
                </div>
            ) : (
                <div>
                    {wisdom.theme && (
                        <p className="text-sm font-semibold mb-2" style={{ color: 'rgba(61,52,80,0.9)', fontFamily: 'Space Grotesk, sans-serif' }}>
                            {wisdom.theme}
                        </p>
                    )}
                    {/* Preview line always visible */}
                    {!expanded && (
                        <p className="text-xs leading-relaxed line-clamp-2" style={{ color: 'rgba(105,95,128,0.75)' }}>
                            {wisdom.wisdom}
                        </p>
                    )}
                    {/* Full content when expanded */}
                    {expanded && (
                        <div className="space-y-3 mt-1">
                            <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: 'rgba(70,60,92,0.85)' }}>
                                {wisdom.wisdom}
                            </p>
                            {wisdom.contemplation && (
                                <div className="p-3 rounded-xl mt-2"
                                    style={{ background: `${cfg.color}0d`, border: `1px solid ${cfg.color}25` }}>
                                    <p className="text-xs font-semibold mb-1 uppercase tracking-widest" style={{ color: cfg.color }}>
                                        Contemplation
                                    </p>
                                    <p className="text-sm italic leading-relaxed" style={{ color: 'rgba(70,60,92,0.8)' }}>
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