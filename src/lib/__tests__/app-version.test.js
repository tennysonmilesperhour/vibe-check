import { describe, expect, it } from 'vitest';
import { getVersionNotice, latestVersionUrl, LIVE_ORIGIN } from '../app-version';

const production = { build: '1788894000000', environment: 'production' };

describe('live version notices', () => {
  it('stays quiet on the current production build, including its aliases', () => {
    expect(getVersionNotice(production, { ...production })).toBeNull();
  });
  it('finds new production deployments with the legacy manifest', () => {
    expect(getVersionNotice(production, { build: '1788895000000' }))
      .toEqual({ build: '1788895000000', kind: 'update' });
  });
  it('follows production rollbacks as well as forward releases', () => {
    expect(getVersionNotice(production, { build: '1788893000000', environment: 'production' })?.kind).toBe('update');
  });
  it('offers current production from a newer preview without claiming the preview is older', () => {
    expect(getVersionNotice({ ...production, environment: 'preview' }, { build: '1788893000000' }))
      .toEqual({ build: '1788893000000', kind: 'preview' });
  });
  it('stays quiet if a preview is promoted with its original build stamp', () => {
    expect(getVersionNotice({ ...production, environment: 'preview' }, production)).toBeNull();
  });
  it('detects a different preview build promoted to the canonical production origin', () => {
    expect(getVersionNotice(production, { build: 'promoted-preview', environment: 'preview' }))
      .toEqual({ build: 'promoted-preview', kind: 'update' });
  });
  it.each(['development', 'test', ''])('does not check local %s builds', environment => {
    expect(getVersionNotice({ ...production, environment }, { build: 'new' })).toBeNull();
  });
  it.each([null, {}, [], 'login page', { build: '' }, { build: 123 }, { build: 'bad value' }])('ignores invalid manifests: %j', manifest => {
    expect(getVersionNotice(production, manifest)).toBeNull();
  });
});

describe('opening the current live app', () => {
  it('leaves an immutable preview while preserving the current route, tab and section', () => {
    const target = new URL(latestVersionUrl('https://preview.vercel.app/CosmicAddons?tab=systems#plants', 'new-build'));
    expect(target.origin).toBe(LIVE_ORIGIN);
    expect(target.pathname).toBe('/CosmicAddons');
    expect(target.searchParams.get('tab')).toBe('systems');
    expect(target.hash).toBe('#plants');
    expect(target.searchParams.get('_vibe_version')).toBe('new-build');
  });
  it('does not carry auth or deployment-access tokens across origins', () => {
    const target = new URL(latestVersionUrl('https://preview.vercel.app/Practice?tab=healing&code=private&_vercel_share=private&token_hash=private#access_token=private&refresh_token=private', 'new'));
    expect([...target.searchParams.keys()]).toEqual(['tab', '_vibe_version']);
    expect(target.hash).toBe('');
    expect(target.href).not.toContain('private');
  });
  it('keeps a selected historical check-in and analytics filters', () => {
    const target = new URL(latestVersionUrl('https://preview.vercel.app/Analytics?tab=patterns&date=2026-09-01&range=90&person=friend-id&review=weekly', 'new'));
    expect(Object.fromEntries(target.searchParams)).toEqual({
      tab: 'patterns', date: '2026-09-01', range: '90', person: 'friend-id', review: 'weekly', _vibe_version: 'new',
    });
  });
  it('always uses the trusted production origin for double-slash paths', () => {
    const target = new URL(latestVersionUrl('https://preview.vercel.app//example.com/Practice', 'new'));
    expect(target.origin).toBe(LIVE_ORIGIN);
  });
  it('replaces a prior cache-busting parameter instead of duplicating it', () => {
    const target = new URL(latestVersionUrl(`${LIVE_ORIGIN}/Today?_vibe_version=old`, 'new'));
    expect(target.searchParams.getAll('_vibe_version')).toEqual(['new']);
  });
});
