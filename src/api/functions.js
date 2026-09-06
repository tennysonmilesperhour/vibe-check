// @ts-check
// Backend functions, now Supabase Edge Functions. Same call shape as the
// Base44 virtual modules: fn(body) -> { data }.
import { supabase } from './supabase';

async function invoke(name, body) {
  const { data, error } = await supabase.functions.invoke(name, { body });
  if (error) throw error;
  return { data };
}

export const generateCosmicWisdom = (body) => invoke('generate-cosmic-wisdom', body);
export const generateDailyWeather = (body) => invoke('generate-daily-weather', body);
