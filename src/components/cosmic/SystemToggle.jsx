import React from "react";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

const SYSTEMS = [
    {
        id: "astrology",
        label: "Astrology",
        emoji: "♈",
        description: "Sun, Moon & Rising signs, North Node — planetary cycles and archetypes",
        activeColor: '#818cf8',
        activeBg: 'rgba(129,140,248,0.1)',
        activeBorder: 'rgba(129,140,248,0.3)',
    },
    {
        id: "human_design",
        label: "Human Design",
        emoji: "⬡",
        description: "Type, Authority, Profile & Strategy — your energetic blueprint for decisions",
        activeColor: '#fbbf24',
        activeBg: 'rgba(251,191,36,0.1)',
        activeBorder: 'rgba(251,191,36,0.3)',
    },
    {
        id: "gene_keys",
        label: "Gene Keys",
        emoji: "🧬",
        description: "Your Hologenetic Profile — shadow, gift and siddhi layers of consciousness",
        activeColor: '#2dd4bf',
        activeBg: 'rgba(45,212,191,0.1)',
        activeBorder: 'rgba(45,212,191,0.3)',
    },
    {
        id: "numerology",
        label: "Numerology",
        emoji: "🔢",
        description: "Life Path, Expression & Soul Urge numbers — vibrational patterns in your name and birth date",
        activeColor: '#c084fc',
        activeBg: 'rgba(192,132,252,0.1)',
        activeBorder: 'rgba(192,132,252,0.3)',
    },
    {
        id: "tarot_archetype",
        label: "Tarot Archetype",
        emoji: "🃏",
        description: "Birth Card and Shadow Card — the Major Arcana archetypes that shape your journey",
        activeColor: '#f472b6',
        activeBg: 'rgba(244,114,182,0.1)',
        activeBorder: 'rgba(244,114,182,0.3)',
    },
    {
        id: "enneagram",
        label: "Enneagram",
        emoji: "🎭",
        description: "Type, Wing & Instinct — your core motivations, fears and path of growth",
        activeColor: '#fb923c',
        activeBg: 'rgba(251,146,60,0.1)',
        activeBorder: 'rgba(251,146,60,0.3)',
    },
    {
        id: "chakras",
        label: "Chakra System",
        emoji: "🌀",
        description: "Dominant energy center and areas of focus — where life force flows and stagnates",
        activeColor: '#38bdf8',
        activeBg: 'rgba(56,189,248,0.1)',
        activeBorder: 'rgba(56,189,248,0.3)',
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
                        className="flex items-center justify-between p-4 rounded-xl transition-all duration-200 cursor-pointer"
                        style={{
                            background: isEnabled ? system.activeBg : 'rgba(255,255,255,0.03)',
                            border: `1px solid ${isEnabled ? system.activeBorder : 'rgba(255,255,255,0.08)'}`,
                        }}
                        onClick={() => onToggle(system.id)}>
                        <div className="flex items-start gap-3 flex-1">
                            <span className="text-2xl mt-0.5">{system.emoji}</span>
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="font-semibold text-sm" style={{ color: isEnabled ? system.activeColor : 'rgba(210,200,235,0.8)' }}>
                                        {system.label}
                                    </span>
                                    {isEnabled && (
                                        <Badge className="text-xs" style={{ background: system.activeBg, color: system.activeColor, border: `1px solid ${system.activeBorder}` }}>
                                            Active
                                        </Badge>
                                    )}
                                </div>
                                <p className="text-xs" style={{ color: 'rgba(160,150,190,0.55)' }}>{system.description}</p>
                            </div>
                        </div>
                        <Switch checked={isEnabled} onCheckedChange={() => onToggle(system.id)} onClick={e => e.stopPropagation()} />
                    </div>
                );
            })}
        </div>
    );
}