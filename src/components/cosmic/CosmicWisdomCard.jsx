import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { periodWisdom } from "@/lib/wisdom/readings";
import { ChevronDown, ChevronUp } from "lucide-react";
import { getPeriodKey, todayKey } from "@/lib/dates";
import { resonanceGraph } from "@/lib/resonance/graph";
import { createPageUrl } from "@/utils";
import { tint } from "./systemMeta";

// Read receipts live client-side now that wisdom is composed locally.
const readKey = (periodType, periodKey) => `cosmic_wisdom_read:${periodType}:${periodKey}`;
const isReadLocal = (periodType, periodKey) => {
    try { return localStorage.getItem(readKey(periodType, periodKey)) === "1"; } catch { return false; }
};
const composeWisdom = (profile, periodType) => {
    const graph = (() => { try { return resonanceGraph(profile || {}, todayKey()); } catch { return null; } })();
    return periodWisdom(periodType, profile || {}, graph);
};

const PERIOD_LABEL = {
    daily: "Today's wisdom",
    weekly: "This week",
    monthly: "This month",
    yearly: "This year",
};

export default function CosmicWisdomCard({ periodType = "daily" }) {
    const label = PERIOD_LABEL[periodType] || PERIOD_LABEL.daily;
    const [wisdom, setWisdom] = useState(null);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState(false);
    const [hasProfile, setHasProfile] = useState(false);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            setLoading(true);
            try {
                const user = await base44.auth.me();
                const profile = user?.cosmic_profile || {};
                if (cancelled) return;
                if ((profile.enabled_systems || []).length === 0) { setLoading(false); return; }
                setHasProfile(true);
                const w = composeWisdom(profile, periodType);
                setWisdom({ ...w, is_read: isReadLocal(periodType, getPeriodKey(periodType)) });
            } catch {
                // unauthenticated mount: the gate handles it
            }
            if (!cancelled) setLoading(false);
        })();
        return () => { cancelled = true; };
    }, [periodType]);

    const markRead = () => {
        if (wisdom && !wisdom.is_read) {
            try { localStorage.setItem(readKey(periodType, getPeriodKey(periodType)), "1"); } catch { /* best-effort */ }
            setWisdom(prev => ({ ...prev, is_read: true }));
        }
        setExpanded(e => !e);
    };

    const isUnread = wisdom && !wisdom.is_read;

    if (loading) {
        return <div className="p-5" style={{ background: "var(--gh-cream)", border: "1px solid hsl(var(--border))", borderRadius: "var(--radius)", boxShadow: "var(--shadow-soft)" }} aria-busy="true" />;
    }

    // The inviting blank state: no systems woven yet.
    if (!hasProfile) {
        return (
            <div className="p-5" style={{ background: "var(--gh-cream)", border: "1px solid hsl(var(--border))", borderRadius: "var(--radius)", boxShadow: "var(--shadow-soft)" }}>
                <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--gh-ink-muted)" }}>{label}</p>
                <p className="font-display text-xl mt-2" style={{ color: "var(--gh-ink)" }}>
                    Weave your cosmos to receive daily wisdom
                </p>
                <p className="text-sm mt-1" style={{ color: "var(--gh-ink-soft)" }}>
                    Add your birth date and the systems you work with; your reflections will use the details you provide.
                </p>
                <Link to={createPageUrl("CosmicAddons")} className="ink-button inline-block text-sm mt-4">
                    Weave your cosmos
                </Link>
            </div>
        );
    }

    if (!wisdom) return null;

    return (
        <div
            className="p-5 transition-colors duration-300"
            style={{
                background: isUnread ? tint("--gh-gold", 10) : "var(--gh-cream)",
                border: isUnread ? "1px solid var(--gh-gold)" : "1px solid hsl(var(--border))",
            }}
        >
            <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--gh-ink-muted)" }}>
                    {label}
                    {isUnread && (
                        <span className="ml-2 px-1.5 py-0.5 text-xs font-semibold normal-case tracking-normal rounded-sm"
                            style={{ background: tint("--gh-gold", 25), color: "var(--gh-ink-soft)" }}>
                            new
                        </span>
                    )}
                </p>
                <button type="button" onClick={(e) => { e.stopPropagation(); markRead(); }}
                    aria-expanded={expanded} aria-label={expanded ? "Collapse wisdom" : "Expand wisdom"}
                    style={{ color: "var(--gh-ink-muted)" }}>
                    {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
            </div>

            {wisdom.theme && (
                <p className="font-display text-xl mb-1" style={{ color: "var(--gh-ink)" }}>
                    {wisdom.theme}
                </p>
            )}
            {!expanded ? (
                <p className="text-sm leading-relaxed line-clamp-2" style={{ color: "var(--gh-ink-soft)" }}>
                    {wisdom.wisdom}
                </p>
            ) : (
                <div className="space-y-3">
                    <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: "var(--gh-ink-soft)" }}>
                        {wisdom.wisdom}
                    </p>
                    {wisdom.basis && <p className="text-xs" style={{ color: "var(--gh-ink-muted)" }}>{wisdom.basis}</p>}
                    {wisdom.contemplation && (
                        <div className="p-3" style={{ background: tint("--gh-gold", 12), borderLeft: "2px solid var(--gh-gold)" }}>
                            <p className="text-xs font-semibold mb-1 uppercase tracking-widest" style={{ color: "var(--gh-ink-muted)" }}>
                                Contemplation
                            </p>
                            <p className="text-sm leading-relaxed" style={{ color: "var(--gh-ink-soft)" }}>
                                {wisdom.contemplation}
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
