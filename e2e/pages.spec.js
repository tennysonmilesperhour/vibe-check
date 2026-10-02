// Every page opens for someone with a history, without errors, failed loads,
// refused or unmodelled requests, or requests to other sites (see support/app.js).
import { test, expect } from './support/app.js';
import { PAGES } from './support/pages.js';

for (const { path, heading, marker } of PAGES) {
  test(`${path} opens`, async ({ page }) => {
    await page.goto(path);
    await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible();
    await expect(marker(page).first()).toBeVisible();
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('alert')).toHaveCount(0);
  });
}

test('people show in orbit', async ({ page }) => {
  await page.goto('/People');
  for (const name of ['Mara', 'Dad', 'Priya', 'Jules']) await expect(page.locator('.orbit-person', { hasText: name })).toBeVisible();
});

test('an unknown address says so', async ({ page }) => {
  await page.goto('/no-such-page');
  await expect(page.getByRole('heading', { level: 1, name: "This page isn't on the map" })).toBeVisible();
});

test.describe('signed out', () => {
  test.use({ persona: null });

  test('shows the sign-in screen', async ({ page }) => {
    await page.goto('/Today');
    await expect(page.getByLabel('Email address')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
  });

  test('help-now and policy pages open without an account', async ({ page }) => {
    for (const { path, heading } of PAGES.filter((item) => ['/support-now', '/privacy', '/terms'].includes(item.path))) {
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
