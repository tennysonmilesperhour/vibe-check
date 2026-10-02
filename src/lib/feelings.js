// The feeling words offered in the daily check-in, shared by the check-in,
// its summaries, and the reports that count them.

// Feeling words in families, so a wide vocabulary stays easy to scan. Each
// word takes its family's symbol.
export const FEELING_FAMILIES = [
  { name: 'Joy', icon: 'sun', words: ['Joyful', 'Happy', 'Grateful', 'Excited', 'Proud', 'Hopeful', 'Playful', 'Amused', 'Confident', 'Inspired'] },
  { name: 'Calm', icon: 'waves', words: ['Calm', 'Content', 'Relieved', 'Relaxed', 'Peaceful', 'Grounded', 'Rested', 'Safe', 'Comfortable', 'Satisfied'] },
  { name: 'Connection', icon: 'heart', words: ['Loved', 'Connected', 'Supported', 'Accepted', 'Seen', 'Close', 'Tender', 'Caring', 'Trusting', 'Included'] },
  { name: 'Curiosity', icon: 'sprout', words: ['Curious', 'Creative', 'Interested', 'Focused', 'Motivated', 'Energized', 'Surprised', 'Amazed', 'Moved', 'In awe'] },
  { name: 'Sadness', icon: 'droplet', words: ['Sad', 'Lonely', 'Hurt', 'Disappointed', 'Grieving', 'Heartbroken', 'Discouraged', 'Hopeless', 'Empty', 'Rejected', 'Left out'] },
  { name: 'Fear and stress', icon: 'wind', words: ['Anxious', 'Afraid', 'Overwhelmed', 'Stressed', 'Worried', 'Nervous', 'Insecure', 'Vulnerable', 'Uneasy', 'Panicked', 'Restless'] },
  { name: 'Anger', icon: 'zap', words: ['Angry', 'Frustrated', 'Irritated', 'Annoyed', 'Resentful', 'Impatient', 'Jealous', 'Betrayed', 'Disrespected', 'Disgusted', 'Furious'] },
  { name: 'Shame and guilt', icon: 'eye-off', words: ['Ashamed', 'Guilty', 'Embarrassed', 'Regretful', 'Inadequate', 'Self-conscious', 'Humiliated', 'Judged'] },
  { name: 'Tired or distant', icon: 'moon', words: ['Tired', 'Numb', 'Exhausted', 'Drained', 'Bored', 'Unmotivated', 'Detached', 'Withdrawn', 'Burnt out', 'Foggy'] },
  { name: 'Unsure or mixed', icon: 'circle-dashed', words: ['Confused', 'Unsure', 'Torn', 'Conflicted', 'Stuck', 'Lost', 'Scattered', 'Distracted', 'Mixed'] },
];

// Shown first in the check-in. The 22 words of the earlier, shorter list are
// all here, so they stay one tap away.
const COMMON_FEELINGS = new Set([
  'Joyful', 'Grateful', 'Excited', 'Proud', 'Hopeful', 'Calm', 'Content', 'Relieved', 'Loved', 'Creative',
  'Sad', 'Lonely', 'Hurt', 'Anxious', 'Afraid', 'Overwhelmed', 'Stressed', 'Angry', 'Frustrated',
  'Ashamed', 'Guilty', 'Tired', 'Numb', 'Confused',
]);

export const EMOTIONS = FEELING_FAMILIES.flatMap((family) => family.words.map((label) => ({
  label, icon: family.icon, common: COMMON_FEELINGS.has(label),
})));

const LISTED = new Set(EMOTIONS.map((feeling) => feeling.label));
const BY_WORD = new Map(EMOTIONS.map((feeling) => [feeling.label.toLowerCase(), feeling]));

/** Whether a saved feeling is a word from the list, exactly as listed. */
export const isListedFeeling = (label) => LISTED.has(label);

/** The family symbol for a feeling, in any letter case; none for own words. */
export const feelingIcon = (label) => BY_WORD.get(String(label).toLowerCase())?.icon;

/**
 * A listed word as the list spells it, so "worried" typed in your own words
 * and "Worried" picked count as one feeling. Other words stay as written.
 */
export const canonicalFeeling = (word) => BY_WORD.get(String(word).toLowerCase())?.label ?? word;

// Lowercase words separated by single spaces, so "self conscious" finds
// "Self-conscious" and a search never runs across two words.
const fold = (text) => text.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();

/**
 * Families with only the words that contain the search text, ignoring case
 * and punctuation. A search for a family's name ("anger") shows the family.
 */
export function findFeelings(query) {
  if (!query.trim()) return FEELING_FAMILIES;
  const text = fold(query);
  if (!text) return [];
  const named = (family) => fold(family.name).startsWith(text)
    || family.name.toLowerCase().split(' ').some((part) => !['and', 'or'].includes(part) && part.startsWith(text));
  return FEELING_FAMILIES.map((family) => (named(family) ? family : { ...family, words: family.words.filter((word) => fold(word).includes(text)) }))
    .filter((family) => family.words.length);
}
