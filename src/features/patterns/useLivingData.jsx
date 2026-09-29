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

// Merges with the latest stored values, in this tab's order (see
// preference-store). The stored row shows at once, even if a reload fails,
// but only while its entry is still cached, so a save that returns after a
// sign-out leaves nothing behind. Every save then reloads the preferences,
// one that failed too: a request abandoned as too slow may still have been
// stored, and the screen should match what is.
function storePreferences(client, userId, patch) {
  return inOrder(async () => {
    try {
      const saved = await mergePreferences(preferenceStore(VibePreference, userId), userId, patch);
      client.setQueryData(preferencesKey(userId), (old) => (old === undefined ? undefined : saved.values));
      return saved;
    } finally {
      // Replaces any fetch already under way, which could hold older values.
      client.invalidateQueries({ queryKey: preferencesKey(userId), exact: true, refetchType: 'all' }).catch(() => {});
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
  const data = useMemo(
    () => (history.data && preferences.data !== undefined ? { ...history.data, preferences: preferences.data } : undefined),
    [history.data, preferences.data],
  );
  // Reloads both and returns what they hold now, for a decision that must
  // rest on what is stored.
  const refresh = async () => {
    await Promise.all([
      client.invalidateQueries({ queryKey, exact: true }),
      client.invalidateQueries({ queryKey: preferencesKey(user?.id), exact: true }),
    ]);
    const stored = client.getQueryData(queryKey);
    const values = client.getQueryData(preferencesKey(user?.id));
    return stored && values !== undefined ? { ...stored, preferences: values } : undefined;
  };
  return {
    data,
    isLoading: history.isLoading || preferences.isLoading,
    // A reload that fails keeps what loaded on screen; only a record that
    // never loaded is an error.
    isError: !data && (history.isError || preferences.isError),
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
