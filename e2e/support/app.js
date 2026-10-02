// The browser test fixture: every page runs against the in-memory Supabase
// (mock-supabase.js) at a fixed clock, with requests to any other site
// blocked. A test fails if the page throws, logs an error, or asks the mock
// or another site for something.
import { test as base, expect } from '@playwright/test';
import { createMockSupabase, makeSession, STORAGE_KEY, SUPABASE_ORIGIN } from './mock-supabase.js';
import { established, newcomer, NOW, NOW_ISO } from './persona.js';

const PERSONAS = { established, newcomer };
// A request the mock fails on purpose makes the browser log this.
const EXPECTED_CONSOLE = [/Failed to load resource/];
// Set before signing out, so the next load doesn't sign the persona back in.
export const SIGNED_OUT_FLAG = 'e2e:signed-out';

export const test = base.extend({
  /** Who is signed in: 'established', 'newcomer', or null for signed out. */
  persona: ['established', { option: true }],

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

  page: async ({ page, backend }, use) => {
    await page.clock.setFixedTime(new Date(NOW));
    const problems = [];
    page.on('pageerror', (error) => problems.push(`page error: ${error.message}`));
    page.on('console', (message) => {
      if (message.type() === 'error' && !EXPECTED_CONSOLE.some((pattern) => pattern.test(message.text()))) problems.push(`console error: ${message.text()}`);
    });
    await use(page);
    expect(problems, 'page and console errors').toEqual([]);
    expect(backend.unhandled, 'requests the mock does not model').toEqual([]);
    expect(backend.external, 'requests to other sites').toEqual([]);
  },
});

export { expect };
