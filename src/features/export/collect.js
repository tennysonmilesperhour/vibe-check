import { base44 } from '@/api/base44Client';
import {
  DailyCheckIn, JournalEntry, CheckInDraft, Person, PracticeSession, ReportReflection,
  Reading, BoundaryAlert, HealingProgress, VibePreference, CosmicWisdom,
} from '@/api/entities';
import { buildCompleteExport, EXPORT_TABLES } from '@/lib/export-file';

// Where each exported table is read from. Every table account deletion
// removes is here, except the request log of the retired AI features, which
// the app cannot read.
const ENTITIES = {
  daily_check_ins: DailyCheckIn,
  vibe_journal_entries: JournalEntry,
  vibe_checkin_drafts: CheckInDraft,
  people: Person,
  vibe_practice_sessions: PracticeSession,
  vibe_report_reflections: ReportReflection,
  readings: Reading,
  boundary_alerts: BoundaryAlert,
  healing_progress: HealingProgress,
  vibe_preferences: VibePreference,
  cosmic_wisdom: CosmicWisdom,
};

/** Each table in the export with the entity it is read from. */
export const EXPORT_SOURCES = EXPORT_TABLES.map(([key]) => {
  if (!ENTITIES[key]) throw new Error(`No source for the exported table ${key}`);
  return [key, ENTITIES[key]];
});

const PAGE = 500;

/** @param {any} row */
const createdAt = (row) => (typeof row.created_at === 'string' ? row.created_at : '');

/**
 * Every row of a table, oldest first. Pages follow the last id read, so a
 * row deleted meanwhile cannot make the next page skip one.
 */
async function readAll(entity, signal) {
  const first = await entity.pageAfter(null, PAGE, { withTotal: true, signal });
  const rows = [...first.rows];
  // The first page is the whole table when it holds the total counted with
  // it. Otherwise read on until a page comes back empty: a short page alone
  // may be the server's cap rather than the end.
  if (first.total === null || rows.length < first.total) {
    for (let page = first.rows; page.length;) {
      page = (await entity.pageAfter(page.at(-1).id, PAGE, { signal })).rows;
      rows.push(...page);
    }
  }
  return rows.sort((a, b) => createdAt(a).localeCompare(createdAt(b)) || String(a.id).localeCompare(String(b.id)));
}

/**
 * Reads everything, every page of every table, or throws: never a partial
 * file. One failure stops the other reads, as does the caller's signal.
 * @param {{ signal?: AbortSignal }} [options]
 */
export async function collectCompleteExport({ signal } = {}) {
  if (signal?.aborted) throw new DOMException('The export was stopped.', 'AbortError');
  const reads = new AbortController();
  const stop = () => reads.abort();
  signal?.addEventListener('abort', stop);
  try {
    const [me, ...rows] = await Promise.all([base44.auth.me(), ...EXPORT_SOURCES.map(([, entity]) => readAll(entity, reads.signal))]);
    const { email, full_name, cosmic_profile, boundary_settings, people_migrated_at, created_date, updated_date } = me;
    return buildCompleteExport({
      profile: { email, full_name, cosmic_profile, boundary_settings, people_migrated_at, created_at: created_date, updated_at: updated_date },
      tables: Object.fromEntries(EXPORT_SOURCES.map(([key], i) => [key, rows[i]])),
      exportedAt: new Date().toISOString(),
    });
  } catch (err) {
    reads.abort();
    throw err;
  } finally {
    signal?.removeEventListener('abort', stop);
  }
}
