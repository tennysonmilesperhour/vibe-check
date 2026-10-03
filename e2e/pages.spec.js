// Every page opens for someone with a history, without errors, failed loads,
// refused or unmodelled requests, or requests to other sites (see support/app.js).
import { test, expect } from './support/app.js';
import { LANDING_HEADING, PAGES } from './support/pages.js';

for (const { path, heading, marker } of PAGES) {
  test(`${path} opens`, async ({ page }) => {
    await page.goto(path);
    await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible();
    await expect(marker(page).first()).toBeVisible();
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('alert')).toHaveCount(0);
  });
}

test('pages arrive with the production security headers', async ({ page }) => {
  for (const path of ['/Today', '/privacy']) {
    const headers = (await page.goto(path)).headers();
    expect(headers['content-security-policy']).toContain("script-src 'self'");
    expect(headers['x-frame-options']).toBe('DENY');
  }
});

test('people show in orbit', async ({ page }) => {
  await page.goto('/People');
  for (const name of ['Mara', 'Dad', 'Priya', 'Jules']) await expect(page.locator('.orbit-person', { hasText: name })).toBeVisible();
});

test('the sign-in addresses open the app for someone signed in', async ({ page }) => {
  for (const path of ['/signin', '/signup']) {
    await page.goto(path);
    await expect(page.getByRole('button', { name: /Begin check-in/ })).toBeVisible();
    await expect(page).toHaveURL('/');
  }
});

test('an unknown address says so', async ({ page }) => {
  await page.goto('/no-such-page');
  await expect(page.getByRole('heading', { level: 1, name: "This page isn't on the map" })).toBeVisible();
});

test.describe("a page whose files don't load", () => {
  // Cosmos's script fails on purpose, and React reports it: the first time
  // with no module at all, as the app reloads once to look for a newer one.
  test.use({ allowFailedAppLoads: true, allowFailedRequests: true, allowConsoleErrors: /dynamically imported module|reading 'default'/ });

  for (const { server, heading } of [{ server: 'a newer build', heading: 'Vibe Check was updated.' }, { server: 'this build', heading: "This page didn't load." }]) {
    test(`says "${heading}" when the server has ${server}`, async ({ page }) => {
      await page.route(/\/assets\/CosmicAddons-[\w-]+\.js$/, (route) => route.abort());
      await page.goto('/Today');
      const build = await page.locator('meta[name="vibe-build"]').getAttribute('content');
      const answer = server === 'this build' ? build : 'newer-build';
      await page.route(/\/version\.json/, (route) => route.fulfill({ json: { build: answer, environment: 'development' } }));
      await page.goto('/CosmicAddons');
      await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible();
      if (server === 'a newer build') {
        await page.getByRole('button', { name: 'Open the latest version' }).click();
        await expect(page).toHaveURL(/_vibe_version=newer-build/);
      }
    });
  }
});

test.describe('signed out', () => {
  test.use({ persona: null });

  test('the front page says what Vibe Check is and what stays free', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1, name: LANDING_HEADING })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Free forever' })).toBeVisible();
    await page.getByRole('link', { name: 'Create a free account' }).first().click();
    await expect(page).toHaveURL('/signup');
    await expect(page.getByLabel('Your name')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Create your account' })).toBeVisible();
  });

  test('any other address shows the sign-in screen', async ({ page }) => {
    await page.goto('/Today');
    await expect(page.getByLabel('Email address')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Enter your sanctuary' })).toBeVisible();
  });

  test('a sign-in link that expired says so', async ({ page }) => {
    await page.goto('/#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired');
    await expect(page.getByRole('alert')).toHaveText('That link has expired or was already used. Sign in, or ask for a new link below.');
    await expect(page.getByLabel('Email address')).toBeVisible();
  });

  test('help-now and policy pages open without an account', async ({ page }) => {
    for (const { path, heading } of PAGES.filter((item) => ['/support-now', '/help-now', '/privacy', '/terms', '/support'].includes(item.path))) {
      await page.goto(path);
      await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible();
    }
  });
});

test.describe('first run', () => {
  test.use({ persona: 'newcomer' });

  test('welcomes someone with no history', async ({ page }) => {
    await page.goto('/Today');
    await expect(page.getByRole('heading', { level: 1, name: 'Welcome to your sanctuary.' })).toBeVisible();
  });
});
