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
// preference-store). What was stored shows at once, in the same order, even
// if a reload fails: a fetch already under way is dropped rather than let
// it land older values, and only entries still cached are updated, so a
// save that returns after a sign-out leaves nothing behind.
function storePreferences(client, userId, patch) {
  return inOrder(async () => {
    const saved = await mergePreferences(preferenceStore(VibePreference, userId), userId, patch);
    await client.cancelQueries({ queryKey: ['living', userId] });
    client.setQueryData(['living', userId, 'preferences'], (old) => (old === undefined ? undefined : saved.values));
    client.setQueryData(['living', userId], (old) => (old === undefined ? undefined : { ...old, preferences: saved.values }));
    client.invalidateQueries({ queryKey: ['living', userId] }).catch(() => {});
    return saved;
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
