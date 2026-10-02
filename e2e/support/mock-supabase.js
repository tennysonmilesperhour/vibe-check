// An in-memory stand-in for the Supabase project, answering the auth,
// PostgREST, RPC, functions and storage requests the app makes. Each test
// gets its own copy of the persona's rows, so writes never leak between tests.

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

const RESERVED = new Set(['select', 'order', 'limit', 'offset', 'on_conflict', 'columns']);

const coerce = (value) => (value === 'true' ? true : value === 'false' ? false : value === 'null' ? null : value);

// One PostgREST filter (eq.x, gte.x, in.(a,b), not.is.null, ...) as a row test.
function parseFilter(column, raw) {
  const negate = raw.startsWith('not.');
  const expr = negate ? raw.slice(4) : raw;
  const dot = expr.indexOf('.');
  const op = expr.slice(0, dot);
  const value = expr.slice(dot + 1);
  const test = (row) => {
    const cell = row[column];
    switch (op) {
      case 'eq': { const wanted = coerce(value); return typeof wanted === 'boolean' ? cell === wanted : String(cell) === String(wanted); }
      case 'neq': return String(cell) !== String(coerce(value));
      case 'gt': return cell != null && String(cell) > value;
      case 'gte': return cell != null && String(cell) >= value;
      case 'lt': return cell != null && String(cell) < value;
      case 'lte': return cell != null && String(cell) <= value;
      case 'is': return value === 'null' ? cell == null : cell === coerce(value);
      case 'in': return value.replace(/^\(|\)$/g, '').split(',').map((item) => item.replace(/^"|"$/g, '')).includes(String(cell));
      case 'like':
      case 'ilike': {
        const pattern = value.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/[*%]/g, '.*');
        return new RegExp(`^${pattern}$`, op === 'ilike' ? 'i' : '').test(String(cell ?? ''));
      }
      default: return true;
    }
  };
  return negate ? (row) => !test(row) : test;
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

/**
 * @param {{ fixture: { user: object, tables: Record<string, object[]> } | null, nowIso: string }} options
 * fixture null means signed out.
 */
export function createMockSupabase({ fixture, nowIso }) {
  const store = fixture ? structuredClone(fixture.tables) : {};
  const user = fixture?.user ?? null;
  let tick = 0;
  let ids = 0;
  const stamp = () => { tick += 1; return new Date(new Date(nowIso).getTime() + tick * 1000).toISOString(); };
  const newId = () => { ids += 1; return `e2e00000-0000-4000-8000-${String(ids).padStart(12, '0')}`; };
  /** Every write the app made: { method, table, rows }. */
  const writes = [];
  /** Requests the mock doesn't model, so a test can fail on them. */
  const unhandled = [];
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

  function auth(route, request, url) {
    const path = url.pathname.replace('/auth/v1', '');
    const method = request.method();
    if (path === '/user' && method === 'GET') {
      if (!user) return json(route, request, 401, { code: 401, error_code: 'no_authorization', msg: 'This endpoint requires a Bearer token' });
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
    unhandled.push(`${method} ${url.pathname}`);
    return json(route, request, 404, { msg: 'e2e mock: not found' });
  }

  async function rest(route, request, url) {
    const table = url.pathname.replace('/rest/v1/', '');
    if (control.delayMs && (!control.delayTables.size || control.delayTables.has(table))) await wait(control.delayMs);
    if (control.failTables.has(table)) return json(route, request, 503, { code: 'PGRST000', message: 'Could not connect to the database. Please try again shortly.', details: null, hint: null });
    const method = request.method();
    const headers = request.headers();
    if (table.startsWith('rpc/')) return json(route, request, 200, {});
    const rows = (store[table] ||= []);
    const filters = [...url.searchParams].filter(([key]) => !RESERVED.has(key)).map(([key, value]) => parseFilter(key, value));
    const matches = (row) => filters.every((test) => test(row));
    const single = (headers.accept || '').includes('vnd.pgrst.object');
    const prefer = headers.prefer || '';
    const representation = prefer.includes('return=representation');

    if (method === 'GET' || method === 'HEAD') {
      const all = applyOrder(rows.filter(matches), url.searchParams.get('order'));
      const offset = Number(url.searchParams.get('offset') || 0);
      const limit = url.searchParams.has('limit') ? Number(url.searchParams.get('limit')) : Infinity;
      const result = all.slice(offset, offset + limit);
      if (single) {
        if (result.length !== 1) return json(route, request, 406, { code: 'PGRST116', details: `The result contains ${result.length} rows`, hint: null, message: 'JSON object requested, multiple (or no) rows returned' });
        return json(route, request, 200, result[0]);
      }
      const total = prefer.includes('count=exact') ? String(all.length) : result.length ? '*' : '0';
      return json(route, request, 200, result, { 'content-range': `${result.length ? `${offset}-${offset + result.length - 1}` : '*'}/${total}` });
    }
    let body = null;
    try { body = request.postDataJSON(); } catch { body = null; }
    if (method === 'POST') {
      const items = Array.isArray(body) ? body : [body || {}];
      const upsert = prefer.includes('resolution=merge-duplicates');
      const conflict = (url.searchParams.get('on_conflict') || 'id').split(',');
      const out = items.map((item) => {
        const existing = upsert ? rows.find((row) => conflict.every((key) => item[key] !== undefined && String(row[key]) === String(item[key]))) : null;
        const at = stamp();
        if (existing) return Object.assign(existing, item, { updated_at: at });
        const row = { id: newId(), user_id: user?.id, created_at: at, updated_at: at, ...item };
        rows.push(row);
        return row;
      });
      writes.push({ method, table, rows: out });
      if (!representation) return empty(route, request, 201);
      return json(route, request, 201, single ? out[0] : out);
    }
    if (method === 'PATCH') {
      const changed = rows.filter(matches);
      const at = stamp();
      changed.forEach((row) => Object.assign(row, body || {}, { updated_at: at }));
      writes.push({ method, table, rows: changed });
      if (!representation) return empty(route, request);
      if (single) return changed.length === 1 ? json(route, request, 200, changed[0]) : json(route, request, 406, { code: 'PGRST116', message: 'JSON object requested, multiple (or no) rows returned' });
      return json(route, request, 200, changed);
    }
    if (method === 'DELETE') {
      const removed = rows.filter(matches);
      store[table] = rows.filter((row) => !matches(row));
      writes.push({ method, table, rows: removed });
      if (!representation) return empty(route, request);
      return json(route, request, 200, single ? removed[0] : removed);
    }
    unhandled.push(`${method} ${url.pathname}`);
    return json(route, request, 405, { message: 'e2e mock: method not allowed' });
  }

  /** Playwright route handler for every request to the Supabase origin. */
  async function handle(route) {
    const request = route.request();
    const url = new URL(request.url());
    if (request.method() === 'OPTIONS') return empty(route, request);
    if (url.pathname.startsWith('/auth/v1/')) return auth(route, request, url);
    if (url.pathname.startsWith('/rest/v1/')) return rest(route, request, url);
    if (url.pathname.startsWith('/functions/v1/')) return json(route, request, 200, {});
    if (url.pathname.startsWith('/storage/v1/')) return json(route, request, 200, []);
    unhandled.push(`${request.method()} ${url.pathname}`);
    return json(route, request, 404, { message: 'e2e mock: unhandled' });
  }

  return { handle, store, writes, unhandled, control };
}
