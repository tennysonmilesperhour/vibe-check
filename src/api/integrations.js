// @ts-check
// LLM access, formerly Base44's InvokeLLM. Routed through the invoke-llm
// edge function so the Anthropic key stays server-side. Returns the plain
// text (or parsed JSON when a response_json_schema was requested), matching
// the Base44 behavior the call sites expect.
import { supabase } from './supabase';

export async function InvokeLLM(args) {
  const { data, error } = await supabase.functions.invoke('invoke-llm', { body: args });
  if (error) throw error;
  if (data?.stub) {
    throw new Error('AI is not configured yet. Add the ANTHROPIC_API_KEY secret in Supabase to enable readings.');
  }
  return data?.result;
}

export async function UploadFile() {
  throw new Error('File upload is not wired in the Supabase build yet.');
}
