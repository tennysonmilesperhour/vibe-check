// Shared helpers for VibeCheck edge functions.
import { createClient } from 'jsr:@supabase/supabase-js@2';

export const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });

export const preflight = (req: Request) =>
  req.method === 'OPTIONS' ? new Response('ok', { headers: CORS }) : null;

/** Supabase client acting as the calling user (RLS applies). */
export function userClient(req: Request) {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } } },
  );
}

/**
 * Anthropic Messages API call. Returns null when no key is configured so
 * callers can respond with an honest stub instead of failing.
 */
export async function askClaude(prompt: string, schema?: Record<string, unknown>): Promise<string | Record<string, unknown> | null> {
  const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!apiKey) return null;

  const tools = schema
    ? [{ name: 'respond', description: 'Return the structured response.', input_schema: schema }]
    : undefined;

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-opus-4-8',
      max_tokens: 4096,
      thinking: { type: 'adaptive' },
      ...(tools ? { tools, tool_choice: { type: 'tool', name: 'respond' } } : {}),
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Anthropic API ${res.status}: ${detail.slice(0, 300)}`);
  }

  const data = await res.json();
  if (schema) {
    const toolUse = (data.content || []).find((b: { type: string }) => b.type === 'tool_use');
    if (toolUse) return toolUse.input as Record<string, unknown>;
  }
  const text = (data.content || []).find((b: { type: string }) => b.type === 'text');
  return text?.text ?? '';
}

/** ISO-week period keys — parity with src/lib/dates.js getPeriodKey. */
function pad(n: number): string { return String(n).padStart(2, '0'); }

export function getPeriodKey(type: string, date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = pad(date.getMonth() + 1);
  if (type === 'daily') return `${y}-${m}-${pad(date.getDate())}`;
  if (type === 'weekly') {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 12));
    const day = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - day);
    const year = d.getUTCFullYear();
    const yearStart = new Date(Date.UTC(year, 0, 1, 12));
    const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
    return `${year}-W${pad(week)}`;
  }
  if (type === 'monthly') return `${y}-${m}`;
  return String(y);
}

export const PERIOD_KEY_SHAPES: Record<string, RegExp> = {
  daily: /^\d{4}-\d{2}-\d{2}$/,
  weekly: /^\d{4}-W\d{2}$/,
  monthly: /^\d{4}-\d{2}$/,
  yearly: /^\d{4}$/,
  weather: /^\d{4}-\d{2}-\d{2}$/,
};

export function resolvePeriodKey(periodType: string, clientKey: unknown): string {
  const shape = PERIOD_KEY_SHAPES[periodType] || PERIOD_KEY_SHAPES.daily;
  if (typeof clientKey === 'string' && shape.test(clientKey)) return clientKey;
  return getPeriodKey(periodType === 'weather' ? 'daily' : periodType);
}
