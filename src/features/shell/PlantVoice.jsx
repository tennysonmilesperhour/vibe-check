import { Leaf } from 'lucide-react';

/** The plants speak together as the app's guide voice. */
export default function PlantVoice({ children, compact = false }) {
  return <aside className={`plant-voice ${compact ? 'plant-voice-compact' : ''}`} aria-label="The plants">
    <span className="plant-voice-seal" aria-hidden="true"><Leaf size={22} /></span>
    <div><p className="sanctuary-eyebrow">THE PLANTS</p><div className="plant-voice-words">{children}</div></div>
  </aside>;
}
