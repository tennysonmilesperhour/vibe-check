import { base44 } from '@/api/base44Client';
import {
  DailyCheckIn, JournalEntry, CheckInDraft, Person, PracticeSession, ReportReflection,
  Reading, BoundaryAlert, HealingProgress, VibePreference,
} from '@/api/entities';
import { buildCompleteExport } from '@/lib/export-file';

// Every table the app keeps for an account that it can read back: the same
// list account deletion removes, less the two the app no longer uses.
const SOURCES = {
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
};

/** Reads everything, every page of every table, or throws: never a partial file. */
export async function collectCompleteExport() {
  const [me, ...rows] = await Promise.all([base44.auth.me(), ...Object.values(SOURCES).map((entity) => entity.all())]);
  const { email, full_name, cosmic_profile, boundary_settings, people_migrated_at } = me;
  return buildCompleteExport({
    profile: { email, full_name, cosmic_profile, boundary_settings, people_migrated_at },
    tables: Object.fromEntries(Object.keys(SOURCES).map((key, i) => [key, rows[i]])),
    exportedAt: new Date().toISOString(),
  });
}
