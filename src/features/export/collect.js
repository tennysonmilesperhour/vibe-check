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

/**
 * Every row of a table, oldest first, so a row saved during the export
 * lands at the end rather than shifting the pages. Reading goes on until a
 * page comes back empty: a short page is not the end when the server caps
 * pages below the size asked for. A row seen twice is kept once.
 */
async function readAll(entity, signal) {
  const rows = [];
  const seen = new Set();
  for (let offset = 0; ;) {
    const page = await entity.list('created_date', PAGE, offset, { signal });
    if (!page.length) return rows;
    offset += page.length;
    for (const row of page) {
      if (seen.has(row.id)) continue;
      seen.add(row.id);
      rows.push(row);
    }
  }
}

/**
 * Reads everything, every page of every table, or throws: never a partial
 * file. One failure stops the other reads, as does the caller's signal.
 * @param {{ signal?: AbortSignal }} [options]
 */
export async function collectCompleteExport({ signal } = {}) {
  const reads = new AbortController();
  const stop = () => reads.abort();
  signal?.addEventListener('abort', stop);
  try {
    const [me, ...rows] = await Promise.all([base44.auth.me(), ...EXPORT_SOURCES.map(([, entity]) => readAll(entity, reads.signal))]);
    const { email, full_name, cosmic_profile, boundary_settings, people_migrated_at } = me;
    return buildCompleteExport({
      profile: { email, full_name, cosmic_profile, boundary_settings, people_migrated_at },
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
