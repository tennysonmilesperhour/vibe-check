// 78-card Rider-Waite-inspired deck data
// Card art is original SVG symbolic design

export const MAJOR_ARCANA = [
  { id: 0,  name: "The Fool",           roman: "0",    geoType: "open-spiral",           color: "#fbbf24", shadow: "#f59e0b", keywords: ["new beginnings","spontaneity","leap of faith"], meaning: "A new beginning. Where could you step forward with curiosity, and what would help you feel ready? You choose whether and when to leap.", reversed: "A leap taken too fast, or one you are unsure about. It is fine to look first." },
  { id: 1,  name: "The Magician",       roman: "I",    geoType: "caduceus",              color: "#f472b6", shadow: "#db2777", keywords: ["willpower","skill","manifestation"], meaning: "What skills and resources do you already have for this? You might focus them on one intention today.", reversed: "Scattered effort, a plan that needs more thought, or talents waiting for their moment. It can also point to someone else's tricks; your own read of the situation counts." },
  { id: 2,  name: "The High Priestess", roman: "II",   geoType: "crescent-pillars",      color: "#F5A25E", shadow: "#C99A3F", keywords: ["intuition","mystery","inner knowing"], meaning: "A quieter kind of knowing. What do you sense about this, alongside what you know? Both are worth listening to.", reversed: "Feeling cut off from your own sense of things, or something kept hidden. What would help you hear yourself?" },
  { id: 3,  name: "The Empress",        roman: "III",  geoType: "venus-spiral",          color: "#4ade80", shadow: "#16a34a", keywords: ["abundance","fertility","nurturing"], meaning: "Care, creativity and pleasure. Where could you let something grow, or let yourself be cared for?", reversed: "Creativity feeling stuck, or care that has become too much, given or received. What would feel nourishing?" },
  { id: 4,  name: "The Emperor",        roman: "IV",   geoType: "triangle-square",       color: "#f97316", shadow: "#ea580c", keywords: ["authority","structure","stability"], meaning: "Structure and steadiness. What foundation would help you right now, and who holds authority in this situation?", reversed: "Rigidity, or power used over others. If someone is using power over you, that is theirs to answer for." },
  { id: 5,  name: "The Hierophant",     roman: "V",    geoType: "papal-cross",           color: "#F7B98F", shadow: "#D96A45", keywords: ["tradition","wisdom","spiritual guidance"], meaning: "Tradition, teachers and shared wisdom. Is there a path or a person whose guidance you trust here?", reversed: "Questioning convention, or finding your own way. Your own beliefs can guide you too." },
  { id: 6,  name: "The Lovers",         roman: "VI",   geoType: "vesica",                color: "#f43f5e", shadow: "#be123c", keywords: ["love","choice","alignment"], meaning: "Love, connection and choice. What do your values say about the choice in front of you?", reversed: "Values out of step, or a connection that feels off balance. How you are treated matters more than any card." },
  { id: 7,  name: "The Chariot",        roman: "VII",  geoType: "cube-motion",           color: "#38bdf8", shadow: "#0369a1", keywords: ["willpower","victory","control"], meaning: "Direction and determination. What are you moving toward, and what pace works for you?", reversed: "Feeling pulled in several directions, or unsure where you are heading. What would help you find your footing?" },
  { id: 8,  name: "Strength",           roman: "VIII", geoType: "lemniscate",            color: "#fbbf24", shadow: "#d97706", keywords: ["courage","compassion","inner strength"], meaning: "Strength can be gentle. Where could courage and compassion, including for yourself, help today?", reversed: "Doubting your own strength. Strong feelings can be a fair response to what is happening, and asking for support takes strength too." },
  { id: 9,  name: "The Hermit",         roman: "IX",   geoType: "lantern",               color: "#a3a3a3", shadow: "#525252", keywords: ["solitude","inner guidance","wisdom"], meaning: "Time alone to reflect. What might you notice in some quiet?", reversed: "Solitude that has turned lonely. Is there someone you would like to reach out to?" },
  { id: 10, name: "Wheel of Fortune",   roman: "X",    geoType: "spoked-wheel",          color: "#FDC94E", shadow: "#D96A45", keywords: ["cycles","change","turning point"], meaning: "Things change. What is shifting around you, and what is yours to steer?", reversed: "Change that feels unwelcome, or a pattern that keeps repeating. Not every turn is yours to cause or to carry." },
  { id: 11, name: "Justice",            roman: "XI",   geoType: "scales",                color: "#38bdf8", shadow: "#0284c7", keywords: ["fairness","truth","accountability"], meaning: "Clarity, honesty, and fairness. What would a fair outcome look like here, for you as well as for others?", reversed: "Something unfair, or accountability that is missing. It may be someone else's to own." },
  { id: 12, name: "The Hanged Man",     roman: "XII",  geoType: "triangle-down-suspended", color: "#2dd4bf", shadow: "#0d9488", keywords: ["pause","new perspective","letting go"], meaning: "A pause, and a different angle. Could you see this from another side? Pausing is not the same as giving up what you need.", reversed: "Feeling stuck, or giving more than you can afford. A pause you choose is different from being held in place." },
  { id: 13, name: "Death",              roman: "XIII", geoType: "scythe",                color: "#6b7280", shadow: "#374151", keywords: ["transformation","endings","rebirth"], meaning: "Endings and change. Is something ending, or ready to? Endings can be hard, and there is no rush to feel any particular way about them.", reversed: "Holding on to something that is ending. That can take time, and grief is part of it." },
  { id: 14, name: "Temperance",         roman: "XIV",  geoType: "flow-triangles",        color: "#34d399", shadow: "#059669", keywords: ["balance","patience","moderation"], meaning: "Balance and patience. Where could a little moderation, or a slower pace, help?", reversed: "Things feeling out of balance. What small change would help you feel steadier?" },
  { id: 15, name: "The Devil",          roman: "XV",   geoType: "inverted-pentagram",    color: "#dc2626", shadow: "#991b1b", keywords: ["shadow self","bondage","materialism"], meaning: "What feels binding right now? Some ties are habits you could loosen; others are held in place by someone else, and seeing that clearly is not your failure.", reversed: "Loosening a tie that has held you, or getting free of a habit. Support can help with either." },
  { id: 16, name: "The Tower",          roman: "XVI",  geoType: "tower-lightning",       color: "#f97316", shadow: "#c2410c", keywords: ["sudden change","upheaval","revelation"], meaning: "Sudden change or upheaval. What do you need to feel safer while things shift? Upheaval is hard, whatever comes after it.", reversed: "Change you can see coming, or fear of it. Fear can be a sensible signal; what would help you feel safer?" },
  { id: 17, name: "The Star",           roman: "XVII", geoType: "star-8",                color: "#F5A25E", shadow: "#C99A3F", keywords: ["hope","renewal","inspiration"], meaning: "Hope and renewal. Where do you find a little hope right now, even a small amount?", reversed: "Hope feeling far away, which is understandable after hard times. Who or what helps on days like this?" },
  { id: 18, name: "The Moon",           roman: "XVIII",geoType: "moon-full",             color: "#FDC94E", shadow: "#C2503C", keywords: ["illusion","intuition","the unconscious"], meaning: "Uncertainty, dreams and intuition. What feels unclear right now, and what would help you see it better?", reversed: "Something unclear starting to make more sense, or a fear you can look at more closely." },
  { id: 19, name: "The Sun",            roman: "XIX",  geoType: "sun-rays",              color: "#fbbf24", shadow: "#d97706", keywords: ["joy","success","vitality"], meaning: "Joy, warmth and vitality. What brings you a little joy right now?", reversed: "Joy that feels out of reach today. Sadness is allowed to be here too." },
  { id: 20, name: "Judgement",          roman: "XX",   geoType: "trumpet",               color: "#60a5fa", shadow: "#2563eb", keywords: ["awakening","reckoning","calling"], meaning: "A moment of reckoning and renewal. What are you ready to hear in yourself? Forgiving is yours to decide; it is never required.", reversed: "Judging yourself harshly, or a calling you are unsure about. You can go gently." },
  { id: 21, name: "The World",          roman: "XXI",  geoType: "ouroboros",             color: "#4ade80", shadow: "#16a34a", keywords: ["completion","wholeness","integration"], meaning: "Completion. What have you finished or come through, and how would you like to mark it?", reversed: "Something unfinished, or closure that hasn't come. Some things close slowly, and some don't close at all." },
];

const SUITS = [
  { name: "Wands",    geoType: "flame-wand",     color: "#f97316", element: "Fire",  domain: "passion, creativity, ambition", area: "drive and creativity" },
  { name: "Cups",     geoType: "chalice",         color: "#38bdf8", element: "Water", domain: "emotions, relationships, intuition", area: "feelings and connection" },
  { name: "Swords",   geoType: "crossed-swords",  color: "#F5A25E", element: "Air",   domain: "intellect, truth, conflict", area: "thinking and speaking up" },
  { name: "Pentacles",geoType: "pentagram",        color: "#4ade80", element: "Earth", domain: "material, career, abundance", area: "work and money" },
];

const COURT_MEANINGS = {
  Page:   { keywords: ["student","curiosity","new energy"],    meaning: "Youthful, curious energy enters — a student of this element's gifts." },
  Knight: { keywords: ["action","pursuit","adventure"],        meaning: "Bold, driven movement. Pursue your vision with committed momentum." },
  Queen:  { keywords: ["mastery","nurturing","embodiment"],    meaning: "Mature, embodied wisdom. Lead with the full mastery of this element." },
  King:   { keywords: ["authority","command","vision"],        meaning: "Sovereign command of this domain. Take your seat of authority wisely." },
};

const PIP_MEANINGS = {
  Ace:   { keywords: ["pure potential","seed","gift"],         meaning: "A seed of something new in this area of life." },
  Two:   { keywords: ["balance","choice","partnership"],       meaning: "A moment of balance, union, or choice between two paths." },
  Three: { keywords: ["growth","collaboration","expansion"],   meaning: "Initial vision expands through creativity and collaboration." },
  Four:  { keywords: ["stability","rest","consolidation"],     meaning: "A pause to consolidate gains. Rest, stability, and foundation." },
  Five:  { keywords: ["conflict","challenge","change"],        meaning: "Tension, conflict, or loss. Conflict doesn't have to mean growth; it can simply be hard." },
  Six:   { keywords: ["harmony","success","forward motion"],   meaning: "A step toward steadier ground. Notice what has helped." },
  Seven: { keywords: ["strategy","perseverance","vision"],     meaning: "Hold your ground with strategic clarity and unwavering vision." },
  Eight: { keywords: ["movement","speed","mastery"],           meaning: "Rapid movement and focused mastery accelerate your path." },
  Nine:  { keywords: ["resilience","completion","wisdom"],     meaning: "Near the end of a cycle — draw on all you've learned with resilience." },
  Ten:   { keywords: ["completion","fulfillment","burden"],    meaning: "An ending, or a load carried to its limit. What would help you set some of it down?" },
};

const NUM_NAMES = ["Ace","Two","Three","Four","Five","Six","Seven","Eight","Nine","Ten"];
const COURT_NAMES = ["Page","Knight","Queen","King"];

function buildMinorArcana() {
  const cards = [];
  let id = 22;
  SUITS.forEach(suit => {
    NUM_NAMES.forEach(num => {
      const pip = PIP_MEANINGS[num];
      cards.push({
        id: id++,
        name: `${num} of ${suit.name}`,
        roman: num,
        geoType: suit.geoType,
        color: suit.color,
        shadow: suit.color,
        keywords: [`${suit.domain.split(",")[0].trim()}`, ...pip.keywords.slice(0,2)],
        meaning: `${pip.meaning} In the realm of ${suit.element} (${suit.domain}).`,
        reversed: `It can point to ${suit.area} feeling harder than usual. What would help right now?`,
        suit: suit.name,
      });
    });
    COURT_NAMES.forEach(court => {
      const c = COURT_MEANINGS[court];
      cards.push({
        id: id++,
        name: `${court} of ${suit.name}`,
        roman: court,
        geoType: suit.geoType,
        color: suit.color,
        shadow: suit.color,
        keywords: [...c.keywords.slice(0,2), suit.domain.split(",")[0].trim()],
        meaning: `${c.meaning} Element: ${suit.element} — ${suit.domain}.`,
        reversed: `The ${court.toLowerCase()}'s qualities may feel out of reach or overdone, around ${suit.area}.`,
        suit: suit.name,
      });
    });
  });
  return cards;
}

export const MINOR_ARCANA = buildMinorArcana();
export const FULL_DECK = [...MAJOR_ARCANA, ...MINOR_ARCANA];

export const SPREADS = [
  {
    id: "single",
    name: "Daily Draw",
    description: "One card to reflect on today",
    positions: [
      { label: "Your Message", x: 50, y: 50 },
    ],
  },
  {
    id: "three",
    name: "Past · Present · What may come",
    description: "The river of time across three cards",
    positions: [
      { label: "Past",    x: 20, y: 50 },
      { label: "Present", x: 50, y: 50 },
      { label: "What may come",  x: 80, y: 50 },
    ],
  },
  {
    id: "five",
    name: "Five-Card Cross",
    description: "Situation, challenge, foundation, advice, where this could lead",
    positions: [
      { label: "Situation",  x: 50, y: 50 },
      { label: "Challenge",  x: 50, y: 15 },
      { label: "Foundation", x: 50, y: 85 },
      { label: "Advice",     x: 20, y: 50 },
      { label: "Where this could lead",    x: 80, y: 50 },
    ],
  },
  {
    id: "horseshoe",
    name: "Horseshoe",
    description: "Seven-card arc from the past to what may come",
    positions: [
      { label: "Distant Past",  x: 10, y: 70 },
      { label: "Recent Past",   x: 25, y: 40 },
      { label: "Present",       x: 42, y: 20 },
      { label: "What may come soon",   x: 58, y: 20 },
      { label: "What may come",        x: 75, y: 40 },
      { label: "Best Action",   x: 90, y: 70 },
      { label: "Where this could lead", x: 50, y: 85 },
    ],
  },
  {
    id: "celtic",
    name: "Celtic Cross",
    description: "The classic 10-card deep reading",
    positions: [
      // Cross cluster left, staff column right — spaced so md cards
      // no longer overlap at small container sizes.
      { label: "The Heart",       x: 32, y: 48 },
      { label: "The Cross",       x: 32, y: 48, rotate: true },
      { label: "Foundation",      x: 32, y: 82 },
      { label: "Recent Past",     x: 12, y: 48 },
      { label: "Crown",           x: 32, y: 14 },
      { label: "What may come soon",     x: 52, y: 48 },
      { label: "Self",            x: 84, y: 85 },
      { label: "Environment",     x: 84, y: 61 },
      { label: "Hopes & Fears",   x: 84, y: 37 },
      { label: "Where this could lead",   x: 84, y: 13 },
    ],
  },
];