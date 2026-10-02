import PlantVoice from '@/features/shell/PlantVoice';
import CosmicWisdomCard from '@/components/cosmic/CosmicWisdomCard';
import LoadingState from '@/features/shell/LoadingState';

/**
 * Daily, weekly, monthly and yearly readings from the profile on this page,
 * saved or not. They wait for the saved profile, so another one never shows.
 */
export default function SymbolicReadings({ profile, profileLoad = 'ready' }) {
  if (profileLoad === 'loading') return <LoadingState label="One moment…" className="justify-center py-10" />;
  if (profileLoad === 'error') return <p className="living-muted text-sm text-center py-10">Readings come from your saved profile, which hasn't loaded.</p>;
  return (
    <div className="space-y-6">
      <PlantVoice>These systems offer another way to reflect. Let your own words and experiences remain the ground beneath each interpretation.</PlantVoice>
      <div className="grid md:grid-cols-2 gap-4">{['daily', 'weekly', 'monthly', 'yearly'].map((period) => <CosmicWisdomCard key={period} periodType={period} profile={profile} />)}</div>
    </div>
  );
}
