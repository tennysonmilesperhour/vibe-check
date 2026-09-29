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

// Merges with the latest stored values, then refreshes every ['living', user]
// query (the full history and the preferences-only one below). A function
// patch is given the latest stored values, so a list is changed from what is
// stored now, not from an older copy on this device.
// Writes from this tab run one at a time, so two quick changes can't both
// start from the same stored values and drop one another.
let writes = Promise.resolve();
function storePreferences(client, userId, patch) {
  const write = writes.then(async () => {
    const [row] = await VibePreference.list();
    const current = row?.values || {};
    return VibePreference.upsert({ values: { ...current, ...(typeof patch === 'function' ? patch(current) : patch) } }, 'user_id');
  });
  writes = write.catch(() => {});
  return write.then(async (result) => {
    await client.invalidateQueries({ queryKey: ['living', userId] });
    return result;
  });
}

export function useLivingData() {
  const { user } = useAuth();
  const client = useQueryClient();
  const queryKey = ['living', user?.id];
  const query = useQuery({ queryKey, queryFn: fetchLivingData, enabled: Boolean(user?.id), staleTime: 0 });
  // Just the history: preferences have their own query and change on their own.
  const refresh = () => client.invalidateQueries({ queryKey, exact: true });
  const savePreferences = (patch) => storePreferences(client, user?.id, patch);
  return { ...query, refresh, savePreferences };
}

/** Just the preferences: one small request, for controls that must show at once. */
export function usePreferences() {
  const { user } = useAuth();
  const client = useQueryClient();
  const query = useQuery({
    queryKey: ['living', user?.id, 'preferences'],
    queryFn: async () => (await VibePreference.list())[0]?.values || {},
    enabled: Boolean(user?.id),
  });
  const savePreferences = (patch) => storePreferences(client, user?.id, patch);
  return { ...query, savePreferences };
}
