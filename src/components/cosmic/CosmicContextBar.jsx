import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import CosmicInsightBadge from "./CosmicInsightBadge";

const SYSTEM_SUMMARIES = {
    astrology: (d) => {
        const parts = [];
        if (d?.sun_sign) parts.push(`☀️ ${d.sun_sign} Sun`);
        if (d?.moon_sign) parts.push(`🌙 ${d.moon_sign} Moon`);
        if (d?.rising_sign) parts.push(`↑ ${d.rising_sign} Rising`);
        return parts.join(" · ") || null;
    },
    human_design: (d) => {
        const parts = [];
        if (d?.type) parts.push(d.type);
        if (d?.profile) parts.push(`Profile ${d.profile}`);
        if (d?.authority) parts.push(d.authority);
        return parts.join(" · ") || null;
    },
    gene_keys: (d) => {
        const parts = [];
        if (d?.life_work) parts.push(`Life's Work: Key ${d.life_work}`);
        if (d?.purpose) parts.push(`Purpose: Key ${d.purpose}`);
        return parts.join(" · ") || null;
    },
    numerology: (d) => {
        const parts = [];
        if (d?.life_path) parts.push(`Life Path ${d.life_path}`);
        if (d?.personal_year) parts.push(`Personal Year ${d.personal_year}`);
        return parts.join(" · ") || null;
    },
    tarot_archetype: (d) => {
        const parts = [];
        if (d?.birth_card) parts.push(`Birth: ${d.birth_card}`);
        if (d?.shadow_card) parts.push(`Shadow: ${d.shadow_card}`);
        return parts.join(" · ") || null;
    },
    chakras: (d) => {
        if (d?.dominant_center) return `Focus: ${d.dominant_center.split('–')[0].trim()}`;
        return null;
    },
};

export default function CosmicContextBar() {
    const [cosmicProfile, setCosmicProfile] = useState(null);
    const [expanded, setExpanded] = useState(false);

    useEffect(() => {
        base44.auth.me().then(user => {
            if (user?.cosmic_profile?.enabled_systems?.length > 0) {
                setCosmicProfile(user.cosmic_profile);
            }
        }).catch(() => {});
    }, []);

    if (!cosmicProfile) return null;

    const enabled = cosmicProfile.enabled_systems || [];
    const summaries = enabled
        .map(id => ({ id, text: SYSTEM_SUMMARIES[id]?.(cosmicProfile[id]) }))
        .filter(s => s.text);

    if (summaries.length === 0) return null;

    return (
        <Card className="border-0 shadow-sm mb-6"
            style={{ background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)', borderColor: '#c4b5fd' }}>
            <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4" style={{ color: '#7c3aed' }} />
                        <span className="text-sm font-semibold" style={{ color: '#5b21b6' }}>Your Cosmic Context</span>
                        <Badge className="text-xs bg-violet-100 text-violet-700">{enabled.length} system{enabled.length !== 1 ? 's' : ''} active</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                        <Link to={createPageUrl("CosmicAddons")}>
                            <Button variant="ghost" size="sm" className="text-xs h-7" style={{ color: '#7c3aed' }}>
                                Edit
                            </Button>
                        </Link>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setExpanded(e => !e)}>
                            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </Button>
                    </div>
                </div>
                <div className={`space-y-2 ${expanded ? '' : 'max-h-16 overflow-hidden'}`}>
                    {summaries.map(({ id, text }) => (
                        <div key={id} className="flex items-start gap-2">
                            <CosmicInsightBadge systemId={id} />
                            <span className="text-sm" style={{ color: '#4c1d95' }}>{text}</span>
                        </div>
                    ))}
                </div>
                {summaries.length > 2 && (
                    <button onClick={() => setExpanded(e => !e)}
                        className="text-xs mt-2 font-medium" style={{ color: '#7c3aed' }}>
                        {expanded ? 'Show less ↑' : `Show all ${summaries.length} systems ↓`}
                    </button>
                )}
            </CardContent>
        </Card>
    );
}