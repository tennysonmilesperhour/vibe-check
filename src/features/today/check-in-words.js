// Words picked from a list and words typed in your own words are kept apart
// while a check-in is edited, then saved together. A word typed on the way to
// a longer one ("Close" in "Close to tears") is never picked.

const listed = (presets) => new Set(presets.map((preset) => preset.label));

/** The words picked from the list, in the order they were picked. */
export const picksFrom = (items = [], presets) => {
  const labels = listed(presets);
  return items.filter((item) => labels.has(item));
};

/** The words to show in the own-words field, separated by commas. */
export const typedFrom = (items = [], presets) => {
  const labels = listed(presets);
  return items.filter((item) => !labels.has(item)).join(', ');
};

/**
 * What is saved: the picks, then each typed word. A word already there in
 * another letter case ("Sad" picked, "sad" typed) is kept once.
 */
export const combineWords = (picks, text) => {
  const seen = new Set();
  return [...picks, ...text.split(',').map((item) => item.trim()).filter(Boolean)].filter((word) => {
    const key = word.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

/**
 * The next words in the order they were saved, new ones last, so undoing a
 * change gives back exactly what was kept.
 */
export const keepOrder = (previous, next) => [...previous.filter((word) => next.includes(word)), ...next.filter((word) => !previous.includes(word))];
