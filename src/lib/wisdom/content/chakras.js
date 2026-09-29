// Chakra content for the local wisdom engine: the seven centers with their
// element, themes, the signs of balance and imbalance, and grounded practices.

export const CHAKRAS = {
  root: {
    name: "Root", sanskrit: "Muladhara", color: "red", element: "Earth", location: "base of the spine",
    theme: "safety, survival, belonging, and the right to be here",
    balanced: "grounded, stable, secure in your body and your place in the world, able to trust that you will be okay",
    blocked: "anxiety, restlessness, fear about money or survival, feeling ungrounded or unwelcome in your own life",
    practices: "walk barefoot on the earth, eat root vegetables and warm grounding food, move your body, tend your home and finances, use red and the note C, and, if it fits, say something true for you, such as: I belong here.",
  },
  sacral: {
    name: "Sacral", sanskrit: "Svadhisthana", color: "orange", element: "Water", location: "lower belly",
    theme: "creativity, pleasure, emotion, sexuality, and the right to feel",
    balanced: "creative, sensual, emotionally fluid, able to feel pleasure and let feelings move through you",
    blocked: "numbness or emotional overwhelm, guilt around pleasure, creative block, rigidity, or compulsive seeking",
    practices: "move fluidly, dance, hips and water; make art with no goal; let yourself feel and enjoy; use orange and the note D, and repeat: I allow myself to feel and to create.",
  },
  "solar plexus": {
    name: "Solar Plexus", sanskrit: "Manipura", color: "yellow", element: "Fire", location: "upper belly",
    theme: "personal power, will, confidence, and the right to act",
    balanced: "confident, purposeful, able to set boundaries and follow through, at home in your own authority",
    blocked: "low self-esteem or domineering control, passivity, shame, or a fire that has gone cold or gone wild",
    practices: "core-strengthening movement, sunlight, warming spices; take a small brave action and finish it; use yellow and the note E, and repeat: I am worthy of my own power.",
  },
  heart: {
    name: "Heart", sanskrit: "Anahata", color: "green", element: "Air", location: "center of the chest",
    theme: "love, compassion, connection, and the right to love and be loved",
    balanced: "open, compassionate, able to give and receive love, at peace with yourself and connected to others",
    blocked: "grief, isolation, defensiveness, over-giving without receiving, or a chest that stays armored",
    practices: "breathwork and chest-opening movement, time in nature and community, self-forgiveness; give and receive freely; use green or pink and the note F, and repeat: I am open to love.",
  },
  throat: {
    name: "Throat", sanskrit: "Vishuddha", color: "blue", element: "Ether/Sound", location: "throat",
    theme: "expression, truth, voice, and the right to speak and be heard",
    balanced: "expressive, honest, able to speak your truth clearly and also to listen",
    blocked: "swallowed words, fear of speaking up, over-talking, gossip, or a sense of never being heard",
    practices: "sing, hum, chant, journal; speak one honest thing you have been holding; use blue and the note G, and repeat: my voice matters and my truth is welcome.",
  },
  "third eye": {
    name: "Third Eye", sanskrit: "Ajna", color: "indigo", element: "Light", location: "between the brows",
    theme: "intuition, insight, imagination, and the right to see",
    balanced: "perceptive, intuitive, clear-sighted, able to trust your inner knowing and imagine widely",
    blocked: "overthinking cut off from intuition, confusion, cynicism, or a felt sense of being lost",
    practices: "meditation and stillness, honor dreams and hunches, reduce screen noise; use indigo and the note A, and repeat: I trust my inner vision.",
  },
  crown: {
    name: "Crown", sanskrit: "Sahasrara", color: "violet/white", element: "Consciousness", location: "top of the head",
    theme: "spirituality, meaning, connection to the whole, and the right to know",
    balanced: "connected to something larger, a felt sense of meaning, presence, and trust in life",
    blocked: "disconnection, meaninglessness, spiritual cynicism, or a rigid over-attachment to belief",
    practices: "meditation, prayer, silence, time under the sky; release the need to control; use violet or white and the note B, and repeat: I am part of something greater.",
  },
};

export function resolveChakra(value) {
  const v = String(value || "").toLowerCase();
  for (const key of Object.keys(CHAKRAS)) {
    if (v.includes(key) || v.includes(CHAKRAS[key].sanskrit.toLowerCase())) return { key, ...CHAKRAS[key] };
  }
  return null;
}
