// The tables the mock serves, read from supabase/migrations at test time so
// the mock can't drift from the real schema: columns, required columns (NOT
// NULL without a default), UNIQUE keys, and simple CHECK lists (col in (...),
// col between a and b). Other CHECK expressions aren't enforced.
//
// A table change this parser doesn't understand stops the tests with an
// error naming the statement, rather than letting the mock quietly refuse
// (or allow) what the real database does.
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

const MIGRATIONS = path.resolve(import.meta.dirname, '../../supabase/migrations');

// Split on a separator that isn't inside parentheses or quotes.
function splitTopLevel(text, separator) {
  const parts = [];
  let depth = 0;
  let quote = null;
  let current = '';
  for (const char of text) {
    if (quote) { if (char === quote) quote = null; current += char; continue; }
    if (char === "'" || char === '"') quote = char;
    else if (char === '(') depth += 1;
    else if (char === ')') depth -= 1;
    else if (depth === 0 && char === separator) { parts.push(current.trim()); current = ''; continue; }
    current += char;
  }
  if (current.trim()) parts.push(current.trim());
  return parts;
}

const unquote = (name) => name.replace(/"/g, '');
// A table name in the public schema ("public"."x", public.x or x), or null for another schema.
function publicTable(name) {
  const parts = unquote(name).split('.');
  if (parts.length === 1) return parts[0];
  return parts[0] === 'public' ? parts[1] : null;
}
const columnList = (text) => text.split(',').map((name) => unquote(name.trim()).split(/\s+/)[0]);

function readCheck(table, expression, name) {
  const values = expression.match(/^\(?\s*"?(\w+)"?\s+in\s*\(([^)]*)\)/i);
  const between = expression.match(/^\(?\s*"?(\w+)"?\s+between\s+(-?[\d.]+)\s+and\s+(-?[\d.]+)/i);
  const column = table.columns.get((values || between)?.[1]);
  if (!column) return;
  column.check = { name, allowed: values ? values[2].split(',').map((value) => value.trim().replace(/^'|'$/g, '')) : null, range: between ? [Number(between[2]), Number(between[3])] : null };
}

function addColumn(tableName, table, definition) {
  const [rawName, ...rest] = definition.split(/\s+/);
  const name = unquote(rawName);
  const text = rest.join(' ');
  const primary = /\bprimary key\b/i.test(text);
  table.columns.set(name, { name, notNull: primary || /\bnot null\b/i.test(text), hasDefault: /\bdefault\b/i.test(text), check: null });
  if (primary) table.unique.push({ name: `${tableName}_pkey`, columns: [name] });
  else if (/\bunique\b/i.test(text)) table.unique.push({ name: `${tableName}_${name}_key`, columns: [name] });
  const check = text.match(/\bcheck\s*\((.*)\)/i);
  if (check) readCheck(table, check[1], `${tableName}_${name}_check`);
}

function addConstraint(tableName, table, clause) {
  const named = clause.match(/^constraint\s+("?[\w]+"?)\s+(.*)$/is);
  const given = named ? unquote(named[1]) : null;
  const body = named ? named[2] : clause;
  const key = body.match(/^(unique|primary key)\s*\(([^)]*)\)/i);
  if (key) {
    const columns = columnList(key[2]);
    table.unique.push({ name: given || (key[1].toLowerCase() === 'unique' ? `${tableName}_${columns.join('_')}_key` : `${tableName}_pkey`), columns });
    return true;
  }
  const check = body.match(/^check\s*\((.*)\)$/is);
  if (check) { readCheck(table, check[1], given || `${tableName}_check`); return true; }
  return /^(foreign key|exclude)\b/i.test(body);
}

function alterTable(tableName, table, clause, where) {
  const fail = () => { throw new Error(`e2e/support/schema.js doesn't understand "${clause}" (${where}). Teach it, so the mock keeps matching the database.`); };
  let match;
  if (/^(enable|disable|force|no force) row level security$/i.test(clause) || /^(owner to|replica identity|set \(|reset \()/i.test(clause)) return;
  if ((match = clause.match(/^add\s+(constraint\s+.*|unique\s*\(.*|primary key\s*\(.*|check\s*\(.*|foreign key.*)$/is))) { if (!addConstraint(tableName, table, match[1])) fail(); return; }
  if ((match = clause.match(/^add\s+(?:column\s+)?(if not exists\s+)?(.+)$/is))) {
    const name = unquote(match[2].split(/\s+/)[0]);
    if (!(match[1] && table.columns.has(name))) addColumn(tableName, table, match[2]);
    return;
  }
  if ((match = clause.match(/^drop\s+(?:column\s+)?(?:if exists\s+)?("?\w+"?)(?:\s+(?:cascade|restrict))?$/i)) && !/^drop\s+constraint/i.test(clause)) {
    const name = unquote(match[1]);
    table.columns.delete(name);
    table.unique = table.unique.filter((key) => !key.columns.includes(name));
    return;
  }
  if ((match = clause.match(/^drop constraint\s+(?:if exists\s+)?("?\w+"?)(?:\s+(?:cascade|restrict))?$/i))) {
    const name = unquote(match[1]);
    table.unique = table.unique.filter((key) => key.name !== name);
    for (const column of table.columns.values()) if (column.check?.name === name) column.check = null;
    return;
  }
  if ((match = clause.match(/^alter\s+(?:column\s+)?("?\w+"?)\s+(.+)$/is))) {
    const column = table.columns.get(unquote(match[1]));
    const change = match[2];
    if (!column) fail();
    if (/^set not null$/i.test(change)) column.notNull = true;
    else if (/^drop not null$/i.test(change)) column.notNull = false;
    else if (/^set default\b/i.test(change)) column.hasDefault = true;
    else if (/^drop default$/i.test(change)) column.hasDefault = false;
    else if (!/^(set data type|type|set statistics|set storage)\b/i.test(change)) fail();
    return;
  }
  if ((match = clause.match(/^rename\s+(?:column\s+)?("?\w+"?)\s+to\s+("?\w+"?)$/i)) && !/^rename to/i.test(clause)) {
    const column = table.columns.get(unquote(match[1]));
    if (!column) fail();
    table.columns.delete(column.name);
    column.name = unquote(match[2]);
    table.columns.set(column.name, column);
    table.unique.forEach((key) => { key.columns = key.columns.map((name) => (name === unquote(match[1]) ? column.name : name)); });
    return;
  }
  fail();
}

/** The schema the migrations add up to, from [{ file, sql }] in the order they run. */
export function parseMigrations(migrations) {
  const tables = new Map();
  const indexes = new Map();
  for (const { file, sql: text } of migrations) {
    // Function bodies and DO blocks ($$ ... $$) don't change tables directly.
    const sql = text
      .replace(/--[^\n]*/g, '')
      .replace(/\$(\w*)\$[\s\S]*?\$\1\$/g, "''");
    for (const raw of splitTopLevel(sql, ';')) {
      const statement = raw.replace(/\s+/g, ' ').trim();
      const where = `${file}: ${statement.slice(0, 80)}`;
      let match;
      if ((match = statement.match(/^create table (if not exists )?("?[\w.]+"?(?:\."?\w+"?)?)\s*\((.*)\)[^)]*$/is))) {
        const name = publicTable(match[2]);
        if (!name || (match[1] && tables.has(name))) continue;
        const table = { columns: new Map(), unique: [] };
        tables.set(name, table);
        for (const part of splitTopLevel(match[3], ',')) {
          if (/^(constraint|unique|primary key|check|foreign key|exclude)\b/i.test(part)) addConstraint(name, table, part);
          else addColumn(name, table, part);
        }
      } else if ((match = statement.match(/^alter table (?:if exists )?(?:only )?("?[\w.]+"?(?:\."?\w+"?)?) (.+)$/is))) {
        const name = publicTable(match[1]);
        const table = name && tables.get(name);
        if (!table) continue;
        const renamed = match[2].match(/^rename to ("?\w+"?)$/i);
        if (renamed) { tables.delete(name); tables.set(unquote(renamed[1]), table); continue; }
        for (const clause of splitTopLevel(match[2], ',')) alterTable(name, table, clause, where);
      } else if ((match = statement.match(/^create (unique )?index (?:concurrently )?(?:if not exists )?("?\w+"?) on (?:only )?("?[\w.]+"?(?:\."?\w+"?)?)(?: using \w+)?\s*\(([^)]*)\)(.*)$/is))) {
        const table = tables.get(publicTable(match[3]));
        // A partial unique index (WHERE ...) only binds some rows, so the mock leaves it out.
        if (match[1] && table && !/\bwhere\b/i.test(match[5])) {
          const key = { name: unquote(match[2]), columns: columnList(match[4]) };
          table.unique.push(key);
          indexes.set(key.name, table);
        }
      } else if ((match = statement.match(/^drop index (?:concurrently )?(?:if exists )?("?[\w.]+"?)/i))) {
        const name = unquote(match[1]).split('.').pop();
        const table = indexes.get(name);
        if (table) table.unique = table.unique.filter((key) => key.name !== name);
      } else if ((match = statement.match(/^drop table (?:if exists )?(.+?)(?: cascade| restrict)?$/i))) {
        for (const name of match[1].split(',')) tables.delete(publicTable(name.trim()));
      }
    }
  }
  // What the mock needs: each column's rules, and the unique keys as column lists.
  return new Map([...tables].map(([name, table]) => [name, {
    columns: new Map([...table.columns].map(([column, info]) => [column, {
      name: column,
      required: info.notNull && !info.hasDefault,
      allowed: info.check?.allowed ?? null,
      range: info.check?.range ?? null,
    }])),
    unique: table.unique.map((key) => key.columns),
  }]));
}

export const SCHEMA = parseMigrations(readdirSync(MIGRATIONS).filter((file) => file.endsWith('.sql')).sort()
  .map((file) => ({ file, sql: readFileSync(path.join(MIGRATIONS, file), 'utf8') })));
