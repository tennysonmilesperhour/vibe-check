import React from "react";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

const SYSTEMS = [
    {
        id: "astrology",
        label: "Astrology",
        emoji: "♈",
        description: "Sun, Moon & Rising signs, North Node — planetary cycles and archetypes",
        color: "bg-indigo-50 border-indigo-200",
        badgeColor: "bg-indigo-100 text-indigo-700"
    },
    {
        id: "human_design",
        label: "Human Design",
        emoji: "⬡",
        description: "Type, Authority, Profile & Strategy — your energetic blueprint for decisions",
        color: "bg-amber-50 border-amber-200",
        badgeColor: "bg-amber-100 text-amber-700"
    },
    {
        id: "gene_keys",
        label: "Gene Keys",
        emoji: "🧬",
        description: "Your Hologenetic Profile — shadow, gift and siddhi layers of consciousness",
        color: "bg-emerald-50 border-emerald-200",
        badgeColor: "bg-emerald-100 text-emerald-700"
    },
    {
        id: "numerology",
        label: "Numerology",
        emoji: "🔢",
        description: "Life Path, Expression & Soul Urge numbers — vibrational patterns in your name and birth date",
        color: "bg-purple-50 border-purple-200",
        badgeColor: "bg-purple-100 text-purple-700"
    },
    {
        id: "tarot_archetype",
        label: "Tarot Archetype",
        emoji: "🃏",
        description: "Birth Card and Shadow Card — the Major Arcana archetypes that shape your journey",
        color: "bg-rose-50 border-rose-200",
        badgeColor: "bg-rose-100 text-rose-700"
    },
    {
        id: "chakras",
        label: "Chakra System",
        emoji: "🌀",
        description: "Dominant energy center and areas of focus — where life force flows and stagnates",
        color: "bg-teal-50 border-teal-200",
        badgeColor: "bg-teal-100 text-teal-700"
    }
];

export { SYSTEMS };

export default function SystemToggle({ enabledSystems, onToggle }) {
    return (
        <div className="space-y-3">
            {SYSTEMS.map((system) => {
                const isEnabled = enabledSystems.includes(system.id);
                return (
                    <div key={system.id}
                         className={`flex items-center justify-between p-4 rounded-xl border transition-all ${isEnabled ? system.color : 'bg-white/40 border-gray-100'}`}>
                        <div className="flex items-start gap-3 flex-1">
                            <span className="text-2xl mt-0.5">{system.emoji}</span>
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="font-semibold text-sm" style={{color: 'var(--warm-gray-800)'}}>{system.label}</span>
                                    {isEnabled && <Badge className={`text-xs ${system.badgeColor}`}>Active</Badge>}
                                </div>
                                <p className="text-xs" style={{color: 'var(--warm-gray-500)'}}>{system.description}</p>
                            </div>
                        </div>
                        <Switch checked={isEnabled} onCheckedChange={() => onToggle(system.id)} />
                    </div>
                );
            })}
        </div>
    );
}