import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import { DailyCheckIn, JournalEntry, PracticeSession, ReportReflection, VibePreference, Person } from '@/api/entities';
import { timelineEntries } from '@/lib/living-patterns';
import { inOrder, mergePreferences, preferenceStore } from '@/lib/preference-store';

export async function fetchLivingData() {
  const [checkIns, journal, sessions, reflections, preferences, people] = await Promise.all([
    DailyCheckIn.all('-date'), JournalEntry.all('-date'), PracticeSession.all('-date'),
    ReportReflection.all('-period_key'), VibePreference.list(), Person.all(),
  ]);
  return { checkIns, journal, sessions, reflections, preferences: preferences[0]?.values || {}, people, entries: timelineEntries(checkIns, journal) };
}

// Merges with the latest stored values, in this tab's order (see
// preference-store). What was stored shows at once, even if the reload of
// every ['living', user] query after it fails.
async function storePreferences(client, userId, patch) {
  const saved = await inOrder((turn) => mergePreferences(preferenceStore(VibePreference, userId), userId, patch, { giveUp: () => turn.late }));
  client.setQueryData(['living', userId, 'preferences'], saved.values);
  client.setQueryData(['living', userId], (old) => (old ? { ...old, preferences: saved.values } : old));
  await client.invalidateQueries({ queryKey: ['living', userId] });
  return saved;
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
