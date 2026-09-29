// Major Arcana archetypes for the local wisdom engine. Keyed by the bare card
// name (matching resonance/tables ARCANA_NAMES). Used for the Tarot "birth card"
// soul archetype, the "shadow/teacher card", and the personal-year card.

export const ARCANA = {
  "The Fool": {
    keywords: ["beginnings", "faith", "spontaneity", "the open road"],
    archetype: "You carry the soul of the eternal beginner, the one who steps off the cliff trusting the ground will meet you. Your gift is fearless openness, the willingness to start again with a clean heart and no cynicism. You are here to live by faith rather than calculation, to keep the innocence that lets life stay astonishing.",
    shadow: "As a shadow card, the Fool can raise a question: are some of your leaps freedom, and some a way to avoid committing? If it fits, it points toward keeping your openness while looking before some leaps.",
    year: "A year to begin fresh with an open heart. Take the leap you have been circling; trust the unknown. Naivete is the only real risk, so leap with your eyes open.",
  },
  "The Magician": {
    keywords: ["will", "manifestation", "focus", "as above so below"],
    archetype: "You carry the soul of the Magician, the one who channels vision into reality. You have all the elements you need, and your gift is focused will, the power to make the inner outer. You are here to be a conscious creator, aligning intention, word, and action so that what you concentrate on comes to be.",
    shadow: "As a shadow card, the Magician can raise questions about power and follow-through: scattered effort, talk without action, or influence used carelessly. If it fits, it points toward using your gifts with integrity and following through.",
    year: "A year of manifestation and skill. You have the tools; direct your will toward one clear aim and act. Concentrated intention is your magic now.",
  },
  "The High Priestess": {
    keywords: ["intuition", "mystery", "the inner voice", "the unseen"],
    archetype: "You carry the soul of the High Priestess, keeper of the inner mysteries. Your gift is deep intuition and a knowing that arrives without proof. You are here to trust the still small voice, to honor dreams and silence, and to hold the wisdom that cannot be spoken outright.",
    shadow: "As a shadow card, the High Priestess can raise questions about hiding behind mystery, doubting your own knowing, or keeping secrets that isolate you. If it fits, it points toward listening inward and weighing what you hear.",
    year: "A year to go inward and listen. Trust your intuition over external noise; let understanding arrive in stillness rather than force. Secrets and dreams speak now.",
  },
  "The Empress": {
    keywords: ["abundance", "nurture", "creativity", "the fertile earth"],
    archetype: "You carry the soul of the Empress, the great creative mother. Your gift is abundance, sensuality, and the power to nurture life, ideas, people, beauty into being. You are here to create and to tend, to trust pleasure and the body, and to let things grow in their own season.",
    shadow: "As a shadow card, the Empress can raise questions about over-giving, holding what you love too tightly, or leaving yourself out of your own care. If it fits, it points toward care that includes you.",
    year: "A year of growth, creativity, and nurture. Plant and tend; let projects and relationships ripen. Receive pleasure and abundance without guilt.",
  },
  "The Emperor": {
    keywords: ["structure", "authority", "protection", "the father"],
    archetype: "You carry the soul of the Emperor, the builder of order and the protective father. Your gift is structure, leadership, and the steady authority that makes others feel safe. You are here to create stability, to lead with responsibility, and to turn chaos into a workable order.",
    shadow: "As a shadow card, the Emperor can raise questions about control: when structure turns rigid, and how you relate to authority, your own or other people's. If it fits, it points toward steady structure that serves the people in it.",
    year: "A year to build structure and take authority. Set the framework, make the plan, lead responsibly. Discipline and order pay off now.",
  },
  "The Hierophant": {
    keywords: ["tradition", "meaning", "teaching", "the sacred"],
    archetype: "You carry the soul of the Hierophant, the bridge between the sacred and the everyday. Your gift is meaning, mentorship, and the transmission of wisdom through form and tradition. You are here to teach and to learn, to seek the deeper significance, and to belong to something larger than yourself.",
    shadow: "As a shadow card, the Hierophant can raise questions about conforming out of fear, holding to rules that no longer help you, or turning away from all guidance. If it fits, it points toward your own relationship to what is sacred, inside or outside tradition.",
    year: "A year of learning, teaching, and meaning. Seek mentorship or offer it; deepen your understanding through study or tradition. Commitments made now carry weight.",
  },
  "The Lovers": {
    keywords: ["union", "choice", "values", "the heart"],
    archetype: "You carry the soul of the Lovers, the one whose path runs through relationship and choice. Your gift is connection, and the deep discernment of what you truly value. You are here to love consciously and to make the choices that align your outer life with your inner truth.",
    shadow: "As a shadow card, the Lovers can raise questions about avoiding a choice, losing yourself in someone else, or setting your values aside for approval. If it fits, it points toward choosing with your heart and your eyes open.",
    year: "A year of relationships and important choices. Align your decisions with your deepest values; a significant union or a defining fork may arrive.",
  },
  "The Chariot": {
    keywords: ["willpower", "victory", "direction", "self-command"],
    archetype: "You carry the soul of the Chariot, the one who wins through focused will and self-command. Your gift is drive, determination, and the ability to hold opposing forces together and steer them toward victory. You are here to master yourself and move with purpose toward what you are called to.",
    shadow: "As a shadow card, the Chariot can raise questions about drive: when it turns into force, and when you might pause instead of push. If it fits, it points toward direction that comes from within.",
    year: "A year of momentum and determined progress. Focus your will, harness competing pressures, and drive toward the goal. Persistence brings the victory.",
  },
  "Strength": {
    keywords: ["courage", "gentleness", "inner power", "compassion"],
    archetype: "You carry the soul of Strength, the one who tames the lion with a gentle hand. Your gift is quiet courage and the power that comes through compassion rather than force. You are here to master your own instincts with patience and love, and to show that true strength is tender.",
    shadow: "As a shadow card, Strength can raise questions about force and power: holding your wildness down, or letting it run you. If it fits, it points toward meeting your own strong feelings with care.",
    year: "A year to lead with patient courage and a soft strength. Master your reactions, persist gently, and let compassion, for yourself and others, be your power.",
  },
  "The Hermit": {
    keywords: ["solitude", "inner light", "guidance", "the search"],
    archetype: "You carry the soul of the Hermit, the one who walks apart to find the inner light and returns to guide. Your gift is wisdom won in solitude and the lantern you carry for others. You are here to seek truth in your own depths, and to honor the necessary aloneness that reveals it.",
    shadow: "As a shadow card, the Hermit can raise questions about solitude: when it becomes isolation, and when staying busy keeps you from your own thoughts. If it fits, it points toward solitude that still lets people in.",
    year: "A year of introspection and inner searching. Withdraw to reflect, seek wisdom, simplify. The answers you need are found by going within, not out.",
  },
  "Wheel of Fortune": {
    keywords: ["cycles", "fate", "turning points", "flow"],
    archetype: "You carry the soul of the Wheel, the one who understands the turning of cycles. Your gift is a sense of timing and the faith to move with fortune's turns rather than against them. You are here to embrace change as the nature of things and to find the still center within the spinning wheel.",
    shadow: "As a shadow card, the Wheel asks how you meet change: holding on to one season, or noticing what is yours to move and what is not. Not everything that happens to you is yours to carry.",
    year: "A year of turning points and shifting fortune. Change is the theme; stay adaptable and trust the cycle. What comes around is often better than expected.",
  },
  "Justice": {
    keywords: ["truth", "balance", "accountability", "cause and effect"],
    archetype: "You carry the soul of Justice, the one attuned to truth, fairness, and consequence. Your gift is clarity, integrity, and the ability to weigh things honestly. You are here to live in alignment with truth, to take responsibility for your choices, and to restore balance where it is missing.",
    shadow: "As a shadow card, Justice can raise questions about accountability: judging yourself or others harshly, or finding your part hard to look at. If it fits, it points toward honest reflection, including on what was never yours.",
    year: "A year of truth, balance, and accountability. Decisions and their consequences come due; act with integrity and fairness, and past causes bear their fruit.",
  },
  "The Hanged Man": {
    keywords: ["surrender", "new perspective", "pause", "letting go"],
    archetype: "You carry the soul of the Hanged Man, the one who finds wisdom by surrender and reversal. Your gift is the ability to let go, to see from an entirely new angle, and to trust the fertile pause. You are here to release control and discover what only surrender can reveal.",
    shadow: "As a shadow card, the Hanged Man can raise questions about feeling stuck, or giving more than you can afford to. If it fits, it points toward telling a chosen pause apart from being held in place.",
    year: "A year of pause and surrender. Progress comes not by pushing but by letting go and shifting perspective. Suspend the old certainties; a new view is forming.",
  },
  "Death": {
    keywords: ["endings", "transformation", "release", "rebirth"],
    archetype: "You carry the soul of Death, the great transformer. Your gift is the courage to let things end so that something truer can be born. You are here to move through profound transformations, to release what has completed its purpose, and to trust the rebirth on the other side.",
    shadow: "As a shadow card, Death can raise questions about endings: what is already over, and what is hard to let go of. Letting go takes the time it takes, and grief is part of it.",
    year: "A year associated with endings and change. If something is completing, you can grieve it and choose what to carry forward. Loss can simply be loss; you do not have to find the gift in it.",
  },
  "Temperance": {
    keywords: ["balance", "alchemy", "moderation", "integration"],
    archetype: "You carry the soul of Temperance, the alchemist who blends opposites into something new. Your gift is balance, patience, and the art of moderation that turns raw elements into gold. You are here to integrate, to find the middle way, and to heal through blending rather than choosing sides.",
    shadow: "As a shadow card, Temperance can raise questions about swinging between extremes or rushing what needs time. If it fits, it points toward a steadier middle pace.",
    year: "A year of balance and patient integration. Blend the different parts of your life, moderate the extremes, and let things combine slowly. Healing comes through the middle way.",
  },
  "The Devil": {
    keywords: ["shadow", "attachment", "liberation", "the material"],
    archetype: "You carry the soul of the Devil, the one who knows the chains and the key. Your gift is honesty about desire, power, and the shadow, and the potential to liberate yourself from what binds you. You are here to face your attachments and addictions consciously and to reclaim the power you gave away.",
    shadow: "As a shadow card, the Devil asks what feels binding: habits you could loosen, and ties that someone else holds in place. Seeing which is which is not a failure of yours.",
    year: "A year to face what binds you. Attachments, patterns, or shadow material come up for reckoning; naming the chain is the start of freedom. Reclaim your power.",
  },
  "The Tower": {
    keywords: ["upheaval", "revelation", "breakthrough", "sudden truth"],
    archetype: "You carry the soul of the Tower, the one who breaks false structures so truth can stand. Your gift is the lightning of sudden revelation and the strange freedom that follows collapse. You are here to let what is false fall away, sometimes shockingly, and to build again on solid ground.",
    shadow: "As a shadow card, the Tower can raise questions about structures in your life that no longer fit. Upheaval is hard, and when it comes from someone else's choices, it is not your fault.",
    year: "A year associated with upheaval and sudden clarity. If something breaks, it is fine to be shaken by it; clarity and loss can arrive together.",
  },
  "The Star": {
    keywords: ["hope", "renewal", "faith", "guidance"],
    archetype: "You carry the image of the Star, the one who brings hope after the dark. Its gifts are faith, renewal, and a steady hope, offered to others without giving up the care and boundaries you need yourself.",
    shadow: "As a shadow card, the Star can raise questions about hope: guarding your heart against it, or pouring out for others while running dry. If it fits, it points toward letting yourself be cared for too.",
    year: "A year of hope, healing, and renewal. After difficulty, faith returns; open up, replenish, and follow your guiding star. Serenity and inspiration are available.",
  },
  "The Moon": {
    keywords: ["intuition", "dreams", "the unconscious", "illusion"],
    archetype: "You carry the soul of the Moon, the one at home in dream, intuition, and the mysterious dark. Your gift is a powerful connection to the unconscious and the imagination. You are here to navigate uncertainty by feeling your way, to honor dreams and instincts, and to distinguish illusion from deeper truth.",
    shadow: "As a shadow card, the Moon can raise questions about fear and uncertainty, and how anxiety and intuition can feel alike. If it fits, it points toward the next step you can see, with support if you want it.",
    year: "A year of intuition, dreams, and uncertainty. Not everything is clear; feel your way rather than forcing clarity. Honor the unconscious and let illusions dissolve.",
  },
  "The Sun": {
    keywords: ["joy", "vitality", "clarity", "success"],
    archetype: "You carry the soul of the Sun, the one who radiates warmth, joy, and clarity. Your gift is vitality, optimism, and the ability to illuminate whatever you touch. You are here to shine openly, to enjoy life without apology, and to let your authentic warmth bless the people around you.",
    shadow: "As a shadow card, the Sun can raise questions about dimming yourself, doubting your right to joy, or showing brightness you don't feel. If it fits, it points toward letting real joy in when it comes, without having to perform it.",
    year: "A year of joy, clarity, and success. Warmth returns, things come to light, vitality is high. Enjoy it, celebrate, and let yourself shine.",
  },
  "Judgement": {
    keywords: ["awakening", "reckoning", "calling", "rebirth"],
    archetype: "You carry the soul of Judgement, the one who hears the call to rise into a truer life. Your gift is the capacity for profound awakening, honest reckoning, and answering a higher calling. You are here to review your life clearly, forgive, and rise renewed into who you are becoming.",
    shadow: "As a shadow card, Judgement can raise questions about judging yourself harshly, or staying in an old way of being past its time. If it fits, it points toward self-forgiveness and answering what calls to you.",
    year: "A year of awakening and reckoning. A calling grows clear; review the past honestly, forgive, and rise. A significant renewal or decision arrives.",
  },
  "The World": {
    keywords: ["completion", "wholeness", "fulfillment", "integration"],
    archetype: "You carry the soul of the World, the one who completes the circle and dances in wholeness. Your gift is integration, accomplishment, and the ability to bring things to fulfilling completion. You are here to unify the parts of yourself and your journey, and to know the satisfaction of a cycle whole.",
    shadow: "As a shadow card, the World can raise questions about leaving things unfinished or skipping past what you have completed. If it fits, it points toward finishing, and letting yourself take in what you have done.",
    year: "A year of completion and fulfillment. A major cycle culminates; celebrate the achievement and integrate all you have learned. Wholeness is at hand before the next beginning.",
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
