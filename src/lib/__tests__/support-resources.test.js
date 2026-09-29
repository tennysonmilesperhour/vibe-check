import { describe, it, expect } from 'vitest';
import { SUPPORT_REGIONS, detectSupportRegion, supportLinesFor, findAHelplineUrl, telHref, smsHref } from '../support-resources.js';

describe('detectSupportRegion', () => {
  it('reads the time zone first, keeping Canada apart from the US', () => {
    expect(detectSupportRegion({ timeZone: 'America/Denver' })).toBe('US');
    expect(detectSupportRegion({ timeZone: 'America/Indiana/Indianapolis' })).toBe('US');
    expect(detectSupportRegion({ timeZone: 'Pacific/Honolulu' })).toBe('US');
    expect(detectSupportRegion({ timeZone: 'America/Toronto' })).toBe('CA');
    expect(detectSupportRegion({ timeZone: 'America/Vancouver' })).toBe('CA');
    expect(detectSupportRegion({ timeZone: 'Europe/London' })).toBe('GB');
    expect(detectSupportRegion({ timeZone: 'Europe/Dublin' })).toBe('IE');
    expect(detectSupportRegion({ timeZone: 'Australia/Perth' })).toBe('AU');
    expect(detectSupportRegion({ timeZone: 'Pacific/Auckland' })).toBe('NZ');
  });
  it('knows the older zone names Chrome reports as well as the IANA ones', () => {
    for (const zone of ['America/Indianapolis', 'America/Louisville', 'America/Indiana/Knox', 'America/Fort_Wayne', 'America/Atka', 'Navajo', 'Pacific/Johnston', 'US/Eastern']) {
      expect(detectSupportRegion({ timeZone: zone, languages: ['en-US'] })).toBe('US');
    }
    for (const zone of ['America/Coral_Harbour', 'America/Atikokan', 'America/Thunder_Bay', 'America/Pangnirtung', 'Canada/Pacific']) {
      expect(detectSupportRegion({ timeZone: zone })).toBe('CA');
    }
    expect(detectSupportRegion({ timeZone: 'GB' })).toBe('GB');
    expect(detectSupportRegion({ timeZone: 'Eire' })).toBe('IE');
    expect(detectSupportRegion({ timeZone: 'NZ' })).toBe('NZ');
  });
  it('matches every zone the browser engine reports for the listed countries', () => {
    const expected = { 'America/Indiana/Indianapolis': 'US', 'America/Kentucky/Louisville': 'US', 'America/Atikokan': 'CA', 'America/Montreal': 'CA', 'Europe/Belfast': 'GB', 'Australia/ACT': 'AU' };
    for (const [zone, region] of Object.entries(expected)) {
      const reported = new Intl.DateTimeFormat('en-US', { timeZone: zone }).resolvedOptions().timeZone;
      expect(detectSupportRegion({ timeZone: reported })).toBe(region);
    }
  });
  it('uses the language region only when the time zone names no place', () => {
    expect(detectSupportRegion({ timeZone: 'UTC', languages: ['en-GB'] })).toBe('GB');
    expect(detectSupportRegion({ timeZone: 'Etc/GMT+5', languages: ['fr-FR', 'en-AU'] })).toBe('AU');
    expect(detectSupportRegion({ timeZone: '', languages: ['en-UK'] })).toBe('GB');
    expect(detectSupportRegion({ timeZone: 'Europe/Berlin', languages: ['de-DE'] })).toBeNull();
    expect(detectSupportRegion()).toBeNull();
  });
  it('never guesses a listed country for someone whose time zone is elsewhere', () => {
    expect(detectSupportRegion({ timeZone: 'Europe/Berlin', languages: ['en-US'] })).toBeNull();
    expect(detectSupportRegion({ timeZone: 'Asia/Kolkata', languages: ['en-US'] })).toBeNull();
    expect(detectSupportRegion({ timeZone: 'Europe/Paris', languages: ['en-GB'] })).toBeNull();
    expect(detectSupportRegion({ timeZone: 'America/Mexico_City', languages: ['es-US'] })).toBeNull();
  });
});

describe('support directory', () => {
  it('gives every region an emergency number and at least one crisis line', () => {
    for (const [code, region] of Object.entries(SUPPORT_REGIONS)) {
      expect(region.emergency, code).toBeTruthy();
      expect(region.lines.some((line) => line.kind === 'crisis'), code).toBe(true);
      for (const line of region.lines) expect(line.call || line.text, line.id).toBeTruthy();
    }
  });
  it('puts relationship services first after an unsafe interaction', () => {
    expect(supportLinesFor('US', 'relationship')[0].id).toBe('us-ndvh');
    expect(supportLinesFor('US', 'crisis')[0].id).toBe('us-988');
    expect(supportLinesFor('XX')).toEqual([]);
  });
  it('builds call, text, and directory links', () => {
    expect(telHref('988')).toBe('tel:988');
    expect(smsHref({ number: '88788', body: 'START' })).toBe('sms:88788?&body=START');
    expect(smsHref({ number: '988' })).toBe('sms:988');
    expect(findAHelplineUrl('GB')).toBe('https://findahelpline.com/countries/gb');
    expect(findAHelplineUrl(null)).toBe('https://findahelpline.com');
  });
});
