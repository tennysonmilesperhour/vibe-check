import { useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import { DailyCheckIn, JournalEntry, PracticeSession, ReportReflection, VibePreference, Person } from '@/api/entities';
import { timelineEntries } from '@/lib/living-patterns';
import { inOrder, mergePreferences, preferenceStore } from '@/lib/preference-store';

// The whole history, without preferences: those have their own small query
// (usePreferences), so saving one never reloads or cancels the history.
export async function fetchLivingData() {
  const [checkIns, journal, sessions, reflections, people] = await Promise.all([
    DailyCheckIn.all('-date'), JournalEntry.all('-date'), PracticeSession.all('-date'),
    ReportReflection.all('-period_key'), Person.all(),
  ]);
  return { checkIns, journal, sessions, reflections, people, entries: timelineEntries(checkIns, journal) };
}

const preferencesKey = (userId) => ['living', userId, 'preferences'];
const combine = (history, preferences) => (history && preferences !== undefined ? { ...history, preferences } : undefined);

// Merges with the latest stored values, in this tab's order (see
// preference-store). Then, whether it worked or not: any read begun before
// the change landed, a first load too, is dropped so it can't land after it;
// the stored row shows at once, but only while its entry is still cached, so
// a save that returns after a sign-out leaves nothing behind; and the
// preferences reload, since a request abandoned as too slow may still have
// been stored and the screen should match what is.
function storePreferences(client, userId, patch) {
  const key = preferencesKey(userId);
  return inOrder(async () => {
    let saved;
    try {
      saved = await mergePreferences(preferenceStore(VibePreference, userId), userId, patch);
      return saved;
    } finally {
      await client.cancelQueries({ queryKey: key, exact: true });
      if (saved) client.setQueryData(key, (old) => (old === undefined ? undefined : saved.values));
      client.invalidateQueries({ queryKey: key, exact: true, refetchType: 'all' }).catch(() => {});
    }
  });
}

/** The whole history plus preferences; data is ready once both are. */
export function useLivingData() {
  const { user } = useAuth();
  const client = useQueryClient();
  const queryKey = ['living', user?.id];
  const history = useQuery({ queryKey, queryFn: fetchLivingData, enabled: Boolean(user?.id), staleTime: 0 });
  const preferences = usePreferences();
  const data = useMemo(() => combine(history.data, preferences.data), [history.data, preferences.data]);
  // Reloads the history (and the preferences, when asked) and returns what is
  // stored now, or nothing when a reload failed or waits for the network, so
  // a decision never rests on an older copy.
  const refresh = async ({ withPreferences = false } = {}) => {
    const started = Date.now();
    const keys = withPreferences ? [queryKey, preferencesKey(user?.id)] : [queryKey];
    await Promise.all(keys.map((key) => client.invalidateQueries({ queryKey: key, exact: true })));
    const fresh = keys.every((key) => {
      const state = client.getQueryState(key);
      return state?.status === 'success' && state.dataUpdatedAt >= started;
    });
    return fresh ? combine(client.getQueryData(queryKey), client.getQueryData(preferencesKey(user?.id))) : undefined;
  };
  return {
    data,
    isLoading: history.isLoading || preferences.isLoading,
    // A reload that fails keeps what loaded on screen; only a record that
    // never loaded is an error. isStale says a reload failed since.
    isError: !data && (history.isError || preferences.isError),
    isStale: Boolean(data) && (history.isError || preferences.isError),
    isSuccess: Boolean(data),
    error: history.error || preferences.error,
    refetch: () => Promise.all([history.refetch(), preferences.refetch()]),
    refresh,
    savePreferences: preferences.savePreferences,
  };
}

/** Just the preferences: one small request, for controls that must show at once. */
export function usePreferences() {
  const { user } = useAuth();
  const client = useQueryClient();
  const query = useQuery({
    queryKey: preferencesKey(user?.id),
    queryFn: async () => (await VibePreference.list())[0]?.values || {},
    enabled: Boolean(user?.id),
  });
  const savePreferences = (patch) => storePreferences(client, user?.id, patch);
  return { ...query, savePreferences };
}
