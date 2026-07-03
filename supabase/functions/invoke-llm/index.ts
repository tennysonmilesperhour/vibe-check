// General LLM proxy for client features (oracle readings, synergy, tarot
// interpretation). Keeps the Anthropic key server-side; requires a signed-in
// user (verify_jwt). Body: { prompt, response_json_schema? }.
import { preflight, json, userClient, askClaude } from '../_shared/common.ts';

Deno.serve(async (req) => {
  const pf = preflight(req);
  if (pf) return pf;

  const supabase = userClient(req);
  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) return json({ error: 'Unauthorized' }, 401);

  const body = await req.json().catch(() => ({}));
  const prompt = typeof body.prompt === 'string' ? body.prompt.slice(0, 24000) : '';
  if (!prompt) return json({ error: 'prompt is required' }, 400);

  try {
    const result = await askClaude(prompt, body.response_json_schema);
    if (result === null) return json({ stub: true, message: 'ANTHROPIC_API_KEY not configured' });
    return json({ result });
  } catch (e) {
    return json({ error: (e as Error).message }, 502);
  }
});
