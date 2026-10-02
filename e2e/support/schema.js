// The tables the mock serves, read from supabase/migrations at test time so
// the mock can't drift from the real schema: columns, NOT NULL columns
// without a default, UNIQUE keys, and simple CHECK lists (col in (...),
// col between a and b). Other CHECK expressions aren't enforced.
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

const MIGRATIONS = path.resolve(import.meta.dirname, '../../supabase/migrations');

// Split on commas that aren't inside parentheses or quotes.
function splitTopLevel(text) {
  const parts = [];
  let depth = 0;
  let quoted = false;
  let current = '';
  for (const char of text) {
    if (char === "'") quoted = !quoted;
    if (!quoted && char === '(') depth += 1;
    if (!quoted && char === ')') depth -= 1;
    if (!quoted && depth === 0 && char === ',') { parts.push(current.trim()); current = ''; continue; }
    current += char;
  }
  if (current.trim()) parts.push(current.trim());
  return parts;
}

// The text inside the parentheses that open at index start.
function enclosed(text, start) {
  let depth = 0;
  for (let i = start; i < text.length; i += 1) {
    if (text[i] === '(') depth += 1;
    if (text[i] === ')') { depth -= 1; if (depth === 0) return text.slice(start + 1, i); }
  }
  return text.slice(start + 1);
}

const columnList = (text) => text.split(',').map((name) => name.trim().replace(/"/g, ''));

function addColumn(table, definition) {
  const [rawName] = definition.split(/\s+/);
  const name = rawName.replace(/"/g, '');
  const lower = definition.toLowerCase();
  const column = { name, required: lower.includes('not null') && !lower.includes('default') && !lower.includes('primary key'), allowed: null, range: null };
  const values = lower.match(/check\s*\(\s*"?\w+"?\s+in\s*\(([^)]*)\)/);
  if (values) column.allowed = values[1].split(',').map((value) => value.trim().replace(/^'|'$/g, ''));
  const between = lower.match(/check\s*\(\s*"?\w+"?\s+between\s+(-?[\d.]+)\s+and\s+(-?[\d.]+)/);
  if (between) column.range = [Number(between[1]), Number(between[2])];
  table.columns.set(name, column);
  if (/\bunique\b/.test(lower)) table.unique.push([name]);
  if (/\bprimary key\b/.test(lower)) table.unique.push([name]);
}

function loadSchema() {
  const tables = new Map();
  const files = readdirSync(MIGRATIONS).filter((file) => file.endsWith('.sql')).sort();
  for (const file of files) {
    const sql = readFileSync(path.join(MIGRATIONS, file), 'utf8').replace(/--[^\n]*/g, '');
    for (const match of sql.matchAll(/create table (?:if not exists )?public\.(\w+)\s*\(/gi)) {
      const table = { columns: new Map(), unique: [] };
      tables.set(match[1], table);
      for (const part of splitTopLevel(enclosed(sql, match.index + match[0].length - 1))) {
        const lower = part.toLowerCase();
        const unique = lower.match(/^(?:constraint\s+\w+\s+)?unique\s*\(([^)]*)\)/);
        const primary = lower.match(/^(?:constraint\s+\w+\s+)?primary key\s*\(([^)]*)\)/);
        if (unique || primary) table.unique.push(columnList((unique || primary)[1]));
        else if (!/^(constraint|check|foreign key|exclude)\b/.test(lower)) addColumn(table, part);
      }
    }
    for (const match of sql.matchAll(/alter table (?:if exists )?(?:only )?public\.(\w+)\s+add column (?:if not exists )?([^;]+);/gi)) {
      const table = tables.get(match[1]);
      if (table) addColumn(table, match[2].trim());
    }
    for (const match of sql.matchAll(/alter table (?:if exists )?(?:only )?public\.(\w+)\s+drop column (?:if exists )?"?(\w+)"?/gi)) {
      tables.get(match[1])?.columns.delete(match[2]);
    }
    for (const match of sql.matchAll(/create unique index (?:if not exists )?\w+ on public\.(\w+)\s*(?:using \w+\s*)?\(([^)]*)\)/gi)) {
      tables.get(match[1])?.unique.push(columnList(match[2]));
    }
  }
  return tables;
}

export const SCHEMA = loadSchema();
