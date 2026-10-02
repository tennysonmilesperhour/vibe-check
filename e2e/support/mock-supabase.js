// A stand-in for the Supabase project: auth and functions answered here, and
// every table request translated to SQL and run in the migrated Postgres
// (database.js) as the signed-in person, with their JWT claims, so types,
// constraints and the migrations' row-level security apply as they do live.
// A request Postgres refuses, or one this mock doesn't model, goes into
// `faults`, which fails the test unless the test expects it.
// Each test starts from the persona's rows alone.

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
const COMPARISONS = { eq: '=', neq: '<>', gt: '>', gte: '>=', lt: '<', lte: '<=' };

const quoted = (name) => `"${name}"`;
// The status PostgREST answers a Postgres error with.
function statusFor(code, signedIn) {
  if (code === '42501') return signedIn ? 403 : 401;
  if (code === '23505' || code === '23503') return 409;
  if (/^(22|23|42)/.test(code)) return 400;
  return 500;
}

// Empties every table, then puts the persona in as its own rows, through the database's rules.
async function loadPersona({ db, columns }, fixture) {
  await db.exec(`truncate ${[...columns.keys()].map((table) => `public.${quoted(table)}`).join(', ')}, auth.users cascade`);
  if (!fixture) return;
  const { user, tables } = fixture;
  await db.transaction(async (tx) => {
    // The sign-up trigger makes the profile row; the persona's profile updates it.
    await tx.query('insert into auth.users (id, email, raw_user_meta_data) values ($1, $2, $3::text::jsonb)', [user.id, user.email, JSON.stringify(user.user_metadata ?? {})]);
    for (const [table, rows] of Object.entries(tables)) {
      if (!rows.length) continue;
      if (!columns.has(table)) throw new Error(`The persona fills ${table}, which no migration creates.`);
      const keys = [...new Set(rows.flatMap((row) => Object.keys(row)))];
      const unknown = keys.filter((key) => !columns.get(table).has(key));
      if (unknown.length) throw new Error(`The persona's ${table} rows have columns no migration defines: ${unknown.join(', ')}.`);
      const list = keys.map(quoted).join(', ');
      const merge = table === 'profiles' ? ` on conflict ("id") do update set ${keys.map((key) => `${quoted(key)} = excluded.${quoted(key)}`).join(', ')}` : '';
      try {
        await tx.query(`insert into public.${quoted(table)} (${list}) select ${list} from json_populate_recordset(null::public.${quoted(table)}, $1::text::json)${merge}`, [JSON.stringify(rows)]);
      } catch (error) {
        throw new Error(`The persona's ${table} rows don't fit the database: ${error.message}`);
      }
    }
  });
}

/**
 * @param {{ database: { db: import('@electric-sql/pglite').PGlite, columns: Map<string, Map<string, string>> }, fixture: { user: object, tables: Record<string, object[]> } | null, nowIso: string }} options
 * fixture null means signed out.
 */
export async function createMockSupabase({ database, fixture, nowIso }) {
  const { db, columns } = database;
  await loadPersona(database, fixture);
  const user = fixture?.user ?? null;
  const token = user ? makeSession(user).access_token : null;
  /** Every write the app made: { method, table, rows } with the rows as stored. */
  const writes = [];
  /** Auth calls, as "METHOD /path". */
  const authCalls = [];
  /** What the database refused, or the mock doesn't model: { text, url }. */
  const faultLog = [];
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
  // A refusal, as the real project would give it, recorded as a fault.
  const refuse = (route, request, status, code, message) => {
    faultLog.push({ text: `${request.method()} ${new URL(request.url()).pathname}: ${code} ${message}`, url: request.url() });
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
    return refuse(route, request, 404, 'not_found', "auth endpoint the mock doesn't model");
  }

  // Runs the statements as the person making the request: their role, and their JWT claims for auth.uid().
  const asRequester = (signedIn, run) => db.transaction(async (tx) => {
    await tx.exec(signedIn ? 'set local role authenticated' : 'set local role anon');
    await tx.query(`select set_config('request.jwt.claims', $1, true)`, [JSON.stringify(signedIn ? { sub: user.id, email: user.email, role: 'authenticated' } : { role: 'anon' })]);
    return run(tx);
  });

  async function rest(route, request, url) {
    const table = url.pathname.replace('/rest/v1/', '');
    if (control.delayMs && (!control.delayTables.size || control.delayTables.has(table))) await wait(control.delayMs);
    if (control.failTables.has(table)) return json(route, request, 503, { code: 'PGRST000', message: 'Could not connect to the database. Please try again shortly.', details: null, hint: null });
    const method = request.method();
    const headers = request.headers();
    const tableColumns = columns.get(table);
    if (!tableColumns) return refuse(route, request, 404, 'PGRST205', `Could not find the table 'public.${table}' in the schema cache`);
    const signedIn = Boolean(user) && headers.authorization === `Bearer ${token}`;
    const params = [];
    // A value from the URL, cast to the column's type as PostgREST casts it.
    const value = (column, text) => { params.push(text); return `($${params.length}::text)::${tableColumns.get(column)}`; };

    const conditions = [];
    for (const [column, raw] of url.searchParams) {
      if (RESERVED.has(column)) continue;
      if (!tableColumns.has(column)) return refuse(route, request, 400, '42703', `column ${table}.${column} does not exist`);
      const negate = raw.startsWith('not.');
      const expr = negate ? raw.slice(4) : raw;
      const op = expr.slice(0, expr.indexOf('.'));
      const operand = expr.slice(expr.indexOf('.') + 1);
      let condition = null;
      if (COMPARISONS[op]) condition = `t.${quoted(column)} ${COMPARISONS[op]} ${value(column, operand)}`;
      else if (op === 'is' && ['null', 'true', 'false'].includes(operand)) condition = `t.${quoted(column)} is ${operand}`;
      else if (op === 'in') condition = `t.${quoted(column)} in (${operand.replace(/^\(|\)$/g, '').split(',').map((item) => value(column, item.replace(/^"|"$/g, ''))).join(', ')})`;
      if (!condition) return refuse(route, request, 400, 'PGRST100', `filter ${column}=${raw} isn't one the mock models`);
      conditions.push(negate ? `not (${condition})` : condition);
    }
    const where = conditions.length ? ` where ${conditions.join(' and ')}` : '';
    const selectParam = url.searchParams.get('select') || '*';
    const selected = selectParam === '*' ? null : selectParam.split(',').map((column) => column.trim());
    if (selected?.some((column) => !tableColumns.has(column))) return refuse(route, request, 400, '42703', `select=${selectParam} asks for a column ${table} doesn't have, or an embedded resource the mock doesn't model`);
    const returned = selected ? selected.map((column) => `t.${quoted(column)}`).join(', ') : 't.*';
    const single = (headers.accept || '').includes('vnd.pgrst.object');
    const prefer = headers.prefer || '';
    const target = `public.${quoted(table)} as t`;
    const asJson = (statement) => `with changed as (${statement}) select coalesce(json_agg(changed), '[]'::json) as body from changed`;

    let sql;
    let countSql = null;
    if (method === 'GET' || method === 'HEAD') {
      const orderParam = url.searchParams.get('order');
      const order = orderParam ? orderParam.split(',').map((part) => {
        const [column, direction = 'asc', nulls] = part.split('.');
        if (!tableColumns.has(column) || !['asc', 'desc'].includes(direction) || (nulls && !['nullsfirst', 'nullslast'].includes(nulls))) return null;
        return `t.${quoted(column)} ${direction}${nulls ? ` nulls ${nulls.slice(5)}` : ''}`;
      }) : [];
      if (order.includes(null)) return refuse(route, request, 400, 'PGRST100', `order=${orderParam} isn't one the mock models`);
      const integer = (name) => (url.searchParams.has(name) ? Number.parseInt(url.searchParams.get(name), 10) : null);
      const [limit, offset] = [integer('limit'), integer('offset')];
      sql = `select coalesce(json_agg(rows), '[]'::json) as body from (select ${returned} from ${target}${where}${order.length ? ` order by ${order.join(', ')}` : ''}${limit != null ? ` limit ${limit}` : ''}${offset ? ` offset ${offset}` : ''}) rows`;
      if (prefer.includes('count=exact')) countSql = `select count(*)::int as total from ${target}${where}`;
    } else {
      let body = null;
      try { body = request.postDataJSON(); } catch { body = null; }
      if (method === 'POST') {
        const items = Array.isArray(body) ? body : [body || {}];
        const keys = [...new Set(items.flatMap((item) => Object.keys(item)))];
        const unknown = keys.find((key) => !tableColumns.has(key));
        if (unknown) return refuse(route, request, 400, 'PGRST204', `Could not find the '${unknown}' column of '${table}' in the schema cache`);
        if (!keys.length) return refuse(route, request, 400, 'PGRST100', "an insert of an empty row, which the mock doesn't model");
        params.push(JSON.stringify(items));
        const list = keys.map(quoted).join(', ');
        let merge = '';
        if (prefer.includes('resolution=merge-duplicates')) {
          const conflict = (url.searchParams.get('on_conflict') || 'id').split(',');
          if (conflict.some((column) => !tableColumns.has(column))) return refuse(route, request, 400, '42703', `on_conflict=${conflict.join(',')} names a column ${table} doesn't have`);
          merge = ` on conflict (${conflict.map(quoted).join(', ')}) do update set ${keys.map((key) => `${quoted(key)} = excluded.${quoted(key)}`).join(', ')}`;
        }
        sql = asJson(`insert into ${target} (${list}) select ${list} from json_populate_recordset(null::public.${quoted(table)}, $${params.length}::text::json)${merge} returning ${returned}`);
      } else if (method === 'PATCH') {
        const keys = Object.keys(body || {});
        const unknown = keys.find((key) => !tableColumns.has(key));
        if (unknown) return refuse(route, request, 400, 'PGRST204', `Could not find the '${unknown}' column of '${table}' in the schema cache`);
        if (!keys.length) return refuse(route, request, 400, 'PGRST100', "an update with nothing to change, which the mock doesn't model");
        params.push(JSON.stringify(body));
        sql = asJson(`update ${target} set ${keys.map((key) => `${quoted(key)} = source.${quoted(key)}`).join(', ')} from json_populate_record(null::public.${quoted(table)}, $${params.length}::text::json) as source${where} returning ${returned}`);
      } else if (method === 'DELETE') {
        sql = asJson(`delete from ${target}${where} returning ${returned}`);
      } else {
        return refuse(route, request, 405, 'PGRST000', `${method} isn't a method the mock models`);
      }
    }

    let rows;
    let total = null;
    try {
      ({ rows, total } = await asRequester(signedIn, async (tx) => ({
        rows: (await tx.query(sql, params)).rows[0].body,
        total: countSql ? (await tx.query(countSql, params)).rows[0].total : null,
      })));
    } catch (error) {
      if (!error.code) throw error;
      return refuse(route, request, statusFor(error.code, signedIn), error.code, error.message);
    }

    if (method === 'GET' || method === 'HEAD') {
      if (single) {
        if (rows.length !== 1) return json(route, request, 406, { code: 'PGRST116', details: `The result contains ${rows.length} rows`, hint: null, message: 'JSON object requested, multiple (or no) rows returned' });
        return json(route, request, 200, rows[0]);
      }
      const offset = Number(url.searchParams.get('offset') || 0);
      const range = rows.length ? `${offset}-${offset + rows.length - 1}` : '*';
      return json(route, request, 200, rows, { 'content-range': `${range}/${total ?? (rows.length ? '*' : '0')}` });
    }
    writes.push({ method, table, rows });
    if (!prefer.includes('return=representation')) return empty(route, request, method === 'POST' ? 201 : 204);
    if (single && rows.length !== 1) return json(route, request, 406, { code: 'PGRST116', message: 'JSON object requested, multiple (or no) rows returned' });
    return json(route, request, method === 'POST' ? 201 : 200, single ? rows[0] : rows);
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

  return { handle, writes, authCalls, faultLog, get faults() { return faultLog.map((fault) => fault.text); }, control };
}
