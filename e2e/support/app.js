// The browser test fixture: every page runs against the in-memory Supabase
// (mock-supabase.js) at a fixed clock, with requests to any other site
// blocked. A test fails if the page throws or logs an error, if one of the
// app's own files fails to load, if the mock records a fault (a request the
// real project would refuse, or one it doesn't model), or if the page
// contacts another site.
import { test as base, expect } from '@playwright/test';
import { createMockSupabase, makeSession, STORAGE_KEY, SUPABASE_ORIGIN } from './mock-supabase.js';
import { established, newcomer, NOW, NOW_ISO } from './persona.js';

const PERSONAS = { established, newcomer };
// Set before signing out, so the next load doesn't sign the persona back in.
export const SIGNED_OUT_FLAG = 'e2e:signed-out';
export { STORAGE_KEY };

export const test = base.extend({
  /** Who is signed in: 'established', 'newcomer', or null for signed out. */
  persona: ['established', { option: true }],
  /** For a test that makes a request fail on purpose: the browser logs each failed load. */
  allowFailedRequests: [false, { option: true }],

  backend: async ({ context, persona, baseURL }, use) => {
    const fixture = persona ? PERSONAS[persona]() : null;
    const backend = { ...createMockSupabase({ fixture, nowIso: NOW_ISO }), external: [] };
    const appOrigin = new URL(baseURL).origin;
    await context.route((url) => url.origin !== appOrigin && url.origin !== SUPABASE_ORIGIN, (route) => {
      const url = new URL(route.request().url());
      // Google Fonts until the fonts are self-hosted; fallback fonts do for these checks.
      if (/^fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)) return route.fulfill({ status: 200, contentType: 'text/css', body: '' });
      backend.external.push(url.href);
      return route.abort();
    });
    await context.route(`${SUPABASE_ORIGIN}/**`, backend.handle);
    if (fixture) {
      await context.addInitScript(([key, session, flag]) => {
        if (!sessionStorage.getItem(flag)) localStorage.setItem(key, JSON.stringify(session));
      }, [STORAGE_KEY, makeSession(fixture.user), SIGNED_OUT_FLAG]);
    }
    await use(backend);
  },

  page: async ({ page, backend, baseURL, allowFailedRequests }, use) => {
    await page.clock.setFixedTime(new Date(NOW));
    const appOrigin = new URL(baseURL).origin;
    const problems = [];
    page.on('pageerror', (error) => problems.push(`page error: ${error.message}`));
    page.on('console', (message) => {
      if (message.type() !== 'error') return;
      if (allowFailedRequests && /Failed to load resource/.test(message.text())) return;
      problems.push(`console error: ${message.text()}`);
    });
    page.on('response', (response) => {
      if (response.url().startsWith(appOrigin) && response.status() >= 400) problems.push(`${response.status()} for ${response.url()}`);
    });
    page.on('requestfailed', (request) => {
      // A load the page itself abandoned (a navigation, an aborted read) isn't a failure.
      if (request.url().startsWith(appOrigin) && !/ERR_ABORTED/.test(request.failure()?.errorText || '')) problems.push(`failed to load ${request.url()}: ${request.failure()?.errorText}`);
    });
    await use(page);
    expect(problems, 'page errors, console errors and failed loads').toEqual([]);
    expect(backend.faults, 'requests the real project would refuse, or the mock does not model').toEqual([]);
    expect(backend.external, 'requests to other sites').toEqual([]);
  },
});

export { expect };
