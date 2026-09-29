// Major Arcana archetypes for the local wisdom engine. Keyed by the bare card
// name (matching resonance/tables ARCANA_NAMES). Used for the Tarot "birth card"
// birth card, the shadow card, and the personal-year card.

export const ARCANA = {
  "The Fool": {
    keywords: ["beginnings", "faith", "spontaneity", "the open road"],
    archetype: "The Fool is the card of beginnings: openness, curiosity and a willingness to start again. Readers link it to a fresh, uncynical way of meeting life. If that fits you, it may be a strength to lean on, alongside looking before you leap.",
    shadow: "As a shadow card, the Fool can raise a question: are some of your leaps freedom, and some a way to avoid committing? If it fits, it points toward keeping your openness while looking before some leaps.",
    year: "A year associated with beginnings. If something new is calling, you can explore it at your own pace and look carefully before any leap.",
  },
  "The Magician": {
    keywords: ["will", "manifestation", "focus", "as above so below"],
    archetype: "The Magician is the card of skill and focus: bringing ideas into form with the tools at hand. Readers link it to resourcefulness and a clear sense of intention. You decide what to put that energy toward.",
    shadow: "As a shadow card, the Magician can raise questions about power and follow-through: scattered effort, talk without action, or influence used carelessly. If it fits, it points toward using your gifts with integrity and following through.",
    year: "A year associated with skill and focus. You might choose one aim that matters to you and see what your existing tools can do for it.",
  },
  "The High Priestess": {
    keywords: ["intuition", "mystery", "the inner voice", "the unseen"],
    archetype: "The High Priestess is the card of inner knowing: intuition, dreams and quiet reflection. Readers link it to people who notice what goes unsaid. Intuition is one voice among several, beside what you have seen and what people you trust notice.",
    shadow: "As a shadow card, the High Priestess can raise questions about hiding behind mystery, doubting your own knowing, or keeping secrets that isolate you. If it fits, it points toward listening inward and weighing what you hear.",
    year: "A year associated with reflection and intuition. Quiet time might help you hear yourself, alongside the facts in front of you.",
  },
  "The Empress": {
    keywords: ["abundance", "nurture", "creativity", "the fertile earth"],
    archetype: "The Empress is the card of care and creativity: nurturing people, ideas and beauty, and enjoying the body and the senses. Readers link it to generosity. That care can include you.",
    shadow: "As a shadow card, the Empress can raise questions about over-giving, holding what you love too tightly, or leaving yourself out of your own care. If it fits, it points toward care that includes you.",
    year: "A year associated with growth, creativity and care. What would you like to tend, and what would feel good to receive?",
  },
  "The Emperor": {
    keywords: ["structure", "authority", "protection", "the father"],
    archetype: "The Emperor is the card of structure and steady leadership. Readers link it to building order, taking responsibility and protecting what matters. Good structure leaves room for everyone in it.",
    shadow: "As a shadow card, the Emperor can raise questions about control: when structure turns rigid, and how you relate to authority, your own or other people's. If it fits, it points toward steady structure that serves the people in it.",
    year: "A year associated with structure and plans. You might set up a framework that makes things steadier for you.",
  },
  "The Hierophant": {
    keywords: ["tradition", "meaning", "teaching", "the sacred"],
    archetype: "The Hierophant is the card of tradition, teaching and shared meaning. Readers link it to mentorship and to belonging to something larger. Your own beliefs can sit inside a tradition or outside it.",
    shadow: "As a shadow card, the Hierophant can raise questions about conforming out of fear, holding to rules that no longer help you, or turning away from all guidance. If it fits, it points toward your own relationship to what is sacred, inside or outside tradition.",
    year: "A year associated with learning and meaning. You might seek a teacher, offer what you know, or explore what you believe.",
  },
  "The Lovers": {
    keywords: ["union", "choice", "values", "the heart"],
    archetype: "The Lovers is the card of connection and choice. Readers link it to love and to knowing what you value. Your values, and how you are treated, count for more than any card.",
    shadow: "As a shadow card, the Lovers can raise questions about avoiding a choice, losing yourself in someone else, or setting your values aside for approval. If it fits, it points toward choosing with your heart and your eyes open.",
    year: "A year associated with relationships and choices. You might look at which choices match your values. No card can say who is right for you.",
  },
  "The Chariot": {
    keywords: ["willpower", "victory", "direction", "self-command"],
    archetype: "The Chariot is the card of direction and determination. Readers link it to drive and to holding competing pulls together. You choose where you are heading and at what pace.",
    shadow: "As a shadow card, the Chariot can raise questions about drive: when it turns into force, and when you might pause instead of push. If it fits, it points toward direction that comes from within.",
    year: "A year associated with momentum. You might pick a direction that matters to you and move at a pace you can keep.",
  },
  "Strength": {
    keywords: ["courage", "gentleness", "inner power", "compassion"],
    archetype: "Strength is the card of gentle courage. Readers link it to patience, compassion and meeting strong feelings with care. Strong feelings can be a fair response to what is happening.",
    shadow: "As a shadow card, Strength can raise questions about force and power: holding your wildness down, or letting it run you. If it fits, it points toward meeting your own strong feelings with care.",
    year: "A year associated with gentle courage. Compassion, for yourself as well as others, can be a kind of strength.",
  },
  "The Hermit": {
    keywords: ["solitude", "inner light", "guidance", "the search"],
    archetype: "The Hermit is the card of solitude and reflection. Readers link it to wisdom found in quiet and shared with others. Time alone can help, and so can people who care about you.",
    shadow: "As a shadow card, the Hermit can raise questions about solitude: when it becomes isolation, and when staying busy keeps you from your own thoughts. If it fits, it points toward solitude that still lets people in.",
    year: "A year associated with reflection. Quiet time could help you sort out what matters, and you don't have to find every answer alone.",
  },
  "Wheel of Fortune": {
    keywords: ["cycles", "fate", "turning points", "flow"],
    archetype: "The Wheel is the card of cycles and change. Readers link it to a sense of timing and to meeting change with some steadiness. Much of what changes is outside your control, and not all of it is yours to carry.",
    shadow: "As a shadow card, the Wheel asks how you meet change: holding on to one season, or noticing what is yours to move and what is not. Not everything that happens to you is yours to carry.",
    year: "A year associated with turning points and change. You can adapt where you choose and still name what you didn't want.",
  },
  "Justice": {
    keywords: ["truth", "balance", "accountability", "cause and effect"],
    archetype: "Justice is the card of fairness and truth. Readers link it to clear thinking, integrity and weighing things honestly. Honesty about responsibility includes seeing what was yours and what was someone else's.",
    shadow: "As a shadow card, Justice can raise questions about accountability: judging yourself or others harshly, or finding your part hard to look at. If it fits, it points toward honest reflection, including on what was never yours.",
    year: "A year associated with fairness and accountability. You might look at decisions honestly, and other people's choices are theirs to answer for.",
  },
  "The Hanged Man": {
    keywords: ["surrender", "new perspective", "pause", "letting go"],
    archetype: "The Hanged Man is the card of pause and new perspective. Readers link it to seeing things from another angle and letting go of what you choose to release. A pause you choose is different from being held in place.",
    shadow: "As a shadow card, the Hanged Man can raise questions about feeling stuck, or giving more than you can afford to. If it fits, it points toward telling a chosen pause apart from being held in place.",
    year: "A year associated with pause and perspective. A new view might form if you give things time, where waiting is safe and yours to choose.",
  },
  "Death": {
    keywords: ["endings", "transformation", "release", "rebirth"],
    archetype: "Death is the card of endings and change, and rarely of literal death. Readers link it to letting things end and making room for what comes next. Endings can bring grief, and grief takes its own time.",
    shadow: "As a shadow card, Death can raise questions about endings: what is already over, and what is hard to let go of. Letting go takes the time it takes, and grief is part of it.",
    year: "A year associated with endings and change. If something is completing, you can grieve it and choose what to carry forward. Loss can simply be loss; you do not have to find the gift in it.",
  },
  "Temperance": {
    keywords: ["balance", "alchemy", "moderation", "integration"],
    archetype: "Temperance is the card of balance and patience. Readers link it to blending different parts of life and finding a middle way. A steadier pace can help, and so can support.",
    shadow: "As a shadow card, Temperance can raise questions about swinging between extremes or rushing what needs time. If it fits, it points toward a steadier middle pace.",
    year: "A year associated with balance. You might look for a middle way between extremes, at a pace that suits you.",
  },
  "The Devil": {
    keywords: ["shadow", "attachment", "liberation", "the material"],
    archetype: "The Devil is the card of what binds: habits, desires and ties that hold on. Readers link it to honesty about attachment and power. Some ties are habits you could loosen; others are held in place by someone else, and that is not your failure.",
    shadow: "As a shadow card, the Devil asks what feels binding: habits you could loosen, and ties that someone else holds in place. Seeing which is which is not a failure of yours.",
    year: "A year associated with looking at what binds you. Naming a habit or a tie can help, and support from others can make loosening it safer.",
  },
  "The Tower": {
    keywords: ["upheaval", "revelation", "breakthrough", "sudden truth"],
    archetype: "The Tower is the card of sudden change and revelation. Readers link it to structures that break and to the clarity that can follow. Upheaval is hard, and when it comes from someone else's choices, it is not your fault.",
    shadow: "As a shadow card, the Tower can raise questions about structures in your life that no longer fit. Upheaval is hard, and when it comes from someone else's choices, it is not your fault.",
    year: "A year associated with upheaval and sudden clarity. If something breaks, it is fine to be shaken by it; clarity and loss can arrive together.",
  },
  "The Star": {
    keywords: ["hope", "renewal", "faith", "guidance"],
    archetype: "The Star is the card of hope and renewal. Readers link it to faith in better days and to offering hope to others. You can offer it without giving up the care and boundaries you need yourself.",
    shadow: "As a shadow card, the Star can raise questions about hope: guarding your heart against it, or pouring out for others while running dry. If it fits, it points toward letting yourself be cared for too.",
    year: "A year associated with hope and renewal. What helps you feel a little more hopeful, and who helps you feel cared for?",
  },
  "The Moon": {
    keywords: ["intuition", "dreams", "the unconscious", "illusion"],
    archetype: "The Moon is the card of dreams, intuition and uncertainty. Readers link it to imagination and to finding your way when things are unclear. Fear and intuition can feel alike, and talking things through can help tell them apart.",
    shadow: "As a shadow card, the Moon can raise questions about fear and uncertainty, and how anxiety and intuition can feel alike. If it fits, it points toward the next step you can see, with support if you want it.",
    year: "A year associated with intuition and uncertainty. When things are unclear, you can take the next step you can see and ask for help with the rest.",
  },
  "The Sun": {
    keywords: ["joy", "vitality", "clarity", "success"],
    archetype: "The Sun is the card of joy and warmth. Readers link it to vitality, optimism and enjoying life. Joy is welcome when it comes, and so are the days when it doesn't.",
    shadow: "As a shadow card, the Sun can raise questions about dimming yourself, doubting your right to joy, or showing brightness you don't feel. If it fits, it points toward letting real joy in when it comes, without having to perform it.",
    year: "A year associated with joy and clarity. You might notice what brings you warmth and make room for it.",
  },
  "Judgement": {
    keywords: ["awakening", "reckoning", "calling", "rebirth"],
    archetype: "Judgement is the card of awakening and reckoning. Readers link it to hearing a call and looking at your life honestly. Forgiving anyone, yourself included, is yours to decide.",
    shadow: "As a shadow card, Judgement can raise questions about judging yourself harshly, or staying in an old way of being past its time. If it fits, it points toward self-forgiveness and answering what calls to you.",
    year: "A year associated with awakening and reckoning. You might look back honestly and answer what calls to you. Forgiving is yours to decide; it is never required.",
  },
  "The World": {
    keywords: ["completion", "wholeness", "fulfillment", "integration"],
    archetype: "The World is the card of completion and wholeness. Readers link it to finishing things and bringing parts of your life together. You can take in what you have done before the next beginning.",
    shadow: "As a shadow card, the World can raise questions about leaving things unfinished or skipping past what you have completed. If it fits, it points toward finishing, and letting yourself take in what you have done.",
    year: "A year associated with completion. You might mark what you have finished or come through, before the next beginning.",
  },
};

// Strip the "N – " prefix the profile form sometimes stores.
export function bareArcana(name) {
  return String(name || "").trim().replace(/^\s*\d+\s*[–-]\s*/, "");
}

export function resolveArcana(name) {
  const bare = bareArcana(name);
  if (ARCANA[bare]) return { name: bare, ...ARCANA[bare] };
  // case-insensitive fallback
  const key = Object.keys(ARCANA).find((k) => k.toLowerCase() === bare.toLowerCase());
  return key ? { name: key, ...ARCANA[key] } : null;
}
