// A real Postgres for the browser tests (PGlite, in-process), built from
// supabase/migrations, so the mock serves and refuses exactly what the
// database does: column types, NOT NULL, CHECK, unique keys, and the
// migrations' own row-level security policies.
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { PGlite } from '@electric-sql/pglite';
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto';

const MIGRATIONS = path.resolve(import.meta.dirname, '../../supabase/migrations');

// What the shared Supabase project provides around these migrations: the API
// roles and the grants new tables get, an auth schema whose uid() reads the
// request's JWT claims like Supabase's, storage, and the other apps' tables
// that the account-deletion functions read (stand-ins, never served).
const SHARED_PROJECT_TABLES = ['camp_agents', 'camp_skills', 'camp_trades', 'camp_reports', 'digest_profiles'];
const PLATFORM = `
  set time zone 'UTC';
  create role anon nologin;
  create role authenticated nologin;
  create role service_role nologin bypassrls;
  grant usage on schema public to anon, authenticated, service_role;
  alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
  alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
  alter default privileges in schema public grant execute on functions to anon, authenticated, service_role;
  create schema auth;
  grant usage on schema auth to anon, authenticated, service_role;
  create table auth.users (id uuid primary key, email text, raw_user_meta_data jsonb not null default '{}', created_at timestamptz not null default now());
  create function auth.jwt() returns jsonb language sql stable as $$ select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb $$;
  create function auth.uid() returns uuid language sql stable as $$ select nullif(auth.jwt() ->> 'sub', '')::uuid $$;
  create function auth.role() returns text language sql stable as $$ select auth.jwt() ->> 'role' $$;
  create schema storage;
  grant usage on schema storage to anon, authenticated, service_role;
  create table storage.buckets (id text primary key, name text, public boolean default false);
  create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text references storage.buckets (id), name text, owner uuid);
  create function storage.foldername(name text) returns text[] language sql immutable as $$ select string_to_array(name, '/') $$;
  create table public.camp_agents (id uuid primary key default gen_random_uuid(), user_id uuid);
  create table public.camp_skills (id uuid primary key default gen_random_uuid(), user_id uuid);
  create table public.camp_trades (id uuid primary key default gen_random_uuid(), offerer_user_id uuid, receiver_user_id uuid);
  create table public.camp_reports (id uuid primary key default gen_random_uuid(), user_id uuid);
  create table public.digest_profiles (id uuid primary key);
`;

/**
 * The migrated database, and this app's public tables with each column's
 * type. PGlite runs PostgreSQL 18; a migration using something newer than
 * the live project's Postgres would pass here and fail there.
 * @returns {Promise<{ db: PGlite, columns: Map<string, Map<string, string>> }>}
 */
export async function createDatabase() {
  const db = await PGlite.create({ extensions: { pgcrypto } });
  await db.exec(PLATFORM);
  for (const file of readdirSync(MIGRATIONS).filter((name) => name.endsWith('.sql')).sort()) {
    try {
      await db.exec(readFileSync(path.join(MIGRATIONS, file), 'utf8'));
    } catch (error) {
      throw new Error(`supabase/migrations/${file} fails in the test database: ${error.message}. If it needs something Supabase provides, add it to PLATFORM in e2e/support/database.js.`);
    }
  }
  const { rows } = await db.query(`
    select c.relname as table_name, a.attname as column_name, format_type(a.atttypid, a.atttypmod) as type
    from pg_attribute a join pg_class c on c.oid = a.attrelid join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind = 'r' and a.attnum > 0 and not a.attisdropped
    order by c.relname, a.attnum`);
  const columns = new Map();
  for (const row of rows.filter((item) => !SHARED_PROJECT_TABLES.includes(item.table_name))) {
    if (!columns.has(row.table_name)) columns.set(row.table_name, new Map());
    columns.get(row.table_name).set(row.column_name, row.type);
  }
  return { db, columns };
}
