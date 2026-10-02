// Check-in vocabulary shared by the ceremony and summaries.

export { FEELING_FAMILIES, EMOTIONS, isListedFeeling, feelingIcon, findFeelings } from '@/lib/feelings';

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
