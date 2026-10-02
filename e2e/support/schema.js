// The tables the mock serves, read from supabase/migrations at test time so
// the mock can't drift from the real schema: columns, required columns (NOT
// NULL without a default), UNIQUE keys, and CHECK lists (col in (...), col
// between a and b). Other CHECK expressions and foreign keys aren't enforced.
//
// A table change this parser can't read exactly stops the tests with an
// error naming the statement, rather than letting the mock quietly refuse
// (or allow) what the real database does. Function bodies are skipped; a DO
// block that changes tables (beyond row-level security) has to be taught.
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

const MIGRATIONS = path.resolve(import.meta.dirname, '../../supabase/migrations');
const TABLE_CHANGE = /\b(create table|add column|drop column|alter column|add constraint|drop constraint|rename column|rename to|create unique index|drop index|drop table)\b/i;

const unteach = (what, where) => new Error(`e2e/support/schema.js can't read ${what} (${where}). Teach it, so the mock keeps matching the database.`);

/**
 * Comments removed, and each dollar-quoted body ($$ ... $$) replaced by '',
 * minding quotes. A DO block's body runs during the migration, so one that
 * changes tables stops the tests.
 */
function clean(sql, file) {
  let out = '';
  let i = 0;
  while (i < sql.length) {
    const rest = sql.slice(i);
    if (rest.startsWith('--')) { const end = sql.indexOf('\n', i); i = end === -1 ? sql.length : end; continue; }
    if (rest.startsWith('/*')) { const end = sql.indexOf('*/', i + 2); i = end === -1 ? sql.length : end + 2; continue; }
    const quote = sql[i] === "'" || sql[i] === '"' ? sql[i] : null;
    if (quote) {
      let j = i + 1;
      while (j < sql.length && !(sql[j] === quote && sql[j + 1] !== quote)) j += sql[j] === quote ? 2 : 1;
      out += sql.slice(i, j + 1);
      i = j + 1;
      continue;
    }
    const dollar = rest.match(/^\$(\w*)\$/);
    if (dollar) {
      const end = sql.indexOf(dollar[0], i + dollar[0].length);
      const body = sql.slice(i + dollar[0].length, end === -1 ? sql.length : end);
      if (/\bdo\s*$/i.test(out) && TABLE_CHANGE.test(body)) throw unteach('a DO block that changes tables', `${file}: ${body.trim().slice(0, 80)}`);
      out += "''";
      i = end === -1 ? sql.length : end + dollar[0].length;
      continue;
    }
    out += sql[i];
    i += 1;
  }
  return out;
}

// Split on a separator that isn't inside parentheses or quotes ('' and "" escapes included).
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

// The text inside the parentheses that open at index start, minding quotes, and the index just after them.
function parenthesized(text, start) {
  let depth = 0;
  let quote = null;
  for (let i = start; i < text.length; i += 1) {
    const char = text[i];
    if (quote) { if (char === quote) quote = null; continue; }
    if (char === "'" || char === '"') quote = char;
    else if (char === '(') depth += 1;
    else if (char === ')') { depth -= 1; if (depth === 0) return { inner: text.slice(start + 1, i), end: i + 1 }; }
  }
  return null;
}

const unquote = (name) => name.replace(/"/g, '');
const NAME = '("?\\w+"?(?:\\."?\\w+"?)?)';
// A table name in the public schema ("public"."x", public.x or x), or null for another schema.
function publicTable(name) {
  const parts = unquote(name).split('.');
  if (parts.length === 1) return parts[0];
  return parts[0] === 'public' ? parts[1] : null;
}
const columnList = (text) => splitTopLevel(text, ',').map((name) => unquote(name).split(/\s+/)[0]);
const literal = (value) => value.trim().replace(/^'([\s\S]*)'$/, '$1').replace(/''/g, "'");

// A CHECK the mock can enforce: col in (...) or col between a and b, on one column.
function readCheck(table, expression, name, where) {
  const inList = expression.match(/^\s*\(?\s*"?(\w+)"?\s+in\s*\(/i);
  const between = expression.match(/^\s*\(?\s*"?(\w+)"?\s+between\s+(-?[\d.]+)\s+and\s+(-?[\d.]+)\s*\)?\s*$/i);
  const columnName = (inList || between)?.[1];
  const column = table.columns.get(columnName);
  if (!column) return;
  const checkName = name || `${table.name}_${columnName}_check`;
  if (between) { column.checks.push({ name: checkName, allowed: null, range: [Number(between[2]), Number(between[3])] }); return; }
  const list = parenthesized(expression, inList.index + inList[0].length - 1);
  if (!list || expression.slice(list.end).replace(/[\s)]/g, '')) throw unteach(`the CHECK "${expression}"`, where);
  column.checks.push({ name: checkName, allowed: splitTopLevel(list.inner, ',').map(literal), range: null });
}

// Each CHECK in a column definition or table constraint, with its name if given.
function readChecks(table, text, where) {
  for (const match of text.matchAll(/(?:constraint\s+("?\w+"?)\s+)?check\s*\(/gi)) {
    const body = parenthesized(text, match.index + match[0].length - 1);
    if (!body) throw unteach(`the CHECK in "${text}"`, where);
    readCheck(table, body.inner, match[1] ? unquote(match[1]) : null, where);
  }
}

function addColumn(table, definition, where) {
  const [rawName, ...rest] = definition.split(/\s+/);
  const name = unquote(rawName);
  if (['constraint', 'unique', 'primary', 'check', 'foreign', 'exclude'].includes(name.toLowerCase())) throw unteach(`"${definition}"`, where);
  const text = rest.join(' ');
  const primary = /\bprimary key\b/i.test(text);
  // serial and identity columns are filled by the database, like a default.
  const hasDefault = /\bdefault\b/i.test(text) || /^(small|big)?serial\b/i.test(text) || /\bgenerated\b/i.test(text);
  table.columns.set(name, { name, notNull: primary || /\bnot null\b/i.test(text), hasDefault, checks: [] });
  if (primary) table.unique.push({ name: `${table.name}_pkey`, columns: [name] });
  else if (/\bunique\b/i.test(text)) table.unique.push({ name: `${table.name}_${name}_key`, columns: [name] });
  readChecks(table, text, where);
}

// A table constraint (in CREATE TABLE, or after ADD in ALTER TABLE).
function addConstraint(table, clause, indexes, where) {
  const named = clause.match(/^constraint\s+("?\w+"?)\s+([\s\S]*)$/i);
  const given = named ? unquote(named[1]) : null;
  const body = named ? named[2] : clause;
  const key = body.match(/^(unique|primary key)(?:\s+nulls\s+(?:not\s+)?distinct)?\s*\(/i);
  if (key) {
    const list = parenthesized(body, key[0].length - 1);
    const columns = columnList(list.inner);
    table.unique.push({ name: given || (key[1].toLowerCase() === 'unique' ? `${table.name}_${columns.join('_')}_key` : `${table.name}_pkey`), columns });
    return;
  }
  const usingIndex = body.match(/^(unique|primary key)\s+using index\s+("?\w+"?)/i);
  if (usingIndex) {
    const index = indexes.get(unquote(usingIndex[2]));
    if (!index) throw unteach(`"${clause}" (an index the parser doesn't know)`, where);
    table.unique.push({ name: given || unquote(usingIndex[2]), columns: index.columns });
    return;
  }
  if (/^check\s*\(/i.test(body)) { readChecks(table, named ? clause : body, where); return; }
  if (/^foreign key\b/i.test(body)) return;
  throw unteach(`"${clause}"`, where);
}

function alterTable(table, clause, indexes, where) {
  let match;
  if (/^(enable|disable|force|no force) row level security$/i.test(clause) || /^(owner to|replica identity|set \(|reset \()/i.test(clause)) return;
  if ((match = clause.match(/^add\s+((?:constraint|unique|primary key|check|foreign key|exclude)\b[\s\S]*)$/i))) { addConstraint(table, match[1], indexes, where); return; }
  if ((match = clause.match(/^add\s+(?:column\s+)?(if not exists\s+)?([\s\S]+)$/i))) {
    const name = unquote(match[2].split(/\s+/)[0]);
    if (!(match[1] && table.columns.has(name))) addColumn(table, match[2], where);
    return;
  }
  if ((match = clause.match(/^drop constraint\s+(?:if exists\s+)?("?\w+"?)(?:\s+(?:cascade|restrict))?$/i))) {
    const name = unquote(match[1]);
    table.unique = table.unique.filter((key) => key.name !== name);
    for (const column of table.columns.values()) column.checks = column.checks.filter((check) => check.name !== name);
    return;
  }
  if ((match = clause.match(/^drop\s+(?:column\s+)?(?:if exists\s+)?("?\w+"?)(?:\s+(?:cascade|restrict))?$/i))) {
    const name = unquote(match[1]);
    table.columns.delete(name);
    table.unique = table.unique.filter((key) => !key.columns.includes(name));
    return;
  }
  if ((match = clause.match(/^alter\s+(?:column\s+)?("?\w+"?)\s+([\s\S]+)$/i))) {
    const column = table.columns.get(unquote(match[1]));
    const change = match[2];
    if (!column) throw unteach(`"${clause}" (no such column)`, where);
    if (/^set not null$/i.test(change)) column.notNull = true;
    else if (/^drop not null$/i.test(change)) column.notNull = false;
    else if (/^set default\b/i.test(change) || /^add generated\b/i.test(change)) column.hasDefault = true;
    else if (/^drop default$/i.test(change) || /^drop identity\b/i.test(change)) column.hasDefault = false;
    else if (!/^(set data type|type|set statistics|set storage)\b/i.test(change)) throw unteach(`"${clause}"`, where);
    return;
  }
  if ((match = clause.match(/^rename\s+(?:column\s+)?("?\w+"?)\s+to\s+("?\w+"?)$/i)) && !/^rename to\b/i.test(clause)) {
    const from = unquote(match[1]);
    const column = table.columns.get(from);
    if (!column) throw unteach(`"${clause}" (no such column)`, where);
    table.columns.delete(from);
    column.name = unquote(match[2]);
    table.columns.set(column.name, column);
    table.unique.forEach((key) => { key.columns = key.columns.map((name) => (name === from ? column.name : name)); });
    return;
  }
  throw unteach(`"${clause}"`, where);
}

/** The schema the migrations add up to, from [{ file, sql }] in the order they run. */
export function parseMigrations(migrations) {
  const tables = new Map();
  // Unique indexes by name: { table, columns }.
  const indexes = new Map();
  for (const { file, sql } of migrations) {
    for (const raw of splitTopLevel(clean(sql, file), ';')) {
      const statement = raw.replace(/\s+/g, ' ').trim();
      const where = `${file}: ${statement.slice(0, 80)}`;
      let match;
      if ((match = statement.match(new RegExp(`^create table (if not exists )?${NAME}\\s*\\(`, 'i')))) {
        const name = publicTable(match[2]);
        if (!name || (match[1] && tables.has(name))) continue;
        const body = parenthesized(statement, match[0].length - 1);
        const table = { name, columns: new Map(), unique: [] };
        tables.set(name, table);
        for (const part of splitTopLevel(body.inner, ',')) {
          if (/^(constraint|unique|primary key|check|foreign key|exclude)\b/i.test(part)) addConstraint(table, part, indexes, where);
          else if (/^like\b/i.test(part)) throw unteach(`"${part}"`, where);
          else addColumn(table, part, where);
        }
      } else if ((match = statement.match(new RegExp(`^alter table (?:if exists )?(?:only )?${NAME} ([\\s\\S]+)$`, 'i')))) {
        const name = publicTable(match[1]);
        const table = name && tables.get(name);
        if (!table) continue;
        const renamed = match[2].match(/^rename to ("?\w+"?)$/i);
        if (renamed) { tables.delete(name); table.name = unquote(renamed[1]); tables.set(table.name, table); continue; }
        for (const clause of splitTopLevel(match[2], ',')) alterTable(table, clause, indexes, where);
      } else if ((match = statement.match(new RegExp(`^create (unique )?index (?:concurrently )?(?:if not exists )?("?\\w+"?) on (?:only )?${NAME}(?: using \\w+)?\\s*\\(`, 'i')))) {
        const table = tables.get(publicTable(match[3]));
        const list = parenthesized(statement, match[0].length - 1);
        // A partial unique index (WHERE ...) binds only some rows; the mock leaves it out.
        if (match[1] && table && !/\bwhere\b/i.test(statement.slice(list.end))) {
          const key = { name: unquote(match[2]), columns: columnList(list.inner) };
          table.unique.push(key);
          indexes.set(key.name, { table, columns: key.columns });
        }
      } else if ((match = statement.match(new RegExp(`^drop index (?:concurrently )?(?:if exists )?${NAME}`, 'i')))) {
        const name = unquote(match[1]).split('.').pop();
        const index = indexes.get(name);
        if (index) index.table.unique = index.table.unique.filter((key) => key.name !== name);
        indexes.delete(name);
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
      checks: info.checks.map(({ allowed, range }) => ({ allowed, range })),
    }])),
    unique: table.unique.map((key) => key.columns),
  }]));
}

export const SCHEMA = parseMigrations(readdirSync(MIGRATIONS).filter((file) => file.endsWith('.sql')).sort()
  .map((file) => ({ file, sql: readFileSync(path.join(MIGRATIONS, file), 'utf8') })));
