// The complete export: everything Vibe Check keeps for an account in one
// portable file, and the reader that opens an export again inside the app.
// Nothing here uploads or stores anything.
import { decryptJson } from './crypto.js';
import { timelineEntries, validDateKey } from './living-patterns.js';

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

// Fields in a chosen-entries export that hold fixed answers, dates or
// times, which are never rewritten; feeling words, matched only against
// whole saved names unless they run to several words. Everything else, what the person wrote and anything
// copied from it into the report, gets every kind of name match, so a field
// this list does not know about errs toward replacing.
const FIXED_FIELDS = new Set([
  'date', 'period_key', 'start', 'end', 'occurred_at', 'created_at', 'updated_at', 'kind', 'entry_kind', 'type', 'period_type',
  'status', 'outcome', 'alignment', 'interaction_feeling', 'boundary_respected', 'stress_measure', 'practice_id', 'state_id', 'state',
  'state_ids', 'asked_steps', 'body_cues', 'app', 'scope', 'format_version',
]);
const WHOLE_NAMES_ONLY = new Set(['emotions']);

/**
 * A chosen-entries export without internal owner ids, and with people's
 * names replaced when a replacer is given (see peopleNameReplacer).
 * @param {any} document
 * @param {((text: string, options?: { parts?: boolean | 'phrase' }) => string) | null} replaceNames
 */
export function redactExport(document, replaceNames) {
  /** @returns {any} */
  const clean = (/** @type {any} */ value, key = '', wholeOnly = false) => {
    if (Array.isArray(value)) return value.map((child) => clean(child, key, wholeOnly));
    if (value && typeof value === 'object') {
      return Object.fromEntries(Object.entries(value).filter(([name]) => name !== 'user_id')
        .map(([name, child]) => [name, clean(child, name, wholeOnly || WHOLE_NAMES_ONLY.has(name))]));
    }
    if (!replaceNames || typeof value !== 'string' || FIXED_FIELDS.has(key)) return value;
    // A feeling phrase of several words ("Missing Jordan") gets every match.
    return replaceNames(value, { parts: wholeOnly ? 'phrase' : true });
  };
  return clean(document);
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
const personIds = (entry) => [entry.person_ids, entry.high_moment?.person_ids, entry.low_moment?.person_ids]
  .flatMap((list) => (Array.isArray(list) ? list : []))
  .filter((id) => typeof id === 'string');

// For a file that does not carry the people its entries name. Chosen-entry
// files may have replaced names with labels like "Person 1" or
// "Removed person 1".
/** @param {any[]} entries */
const peopleNamedBy = (entries) => [...new Set(entries.flatMap(personIds))].map((id) => ({ id, name: /^(Removed person|Person) \d+$/.test(id) ? id : 'Unnamed person' }));

/**
 * Counts by kind of record in an opened export.
 * @param {any} document
 * @returns {{ key: string, label: string, count: number }[]}
 */
export function exportCounts(document) {
  const kind = exportKind(document);
  if (kind === 'complete') {
    const tables = document.tables && typeof document.tables === 'object' ? document.tables : {};
    return EXPORT_TABLES.map(([key, label]) => ({ key, label, count: rowsOf(tables[key]).length }))
      .filter(({ key, count }) => count > 0 || !RETIRED_TABLES.has(key));
  }
  if (kind === 'earlier') return EARLIER_PARTS.filter(([key]) => Array.isArray(document[key])).map(([key, label]) => ({ key, label, count: rowsOf(document[key]).length }));
  return SELECTED_PARTS.map(([key, label]) => ({ key, label, count: rowsOf(document?.[key]).length }));
}

/**
 * What the viewer shows for an opened export: its kind, when it was made
 * or what it covers, counts by kind of record, its check-ins and journal
 * entries newest first (unfinished ones too), and the people those entries
 * name.
 * @param {any} document
 */
export function summarizeExport(document) {
  const kind = exportKind(document);
  const counts = exportCounts(document);
  if (kind === 'complete') {
    const tables = document.tables && typeof document.tables === 'object' ? document.tables : {};
    return {
      kind, counts, range: null,
      exportedAt: textOf(document.exported_at) || null,
      entries: timelineEntries(rowsOf(tables.daily_check_ins), rowsOf(tables.vibe_journal_entries), { drafts: true }),
      people: rowsOf(tables.people),
    };
  }
  if (kind === 'earlier') {
    const entries = timelineEntries(rowsOf(document.check_ins), []);
    return {
      kind, counts, range: null,
      exportedAt: textOf(document.export_date) || null,
      entries,
      // The earliest of these files did not include people.
      people: Array.isArray(document.people) ? rowsOf(document.people) : peopleNamedBy(entries),
    };
  }
  const entries = rowsOf(document?.entries);
  const range = document?.range && typeof document.range === 'object' ? document.range : null;
  return {
    kind: 'selected', counts, exportedAt: null,
    range: range && validDateKey(range.start) && validDateKey(range.end) ? { start: range.start, end: range.end } : null,
    entries,
    people: peopleNamedBy(entries),
  };
}
