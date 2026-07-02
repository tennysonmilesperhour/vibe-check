// Cross-system correspondence map
// Helps surface how different wisdom systems describe the same archetypes

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

export const ENNEAGRAM_TYPES = [
    "1 – The Reformer",
    "2 – The Helper",
    "3 – The Achiever",
    "4 – The Individualist",
    "5 – The Investigator",
    "6 – The Loyalist",
    "7 – The Enthusiast",
    "8 – The Challenger",
    "9 – The Peacemaker"
];

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

// Qualitative cross-system mapping for AI context enrichment
export const SYSTEM_CORRESPONDENCES = {
    astrology_human_design: `
Astrology and Human Design share roots: HD uses the I Ching's 64 hexagrams mapped to the zodiac wheel and planetary gates. Sun sign themes often resonate with one's Incarnation Cross. Moon sign qualities tend to mirror emotional authority patterns.`,

    astrology_gene_keys: `
Gene Keys are derived from the same 64 hexagrams as Human Design, which in turn map to zodiac degrees. Each Gene Key has a Shadow (unconscious pattern), Gift (awakened expression), and Siddhi (highest potential) — mirroring astrology's concept of a planet in detriment, dignity, and exaltation.`,

    astrology_numerology: `
Both systems decode patterns in birth data. Numerology reduces the birth date to core numbers while astrology maps planetary positions at that moment. Life Path 1 often correlates with Aries/Leo sun themes; Life Path 2 with Libra/Cancer; Life Path 7 with Pisces/Scorpio.`,

    astrology_tarot: `
The Major Arcana map directly to astrology: The Fool = Uranus/Aquarius, The High Priestess = Moon, The Empress = Venus, The Emperor = Aries, The Hierophant = Taurus, The Lovers = Gemini, etc. Birth cards connect to your numerological soul archetype.`,

    human_design_gene_keys: `
Human Design and Gene Keys both use the 64 hexagrams of the I Ching. In HD they are called Gates; in Gene Keys they are called the 64 Keys. Your Life's Work Gene Key is the same as your Conscious Sun Gate in HD — the most visible aspect of your design.`,

    human_design_chakras: `
Human Design's 9 Centers correspond directly to the chakra system: Root Center = Root Chakra, Sacral Center = Sacral Chakra, Solar Plexus Center = Solar Plexus Chakra, Heart Center = Heart Chakra, G Center = integrates Heart/Throat, Throat Center = Throat Chakra, Ajna = Third Eye, Head = Crown.`,

    numerology_tarot: `
Numerology and Tarot are deeply linked. Your Life Path number corresponds to a Major Arcana card (1 = Magician, 2 = High Priestess, etc., with master numbers 11 = Justice, 22 = The Fool). The birth card in Tarot is calculated similarly to the Life Path number.`,

    gene_keys_chakras: `
The 64 Gene Keys are organized into biological sequences that correlate with the body's energy centers. The Activation Sequence maps to physical wellbeing (lower chakras), the Venus Sequence to emotional intelligence (heart center), and the Pearl Sequence to vocation and prosperity (higher expression).`,

    enneagram_astrology: `
Both systems describe core archetypal drives. The Enneagram's nine types echo planetary signatures: Type 1's inner critic mirrors Saturn/Virgo precision, Type 2 resonates with Venus/Cancer nurturing, Type 4 with Neptune/Pisces depth, Type 8 with Mars/Scorpio intensity. Your Sun and Moon signs often color how your Enneagram type expresses and defends itself.`,

    enneagram_human_design: `
The Enneagram maps psychological motivation (core fear and desire) while Human Design maps energetic mechanics (how your energy is built to operate). A Projector Type 3 achieves differently than a Generator Type 3. Your HD Authority shows how to make decisions; your Enneagram type shows the patterns that hijack them — together they reveal both the vehicle and the driver.`,

    enneagram_gene_keys: `
The Enneagram's growth path — from fixation toward essence — parallels the Gene Keys' journey from Shadow through Gift to Siddhi. Your type's core passion (e.g. Type 1's resentment, Type 9's sloth) often names the same pattern as a prominent Shadow in your hologenetic profile, offering two languages for the same inner work.`
};