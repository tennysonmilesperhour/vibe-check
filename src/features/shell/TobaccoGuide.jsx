import { Leaf } from 'lucide-react';

export default function TobaccoGuide({ children, compact = false }) {
  return <aside className={`tobacco-guide ${compact ? 'tobacco-guide-compact' : ''}`} aria-label="Tobacco, voice of the plants">
    <span className="tobacco-seal" aria-hidden="true"><Leaf size={22} /></span>
    <div><p className="sanctuary-eyebrow">TOBACCO · VOICE OF THE PLANTS</p><div className="tobacco-words">{children}</div></div>
  </aside>;
}
