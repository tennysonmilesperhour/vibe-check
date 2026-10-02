// Automated WCAG 2.2 A and AA checks (axe-core) on every page and the main
// dialogs. Automated checks catch part of what matters; they don't replace
// trying the app with a keyboard and a screen reader.
import AxeBuilder from '@axe-core/playwright';
import { test, expect } from './support/app.js';

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

async function expectNoViolations(page) {
  await page.waitForLoadState('networkidle');
  const { violations } = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  const found = violations.map((violation) => `${violation.impact} ${violation.id}: ${violation.help} at ${violation.nodes.map((node) => node.target.join(' ')).join(', ')}`);
  expect(found).toEqual([]);
}

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
  test(`${path} meets WCAG A and AA checks`, async ({ page }) => {
    await page.goto(path);
    await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible();
    await expectNoViolations(page);
  });
}

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
  await expect(page.getByRole('heading', { level: 1, name: 'Come back to yourself.' })).toBeVisible();
  if (testInfo.project.name === 'mobile') await page.getByRole('button', { name: 'Open menu' }).click();
  await page.getByRole('button', { name: /Settings/ }).first().click();
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
