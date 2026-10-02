import { useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import { DailyCheckIn, JournalEntry, PracticeSession, ReportReflection, VibePreference, Person } from '@/api/entities';
import { timelineEntries } from '@/lib/living-patterns';
import { daysKeptThisMonth } from '@/lib/record-days';
import { todayKey } from '@/lib/dates';
import { inOrder, mergePreferences, preferenceStore } from '@/lib/preference-store';
import { recordKey } from './record-cache';

export { recordKey, putRecordRow, dropRecordRow, putRecentCheckIns } from './record-cache';

// The record in parts, each its own cached query shared by every page:
// moving between pages shows what already loaded, and a change reloads only
// the part it touched. Preferences have their own small query too
// (usePreferences), so saving one never reloads or cancels the record.
const PARTS = {
  checkIns: () => DailyCheckIn.all('-date'),
  journal: () => JournalEntry.all('-date'),
  sessions: () => PracticeSession.all('-date'),
  reflections: () => ReportReflection.all('-period_key'),
  people: () => Person.all(),
};
export const RECORD_PARTS = /** @type {Array<keyof typeof PARTS>} */ (Object.keys(PARTS));
// A part is read again when a page that uses it opens and its copy is over a
// minute old. Changes made here update it or reload it at once. Reads go out
// offline too, so a page shows that it couldn't load rather than waiting, and
// the Supabase client already retries a dropped connection, so they aren't
// retried twice over.
const STALE_MS = 60_000;
const READS = { staleTime: STALE_MS, networkMode: /** @type {const} */ ('always'), retry: false };
/** @param {string | undefined} userId @param {keyof typeof PARTS} part */
const partQuery = (userId, part) => ({ queryKey: recordKey(userId, part), queryFn: PARTS[part], enabled: Boolean(userId), ...READS });

/** One part of the record, for a page that needs only that part. */
export function useRecordPart(/** @type {keyof typeof PARTS} */ part) {
  const { user } = useAuth();
  return useQuery(partQuery(user?.id, part));
}

/**
 * One part of the record: the cached copy while it is recent, read now
 * otherwise. fresh reads it now in any case and keeps it for other pages.
 * @param {import('@tanstack/react-query').QueryClient} client
 * @param {string} userId @param {keyof typeof PARTS} part
 */
export function fetchRecordPart(client, userId, part, { fresh = false } = {}) {
  return client.fetchQuery({ ...partQuery(userId, part), ...(fresh ? { staleTime: 0 } : {}) });
}

const preferencesKey = (userId) => ['living', userId, 'preferences'];

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

/** The whole record plus preferences; data is ready once every part is. */
export function useLivingData() {
  const { user } = useAuth();
  const client = useQueryClient();
  // Five plain queries: useQueries would bring its own observer code into
  // the first load.
  const byPart = {
    checkIns: useQuery(partQuery(user?.id, 'checkIns')), journal: useQuery(partQuery(user?.id, 'journal')),
    sessions: useQuery(partQuery(user?.id, 'sessions')), reflections: useQuery(partQuery(user?.id, 'reflections')),
    people: useQuery(partQuery(user?.id, 'people')),
  };
  const results = RECORD_PARTS.map((part) => byPart[part]);
  const { checkIns: { data: checkIns }, journal: { data: journal }, sessions: { data: sessions }, reflections: { data: reflections }, people: { data: people } } = byPart;
  const preferences = usePreferences();
  const entries = useMemo(() => (checkIns && journal ? timelineEntries(checkIns, journal) : undefined), [checkIns, journal]);
  const data = useMemo(() => (
    entries && sessions && reflections && people && preferences.data !== undefined
      ? { checkIns, journal, sessions, reflections, people, entries, preferences: preferences.data }
      : undefined
  ), [checkIns, journal, sessions, reflections, people, entries, preferences.data]);
  // What the cache holds now for every part, or nothing while a part is missing.
  const cached = () => {
    const rows = Object.fromEntries(RECORD_PARTS.map((part) => [part, client.getQueryData(recordKey(user?.id, part))]));
    const stored = client.getQueryData(preferencesKey(user?.id));
    if (RECORD_PARTS.some((part) => rows[part] === undefined) || stored === undefined) return undefined;
    return { ...rows, entries: timelineEntries(rows.checkIns, rows.journal), preferences: stored };
  };
  // Reloads the parts asked for (all of them unless told; the preferences
  // too, when asked) and returns what is stored now, or nothing when a reload
  // failed or waits for the network, so a decision never rests on an older copy.
  const refresh = async ({ parts = RECORD_PARTS, withPreferences = false } = {}) => {
    const started = Date.now();
    const keys = [...parts.map((part) => recordKey(user?.id, part)), ...(withPreferences ? [preferencesKey(user?.id)] : [])];
    // A saved or removed entry can change whether readings wait (useHardMoment).
    client.invalidateQueries({ queryKey: ['living', user?.id, 'hard-moment'], exact: true }).catch(() => {});
    await Promise.all(keys.map((key) => client.invalidateQueries({ queryKey: key, exact: true })));
    const fresh = keys.every((key) => {
      const state = client.getQueryState(key);
      return state?.status === 'success' && state.dataUpdatedAt >= started;
    });
    return fresh ? cached() : undefined;
  };
  const failed = results.some((result) => result.isError) || preferences.isError;
  return {
    data,
    isLoading: results.some((result) => result.isLoading) || preferences.isLoading,
    // A reload that fails keeps what loaded on screen; only a record that
    // never loaded is an error. reloadFailed says a reload failed since.
    isError: !data && failed,
    reloadFailed: Boolean(data) && failed,
    isFetching: results.some((result) => result.isFetching) || preferences.isFetching,
    isSuccess: Boolean(data),
    error: results.find((result) => result.error)?.error || preferences.error,
    refetch: () => Promise.all([...results.map((result) => result.refetch()), preferences.refetch()]),
    refresh,
    savePreferences: preferences.savePreferences,
  };
}

/**
 * The days kept this month, for the sidebar: counted from the check-ins a page
 * has loaded, or from a small read of this month's dates when none has, so a
 * page that never needs the history doesn't download it for a count.
 */
export function useDaysKeptThisMonth() {
  const { user } = useAuth();
  const loaded = useQuery({ ...partQuery(user?.id, 'checkIns'), enabled: false }).data;
  const today = todayKey();
  const month = today.slice(0, 7);
  const dates = useQuery({
    queryKey: ['living', user?.id, 'month-days', month],
    queryFn: () => DailyCheckIn.since(`${month}-01`, 'date'),
    enabled: Boolean(user?.id) && !loaded,
    ...READS,
  }).data;
  const rows = loaded || dates;
  return rows ? daysKeptThisMonth(rows, today) : null;
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
