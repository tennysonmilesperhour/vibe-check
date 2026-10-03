// Today says when last week's report is ready (src/lib/week-ready.js), in the
// app only, until the person reads it or hides the note. The test clock is a
// Tuesday, so last week ran Monday, September 21 to Sunday the 27th.
import { test, expect } from './support/app.js';

const NOTE = 'Your weekly report for Sep 21 to 27, 2026 is ready.';

test('Today says when last week\'s report is ready, until it\'s read', async ({ page }) => {
  await page.goto('/Today');
  await expect(page.getByText(NOTE)).toBeVisible();
  await page.getByRole('link', { name: 'Read your weekly report', exact: true }).click();
  await expect(page).toHaveURL(/tab=reports&period=weekly&reportDate=2026-09-21/);
  await page.goto('/Today');
  await expect(page.getByRole('button', { name: /Begin check-in/ })).toBeVisible();
  await expect(page.getByText(NOTE)).toBeHidden();
});

test('hiding the note keeps it hidden for that week', async ({ page }) => {
  await page.goto('/Today');
  await page.getByRole('button', { name: 'Hide the note about your week' }).click();
  await expect(page.getByText(NOTE)).toBeHidden();
  await page.reload();
  await expect(page.getByRole('button', { name: /Begin check-in/ })).toBeVisible();
  await expect(page.getByText(NOTE)).toBeHidden();
});

test('after today\'s check-in, the note is a card on the reflection page', async ({ page }) => {
  await page.goto('/Today');
  await page.getByRole('button', { name: /Begin check-in/ }).click();
  await page.getByRole('radio', { name: '6 of 10' }).click();
  await page.getByRole('button', { name: /Keep short check-in/ }).click();
  const card = page.getByRole('region', { name: 'Sep 21 to 27, 2026' });
  await expect(card).toContainText('YOUR WEEK IS READY');
  await card.getByRole('link', { name: 'Read your weekly report' }).click();
  await expect(page).toHaveURL(/reportDate=2026-09-21/);
});

test.describe('with nothing recorded yet', () => {
  test.use({ persona: 'newcomer' });

  test('there is no note', async ({ page }) => {
    await page.goto('/Today');
    await expect(page.getByRole('heading', { name: 'Welcome to your sanctuary.' })).toBeVisible();
    await expect(page.getByText(/weekly report for/)).toHaveCount(0);
  });
});
