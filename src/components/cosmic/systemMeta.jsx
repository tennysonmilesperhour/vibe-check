import { Sun, Hexagon, Dna, Hash, Star, Drama, CircleDot } from "lucide-react";

// One identity per wisdom system: label, lucide glyph, one-line description.
// Every cosmic surface (toggles, reports, badges, page copy) draws from here
// so the systems always look and read the same.
export const SYSTEMS = [
    {
        id: "astrology",
        label: "Astrology",
        Icon: Sun,
        description: "Sun, Moon & Rising signs, North Node — planetary cycles and archetypes",
    },
    {
        id: "human_design",
        label: "Human Design",
        Icon: Hexagon,
        description: "Type, Authority, Profile & Strategy — your energetic blueprint for decisions",
    },
    {
        id: "gene_keys",
        label: "Gene Keys",
        Icon: Dna,
        description: "Your Hologenetic Profile — shadow, gift and siddhi layers of consciousness",
    },
    {
        id: "numerology",
        label: "Numerology",
        Icon: Hash,
        description: "Life Path, Expression & Soul Urge numbers — vibrational patterns in your name and birth date",
    },
    {
        id: "tarot_archetype",
        label: "Tarot Archetype",
        Icon: Star,
        description: "Birth Card and Shadow Card — the Major Arcana archetypes that shape your journey",
    },
    {
        id: "enneagram",
        label: "Enneagram",
        Icon: Drama,
        description: "Type, Wing & Instinct — your core motivations, fears and path of growth",
    },
    {
        id: "chakras",
        label: "Chakra System",
        Icon: CircleDot,
        description: "Dominant energy center and areas of focus — where life force flows and stagnates",
    },
];

export const systemMeta = (id) => SYSTEMS.find((s) => s.id === id) || null;

// Soft tints derived from the palette tokens, for chips and quiet fills.
export const tint = (token, pct = 12) => `color-mix(in srgb, var(${token}) ${pct}%, transparent)`;
