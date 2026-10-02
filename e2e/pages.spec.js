// Every page opens for someone with a history, without errors, load
// failures, unmodelled requests or requests to other sites (see support/app.js).
import { test, expect } from './support/app.js';

const PAGES = [
  ['/Today', 'Come back to yourself.'],
  ['/Analytics', 'The whole pattern.'],
  ['/Analytics?tab=journal', 'The whole pattern.'],
  ['/Analytics?tab=reports', 'The whole pattern.'],
  ['/People', 'People'],
  ['/Practice', 'Come back to yourself.'],
  ['/Practice?tab=healing', 'Practice board'],
  ['/CosmicAddons', 'Your Loom'],
  ['/CosmicAddons?tab=tarot', 'Your Loom'],
  ['/Summary', 'A summary to share'],
  ['/support-now', "You don't have to hold this alone."],
  ['/privacy', 'Privacy policy'],
  ['/terms', 'Terms of use'],
  ['/support', 'Support'],
];

for (const [path, heading] of PAGES) {
  test(`${path} opens`, async ({ page }) => {
    await page.goto(path);
    await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible();
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('alert')).toHaveCount(0);
  });
}

test('the record shows on Patterns', async ({ page }) => {
  await page.goto('/Analytics?tab=journal');
  await expect(page.getByText('Coffee with Jules. I did not compare myself once.')).toBeVisible();
});

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
    for (const [path, heading] of [['/support-now', "You don't have to hold this alone."], ['/privacy', 'Privacy policy'], ['/terms', 'Terms of use']]) {
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
