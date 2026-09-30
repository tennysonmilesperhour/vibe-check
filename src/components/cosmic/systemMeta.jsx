import { Sun, Hexagon, Dna, Hash, Star, Drama, CircleDot } from "lucide-react";

// One identity per wisdom system: label, lucide glyph, one-line description,
// and where the system comes from (shown with its Deep Dive report).
// Every cosmic surface (toggles, reports, badges, page copy) draws from here
// so the systems always look and read the same.
export const SYSTEMS = [
    {
        id: "astrology",
        label: "Astrology",
        Icon: Sun,
        description: "Planets, signs, houses and aspects in the tropical zodiac, as possibilities to explore through your own choices",
        origin: "Western astrology, using the tropical zodiac, which ties the signs to the seasons. Sidereal (Vedic) astrology places the signs about 24 degrees differently, so your sign there may differ. The readings are Vibe Check's own writing.",
    },
    {
        id: "human_design",
        label: "Human Design",
        Icon: Hexagon,
        description: "Type, authority, profile and strategy, offered as one way to think about decisions",
        origin: "Human Design was created by Ra Uru Hu in 1987, drawing on astrology, the I Ching, Kabbalah and the chakras. Vibe Check is not affiliated with Jovian Archive or any Human Design organization, and its texts are its own.",
    },
    {
        id: "gene_keys",
        label: "Gene Keys",
        Icon: Dna,
        description: "Shadow, gift and siddhi names for the keys in your chart, as prompts for contemplation",
        origin: "Gene Keys was created by Richard Rudd, building on Human Design. The Shadow, Gift and Siddhi names come from his work; the rest is Vibe Check's own writing. Vibe Check is not affiliated with Gene Keys.",
    },
    {
        id: "numerology",
        label: "Numerology",
        Icon: Hash,
        description: "Life Path, Expression and Soul Urge numbers from your name and birth date",
        origin: "Western numerology, often called Pythagorean, is a modern system that later writers linked to Pythagoras. The calculations follow common modern methods, and the texts are Vibe Check's own.",
    },
    {
        id: "tarot_archetype",
        label: "Tarot Archetype",
        Icon: Star,
        description: "Birth, soul and year cards from your birth date, as images to reflect with",
        origin: "Tarot began as a card game in fifteenth-century Italy and came into use for divination in the eighteenth century. Birth cards follow Mary K. Greer's method, and the card texts are Vibe Check's own.",
    },
    {
        id: "enneagram",
        label: "Enneagram",
        Icon: Drama,
        description: "Type, wing and instinct, as a map of motivations and fears to explore",
        origin: "The Enneagram of personality took shape with Oscar Ichazo and Claudio Naranjo in the 1960s and 1970s and has many schools today. Vibe Check is not affiliated with The Enneagram Institute or any Enneagram school, and its texts are its own.",
    },
    {
        id: "chakras",
        label: "Chakra System",
        Icon: CircleDot,
        description: "Seven centers from yogic tradition, with themes to reflect on",
        origin: "Chakras come from Hindu and Buddhist tantric traditions. The seven-center, rainbow-colored system common today is a twentieth-century Western adaptation. Vibe Check's texts are its own and make no health claims.",
    },
];

export const systemMeta = (id) => SYSTEMS.find((s) => s.id === id) || null;

// Soft tints derived from the palette tokens, for chips and quiet fills.
export const tint = (token, pct = 12) => `color-mix(in srgb, var(${token}) ${pct}%, transparent)`;
