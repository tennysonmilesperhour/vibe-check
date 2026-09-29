import { useState } from 'react';
import PlantVoice from '@/features/shell/PlantVoice';
import CosmicWisdomCard from '@/components/cosmic/CosmicWisdomCard';
import ReadingPause from './ReadingPause';
import useHardMoment from './useHardMoment';

/** Daily, weekly, monthly and yearly readings from the systems the person chose. */
export default function SymbolicReadings() {
  const hard = useHardMoment();
  const [showAnyway, setShowAnyway] = useState(false);
  if (hard.data && !showAnyway) return <ReadingPause moment={hard.data} onShowAnyway={() => setShowAnyway(true)} />;
  return (
    <div className="space-y-6">
      <PlantVoice>These systems offer another way to reflect. Let your own words and experiences remain the ground beneath each interpretation.</PlantVoice>
      <div className="grid md:grid-cols-2 gap-4">{['daily', 'weekly', 'monthly', 'yearly'].map((period) => <CosmicWisdomCard key={period} periodType={period} />)}</div>
    </div>
  );
}
