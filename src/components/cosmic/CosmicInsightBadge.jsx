import React from "react";
import { Badge } from "@/components/ui/badge";

const SYSTEM_STYLES = {
    astrology: { emoji: "♈", label: "Astrology", color: "bg-indigo-100 text-indigo-700" },
    human_design: { emoji: "⬡", label: "Human Design", color: "bg-amber-100 text-amber-700" },
    gene_keys: { emoji: "🧬", label: "Gene Keys", color: "bg-emerald-100 text-emerald-700" },
    numerology: { emoji: "🔢", label: "Numerology", color: "bg-rose-100 text-rose-700" },
    tarot_archetype: { emoji: "🃏", label: "Tarot", color: "bg-rose-100 text-rose-700" },
    enneagram: { emoji: "🎭", label: "Enneagram", color: "bg-orange-100 text-orange-700" },
    chakras: { emoji: "🌀", label: "Chakras", color: "bg-teal-100 text-teal-700" },
};

export default function CosmicInsightBadge({ systemId }) {
    const style = SYSTEM_STYLES[systemId];
    if (!style) return null;
    return (
        <Badge className={`text-xs gap-1 ${style.color}`}>
            <span>{style.emoji}</span>
            {style.label}
        </Badge>
    );
}