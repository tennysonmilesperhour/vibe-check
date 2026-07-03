import React from "react";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

const SYSTEMS = [
    {
        id: "astrology",
        label: "Astrology",
        emoji: "♈",
        description: "Sun, Moon & Rising signs, North Node — planetary cycles and archetypes",
        activeColor: '#7E85C8',
        activeBg: 'rgba(126,133,200,0.1)',
        activeBorder: 'rgba(126,133,200,0.3)',
    },
    {
        id: "human_design",
        label: "Human Design",
        emoji: "⬡",
        description: "Type, Authority, Profile & Strategy — your energetic blueprint for decisions",
        activeColor: '#B8902F',
        activeBg: 'rgba(184,144,47,0.1)',
        activeBorder: 'rgba(184,144,47,0.3)',
    },
    {
        id: "gene_keys",
        label: "Gene Keys",
        emoji: "🧬",
        description: "Your Hologenetic Profile — shadow, gift and siddhi layers of consciousness",
        activeColor: '#C9834B',
        activeBg: 'rgba(201,131,75,0.1)',
        activeBorder: 'rgba(201,131,75,0.3)',
    },
    {
        id: "numerology",
        label: "Numerology",
        emoji: "🔢",
        description: "Life Path, Expression & Soul Urge numbers — vibrational patterns in your name and birth date",
        activeColor: '#C2503C',
        activeBg: 'rgba(194,80,60,0.1)',
        activeBorder: 'rgba(194,80,60,0.3)',
    },
    {
        id: "tarot_archetype",
        label: "Tarot Archetype",
        emoji: "🃏",
        description: "Birth Card and Shadow Card — the Major Arcana archetypes that shape your journey",
        activeColor: '#D95C50',
        activeBg: 'rgba(217,92,80,0.1)',
        activeBorder: 'rgba(217,92,80,0.3)',
    },
    {
        id: "enneagram",
        label: "Enneagram",
        emoji: "🎭",
        description: "Type, Wing & Instinct — your core motivations, fears and path of growth",
        activeColor: '#C07A3E',
        activeBg: 'rgba(192,122,62,0.1)',
        activeBorder: 'rgba(192,122,62,0.3)',
    },
    {
        id: "chakras",
        label: "Chakra System",
        emoji: "🌀",
        description: "Dominant energy center and areas of focus — where life force flows and stagnates",
        activeColor: '#F2952E',
        activeBg: 'rgba(242,149,46,0.1)',
        activeBorder: 'rgba(242,149,46,0.3)',
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
                            background: isEnabled ? system.activeBg : 'rgba(255,255,255,0.5)',
                            border: `1px solid ${isEnabled ? system.activeBorder : 'rgba(61,52,80,0.1)'}`,
                        }}
                        onClick={() => onToggle(system.id)}>
                        <div className="flex items-start gap-3 flex-1">
                            <span className="text-2xl mt-0.5">{system.emoji}</span>
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="font-semibold text-sm" style={{ color: isEnabled ? system.activeColor : 'rgba(70,60,92,0.8)' }}>
                                        {system.label}
                                    </span>
                                    {isEnabled && (
                                        <Badge className="text-xs" style={{ background: system.activeBg, color: system.activeColor, border: `1px solid ${system.activeBorder}` }}>
                                            Active
                                        </Badge>
                                    )}
                                </div>
                                <p className="text-xs" style={{ color: 'rgba(122,112,144,0.65)' }}>{system.description}</p>
                            </div>
                        </div>
                        <Switch checked={isEnabled} onCheckedChange={() => onToggle(system.id)} onClick={e => e.stopPropagation()} />
                    </div>
                );
            })}
        </div>
    );
}