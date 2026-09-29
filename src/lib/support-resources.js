// Free, confidential support services by region.
// Verified on 2026-09-29 against each service's own site or government
// listings. Re-verify every number before changing this table. Anywhere not
// listed falls back to findahelpline.com, which covers most countries.

export const FIND_A_HELPLINE = 'https://findahelpline.com';

/** @typedef {{ id: string, label: string, detail: string, kind: 'crisis' | 'relationship', call?: string, text?: { number: string, body?: string }, url?: string }} SupportLine */

/** @type {Record<string, { name: string, emergency: string, lines: SupportLine[] }>} */
export const SUPPORT_REGIONS = {
  US: {
    name: 'United States',
    emergency: '911',
    lines: [
      { id: 'us-988', label: '988 Suicide & Crisis Lifeline', detail: 'Call or text 988, or chat online. Free, confidential, 24/7.', kind: 'crisis', call: '988', text: { number: '988' }, url: 'https://988lifeline.org' },
      { id: 'us-ndvh', label: 'National Domestic Violence Hotline', detail: 'Call 800-799-7233, text START to 88788, or chat online. Free, confidential, 24/7.', kind: 'relationship', call: '18007997233', text: { number: '88788', body: 'START' }, url: 'https://www.thehotline.org' },
    ],
  },
  CA: {
    name: 'Canada',
    emergency: '911',
    lines: [
      { id: 'ca-988', label: '9-8-8 Suicide Crisis Helpline', detail: 'Call or text 9-8-8. Free, bilingual, 24/7.', kind: 'crisis', call: '988', text: { number: '988' }, url: 'https://988.ca' },
    ],
  },
  GB: {
    name: 'United Kingdom',
    emergency: '999',
    lines: [
      { id: 'gb-samaritans', label: 'Samaritans', detail: 'Call 116 123. Free, any time of day or night.', kind: 'crisis', call: '116123', url: 'https://www.samaritans.org' },
      { id: 'gb-shout', label: 'Shout', detail: 'Text SHOUT to 85258. Free, 24/7.', kind: 'crisis', text: { number: '85258', body: 'SHOUT' } },
      { id: 'gb-ndah', label: 'National Domestic Abuse Helpline', detail: 'Call 0808 2000 247. Free, 24/7.', kind: 'relationship', call: '08082000247' },
    ],
  },
  IE: {
    name: 'Ireland',
    emergency: '112 or 999',
    lines: [
      { id: 'ie-samaritans', label: 'Samaritans Ireland', detail: 'Call 116 123. Free, any time of day or night.', kind: 'crisis', call: '116123', url: 'https://www.samaritans.org/samaritans-ireland/' },
      { id: 'ie-50808', label: 'Text 50808', detail: 'Text HELLO to 50808. Free, 24/7.', kind: 'crisis', text: { number: '50808', body: 'HELLO' } },
      { id: 'ie-womensaid', label: "Women's Aid", detail: 'Call 1800 341 900. Free, 24/7.', kind: 'relationship', call: '1800341900', url: 'https://www.womensaid.ie' },
    ],
  },
  AU: {
    name: 'Australia',
    emergency: '000',
    lines: [
      { id: 'au-lifeline', label: 'Lifeline', detail: 'Call 13 11 14 or text 0477 13 11 14. 24/7.', kind: 'crisis', call: '131114', text: { number: '0477131114' }, url: 'https://www.lifeline.org.au' },
      { id: 'au-1800respect', label: '1800RESPECT', detail: 'Call 1800 737 732. Free, confidential, 24/7.', kind: 'relationship', call: '1800737732' },
    ],
  },
  NZ: {
    name: 'New Zealand',
    emergency: '111',
    lines: [
      { id: 'nz-1737', label: 'Need to talk? 1737', detail: 'Call or text 1737. Free, 24/7.', kind: 'crisis', call: '1737', text: { number: '1737' } },
      { id: 'nz-refuge', label: "Women's Refuge", detail: 'Call 0800 733 843. Free, 24/7.', kind: 'relationship', call: '0800733843' },
    ],
  },
};

// Canadian zones share offsets with US ones, so match them by name first.
// Chrome reports older (CLDR) names for some zones, like America/Indianapolis
// and America/Coral_Harbour; other browsers report the IANA names. Both are here.
const CANADA_ZONES = /^(America\/(Toronto|Montreal|Vancouver|Edmonton|Calgary|Winnipeg|Regina|Swift_Current|Halifax|Glace_Bay|Moncton|Goose_Bay|St_Johns|Whitehorse|Dawson|Dawson_Creek|Fort_Nelson|Creston|Yellowknife|Inuvik|Cambridge_Bay|Rankin_Inlet|Resolute|Iqaluit|Pangnirtung|Atikokan|Coral_Harbour|Thunder_Bay|Nipigon|Rainy_River|Blanc-Sablon)|Canada\/.+)$/;
const US_ZONES = /^(America\/(New_York|Detroit|Chicago|Denver|Phoenix|Los_Angeles|Anchorage|Juneau|Sitka|Metlakatla|Yakutat|Nome|Adak|Atka|Boise|Menominee|Indianapolis|Fort_Wayne|Knox_IN|Louisville|Shiprock|Indiana\/.+|Kentucky\/.+|North_Dakota\/.+)|Pacific\/(Honolulu|Johnston)|US\/.+|Navajo)$/;
const GB_ZONES = /^(Europe\/(London|Belfast)|GB|GB-Eire)$/;
const IE_ZONES = /^(Europe\/Dublin|Eire)$/;
const NZ_ZONES = /^(Pacific\/(Auckland|Chatham)|NZ|NZ-CHAT)$/;

// Zones that say nothing about where someone is.
const PLACELESS_ZONES = /^(|UTC|GMT|UCT|Universal|Zulu|Etc\/.*)$/;

/**
 * Best guess at where someone is, from their time zone. The language setting
 * only counts when the zone names no place: an en-US browser in Berlin is in
 * Germany, and a wrong guess would show the wrong emergency number.
 * Returns a key of SUPPORT_REGIONS or null.
 * @param {{ timeZone?: string, languages?: readonly string[] }} signals
 */
export function detectSupportRegion({ timeZone = '', languages = [] } = {}) {
  if (CANADA_ZONES.test(timeZone)) return 'CA';
  if (US_ZONES.test(timeZone)) return 'US';
  if (GB_ZONES.test(timeZone)) return 'GB';
  if (IE_ZONES.test(timeZone)) return 'IE';
  if (timeZone.startsWith('Australia/')) return 'AU';
  if (NZ_ZONES.test(timeZone)) return 'NZ';
  if (!PLACELESS_ZONES.test(timeZone)) return null;
  for (const language of languages) {
    const region = String(language).split('-')[1]?.toUpperCase();
    if (region === 'UK') return 'GB';
    if (region && SUPPORT_REGIONS[region]) return region;
  }
  return null;
}

/** The directory page for a region on findahelpline.com. */
export function findAHelplineUrl(region) {
  return region ? `${FIND_A_HELPLINE}/countries/${region.toLowerCase()}` : FIND_A_HELPLINE;
}

/** Lines for a region, with the kind that fits the moment first. */
export function supportLinesFor(region, focus = 'crisis') {
  const lines = SUPPORT_REGIONS[region]?.lines || [];
  return [...lines].sort((a, b) => Number(b.kind === focus) - Number(a.kind === focus));
}

export const telHref = (number) => `tel:${number}`;
// `sms:number?&body=` opens a prefilled message on both iOS and Android.
/** @param {{ number: string, body?: string }} text */
export const smsHref = ({ number, body }) => (body ? `sms:${number}?&body=${encodeURIComponent(body)}` : `sms:${number}`);
