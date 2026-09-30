import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import { DailyCheckIn, JournalEntry } from '@/api/entities';
import { addDaysKey, todayKey } from '@/lib/dates';
import { GUARD_DAYS, guardWaiting, recentHardMoment, settleDecision } from '@/lib/symbolic-guard';

/**
 * The latest hard moment in the last few days (see symbolic-guard), for
 * readings to wait on. Saves of check-ins and journal moments mark it stale
 * (see useLivingData). The first current answer after the page opens decides
 * for the visit: checking is true until then, offline included, and later
 * refreshes never swap an open reading for the pause. waitingSince is when
 * the page began waiting. If the check fails, readings show as usual.
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
  const waitingSince = useRef(Date.now()).current;
  const current = query.data || null;
  const [decided, setDecided] = useState(/** @type {typeof current | undefined} */ (undefined));
  const settled = settleDecision(decided, guardWaiting(query), current);
  useEffect(() => { if (decided === undefined && settled !== undefined) setDecided(settled); }, [decided, settled]);
  return { moment: settled ?? null, checking: settled === undefined, waitingSince };
}
