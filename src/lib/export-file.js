// The complete export: everything Vibe Check keeps for an account in one
// portable file, and the reader that opens an export again inside the app.
// Nothing here uploads or stores anything.
import { decryptJson } from './crypto.js';
import { entryText, timelineEntries } from './living-patterns.js';

/** The tables in a complete export, in the order the viewer lists them. */
export const EXPORT_TABLES = [
  ['daily_check_ins', 'Check-ins'],
  ['vibe_journal_entries', 'Journal entries'],
  ['vibe_checkin_drafts', 'Unfinished check-ins'],
  ['people', 'People'],
  ['vibe_practice_sessions', 'Practice responses'],
  ['vibe_report_reflections', 'Report reflections'],
  ['readings', 'Tarot readings'],
  ['boundary_alerts', 'Low-mood notices'],
  ['healing_progress', 'Healing board items'],
  ['vibe_preferences', 'Preferences'],
];

const SELECTED_LABELS = { entries: 'Entries', practice_sessions: 'Practice responses', report_reflections: 'Report reflections' };

// Rows as stored: the internal owner id and the app's duplicate date names go.
/** @param {Record<string, any>} row */
const asStored = (row) => {
  const { user_id: _owner, created_date: _created, updated_date: _updated, ...rest } = row || {};
  return rest;
};

/**
 * @param {{ profile: Record<string, any>, tables: Record<string, any[]>, exportedAt: string }} input
 */
export function buildCompleteExport({ profile, tables, exportedAt }) {
  const data = Object.fromEntries(EXPORT_TABLES.map(([key]) => [key, (tables[key] || []).map(asStored)]));
  return {
    app: 'Vibe Check',
    format_version: 2,
    kind: 'complete',
    exported_at: exportedAt,
    scope: 'Everything Vibe Check stores for this account. Settings kept only on one device are not included.',
    profile,
    counts: Object.fromEntries(Object.entries(data).map(([key, rows]) => [key, rows.length])),
    tables: data,
  };
}

/** @param {any} value */
const isEncrypted = (value) => Boolean(value) && typeof value === 'object' && value.cipher === 'AES-256-GCM' && typeof value.data === 'string';

/**
 * Opens the text of an export file. An encrypted file without its password
 * reports that it needs one.
 * @param {string} text @param {string} [password]
 * @returns {Promise<{ encrypted: true } | { document: any }>}
 */
export async function openExportFile(text, password) {
  let value;
  try { value = JSON.parse(text); } catch { throw new Error('This file is not a Vibe Check export.'); }
  if (isEncrypted(value)) {
    if (!password) return { encrypted: true };
    try { value = await decryptJson(value, password); } catch { throw new Error('That password did not open this file.'); }
  }
  if (value?.app !== 'Vibe Check') throw new Error('This file is not a Vibe Check export.');
  return { document: value };
}

/** @param {unknown} value */
const rowsOf = (value) => (Array.isArray(value) ? value.filter((row) => row && typeof row === 'object') : []);

/**
 * What the viewer shows for an opened export: its kind, when it covers,
 * counts by kind of record, and its check-ins and journal entries, newest
 * first.
 * @param {any} document
 */
export function summarizeExport(document) {
  const complete = document.kind === 'complete';
  const rows = complete
    ? timelineEntries(rowsOf(document.tables?.daily_check_ins), rowsOf(document.tables?.vibe_journal_entries))
    : rowsOf(document.entries);
  const counts = complete
    ? EXPORT_TABLES.map(([key, label]) => ({ key, label, count: rowsOf(document.tables?.[key]).length }))
    : Object.entries(SELECTED_LABELS).map(([key, label]) => ({ key, label, count: rowsOf(document[key]).length }));
  return {
    complete,
    exportedAt: document.exported_at || null,
    range: document.range || null,
    counts,
    entries: rows.map((/** @type {any} */ entry) => ({
      key: entry.key || `${entry.kind}:${entry.id}`,
      date: entry.date,
      label: entry.kind === 'day' ? 'Check-in' : entry.entry_kind === 'interaction' || entry.interaction_feeling ? 'Interaction' : 'Journal',
      mood: entry.mood_score ?? null,
      text: entryText(entry),
    })),
  };
}
