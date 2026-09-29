// Authored invitations, not diagnoses or a treatment protocol. No external AI.
export const PRACTICE_SOURCES = {
  grounding: { title: 'WHO · Doing What Matters in Times of Stress', url: 'https://www.who.int/thailand/activities/doing-what-matters-in-times-of-stress' },
  coping: { title: 'VA · Coping with stress reactions', url: 'https://www.ptsd.va.gov/gethelp/coping_stress_reactions.asp' },
  anger: { title: 'NHS · Help with anger', url: 'https://www.nhs.uk/mental-health/feelings-symptoms-behaviours/feelings-and-symptoms/anger/' },
  starting: { title: 'CCI · Practical strategies for procrastination', url: 'https://www.cci.health.wa.gov.au/Resources/Looking-After-Yourself/Procrastination' },
};

export const STRESS_STATES = [
  { id: 'confusion', label: 'Confusion', description: 'Too much to untangle', invitation: 'We can begin with what is clear enough for one next step.', practices: ['one-clear-thing', 'decision-pause', 'orient'] },
  { id: 'on-edge', label: 'Fight or flight', description: 'On edge or ready to react', invitation: 'Let us make a little room to notice what you need right now.', practices: ['orient', 'comfortable-breath'] },
  { id: 'anger', label: 'Anger', description: 'Heat, frustration, or a crossed line', invitation: 'Your anger has room here. You can take time before choosing a response.', practices: ['space-before-response', 'comfortable-movement'] },
  { id: 'shutdown', label: 'Shutdown', description: 'Everything feels hard to begin', invitation: 'A small movement or a moment of care is enough to begin with.', practices: ['small-movement', 'one-care-action'] },
  { id: 'numbness', label: 'Emotional numbness', description: 'Distant or disconnected', invitation: 'You do not have to force a feeling. We can notice one familiar thing.', practices: ['familiar-sense', 'one-care-action'] },
  { id: 'procrastination', label: 'Procrastination', description: 'Putting off a step that matters', invitation: 'Let us find what is in the way, then make the first step smaller.', practices: ['small-start', 'name-the-obstacle'] },
  { id: 'unsure', label: 'Mixed or unsure', description: 'I do not have a word for it yet', invitation: 'You can start without finding the right word.', practices: ['orient', 'one-care-action'] },
];

export const BODY_CUES = ['Tight shoulders', 'Tense jaw', 'Restlessness', 'Heavy body', 'Chest tension', 'Stomach tension', 'Low energy', 'Hard to notice'];
export const ALIGNMENTS = [
  { id: 'aligned', label: 'Like myself' }, { id: 'mixed', label: 'Some of both' },
  { id: 'not-aligned', label: 'Away from myself' }, { id: 'unsure', label: 'Unsure' },
];
export const OUTCOMES = ['Clearer', 'More connected', 'More able to begin', 'More settled', 'About the same', 'More uncomfortable'];

export const PRACTICES = [
  { id: 'one-clear-thing', title: 'One clear thing', minutes: 2, purpose: 'Make space around a tangled decision.', source: 'starting', steps: ['Notice one neutral detail in the room: a shape, a sound, or a color.', 'Write one sentence about what you know, and one about what is still unclear.', 'Choose one small question or next step. A nonurgent decision can wait.'], alternative: 'Say the two sentences quietly or think them through instead of writing.', reflection: 'What feels a little clearer? What can wait?' },
  { id: 'orient', title: 'Find your surroundings', minutes: 1, purpose: 'Bring attention to the present surroundings.', source: 'grounding', steps: ['Keep your eyes open if comfortable. Notice three neutral things around you.', 'Notice a sound, or the support of your chair or the ground. Choose a sense that works for you.', 'Name where you are and one thing you would like to do next.'], alternative: 'Focus on a familiar sound or object instead of looking around. Skip body attention if it feels unwelcome.', reflection: 'Do you have more room to choose your next step?' },
  { id: 'comfortable-breath', title: 'An unforced breath', minutes: 1, purpose: 'Try a brief pause with comfortable breathing.', source: 'coping', steps: ['Choose a comfortable seated or standing position.', 'Let breathing stay gentle and natural. There is no count to meet and no breath to hold.', 'After a few breaths, look around and decide whether to continue or stop.'], alternative: 'Choose Find your surroundings if focusing on breathing is uncomfortable.', reflection: 'Did this feel useful, unchanged, or uncomfortable?' },
  { id: 'space-before-response', title: 'Space before a response', minutes: 2, purpose: 'Allow time to choose what you want to say or do.', source: 'anger', steps: ['Pause before replying or sending a message. If appropriate and safe, make some space from the interaction.', 'Try a short walk or a comfortable shift of position. Let your hands rest without forcing them to relax.', 'Privately name what felt wrong and what you need. You can draft a response without sending it.'], alternative: 'Remain where you are and privately think through one sentence. You do not need to confront anyone.', reflection: 'What boundary or need do you want your response to respect?' },
  { id: 'comfortable-movement', title: 'A little room to move', minutes: 2, purpose: 'Explore a comfortable movement break.', source: 'coping', steps: ['Sit or stand with the support you prefer.', 'Try a small shoulder movement, move your hands, or take a few comfortable steps. Stay within an easy range.', 'Pause and notice what changed, if anything. Stop if movement hurts or adds distress.'], alternative: 'Rest and notice an external sound or object; movement is optional.', reflection: 'What would feel supportive next?' },
  { id: 'small-movement', title: 'Begin very small', minutes: 1, purpose: 'Offer a manageable starting point when action feels hard.', source: 'coping', steps: ['Notice one thing in the room without needing to change how you feel.', 'If comfortable, move a hand or adjust your position a little.', 'Choose whether to rest, repeat that small movement, or take one care action.'], alternative: 'Imagine the movement, notice a sound, or rest. Nothing has to be completed.', reflection: 'Is there one small thing you want or need now?' },
  { id: 'one-care-action', title: 'One act of care', minutes: 2, purpose: 'Choose a small, practical way to support yourself.', source: 'coping', steps: ['Ask what is manageable now: a rest, a drink of water, a quieter space, or some company.', 'Choose one option that is appropriate for you. Take your time.', 'If you want support, decide whom you trust and whether you want to contact them yourself.'], alternative: 'Rest can be the whole practice. The app will not contact anyone.', reflection: 'Did this respect what you needed?' },
  { id: 'familiar-sense', title: 'Something familiar', minutes: 2, purpose: 'Explore gentle contact with your surroundings.', source: 'grounding', steps: ['Choose a familiar, neutral texture, object, or sound.', 'Notice one detail: texture, shape, rhythm, or temperature. Use a sense that is comfortable for you.', 'Name what you noticed, even if it is very little. No emotion needs to appear.'], alternative: 'Look at an ordinary object or listen to the room. Avoid intense sensations and stop if uncomfortable.', reflection: 'Do you feel any more connected to this moment?' },
  { id: 'small-start', title: 'Make the start smaller', minutes: 5, purpose: 'Try one concrete step on something you want to do.', source: 'starting', steps: ['Name the smallest visible first action: open the file, write a title, or put one item in place.', 'Choose a short amount of time, up to five minutes. Start with that action.', 'When the time is up, decide whether to continue, ask for help, or rest. Finishing the whole task is optional.'], alternative: 'Choose Name the obstacle if the task is unclear or your available energy is low.', reflection: 'What made starting easier or harder?' },
  { id: 'name-the-obstacle', title: 'What is in the way?', minutes: 2, purpose: 'Choose support that fits the obstacle.', source: 'starting', steps: ['Ask what is making this difficult: uncertainty, worry, tiredness, distraction, or something else.', 'Match one response to that obstacle: clarify a question, reduce a distraction, ask for practical help, or rest.', 'Choose a next step only if one feels appropriate.'], alternative: 'Write or say “I need…” and leave space for an answer later.', reflection: 'What would help you begin on your own terms?' },
  { id: 'decision-pause', title: 'Time to decide', minutes: 2, purpose: 'Practice a pause before agreeing.', source: 'grounding', steps: ['Choose a comfortable position and notice one neutral detail nearby.', 'Privately rehearse “I need time to think” or “I will get back to you.” Choose words that sound like you.', 'Notice what you need to consider before answering. Decide where, if anywhere, using this pause feels appropriate and safe.'], alternative: 'Write your phrase privately instead of speaking. There is no requirement to use it with another person.', reflection: 'Did the pause give your needs more room?' },
];

export const stateById = (id) => STRESS_STATES.find((state) => state.id === id);
export const practiceById = (id) => PRACTICES.find((practice) => practice.id === id);

export const HELPFUL_OUTCOMES = ['Clearer', 'More connected', 'More able to begin', 'More settled'];

// Until September 2026 a "More uncomfortable" response hid a practice by
// itself, and people were told it would no longer be suggested. That promise
// holds: those practices count as hidden (and are saved as hidden, with
// Unhide available) until the preference below is set. Later responses ask.
export const UNCOMFORTABLE_KEPT_HIDDEN = 'uncomfortable_hidden_v1';

/** Hidden practice ids, honoring the earlier promise for older responses. */
export function hiddenPractices(preferences = {}, sessions = []) {
  const hidden = preferences.hidden_practices || [];
  if (preferences[UNCOMFORTABLE_KEPT_HIDDEN]) return hidden;
  return [...new Set([...hidden, ...sessions.filter((s) => s.outcome === 'More uncomfortable').map((s) => s.practice_id)])];
}
const times = (n) => (n === 1 ? 'once' : `${n} times`);

/**
 * Practices for a state, each with the reason it is offered. Hidden practices
 * are left out. One that felt more uncomfortable before stays available, last
 * and saying so: whether to stop suggesting it is the person's call.
 */
export function recommendPractices(stateId, sessions = [], hidden = []) {
  const state = stateById(stateId) || stateById('unsure');
  const hiddenIds = new Set([...hidden, ...sessions.filter((s) => s.status === 'hidden').map((s) => s.practice_id)]);
  return state.practices.filter((id) => !hiddenIds.has(id)).map(practiceById).filter(Boolean).map((practice, order) => {
    const responses = sessions.filter((s) => s.practice_id === practice.id);
    const uncomfortable = responses.filter((s) => s.outcome === 'More uncomfortable').length;
    const helped = responses.filter((s) => HELPFUL_OUTCOMES.includes(s.outcome)).length;
    const reason = uncomfortable ? `You noted feeling more uncomfortable after this ${times(uncomfortable)}. It's here in case it fits now.`
      : helped ? `Offered for ${state.label.toLowerCase()}. You noted it helped ${times(helped)}.`
        : `Offered for ${state.label.toLowerCase()}.`;
    return { ...practice, reason, uncomfortable, helped, order };
  }).sort((a, b) => Number(a.uncomfortable > 0) - Number(b.uncomfortable > 0) || b.helped - a.helped || a.order - b.order);
}

export const PLANT_COMPANIONS = [
  { chakra: 'Root', plant: 'Oak', focus: 'Support', question: 'What helps you feel supported in the life you have today?' },
  { chakra: 'Sacral', plant: 'Hibiscus', focus: 'Feeling', question: 'What feeling wants room without needing to be changed?' },
  { chakra: 'Solar plexus', plant: 'Sunflower', focus: 'Choice', question: 'Where do you want more room to choose for yourself?' },
  { chakra: 'Heart', plant: 'Rose', focus: 'Care & boundaries', question: 'What would care for you while respecting your boundaries?' },
  { chakra: 'Throat', plant: 'Mint', focus: 'Expression', question: 'What would you like to put into your own words?' },
  { chakra: 'Third eye', plant: 'Mugwort', focus: 'Perspective', question: 'What does the whole record show that today alone might hide?' },
  { chakra: 'Crown', plant: 'Lotus', focus: 'Connection', question: 'What connects you with something beyond this moment?' },
];
