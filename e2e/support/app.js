// The browser test fixture: every page runs against a stand-in Supabase
// (mock-supabase.js) whose tables live in a real Postgres built from the
// migrations (database.js), at a fixed clock, with requests to any other site
// blocked. A test fails if the page throws or logs an error, if one of the
// app's own files fails to load, if the database refuses a request (or the
// mock doesn't model it), or if the page contacts another site.
import { test as base, expect } from '@playwright/test';
import { createDatabase } from './database.js';
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
  /**
   * A refusal a test expects, such as the duplicate key a second tab's save
   * meets: a pattern for the faults it may produce, at least one of which
   * must happen. One RegExp (join alternatives with |): Playwright would read
   * an array of them as a fixture tuple.
   */
  expectedFaults: [null, { option: true }],

  // One migrated database per worker; each test empties it and loads its persona.
  // eslint-disable-next-line no-empty-pattern
  database: [async ({}, use) => {
    const database = await createDatabase();
    await use(database);
    await database.db.close();
  }, { scope: 'worker' }],

  backend: async ({ context, persona, baseURL, database }, use) => {
    const fixture = persona ? PERSONAS[persona]() : null;
    const backend = await createMockSupabase({ database, fixture, nowIso: NOW_ISO });
    backend.external = [];
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

  page: async ({ page, backend, baseURL, allowFailedRequests, expectedFaults }, use) => {
    await page.clock.setFixedTime(new Date(NOW));
    const appOrigin = new URL(baseURL).origin;
    // A copy without g or y, whose lastIndex would carry from one fault to the next.
    const expectation = expectedFaults ? new RegExp(expectedFaults.source, expectedFaults.flags.replace(/[gy]/g, '')) : null;
    const isExpected = (fault) => Boolean(expectation?.test(fault.text));
    const problems = [];
    page.on('pageerror', (error) => problems.push(`page error: ${error.message}`));
    page.on('console', (message) => {
      if (message.type() !== 'error') return;
      if (/Failed to load resource/.test(message.text())) {
        if (allowFailedRequests) return;
        // The failed load an expected refusal causes, and only that one.
        if (backend.faultLog.some((fault) => isExpected(fault) && fault.url === message.location().url)) return;
      }
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
    const expected = backend.faultLog.filter(isExpected);
    // One check, so a refusal shows with its reason next to the console line it caused.
    expect({
      faults: backend.faultLog.filter((fault) => !isExpected(fault)).map((fault) => fault.text),
      problems,
      external: backend.external,
      expectedFaultMissing: Boolean(expectation) && expected.length === 0,
    }, 'refused or unmodelled requests, page problems, and requests to other sites').toEqual({ faults: [], problems: [], external: [], expectedFaultMissing: false });
  },
});

export { expect };
