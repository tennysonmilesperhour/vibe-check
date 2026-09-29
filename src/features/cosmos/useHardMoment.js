import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import { DailyCheckIn, JournalEntry } from '@/api/entities';
import { GUARD_DAYS, recentHardMoment } from '@/lib/symbolic-guard';

/**
 * The latest hard moment in the last few days (see symbolic-guard), for a
 * reading to wait on. If it can't be checked, readings show as usual.
 */
export default function useHardMoment() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['living', user?.id, 'hard-moment'],
    queryFn: async () => {
      const [checkIns, journal] = await Promise.all([DailyCheckIn.list('-date', GUARD_DAYS + 2), JournalEntry.list('-date', 60)]);
      return recentHardMoment({ checkIns, journal });
    },
    enabled: Boolean(user?.id),
  });
}
