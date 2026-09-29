// Check-in vocabulary shared by the ceremony and summaries.
export const EMOTIONS = [
  { label: 'Joyful', icon: 'sun' },
  { label: 'Grateful', icon: 'hand-heart' },
  { label: 'Calm', icon: 'waves' },
  { label: 'Excited', icon: 'flame' },
  { label: 'Loved', icon: 'heart' },
  { label: 'Hopeful', icon: 'sprout' },
  { label: 'Proud', icon: 'award' },
  { label: 'Creative', icon: 'palette' },
  { label: 'Content', icon: 'smile' },
  { label: 'Relieved', icon: 'cloud-sun' },
  { label: 'Anxious', icon: 'wind' },
  { label: 'Sad', icon: 'droplet' },
  { label: 'Frustrated', icon: 'cloud-lightning' },
  { label: 'Tired', icon: 'moon' },
  { label: 'Lonely', icon: 'circle-dashed' },
  { label: 'Overwhelmed', icon: 'orbit' },
  { label: 'Numb', icon: 'mountain' },
  { label: 'Angry', icon: 'zap' },
  { label: 'Afraid', icon: 'shield' },
  { label: 'Hurt', icon: 'heart-crack' },
  { label: 'Ashamed', icon: 'eye-off' },
  { label: 'Guilty', icon: 'scale' },
];

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
