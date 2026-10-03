// Saves made without a connection are kept on the device and saved to the
// account when it returns (src/lib/kept-saves.js). The stand-in Supabase goes
// out of reach (backend.control.offline), as with a lost connection.
import { test, expect, SIGNED_OUT_FLAG } from './support/app.js';
import { openSettings } from './support/pages.js';
import { TODAY } from './support/persona.js';

const written = (backend, table) => backend.writes.filter((write) => write.table === table && write.method !== 'DELETE').flatMap((write) => write.rows);
const MOMENT = 'Wrote this on the train with no signal.';

/** The connection returns, and the page hears of it. */
async function reconnect(page, backend) {
  backend.control.offline = false;
  await page.evaluate(() => window.dispatchEvent(new Event('online')));
}

async function keepMomentOffline(page, backend) {
  await page.goto('/Analytics?tab=journal&compose=1');
  await page.getByLabel('What do you want to remember?').fill(MOMENT);
  backend.control.offline = true;
  await page.getByRole('button', { name: 'Save journal entry' }).click();
  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(page.getByRole('region', { name: 'Kept on this device' })).toContainText(MOMENT);
}

// Saves fail on purpose while the account is out of reach, and the browser logs each.
test.use({ allowFailedRequests: true });

test('a check-in saved without a connection is kept, then saved when the connection returns', async ({ page, backend }) => {
  await page.goto('/Today');
  await page.getByRole('button', { name: /Begin check-in/ }).click();
  await page.getByRole('radio', { name: '7 of 10' }).click();
  backend.control.offline = true;
  await page.getByRole('button', { name: /Keep short check-in/ }).click();
  const keptNote = page.getByRole('status').filter({ hasText: "Today's check-in is kept on this device." });
  await expect(keptNote).toBeVisible();
  expect(written(backend, 'daily_check_ins')).toEqual([]);
  await reconnect(page, backend);
  await expect.poll(() => written(backend, 'daily_check_ins')).toEqual([expect.objectContaining({ date: TODAY, mood_score: 7 })]);
  await expect(keptNote).toBeHidden();
  await expect(page.getByRole('heading', { name: 'Today, kept' })).toBeVisible();
});

test.describe('with the device offline', () => {
  // The page's own image is fetched while the device is offline.
  test.use({ allowFailedAppLoads: true });

  test('a check-in opens at once, is kept, and reopens from what was kept', async ({ page, context, backend }) => {
    await page.goto('/Today');
    await expect(page.getByRole('button', { name: /Begin check-in/ })).toBeVisible();
    // The browser reports no connection (requests the stand-in answers would
    // still be answered, so it goes out of reach too). Nothing waits on reads
    // that can't be answered.
    backend.control.offline = true;
    await context.setOffline(true);
    await page.getByRole('button', { name: /Begin check-in/ }).click();
    await page.getByRole('radio', { name: '5 of 10' }).click({ timeout: 3000 });
    await page.getByRole('button', { name: /Keep short check-in/ }).click();
    const keptNote = page.getByRole('status').filter({ hasText: "Today's check-in is kept on this device." });
    await expect(keptNote).toBeVisible();
    await page.getByRole('button', { name: 'Revisit today' }).click();
    await expect(page.getByRole('radio', { name: '5 of 10' })).toBeChecked({ timeout: 3000 });
    await page.getByRole('button', { name: 'Back' }).click();
    await expect(keptNote).toBeVisible();
    expect(written(backend, 'daily_check_ins')).toEqual([]);
    // The browser says when the connection is back.
    backend.control.offline = false;
    await context.setOffline(false);
    await expect.poll(() => written(backend, 'daily_check_ins')).toEqual([expect.objectContaining({ date: TODAY, mood_score: 5 })]);
    await expect(keptNote).toBeHidden();
  });
});

test('a kept check-in whose answer was lost is known as saved, not taken for another version', async ({ page, backend }) => {
  await page.goto('/Today');
  await page.getByRole('button', { name: /Begin check-in/ }).click();
  await page.getByRole('radio', { name: '6 of 10' }).click();
  backend.control.offline = true;
  await page.getByRole('button', { name: /Keep short check-in/ }).click();
  const keptNote = page.getByRole('status').filter({ hasText: "Today's check-in is kept on this device." });
  await expect(keptNote).toBeVisible();
  backend.control.loseAnswers.add('daily_check_ins');
  await reconnect(page, backend);
  await expect.poll(() => written(backend, 'daily_check_ins').length).toBe(1);
  await expect(keptNote).toBeVisible();
  backend.control.loseAnswers.clear();
  await page.evaluate(() => window.dispatchEvent(new Event('online')));
  await expect(keptNote).toBeHidden();
  await expect(page.getByRole('region', { name: 'Kept on this device: your choice' })).toBeHidden();
  // The stored day already held it, so it wasn't written again.
  expect(written(backend, 'daily_check_ins')).toEqual([expect.objectContaining({ date: TODAY, mood_score: 6 })]);
});

test('a kept check-in never replaces one saved somewhere else meanwhile without asking', async ({ page, backend, database }) => {
  await page.goto('/Today');
  await page.getByRole('button', { name: /Begin check-in/ }).click();
  await page.getByRole('radio', { name: '7 of 10' }).click();
  backend.control.offline = true;
  await page.getByRole('button', { name: /Keep short check-in/ }).click();
  await expect(page.getByRole('status').filter({ hasText: "Today's check-in is kept on this device." })).toBeVisible();
  // Meanwhile, another device saves today's check-in.
  await database.db.query("insert into public.daily_check_ins (user_id, date, mood_score, notes) select id, $1, 3, 'From the phone' from auth.users", [TODAY]);
  await reconnect(page, backend);
  const choice = page.getByRole('region', { name: 'Kept on this device: your choice' });
  await expect(choice).toContainText('Check-in for');
  await expect(choice).toContainText('mood 7 of 10');
  await expect(choice).toContainText("This day has a saved check-in that's different from this one.");
  expect(written(backend, 'daily_check_ins')).toEqual([]);
  // Discarding asks first.
  await choice.getByRole('button', { name: 'Discard this version' }).click();
  await choice.getByRole('button', { name: 'Keep it' }).click();
  await choice.getByRole('button', { name: 'Save this version' }).click();
  await expect.poll(() => written(backend, 'daily_check_ins')).toEqual([expect.objectContaining({ date: TODAY, mood_score: 7 })]);
  await expect(choice).toBeHidden();
  const { rows } = await database.db.query('select mood_score::int as mood from public.daily_check_ins where date = $1', [TODAY]);
  expect(rows).toEqual([{ mood: 7 }]);
});

test('a journal entry kept without a connection is saved once, even when an answer is lost', async ({ page, backend, database }) => {
  await keepMomentOffline(page, backend);
  // The first try is saved, but its answer is lost on the way back, so the
  // entry stays kept and is sent again.
  backend.control.loseAnswers.add('vibe_journal_entries');
  await reconnect(page, backend);
  await expect.poll(() => written(backend, 'vibe_journal_entries').length).toBe(1);
  await expect(page.getByRole('region', { name: 'Kept on this device' })).toContainText(MOMENT);
  backend.control.loseAnswers.clear();
  await page.evaluate(() => window.dispatchEvent(new Event('online')));
  await expect(page.getByRole('region', { name: 'Kept on this device' })).toBeHidden();
  const { rows } = await database.db.query('select count(*)::int as n from public.vibe_journal_entries where notes = $1', [MOMENT]);
  expect(rows[0].n).toBe(1);
  await expect(page.getByText(MOMENT)).toBeVisible();
});

test('a change kept offline to an entry changed somewhere else waits for the person, who can discard it', async ({ page, backend, database }) => {
  const JAW = 'Noticed my jaw was clenched the whole commute.';
  await page.goto('/Analytics?tab=journal');
  await page.locator('article', { hasText: JAW }).getByRole('button', { name: /Edit entry from/ }).click();
  await page.getByLabel('What do you want to remember?').fill('Edited on the train.');
  backend.control.offline = true;
  await page.getByRole('button', { name: 'Save journal entry' }).click();
  await expect(page.getByRole('dialog')).toBeHidden();
  const kept = page.getByRole('region', { name: 'Kept on this device' });
  await expect(kept).toContainText('Changes to your entry from');
  // Opened again, the entry shows the change kept here.
  await page.locator('article', { hasText: JAW }).getByRole('button', { name: /Edit entry from/ }).click();
  await expect(page.getByLabel('What do you want to remember?')).toHaveValue('Edited on the train.');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toBeHidden();
  // Meanwhile, another device changes the same entry.
  await database.db.query("update public.vibe_journal_entries set notes = 'Edited on the laptop.' where notes like $1", [`${JAW}%`]);
  await reconnect(page, backend);
  await expect(kept).toContainText('This entry was changed somewhere else too.');
  expect(written(backend, 'vibe_journal_entries')).toEqual([]);
  await kept.getByRole('button', { name: 'Discard this version' }).click();
  await kept.getByRole('button', { name: 'Discard', exact: true }).click();
  await expect(kept).toBeHidden();
  const { rows } = await database.db.query("select notes from public.vibe_journal_entries where notes like 'Edited%'");
  expect(rows).toEqual([{ notes: 'Edited on the laptop.' }]);
});

test('signing out warns about entries not yet saved, and deletes them from the device', async ({ page, backend }, testInfo) => {
  await keepMomentOffline(page, backend);
  // The account is reachable again, but nothing has been sent yet.
  backend.control.offline = false;
  await openSettings(page, testInfo);
  await page.getByRole('button', { name: 'Sign out on this device' }).click();
  const warning = page.getByRole('alert').filter({ hasText: "1 entry kept on this device hasn't been saved to your account yet." });
  await expect(warning).toBeVisible();
  await page.getByRole('button', { name: 'Stay signed in' }).click();
  await expect(warning).toBeHidden();
  await page.getByRole('button', { name: 'Sign out on this device' }).click();
  await page.evaluate((flag) => sessionStorage.setItem(flag, '1'), SIGNED_OUT_FLAG);
  await page.getByRole('button', { name: 'Sign out and delete it' }).click();
  await expect(page.getByLabel('Email address')).toBeVisible();
  expect(await page.evaluate(() => Object.keys(localStorage).filter((key) => key.startsWith('vibe:kept-saves:')))).toEqual([]);
  expect(written(backend, 'vibe_journal_entries')).toEqual([]);
});

test('with the history out of reach, Today still takes a check-in and keeps it', async ({ page, backend }) => {
  // The client tries a failed read again before giving up.
  test.setTimeout(60_000);
  backend.control.offline = true;
  await page.goto('/Today');
  await expect(page.getByRole('status').filter({ hasText: "Your history will load when you're back online." })).toBeVisible({ timeout: 30_000 });
  await page.getByRole('button', { name: /Begin check-in/ }).click();
  await page.getByRole('radio', { name: '4 of 10' }).click();
  await page.getByRole('button', { name: /Keep short check-in/ }).click();
  await expect(page.getByRole('status').filter({ hasText: "Today's check-in is kept on this device." })).toBeVisible();
  await reconnect(page, backend);
  await expect.poll(() => written(backend, 'daily_check_ins'), { timeout: 30_000 }).toEqual([expect.objectContaining({ date: TODAY, mood_score: 4 })]);
});
