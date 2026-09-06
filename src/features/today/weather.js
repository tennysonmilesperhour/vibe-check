export const WEATHER_STATES = [
  {
    id: "stormy",
    label: "Stormy",
    score: 2,
    description: "Everything had an edge.",
    reflection: "A difficult atmosphere moved through today. It does not get to define tomorrow.",
  },
  {
    id: "heavy",
    label: "Heavy",
    score: 4,
    description: "The day carried weight.",
    reflection: "Something asked more of you today. Notice what can be set down before sleep.",
  },
  {
    id: "still",
    label: "Still",
    score: 6,
    description: "The air stayed quiet.",
    reflection: "Today held a quieter weather. There may be something useful in the pause.",
  },
  {
    id: "open",
    label: "Open",
    score: 8,
    description: "There was room today.",
    reflection: "Notice what made the day feel open. That condition may be worth protecting.",
  },
  {
    id: "bright",
    label: "Bright",
    score: 10,
    description: "The light found you.",
    reflection: "Something brought light into today. Give it a name while it is close.",
  },
];

export function weatherForScore(score) {
  if (score == null) return WEATHER_STATES[2];
  if (score <= 2) return WEATHER_STATES[0];
  if (score <= 4) return WEATHER_STATES[1];
  if (score <= 6) return WEATHER_STATES[2];
  if (score <= 8) return WEATHER_STATES[3];
  return WEATHER_STATES[4];
}

export function weatherIdForScore(score) {
  return score == null ? "unwritten" : weatherForScore(score).id;
}
