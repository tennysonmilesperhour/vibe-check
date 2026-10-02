// Check-in vocabulary shared by the ceremony and summaries.

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
// all here, so check-ins kept with it look the same.
const COMMON_FEELINGS = new Set([
  'Joyful', 'Grateful', 'Excited', 'Proud', 'Hopeful', 'Calm', 'Content', 'Relieved', 'Loved', 'Creative',
  'Sad', 'Lonely', 'Hurt', 'Anxious', 'Afraid', 'Overwhelmed', 'Stressed', 'Angry', 'Frustrated',
  'Ashamed', 'Guilty', 'Tired', 'Numb', 'Confused',
]);

export const EMOTIONS = FEELING_FAMILIES.flatMap((family) => family.words.map((label) => ({
  label, icon: family.icon, family: family.name, common: COMMON_FEELINGS.has(label),
})));

/** Families with only the words that contain the search text, ignoring case. */
export function findFeelings(query) {
  const text = query.trim().toLowerCase();
  if (!text) return FEELING_FAMILIES;
  return FEELING_FAMILIES.map((family) => ({ ...family, words: family.words.filter((word) => word.toLowerCase().includes(text)) }))
    .filter((family) => family.words.length);
}

export const ACTIVITIES = [
  { label: 'Exercise', icon: 'footprints' },
  { label: 'Meditation', icon: 'flower' },
  { label: 'Journaling', icon: 'feather' },
  { label: 'Nature', icon: 'leaf' },
  { label: 'Social', icon: 'users' },
  { label: 'Creative work', icon: 'pen-tool' },
  { label: 'Learning', icon: 'book-open' },
  { label: 'Rest', icon: 'armchair' },
  { label: 'Healthy eating', icon: 'wheat' },
  { label: 'Music', icon: 'music' },
  { label: 'Spiritual practice', icon: 'sun-moon' },
  { label: 'Therapy/coaching', icon: 'messages' },
];

export const SCALE_WORDS = {
  mood_score: ['', 'heavy', 'low', 'strained', 'flat', 'steady', 'okay', 'good', 'bright', 'glowing', 'radiant'],
  // Energy is neither good nor bad, so its words only say how much.
  energy_level: ['', 'very low', 'low', 'low', 'somewhat low', 'middling', 'middling', 'somewhat high', 'high', 'high', 'very high'],
  sleep_quality: ['', 'very poor', 'poor', 'poor', 'fair', 'fair', 'okay', 'good', 'good', 'very good', 'very good'],
};

// Shown under each scale before anything is chosen, so a number means the same thing every day.
export const SCALE_ANCHORS = {
  mood_score: ['very low', 'very good'],
  energy_level: ['very low', 'very high'],
  sleep_quality: ['very poor', 'very good'],
};
