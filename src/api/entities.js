// Base44-compatible entity API over Supabase Postgres.
// Pages keep calling Entity.list('-date', limit, offset) / .filter / .create /
// .update / .delete exactly as before; this layer translates.
// RLS scopes every query to the signed-in user; user_id is stamped on insert.
import { supabase } from './supabase';
import { fetchAllPages } from '../lib/crypto';

const SORTABLE = { date: 'date', created_date: 'created_at', updated_date: 'updated_at' };

function parseSort(sort) {
  if (!sort) return { column: 'created_at', ascending: false };
  const desc = sort.startsWith('-');
  const key = desc ? sort.slice(1) : sort;
  return { column: SORTABLE[key] || key, ascending: !desc };
}

/** Base44 rows exposed created_date/updated_date; keep those names alive. */
function outbound(row) {
  if (!row) return row;
  return { ...row, created_date: row.created_at, updated_date: row.updated_at };
}

function inbound(data) {
  // strip fields the DB owns or that don't exist as columns
  const { id, user_id, created_at, updated_at, created_date, updated_date, ...rest } = data || {};
  return rest;
}

async function currentUserId() {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) throw new Error('Not signed in');
  return data.user.id;
}

function makeEntity(table) {
  return {
    async list(sort = '-created_date', limit = 100, offset = 0) {
      const { column, ascending } = parseSort(sort);
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .order(column, { ascending })
        .order('id', { ascending: true })
        .range(offset, offset + limit - 1);
      if (error) throw error;
      return (data || []).map(outbound);
    },

    async all(sort = '-created_date') {
      return fetchAllPages((limit, offset) => this.list(sort, limit, offset), 500);
    },

    async filter(criteria = {}, sort = '-created_date', limit = 100) {
      const { column, ascending } = parseSort(sort);
      let query = supabase.from(table).select('*');
      for (const [key, value] of Object.entries(criteria)) {
        query = query.eq(key, value);
      }
      const { data, error } = await query.order(column, { ascending }).limit(limit);
      if (error) throw error;
      return (data || []).map(outbound);
    },

    /**
     * Insert-or-update on a uniqueness key (default: one row per user+date).
     * Fixes the read-then-write race two tabs could hit on daily check-ins.
     */
    async upsert(data, onConflict = 'user_id,date') {
      return this.upsertFor(await currentUserId(), data, onConflict);
    },

    /** Upsert for this owner only: row-level security refuses it for any other signed-in account. */
    async upsertFor(user_id, data, onConflict = 'user_id,date') {
      const { data: row, error } = await supabase
        .from(table)
        .upsert({ ...inbound(data), user_id }, { onConflict })
        .select()
        .single();
      if (error) throw error;
      return outbound(row);
    },

    async create(data) {
      return this.createFor(await currentUserId(), data);
    },

    async update(id, data) {
      const { data: row, error } = await supabase
        .from(table)
        .update(inbound(data))
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return outbound(row);
    },

    /** Update every row of the person's that matches (row-level security keeps it to them); returns the rows it changed. */
    async updateWhere(criteria, data) {
      let query = supabase.from(table).update(inbound(data));
      for (const [key, value] of Object.entries(criteria)) query = query.eq(key, value);
      const { data: rows, error } = await query.select();
      if (error) throw error;
      return (rows || []).map(outbound);
    },

    /** Insert for this owner only: row-level security refuses it for any other signed-in account. */
    async createFor(user_id, data) {
      const { data: row, error } = await supabase
        .from(table)
        .insert({ ...inbound(data), user_id })
        .select()
        .single();
      if (error) throw error;
      return outbound(row);
    },

    async delete(id) {
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) throw error;
      return true;
    },
  };
}

export const DailyCheckIn = makeEntity('daily_check_ins');
export const Person = makeEntity('people');
export const Reading = makeEntity('readings');
export const BoundaryAlert = makeEntity('boundary_alerts');
export const HealingProgress = makeEntity('healing_progress');
export const CosmicWisdom = makeEntity('cosmic_wisdom');
export const JournalEntry = makeEntity('vibe_journal_entries');
export const PracticeSession = makeEntity('vibe_practice_sessions');
export const ReportReflection = makeEntity('vibe_report_reflections');
export const VibePreference = makeEntity('vibe_preferences');
export const CheckInDraft = makeEntity('vibe_checkin_drafts');

// Legacy entities, retired after the people migration. Empty reads keep the
// one-time migratePeople() call harmless; writes are refused.
const retired = (name) => ({
  list: async () => [],
  filter: async () => [],
  create: async () => { throw new Error(`${name} is retired; use Person`); },
  update: async () => { throw new Error(`${name} is retired; use Person`); },
  delete: async () => true,
});
export const Relationship = retired('Relationship');
export const Connection = retired('Connection');

// Cross-user lookup (synergy snapshot refresh) is not possible client-side
// under RLS; returns empty so callers degrade gracefully. A share model can
// bring this back properly later.
export const User = {
  list: async () => [],
  filter: async () => [],
};

export default {
  DailyCheckIn, Person, Reading, BoundaryAlert, HealingProgress, CosmicWisdom,
  JournalEntry, PracticeSession, ReportReflection, VibePreference, CheckInDraft,
  Relationship, Connection, User,
};
