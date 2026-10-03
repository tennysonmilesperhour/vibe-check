// Without a connection: once the app has been opened, its pages come from the
// service worker (src/service-worker.js). Each test runs its own copy of the
// test build's server and stops it, so the page and the worker both lose it.
// (Playwright's offline switch and its routing don't reach the worker.)
import { spawn } from 'node:child_process';
import { test as base, expect, STORAGE_KEY } from './support/app.js';
import { LANDING_HEADING } from './support/pages.js';

const test = base.extend({
  // eslint-disable-next-line no-empty-pattern
  server: async ({}, use, testInfo) => {
    const port = 4300 + testInfo.parallelIndex;
    const url = `http://127.0.0.1:${port}`;
    const child = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--outDir', 'dist-e2e', '--port', String(port), '--strictPort', '--host', '127.0.0.1'], { stdio: 'ignore' });
    let running = true;
    const exited = new Promise((resolve) => { child.once('exit', () => { running = false; resolve(); }); });
    const stop = async () => { if (running) child.kill(); await exited; };
    try {
      for (let attempt = 0; ; attempt += 1) {
        // A server that exits (its port taken) or never answers fails the test here.
        if (!running) throw new Error(`The offline tests' server on port ${port} exited before it answered.`);
        if (await fetch(url).then((response) => response.ok, () => false)) break;
        if (attempt > 150) throw new Error(`The offline tests' server didn't answer on port ${port}.`);
        await new Promise((resolve) => { setTimeout(resolve, 100); });
      }
    } catch (error) {
      await stop();
      throw error;
    }
    await use({ url, stop });
    await stop();
  },
  baseURL: async ({ server }, use) => use(server.url),
});

/** Waits for the worker to keep its files and take over the page. */
const workerReady = (page) => page.evaluate(() => navigator.serviceWorker.ready.then(() => undefined));

/** No server, no Supabase and no network, for the page and the worker alike. */
async function goOffline({ context, server, backend }) {
  await server.stop();
  backend.control.offline = true;
  await context.setOffline(true);
}

test.use({ serviceWorkers: 'allow' });

test.describe('signed out', () => {
  test.use({ persona: null });

  test('the front page, Support now and help now open offline', async ({ page, context, server, backend }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1, name: LANDING_HEADING })).toBeVisible();
    await workerReady(page);
    await goOffline({ context, server, backend });
    await page.goto('/support-now');
    await expect(page.getByRole('heading', { level: 1, name: "You don't have to hold this alone." })).toBeVisible();
    await expect(page.getByRole('link', { name: /Call: 988/ })).toBeVisible();
    await page.goto('/help-now/on-edge/orient');
    await expect(page.getByRole('heading', { name: 'Find your surroundings' })).toBeVisible();
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1, name: LANDING_HEADING })).toBeVisible();
  });
});

test.describe('signed in', () => {
  // Pages and records that can't load offline fail on purpose, and React
  // reports the page that can't.
  test.use({ allowFailedAppLoads: true, allowConsoleErrors: /dynamically imported module/ });

  test("a page opened before opens offline, and one that wasn't says it needs a connection", async ({ page, context, server, backend }) => {
    await page.goto('/Today');
    await expect(page.getByRole('button', { name: /Begin check-in/ })).toBeVisible();
    await workerReady(page);
    await page.goto('/People');
    await expect(page.getByRole('heading', { level: 1, name: 'People' })).toBeVisible();
    await goOffline({ context, server, backend });
    await page.goto('/People');
    // The page opens from what the worker kept; its records wait for a connection.
    await expect(page.getByRole('status').filter({ hasText: 'Gathering your people…' })).toBeVisible();
    await page.goto('/CosmicAddons');
    const notice = page.getByRole('alert').filter({ hasText: 'This page needs a connection to open.' });
    await expect(notice.getByRole('heading', { level: 1 })).toHaveText('This page needs a connection to open.');
    await expect(notice.getByRole('link', { name: 'Support now' })).toHaveAttribute('href', '/support-now');
  });

  test('with an expired session, the account waits for a connection and help now still opens', async ({ page, context, server, backend }) => {
    // Sessions last an hour; offline, one that has expired can't be renewed.
    await context.addInitScript((key) => {
      const stored = JSON.parse(localStorage.getItem(key) || 'null');
      if (stored) localStorage.setItem(key, JSON.stringify({ ...stored, expires_at: 1 }));
    }, STORAGE_KEY);
    await page.goto('/Today');
    await expect(page.getByRole('button', { name: /Begin check-in/ })).toBeVisible();
    await workerReady(page);
    await goOffline({ context, server, backend });
    await page.goto('/Today');
    // The app gives the sign-in service a few seconds before saying so.
    await expect(page.getByRole('heading', { level: 1, name: "Your account can't be reached right now." })).toBeVisible({ timeout: 15_000 });
    await page.getByRole('link', { name: 'help now' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Help for this moment.' })).toBeVisible();
  });
});
