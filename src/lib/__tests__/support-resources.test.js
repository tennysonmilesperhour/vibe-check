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
  it('falls back to the language region, then to nothing', () => {
    expect(detectSupportRegion({ timeZone: 'UTC', languages: ['en-GB'] })).toBe('GB');
    expect(detectSupportRegion({ timeZone: 'UTC', languages: ['fr-FR', 'en-AU'] })).toBe('AU');
    expect(detectSupportRegion({ timeZone: 'Europe/Berlin', languages: ['de-DE'] })).toBeNull();
    expect(detectSupportRegion()).toBeNull();
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
