// Without a connection: once the app has been opened, its pages come from the
// service worker (src/service-worker.js). Each test runs its own copy of the
// test build's server and stops it, so the page and the worker both lose it.
// (Playwright's offline switch doesn't reach the worker.)
import { spawn } from 'node:child_process';
import { test as base, expect } from './support/app.js';
import { LANDING_HEADING } from './support/pages.js';

const test = base.extend({
  // eslint-disable-next-line no-empty-pattern
  server: async ({}, use, testInfo) => {
    const port = 4300 + testInfo.parallelIndex;
    const url = `http://127.0.0.1:${port}`;
    const child = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--outDir', 'dist-e2e', '--port', String(port), '--strictPort', '--host', '127.0.0.1'], { stdio: 'ignore' });
    const exited = new Promise((resolve) => { child.once('exit', resolve); });
    for (let attempt = 0; ; attempt += 1) {
      if (await fetch(url).then((response) => response.ok, () => false)) break;
      if (attempt > 100) throw new Error(`The offline tests' server didn't start on port ${port}.`);
      await new Promise((resolve) => { setTimeout(resolve, 100); });
    }
    const stop = async () => { if (child.exitCode === null && child.signalCode === null) child.kill(); await exited; };
    await use({ url, stop });
    await stop();
  },
  baseURL: async ({ server }, use) => use(server.url),
});

/** Waits for the worker to keep its files and take over the page. */
const workerReady = (page) => page.evaluate(() => navigator.serviceWorker.ready.then(() => undefined));

/** No server and no network, for the page and the worker alike. */
async function goOffline(context, server) {
  await server.stop();
  await context.setOffline(true);
}

test.use({ serviceWorkers: 'allow' });

test.describe('signed out', () => {
  test.use({ persona: null });

  test('the front page, Support now and help now open offline', async ({ page, context, server }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1, name: LANDING_HEADING })).toBeVisible();
    await workerReady(page);
    await goOffline(context, server);
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
  // The page that can't load offline fails on purpose, and React reports it.
  test.use({ allowFailedRequests: true, allowConsoleErrors: /dynamically imported module/ });

  test('a page opened before opens offline, and one that wasn\'t says it needs a connection', async ({ page, context, server }) => {
    await page.goto('/Today');
    await expect(page.getByRole('button', { name: /Begin check-in/ })).toBeVisible();
    await workerReady(page);
    await page.goto('/People');
    await expect(page.getByRole('heading', { level: 1, name: 'People' })).toBeVisible();
    await goOffline(context, server);
    await page.goto('/People');
    await expect(page.getByRole('heading', { level: 1, name: 'People' })).toBeVisible();
    await page.goto('/CosmicAddons');
    await expect(page.getByRole('heading', { level: 1, name: 'This page needs a connection the first time.' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Support now' }).first()).toBeVisible();
  });
});
