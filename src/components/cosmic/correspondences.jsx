// Cross-system correspondence map
// Helps surface how different wisdom systems describe the same archetypes
import { ENNEAGRAM, enneagramOption } from "@/lib/wisdom/content/enneagram";

export const ZODIAC_SIGNS = [
    "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
    "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
];

export const HUMAN_DESIGN_TYPES = [
    "Manifestor", "Generator", "Manifesting Generator", "Projector", "Reflector"
];

export const HUMAN_DESIGN_AUTHORITIES = [
    "Emotional / Solar Plexus", "Sacral", "Splenic", "Ego / Heart",
    "G Center / Self", "Environment (Mental Projector)", "Lunar (Reflector)"
];

export const HUMAN_DESIGN_PROFILES = [
    "1/3 – Investigator / Martyr",
    "1/4 – Investigator / Opportunist",
    "2/4 – Hermit / Opportunist",
    "2/5 – Hermit / Heretic",
    "3/5 – Martyr / Heretic",
    "3/6 – Martyr / Role Model",
    "4/6 – Opportunist / Role Model",
    "4/1 – Opportunist / Investigator",
    "5/1 – Heretic / Investigator",
    "5/2 – Heretic / Hermit",
    "6/2 – Role Model / Hermit",
    "6/3 – Role Model / Martyr"
];

export const GENE_KEY_NUMBERS = Array.from({ length: 64 }, (_, i) => String(i + 1));

export const LIFE_PATH_NUMBERS = ["1","2","3","4","5","6","7","8","9","11","22","33"];

export const TAROT_MAJOR_ARCANA = [
    "0 – The Fool", "1 – The Magician", "2 – The High Priestess", "3 – The Empress",
    "4 – The Emperor", "5 – The Hierophant", "6 – The Lovers", "7 – The Chariot",
    "8 – Strength", "9 – The Hermit", "10 – Wheel of Fortune", "11 – Justice",
    "12 – The Hanged Man", "13 – Death", "14 – Temperance", "15 – The Devil",
    "16 – The Tower", "17 – The Star", "18 – The Moon", "19 – The Sun",
    "20 – Judgement", "21 – The World"
];

// Vibe Check's own theme names, not any Enneagram school's type names.
export const ENNEAGRAM_TYPES = Object.keys(ENNEAGRAM).map(enneagramOption);

export const ENNEAGRAM_WINGS = [
    "1w9", "1w2", "2w1", "2w3", "3w2", "3w4", "4w3", "4w5", "5w4",
    "5w6", "6w5", "6w7", "7w6", "7w8", "8w7", "8w9", "9w8", "9w1"
];

export const ENNEAGRAM_INSTINCTS = [
    "Self-Preservation (sp)",
    "Social (so)",
    "Sexual / One-to-One (sx)"
];

export const CHAKRA_CENTERS = [
    "Root (Muladhara) – Safety & grounding",
    "Sacral (Svadhisthana) – Creativity & pleasure",
    "Solar Plexus (Manipura) – Power & will",
    "Heart (Anahata) – Love & connection",
    "Throat (Vishuddha) – Expression & truth",
    "Third Eye (Ajna) – Intuition & insight",
    "Crown (Sahasrara) – Consciousness & unity"
];

// Qualitative cross-system mapping used by the correspondence surfaces
export const SYSTEM_CORRESPONDENCES = {
    astrology_human_design: `
Human Design places the 64 hexagrams of the I Ching around the zodiac wheel, so each gate sits at particular zodiac degrees, and it works out a chart from planetary positions, as astrology does. Beyond that shared wheel, the two systems describe people in their own ways.`,

    astrology_gene_keys: `
Gene Keys uses the same 64 hexagrams as Human Design, so each key also sits at particular zodiac degrees. Its Shadow, Gift and Siddhi are Gene Keys' own terms, with no direct astrological equivalent.`,

    astrology_numerology: `
Both work from your birth date: numerology reduces it to core numbers, and astrology maps the sky at that moment. Links between particular numbers and signs are modern associations, not rules of either system.`,

    astrology_tarot: `
In the Golden Dawn tradition, which many modern decks follow, each Major Arcana card is attributed to a sign, planet or element: The High Priestess to the Moon, The Empress to Venus, The Emperor to Aries, The Hierophant to Taurus, The Lovers to Gemini, and so on. Birth cards are worked out from your birth date by Mary K. Greer's method.`,

    human_design_gene_keys: `
Human Design and Gene Keys both use the 64 hexagrams of the I Ching. Human Design calls them gates, and Gene Keys calls them keys. Your Life's Work key has the same number as your Conscious Sun gate in Human Design.`,

    human_design_chakras: `
Human Design says its nine centers grew out of the seven chakras, and teachers pair them in different ways. Vibe Check pairs them by theme: Head with Crown, Ajna with Third Eye, Throat with Throat, the G center with Heart and Throat, the Heart (will) center with Solar Plexus, the emotional Solar Plexus center and the Sacral center with Sacral, and Root with Root. The Spleen center has no single match. This pairing is Vibe Check's own.`,

    numerology_tarot: `
Every Major Arcana card has a number, so numerology and tarot share number symbolism. Tarot birth cards, by Mary K. Greer's method, come from the same birth date as your Life Path, so the card's number, with The Fool counted as 22, reduces to the same single digit as your Life Path.`,

    gene_keys_chakras: `
Gene Keys groups the keys from your chart into sequences: the Activation Sequence (life's work, evolution, radiance and purpose), the Venus Sequence (relationships and emotional patterns) and the Pearl Sequence (work and prosperity). Vibe Check pairs the Activation Sequence with the lower chakras, for the body and health, the Venus Sequence with the heart, and the Pearl Sequence with the throat and crown, for work and expression. This pairing is Vibe Check's own association, not part of Gene Keys.`,

    enneagram_astrology: `
Both describe patterns in how people meet the world. Linking particular types to signs or planets is a modern association, not part of either system, so compare them as two lenses rather than as confirmation.`,

    enneagram_human_design: `
The Enneagram describes motivations, such as core fears and desires. Human Design describes how, in its view, your energy and decisions work. They come from different traditions, and you can compare what each offers without making them agree.`,

    enneagram_gene_keys: `
Both describe a movement from reactive patterns toward more freedom: the Enneagram from fixation toward essence, and Gene Keys from Shadow toward Gift. The systems don't reference each other, so any overlap you notice is yours to weigh.`
};