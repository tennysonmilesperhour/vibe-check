import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import { DailyCheckIn, JournalEntry } from '@/api/entities';
import { addDaysKey, todayKey } from '@/lib/dates';
import { GUARD_DAYS, guardAnswer, recentHardMoment, settleDecision } from '@/lib/symbolic-guard';

/**
 * The latest hard moment in the last few days (see symbolic-guard), for
 * readings to wait on. Saves of check-ins and journal moments mark it stale
 * (see useLivingData). checking is true until the page has an answer, offline
 * included; a current answer then decides for the visit, so later refreshes
 * never swap an open reading for the pause (see settleDecision).
 * waitingSince is when the page began waiting. If the check fails, readings
 * show as usual.
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
  const answer = guardAnswer({ fetchStatus: query.fetchStatus, isPending: query.isPending, isStale: query.isStale, data: query.data });
  const [decided, setDecided] = useState(/** @type {{ moment: any, final: boolean } | undefined} */ (undefined));
  const settled = settleDecision(decided, answer, query.data || null);
  useEffect(() => { if (settled !== decided) setDecided(settled); }, [settled, decided]);
  return { moment: settled?.moment ?? null, checking: settled === undefined, waitingSince };
}
