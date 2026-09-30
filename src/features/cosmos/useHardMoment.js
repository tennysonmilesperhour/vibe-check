import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import { DailyCheckIn, JournalEntry } from '@/api/entities';
import { addDaysKey, todayKey } from '@/lib/dates';
import { GUARD_DAYS, recentHardMoment } from '@/lib/symbolic-guard';

/**
 * The latest hard moment in the last few days (see symbolic-guard), for
 * readings to wait on. Saves of check-ins and journal moments mark it stale
 * (see useLivingData). The first current answer after the page opens decides
 * for the visit: checking is true until then, and later refreshes never swap
 * an open reading for the pause. If nothing can be read, offline included,
 * readings show as usual.
 */
export default function useHardMoment() {
  const { user } = useAuth();
  const query = useQuery({
    queryKey: ['living', user?.id, 'hard-moment'],
    queryFn: async () => {
      const since = addDaysKey(todayKey(), -(GUARD_DAYS - 1));
      const [checkIns, journal] = await Promise.allSettled([
        DailyCheckIn.since(since, 'date,mood_score'),
        JournalEntry.since(since, 'date,mood_score,interaction_feeling,boundary_respected,is_draft'),
      ]);
      if (checkIns.status === 'rejected' && journal.status === 'rejected') throw checkIns.reason;
      return recentHardMoment({
        checkIns: checkIns.status === 'fulfilled' ? checkIns.value : [],
        journal: journal.status === 'fulfilled' ? journal.value : [],
      });
    },
    enabled: Boolean(user?.id),
    staleTime: 60_000,
  });
  // Waiting on a request that can answer now: not paused offline, not
  // disabled, not failed.
  const unanswered = query.fetchStatus === 'fetching' && (query.isPending || query.isStale);
  const current = query.data || null;
  const [decision, setDecision] = useState(/** @type {typeof current | undefined} */ (undefined));
  useEffect(() => { if (!unanswered && decision === undefined) setDecision(current); }, [unanswered, decision, current]);
  if (decision !== undefined) return { moment: decision, checking: false };
  return { moment: unanswered ? null : current, checking: unanswered };
}
