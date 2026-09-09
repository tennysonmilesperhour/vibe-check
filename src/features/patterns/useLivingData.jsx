import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import { DailyCheckIn, JournalEntry, PracticeSession, ReportReflection, VibePreference, Person } from '@/api/entities';
import { timelineEntries } from '@/lib/living-patterns';

export async function fetchLivingData() {
  const [checkIns, journal, sessions, reflections, preferences, people] = await Promise.all([
    DailyCheckIn.all('-date'), JournalEntry.all('-date'), PracticeSession.all('-date'),
    ReportReflection.all('-period_key'), VibePreference.list(), Person.all(),
  ]);
  return { checkIns, journal, sessions, reflections, preferences: preferences[0]?.values || {}, people, entries: timelineEntries(checkIns, journal) };
}

export function useLivingData() {
  const { user } = useAuth();
  const client = useQueryClient();
  const queryKey = ['living', user?.id];
  const query = useQuery({ queryKey, queryFn: fetchLivingData, enabled: Boolean(user?.id), staleTime: 0 });
  const refresh = () => client.invalidateQueries({ queryKey });
  const savePreferences = async (patch) => {
    const [row] = await VibePreference.list();
    const result = await VibePreference.upsert({ values: { ...(row?.values || {}), ...patch } }, 'user_id');
    await refresh();
    return result;
  };
  return { ...query, refresh, savePreferences };
}
