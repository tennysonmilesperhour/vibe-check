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

/** What is saved: the picks, then each typed word once. */
export const combineWords = (picks, text) => [...new Set([...picks, ...text.split(',').map((item) => item.trim()).filter(Boolean)])];
