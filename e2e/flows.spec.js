// The everyday paths: keeping a day, a moment and a person, signing in and
// out, and getting a page back after a failed load.
import { test, expect, SIGNED_OUT_FLAG, STORAGE_KEY } from './support/app.js';
import { openSettings } from './support/pages.js';
import { TODAY } from './support/persona.js';

const written = (backend, table) => backend.writes.filter((write) => write.table === table && write.method !== 'DELETE').flatMap((write) => write.rows);

test('keeping a short check-in saves today and shows it kept', async ({ page, backend }) => {
  await page.goto('/Today');
  await page.getByRole('button', { name: /Begin check-in/ }).click();
  await page.getByRole('radio', { name: '7 of 10' }).click();
  await page.getByRole('button', { name: /Keep short check-in/ }).click();
  await expect(page.getByRole('heading', { name: 'Today, kept' })).toBeVisible();
  expect(written(backend, 'daily_check_ins')).toEqual([expect.objectContaining({ date: TODAY, mood_score: 7 })]);
});

test('keeping a moment adds it to the journal', async ({ page, backend }) => {
  await page.goto('/Analytics?tab=journal&compose=1');
  await page.getByLabel('What do you want to remember?').fill('Watched the first frost on the porch rail.');
  await page.getByRole('button', { name: 'Save journal entry' }).click();
  // The composer's text field holds the same words until it closes.
  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(page.getByText('Watched the first frost on the porch rail.')).toBeVisible();
  expect(written(backend, 'vibe_journal_entries')).toEqual([expect.objectContaining({ notes: 'Watched the first frost on the porch rail.', is_draft: false })]);
});

test('adding a person puts them in orbit', async ({ page, backend }) => {
  await page.goto('/People');
  await page.getByRole('button', { name: 'Add person' }).first().click();
  await page.getByLabel('Name').fill('Robin');
  await page.getByRole('dialog').getByRole('button', { name: 'Add person' }).click();
  await expect(page.locator('.orbit-person', { hasText: 'Robin' })).toBeVisible();
  expect(written(backend, 'people')).toEqual([expect.objectContaining({ name: 'Robin' })]);
});

test('a practice opens straight to its steps', async ({ page }) => {
  await page.goto('/Practice?tab=somatic&state=on-edge');
  await page.getByRole('button', { name: 'Try find your surroundings' }).click();
  await expect(page.getByText('Notice three neutral things around you.', { exact: false })).toBeVisible();
});

test('signing out ends the session on this device', async ({ page, backend }, testInfo) => {
  await page.goto('/Today');
  await expect(page.getByRole('button', { name: /Begin check-in/ })).toBeVisible();
  await openSettings(page, testInfo);
  // Keeps the test fixture from signing the persona back in on the reload below.
  await page.evaluate((flag) => sessionStorage.setItem(flag, '1'), SIGNED_OUT_FLAG);
  await page.getByRole('button', { name: 'Sign out on this device' }).click();
  await expect(page.getByLabel('Email address')).toBeVisible();
  expect(backend.authCalls).toContain('POST /logout');
  await page.reload();
  await expect(page.getByLabel('Email address')).toBeVisible();
  expect(await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY)).toBeNull();
});

test.describe('signed out', () => {
  test.use({ persona: null, allowFailedRequests: true });

  test('a wrong password says what went wrong', async ({ page }) => {
    await page.goto('/Today');
    await page.getByLabel('Email address').fill('someone@example.com');
    await page.getByLabel('Password').fill('not-the-password');
    await page.getByRole('button', { name: 'Enter your sanctuary' }).click();
    await expect(page.getByText('Email or password is incorrect.', { exact: false })).toBeVisible();
  });
});

test.describe('a failed load', () => {
  test.use({ allowFailedRequests: true });

  test('can be retried from where the person is', async ({ page, backend }) => {
    // The Supabase client retries a failed read itself before the page hears of it.
    test.setTimeout(60_000);
    backend.control.failTables.add('daily_check_ins');
    await page.goto('/Analytics');
    const retry = page.getByRole('button', { name: 'Try loading again' });
    await expect(retry).toBeVisible({ timeout: 30_000 });
    backend.control.failTables.clear();
    backend.control.delayMs = 1500;
    backend.control.delayTables.add('daily_check_ins');
    await retry.focus();
    await retry.press('Enter');
    const trying = page.getByRole('button', { name: 'Trying…' });
    await expect(trying).toBeFocused();
    await expect(trying).toHaveAttribute('aria-disabled', 'true');
    await expect(page.getByRole('heading', { name: 'Daily mood calendar' })).toBeVisible();
    await expect(page.getByRole('alert')).toHaveCount(0);
  });
});
