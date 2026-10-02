// Automated WCAG 2.2 A and AA checks (axe-core) on every page and the main
// dialogs. Automated checks catch part of what matters; they don't replace
// trying the app with a keyboard and a screen reader.
import AxeBuilder from '@axe-core/playwright';
import { test, expect } from './support/app.js';
import { PAGES, openSettings } from './support/pages.js';

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

async function expectNoViolations(page) {
  await page.waitForLoadState('networkidle');
  // preload: false keeps axe from fetching stylesheets itself, which the
  // production Content-Security-Policy (connect-src) refuses. options() goes
  // first: it replaces the options withTags() sets.
  const { violations } = await new AxeBuilder({ page }).options({ preload: false }).withTags(TAGS).analyze();
  const found = violations.map((violation) => `${violation.impact} ${violation.id}: ${violation.help} at ${violation.nodes.map((node) => node.target.join(' ')).join(', ')}`);
  expect(found).toEqual([]);
}

for (const { path, heading, marker } of PAGES) {
  test(`${path} meets WCAG A and AA checks`, async ({ page }) => {
    await page.goto(path);
    await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible();
    await expect(marker(page).first()).toBeVisible();
    await expectNoViolations(page);
  });
}

test('the practice board reads out how far each item has come', async ({ page }) => {
  await page.goto('/Practice?tab=healing');
  const progress = page.getByRole('progressbar', { name: 'Your sense of Morning pages' });
  await expect(progress).toHaveAttribute('aria-valuenow', '60');
  await expect(progress).toHaveAttribute('aria-valuetext', '60 of 100');
});

test('the check-in meets WCAG A and AA checks', async ({ page }) => {
  await page.goto('/Today');
  await page.getByRole('button', { name: /Begin check-in/ }).click();
  await expect(page.getByRole('radio', { name: '7 of 10' })).toBeVisible();
  await expectNoViolations(page);
});

test('the journal composer meets WCAG A and AA checks', async ({ page }) => {
  await page.goto('/Analytics?tab=journal&compose=1');
  await expect(page.getByLabel('What do you want to remember?')).toBeVisible();
  await expectNoViolations(page);
});

test('the add-person dialog meets WCAG A and AA checks', async ({ page }) => {
  await page.goto('/People');
  await page.getByRole('button', { name: 'Add person' }).first().click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expectNoViolations(page);
});

test('settings meet WCAG A and AA checks', async ({ page }, testInfo) => {
  await page.goto('/Today');
  await expect(page.getByRole('button', { name: /Begin check-in/ })).toBeVisible();
  await openSettings(page, testInfo);
  await expect(page.getByRole('dialog', { name: 'Settings & privacy' })).toBeVisible();
  await expectNoViolations(page);
});

test.describe('signed out', () => {
  test.use({ persona: null });

  test('the sign-in screen meets WCAG A and AA checks', async ({ page }) => {
    await page.goto('/Today');
    await expect(page.getByLabel('Email address')).toBeVisible();
    await expectNoViolations(page);
  });
});

test.describe('first run', () => {
  test.use({ persona: 'newcomer' });

  test('the first-run page meets WCAG A and AA checks', async ({ page }) => {
    await page.goto('/Today');
    await expect(page.getByRole('heading', { level: 1, name: 'Welcome to your sanctuary.' })).toBeVisible();
    await expectNoViolations(page);
  });
});
