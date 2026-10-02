// An in-memory stand-in for the Supabase project. It answers the requests
// the app makes and refuses what the real project would: tables and columns
// the migrations don't define (schema.js), a missing required column, a
// second row for a unique key, a value outside a CHECK list, and a row that
// isn't the signed-in person's (row-level security). Each refusal, and any
// request the mock doesn't model, goes into `faults`, which fails the test.
// Each test gets its own copy of the persona's rows.
import { SCHEMA } from './schema.js';

export const SUPABASE_ORIGIN = 'https://mockproj.supabase.co';
// supabase-js keeps the session under sb-<project ref>-auth-token.
export const STORAGE_KEY = 'sb-mockproj-auth-token';

const base64url = (text) => Buffer.from(text).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const NEVER = 4102444800; // 2100-01-01, so sessions never expire under the fixed test clock

function fakeJwt(user) {
  const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const claims = base64url(JSON.stringify({
    aud: 'authenticated', exp: NEVER, iat: 1790000000, iss: `${SUPABASE_ORIGIN}/auth/v1`, sub: user.id,
    email: user.email, role: 'authenticated', aal: 'aal1', session_id: 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee', is_anonymous: false,
  }));
  return `${header}.${claims}.bW9jaw`;
}

/** A stored session for the user, as supabase-js writes it to localStorage. */
export function makeSession(user) {
  return { access_token: fakeJwt(user), token_type: 'bearer', expires_in: 3600, expires_at: NEVER, refresh_token: 'e2e-refresh-token', user };
}

// Query parameters that aren't filters.
const RESERVED = new Set(['select', 'order', 'limit', 'offset', 'on_conflict', 'columns']);
// The functions the app calls (supabase.functions.invoke).
const FUNCTIONS = { 'delete-account': () => ({ deleted: true }) };

const coerce = (value) => (value === 'true' ? true : value === 'false' ? false : value === 'null' ? null : value);

// Compares a cell with a filter value as PostgREST would: numbers as numbers.
function compare(cell, value) {
  if (typeof cell === 'number' && value !== '' && !Number.isNaN(Number(value))) return cell - Number(value);
  return String(cell).localeCompare(String(value));
}

// One PostgREST filter (eq.x, gte.x, in.(a,b), is.null, not.eq.x), or null when the app uses an operator this mock doesn't model.
function parseFilter(column, raw) {
  const negate = raw.startsWith('not.');
  const expr = negate ? raw.slice(4) : raw;
  const dot = expr.indexOf('.');
  const op = expr.slice(0, dot);
  const value = expr.slice(dot + 1);
  const tests = {
    eq: (cell) => { const wanted = coerce(value); return typeof wanted === 'boolean' ? cell === wanted : cell != null && compare(cell, wanted) === 0; },
    neq: (cell) => cell != null && compare(cell, coerce(value)) !== 0,
    gt: (cell) => cell != null && compare(cell, value) > 0,
    gte: (cell) => cell != null && compare(cell, value) >= 0,
    lt: (cell) => cell != null && compare(cell, value) < 0,
    lte: (cell) => cell != null && compare(cell, value) <= 0,
    is: (cell) => (value === 'null' ? cell == null : cell === coerce(value)),
    in: (cell) => value.replace(/^\(|\)$/g, '').split(',').map((item) => item.replace(/^"|"$/g, '')).includes(String(cell)),
  };
  const test = tests[op];
  if (!test) return null;
  return negate ? (row) => !test(row[column]) : (row) => test(row[column]);
}

function applyOrder(rows, order) {
  if (!order) return rows;
  const keys = order.split(',').map((part) => { const [column, direction = 'asc'] = part.split('.'); return { column, desc: direction === 'desc' }; });
  return [...rows].sort((a, b) => {
    for (const { column, desc } of keys) {
      const x = a[column];
      const y = b[column];
      if (x === y) continue;
      if (x == null) return 1;
      if (y == null) return -1;
      const cmp = typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y));
      if (cmp !== 0) return desc ? -cmp : cmp;
    }
    return 0;
  });
}

// Whose row this is, for row-level security: profiles are keyed by the person's id.
const ownerOf = (table, row) => (table === 'profiles' ? row.id : row.user_id);

/**
 * @param {{ fixture: { user: object, tables: Record<string, object[]> } | null, nowIso: string }} options
 * fixture null means signed out.
 */
export function createMockSupabase({ fixture, nowIso }) {
  const user = fixture?.user ?? null;
  const token = user ? makeSession(user).access_token : null;
  const store = {};
  let tick = 0;
  let ids = 0;
  const stamp = () => { tick += 1; return new Date(new Date(nowIso).getTime() + tick * 1000).toISOString(); };
  const newId = () => { ids += 1; return `e2e00000-0000-4000-8000-${String(ids).padStart(12, '0')}`; };
  /** Every write the app made: { method, table, rows }. */
  const writes = [];
  /** Auth calls, as "METHOD /path". */
  const authCalls = [];
  /** What the real project would refuse, or what the mock doesn't model. */
  const faults = [];
  // Levers for loading and error states: tables that answer slowly or fail.
  const control = { delayMs: 0, delayTables: new Set(), failTables: new Set() };
  const wait = (ms) => new Promise((resolve) => { setTimeout(resolve, ms); });

  const cors = (request) => ({
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'GET,POST,PATCH,PUT,DELETE,OPTIONS,HEAD',
    'access-control-allow-headers': request.headers()['access-control-request-headers'] || 'authorization, apikey, content-type, x-client-info, prefer, accept, accept-profile, content-profile, range, x-supabase-api-version',
    'access-control-expose-headers': 'content-range, x-supabase-api-version',
  });
  const json = (route, request, status, body, extra = {}) => route.fulfill({
    status, headers: { ...cors(request), 'content-type': 'application/json; charset=utf-8', ...extra }, body: JSON.stringify(body),
  });
  const empty = (route, request, status = 204) => route.fulfill({ status, headers: cors(request), body: '' });
  // A refusal the real project would give, recorded as a fault.
  const refuse = (route, request, status, code, message) => {
    faults.push(`${request.method()} ${new URL(request.url()).pathname}: ${message}`);
    return json(route, request, status, { code, message, details: null, hint: null });
  };

  function auth(route, request, url) {
    const path = url.pathname.replace('/auth/v1', '');
    const method = request.method();
    authCalls.push(`${method} ${path}`);
    if (path === '/user' && method === 'GET') {
      if (!user || request.headers().authorization !== `Bearer ${token}`) return json(route, request, 401, { code: 401, error_code: 'no_authorization', msg: 'This endpoint requires a Bearer token' });
      return json(route, request, 200, user);
    }
    if (path === '/user' && method === 'PUT') return json(route, request, 200, user);
    if (path === '/token') {
      const grant = url.searchParams.get('grant_type');
      if (grant === 'refresh_token' && user) return json(route, request, 200, makeSession(user));
      return json(route, request, 400, { code: 400, error_code: 'invalid_credentials', msg: 'Invalid login credentials' });
    }
    if (path === '/signup') {
      const body = request.postDataJSON() || {};
      return json(route, request, 200, { id: 'e2e0000a-0000-4000-8000-000000000001', aud: 'authenticated', role: 'authenticated', email: body.email, confirmation_sent_at: nowIso, app_metadata: { provider: 'email', providers: ['email'] }, user_metadata: body.data || {}, identities: [], created_at: nowIso, updated_at: nowIso, is_anonymous: false });
    }
    if (['/otp', '/recover', '/resend'].includes(path)) return json(route, request, 200, {});
    if (path === '/logout') return empty(route, request);
    if (path === '/settings') return json(route, request, 200, { external: { email: true }, disable_signup: false, mailer_autoconfirm: false });
    faults.push(`${method} ${url.pathname}: auth endpoint the mock doesn't model`);
    return json(route, request, 404, { msg: 'e2e mock: not found' });
  }

  // Checks a row the app wants to write against the schema and row-level security.
  function invalid(table, schema, row, { insert }) {
    const unknown = Object.keys(row).filter((column) => !schema.columns.has(column));
    if (unknown.length) return [400, 'PGRST204', `Could not find the '${unknown[0]}' column of '${table}' in the schema cache`];
    if (insert) {
      const missing = [...schema.columns.values()].find((column) => column.required && row[column.name] == null);
      if (missing) return [400, '23502', `null value in column "${missing.name}" of relation "${table}" violates not-null constraint`];
    }
    for (const [name, value] of Object.entries(row)) {
      if (value == null) continue;
      const broken = schema.columns.get(name).checks.some(({ allowed, range }) => (allowed && !allowed.includes(String(value))) || (range && (Number(value) < range[0] || Number(value) > range[1])));
      if (broken) return [400, '23514', `new row for relation "${table}" violates check constraint on "${name}"`];
    }
    if (ownerOf(table, row) !== undefined && ownerOf(table, row) !== user?.id) return [403, '42501', `new row violates row-level security policy for table "${table}"`];
    return null;
  }

  // The persona's rows go in by the same rules as the app's writes, so the
  // tests never run on data the real database couldn't hold.
  const fixtureProblems = [];
  for (const [table, rows] of Object.entries(fixture?.tables ?? {})) {
    const schema = SCHEMA.get(table);
    if (!schema) { fixtureProblems.push(`${table}: no migration creates it`); continue; }
    store[table] = [];
    for (const row of structuredClone(rows)) {
      const problem = invalid(table, schema, row, { insert: true });
      const clash = schema.unique.find((key) => store[table].some((other) => key.every((column) => row[column] != null && String(other[column]) === String(row[column]))));
      if (problem) fixtureProblems.push(`${table} ${row.id}: ${problem[2]}`);
      else if (clash) fixtureProblems.push(`${table} ${row.id}: repeats the unique key (${clash.join(', ')})`);
      else store[table].push(row);
    }
  }
  if (fixtureProblems.length) throw new Error(`The persona doesn't fit the schema:\n${fixtureProblems.join('\n')}`);

  async function rest(route, request, url) {
    const table = url.pathname.replace('/rest/v1/', '');
    if (control.delayMs && (!control.delayTables.size || control.delayTables.has(table))) await wait(control.delayMs);
    if (control.failTables.has(table)) return json(route, request, 503, { code: 'PGRST000', message: 'Could not connect to the database. Please try again shortly.', details: null, hint: null });
    const method = request.method();
    const headers = request.headers();
    const schema = SCHEMA.get(table);
    if (!schema) return refuse(route, request, 404, 'PGRST205', `Could not find the table 'public.${table}' in the schema cache`);
    // Signed in means the persona's own token; anything else reads as anonymous, which row-level security shows nothing.
    const signedIn = Boolean(user) && headers.authorization === `Bearer ${token}`;
    const rows = (store[table] ||= []);
    const filters = [];
    for (const [key, value] of url.searchParams) {
      if (RESERVED.has(key)) continue;
      if (!schema.columns.has(key)) return refuse(route, request, 400, '42703', `column ${table}.${key} does not exist`);
      const filter = parseFilter(key, value);
      if (!filter) return refuse(route, request, 400, 'PGRST100', `filter ${key}=${value} isn't one the mock models`);
      filters.push(filter);
    }
    const visible = (row) => signedIn && ownerOf(table, row) === user.id;
    const matches = (row) => visible(row) && filters.every((test) => test(row));
    const selectParam = url.searchParams.get('select') || '*';
    const selected = selectParam === '*' ? null : selectParam.split(',').map((column) => column.trim());
    if (selected?.some((column) => !schema.columns.has(column))) return refuse(route, request, 400, '42703', `select=${selectParam} asks for a column ${table} doesn't have, or an embedded resource the mock doesn't model`);
    const project = (row) => (selected ? Object.fromEntries(selected.map((column) => [column, row[column]])) : row);
    const single = (headers.accept || '').includes('vnd.pgrst.object');
    const prefer = headers.prefer || '';
    const representation = prefer.includes('return=representation');

    if (method === 'GET' || method === 'HEAD') {
      const all = applyOrder(rows.filter(matches), url.searchParams.get('order'));
      const offset = Number(url.searchParams.get('offset') || 0);
      const limit = url.searchParams.has('limit') ? Number(url.searchParams.get('limit')) : Infinity;
      const result = all.slice(offset, offset + limit).map(project);
      if (single) {
        if (result.length !== 1) return json(route, request, 406, { code: 'PGRST116', details: `The result contains ${result.length} rows`, hint: null, message: 'JSON object requested, multiple (or no) rows returned' });
        return json(route, request, 200, result[0]);
      }
      const total = prefer.includes('count=exact') ? String(all.length) : result.length ? '*' : '0';
      return json(route, request, 200, result, { 'content-range': `${result.length ? `${offset}-${offset + result.length - 1}` : '*'}/${total}` });
    }
    if (!signedIn) return refuse(route, request, 401, '42501', `permission denied for table ${table}`);
    let body = null;
    try { body = request.postDataJSON(); } catch { body = null; }
    if (method === 'POST') {
      const items = Array.isArray(body) ? body : [body || {}];
      const upsert = prefer.includes('resolution=merge-duplicates');
      const conflict = upsert ? (url.searchParams.get('on_conflict') || 'id').split(',') : null;
      if (conflict && !schema.unique.some((key) => key.length === conflict.length && key.every((column) => conflict.includes(column)))) {
        return refuse(route, request, 400, '42P10', `there is no unique or exclusion constraint matching the ON CONFLICT specification (${conflict.join(',')})`);
      }
      const out = [];
      for (const item of items) {
        const existing = conflict ? rows.find((row) => conflict.every((column) => item[column] !== undefined && String(row[column]) === String(item[column]))) : null;
        const problem = invalid(table, schema, item, { insert: !existing });
        if (problem) return refuse(route, request, ...problem);
        const at = stamp();
        if (existing) { Object.assign(existing, item, { updated_at: at }); out.push(existing); continue; }
        const row = { id: newId(), created_at: at, updated_at: at, ...item };
        const clash = schema.unique.find((key) => rows.some((other) => key.every((column) => row[column] != null && String(other[column]) === String(row[column]))));
        if (clash) return refuse(route, request, 409, '23505', `duplicate key value violates unique constraint (${clash.join(', ')}) on ${table}`);
        rows.push(row);
        out.push(row);
      }
      writes.push({ method, table, rows: out });
      if (!representation) return empty(route, request, 201);
      return json(route, request, 201, single ? project(out[0]) : out.map(project));
    }
    if (method === 'PATCH') {
      const problem = invalid(table, schema, body || {}, { insert: false });
      if (problem) return refuse(route, request, ...problem);
      const changed = rows.filter(matches);
      const at = stamp();
      changed.forEach((row) => Object.assign(row, body || {}, { updated_at: at }));
      writes.push({ method, table, rows: changed });
      if (!representation) return empty(route, request);
      if (single) return changed.length === 1 ? json(route, request, 200, project(changed[0])) : json(route, request, 406, { code: 'PGRST116', message: 'JSON object requested, multiple (or no) rows returned' });
      return json(route, request, 200, changed.map(project));
    }
    if (method === 'DELETE') {
      const removed = rows.filter(matches);
      store[table] = rows.filter((row) => !matches(row));
      writes.push({ method, table, rows: removed });
      if (!representation) return empty(route, request);
      return json(route, request, 200, single ? project(removed[0]) : removed.map(project));
    }
    return refuse(route, request, 405, 'PGRST000', `${method} isn't a method the mock models`);
  }

  /** Playwright route handler for every request to the Supabase origin. */
  async function handle(route) {
    const request = route.request();
    const url = new URL(request.url());
    if (request.method() === 'OPTIONS') return empty(route, request);
    if (url.pathname.startsWith('/auth/v1/')) return auth(route, request, url);
    if (url.pathname.startsWith('/rest/v1/rpc/')) return refuse(route, request, 404, 'PGRST202', `the app called ${url.pathname}, which the mock doesn't model`);
    if (url.pathname.startsWith('/rest/v1/')) return rest(route, request, url);
    const fn = url.pathname.match(/^\/functions\/v1\/([\w-]+)$/)?.[1];
    if (fn && FUNCTIONS[fn] && request.method() === 'POST') {
      writes.push({ method: 'POST', table: `functions/${fn}`, rows: [] });
      return json(route, request, 200, FUNCTIONS[fn]());
    }
    return refuse(route, request, 404, 'PGRST000', `the app called ${request.method()} ${url.pathname}, which the mock doesn't model`);
  }

  return { handle, store, writes, authCalls, faults, control };
}
