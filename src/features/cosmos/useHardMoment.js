import { useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import { DailyCheckIn, JournalEntry } from '@/api/entities';
import { addDaysKey, todayKey } from '@/lib/dates';
import { GUARD_DAYS, guardAnswer, keepKnownHarm, momentFromReads, settleDecision } from '@/lib/symbolic-guard';

/**
 * The latest hard moment in the last few days (see symbolic-guard), for
 * readings to wait on. Saves of check-ins and journal moments mark it stale
 * (see useLivingData). checking is true until the page has an answer, offline
 * included; a current answer then decides for the visit, so later refreshes
 * never swap an open reading for the pause (see settleDecision).
 * waitingSince is when the page began waiting. If the check fails, readings
 * show as usual. watching is false once the person chose to read anyway.
 */
export default function useHardMoment({ watching = true } = {}) {
  const { user } = useAuth();
  const client = useQueryClient();
  const queryKey = ['living', user?.id, 'hard-moment'];
  const [decided, setDecided] = useState(/** @type {{ moment: any, final: boolean } | undefined} */ (undefined));
  const query = useQuery({
    queryKey,
    queryFn: async () => {
      const since = addDaysKey(todayKey(), -(GUARD_DAYS - 1));
      const [checkIns, journal] = await Promise.allSettled([
        DailyCheckIn.since(since, 'date,mood_score'),
        JournalEntry.since(since, 'date,mood_score,interaction_feeling,boundary_respected,is_draft'),
      ]);
      return keepKnownHarm(client.getQueryData(queryKey), momentFromReads(checkIns, journal));
    },
    enabled: Boolean(user?.id),
    // An answer found from part of the record is checked again until whole,
    // while its pause is showing: not once the page has decided or the
    // person chose to read.
    staleTime: (query) => (query.state.data?.incomplete ? 0 : 60_000),
    refetchInterval: watching && !decided?.final ? (query) => (query.state.data?.incomplete ? 15_000 : false) : false,
  });
  const waitingSince = useRef(Date.now()).current;
  const answer = guardAnswer({ fetchStatus: query.fetchStatus, isPending: query.isPending, isStale: query.isStale, data: query.data });
  const settled = settleDecision(decided, answer, query.data || null);
  useEffect(() => { if (settled !== decided) setDecided(settled); }, [settled, decided]);
  return { moment: settled?.moment ?? null, checking: settled === undefined, waitingSince };
}
