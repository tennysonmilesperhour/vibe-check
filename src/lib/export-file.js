// The complete export: everything Vibe Check keeps for an account in one
// portable file, and the reader that opens an export again inside the app.
// Nothing here uploads or stores anything.
import { decryptJson } from './crypto.js';
import { validDateKey } from './living-patterns.js';

/** The tables in a complete export, in the order the viewer lists them. */
export const EXPORT_TABLES = [
  ['daily_check_ins', 'Check-ins'],
  ['vibe_journal_entries', 'Journal entries'],
  ['vibe_checkin_drafts', 'Unfinished check-ins'],
  ['people', 'People'],
  ['vibe_practice_sessions', 'Practice responses'],
  ['vibe_report_reflections', 'Report reflections'],
  ['readings', 'Card readings'],
  ['boundary_alerts', 'Low-mood notices'],
  ['healing_progress', 'Practice board items'],
  ['vibe_preferences', 'Preferences'],
  ['cosmic_wisdom', 'Earlier AI wisdom'],
];

// Kept from a retired feature: listed only when the account has some.
const RETIRED_TABLES = new Set(['cosmic_wisdom']);

// What a file of chosen entries (format 1) holds.
const SELECTED_PARTS = [['entries', 'Entries'], ['practice_sessions', 'Practice responses'], ['report_reflections', 'Report reflections']];

// What the Settings export held before September 2026. Those files have no
// app name; the earliest call low-mood notices "alerts".
const EARLIER_PARTS = [
  ['check_ins', 'Check-ins'], ['people', 'People'], ['readings', 'Card readings'], ['wisdom', 'Earlier AI wisdom'],
  ['boundary_alerts', 'Low-mood notices'], ['alerts', 'Low-mood notices'], ['legacy_healing_items', 'Practice board items'],
];

export const EXPORT_SCOPE = 'Everything Vibe Check stores for this account, except the dates of requests to its retired AI features. Settings kept only on one device are not included.';

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
    scope: EXPORT_SCOPE,
    profile,
    counts: Object.fromEntries(Object.entries(data).map(([key, rows]) => [key, rows.length])),
    tables: data,
  };
}

/** @param {any} value */
const isEncrypted = (value) => Boolean(value) && typeof value === 'object' && value.cipher === 'AES-256-GCM' && typeof value.data === 'string';

/**
 * Which kind of Vibe Check export a parsed file is, or null.
 * @param {any} value
 * @returns {'complete' | 'selected' | 'earlier' | null}
 */
function exportKind(value) {
  if (!value || typeof value !== 'object') return null;
  if (value.app === 'Vibe Check') return value.kind === 'complete' ? 'complete' : 'selected';
  if (typeof value.export_date === 'string' && Array.isArray(value.check_ins)) return 'earlier';
  return null;
}

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
  if (!exportKind(value)) throw new Error('This file is not a Vibe Check export.');
  return { document: value };
}

/** @param {unknown} value @returns {any[]} */
const rowsOf = (value) => (Array.isArray(value) ? value.filter((row) => row && typeof row === 'object' && !Array.isArray(row)) : []);

/** @param {unknown} value */
const textOf = (value) => (typeof value === 'string' ? value : '');

/** @param {any} entry */
const stampOf = (entry) => textOf(entry.occurred_at) || textOf(entry.created_at);

/**
 * Check-ins and journal entries, newest first, shaped as the journal shows
 * them. Unlike the app's timeline it keeps unfinished journal entries, and
 * it holds up against a hand-edited file.
 * @param {any[]} checkIns @param {any[]} journal
 */
function fileTimeline(checkIns, journal) {
  return [
    ...checkIns.map((row, i) => ({ ...row, kind: 'day', key: `day:${row.id ?? i}` })),
    ...journal.map((row, i) => ({ ...row, entry_kind: row.kind, kind: 'journal', key: `journal:${row.id ?? i}` })),
  ].filter((entry) => validDateKey(entry.date))
    .sort((a, b) => b.date.localeCompare(a.date) || stampOf(b).localeCompare(stampOf(a)) || a.key.localeCompare(b.key));
}

/** @param {any} entry */
const personIds = (entry) => [entry.person_ids, entry.high_moment?.person_ids, entry.low_moment?.person_ids]
  .flatMap((list) => (Array.isArray(list) ? list : []))
  .filter((id) => typeof id === 'string');

/**
 * What the viewer shows for an opened export: its kind, when it was made
 * or what it covers, counts by kind of record, its check-ins and journal
 * entries newest first, and the people those entries name.
 * @param {any} document
 */
export function summarizeExport(document) {
  const kind = exportKind(document);
  if (kind === 'complete') {
    const tables = document.tables && typeof document.tables === 'object' ? document.tables : {};
    return {
      kind,
      exportedAt: textOf(document.exported_at) || null,
      range: null,
      counts: EXPORT_TABLES.map(([key, label]) => ({ key, label, count: rowsOf(tables[key]).length }))
        .filter(({ key, count }) => count > 0 || !RETIRED_TABLES.has(key)),
      entries: fileTimeline(rowsOf(tables.daily_check_ins), rowsOf(tables.vibe_journal_entries)),
      people: rowsOf(tables.people),
    };
  }
  if (kind === 'earlier') {
    return {
      kind,
      exportedAt: textOf(document.export_date) || null,
      range: null,
      counts: EARLIER_PARTS.filter(([key]) => Array.isArray(document[key])).map(([key, label]) => ({ key, label, count: rowsOf(document[key]).length })),
      entries: fileTimeline(rowsOf(document.check_ins), []),
      people: rowsOf(document.people),
    };
  }
  // Chosen entries: names may have been replaced with labels like "Person 1",
  // and the people themselves are not in the file.
  const entries = rowsOf(document?.entries);
  const range = document?.range && typeof document.range === 'object' ? document.range : null;
  return {
    kind: 'selected',
    exportedAt: null,
    range: range && validDateKey(range.start) && validDateKey(range.end) ? { start: range.start, end: range.end } : null,
    counts: SELECTED_PARTS.map(([key, label]) => ({ key, label, count: rowsOf(document?.[key]).length })),
    entries,
    people: [...new Set(entries.flatMap(personIds))].map((id) => ({ id, name: /^Person \d+$/.test(id) ? id : 'Unnamed person' })),
  };
}
