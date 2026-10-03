// The pages every suite visits, each with its h1 and something only that
// page shows, so a page that quietly turned into another one fails.

/** @type {Array<{ path: string, heading: string, marker: (page: import('@playwright/test').Page) => import('@playwright/test').Locator }>} */
export const PAGES = [
  { path: '/Today', heading: 'Come back to yourself.', marker: (page) => page.getByRole('button', { name: /Begin check-in/ }) },
  { path: '/Analytics', heading: 'The whole pattern.', marker: (page) => page.getByRole('heading', { name: 'Daily mood calendar' }) },
  { path: '/Analytics?tab=journal', heading: 'The whole pattern.', marker: (page) => page.getByText('Coffee with Jules. I did not compare myself once.') },
  { path: '/Analytics?tab=reports', heading: 'The whole pattern.', marker: (page) => page.getByRole('heading', { name: 'What do you want to carry forward?' }) },
  { path: '/People', heading: 'People', marker: (page) => page.locator('.orbit-person', { hasText: 'Mara' }) },
  { path: '/Practice', heading: 'Come back to yourself.', marker: (page) => page.getByRole('heading', { name: 'What feels present?' }) },
  { path: '/Practice?tab=healing', heading: 'Practice board', marker: (page) => page.getByText('Morning pages') },
  { path: '/CosmicAddons', heading: 'Your Loom', marker: (page) => page.getByText('Human Design', { exact: true }) },
  { path: '/CosmicAddons?tab=tarot', heading: 'Your Loom', marker: (page) => page.getByRole('heading', { level: 2, name: 'The table is set' }) },
  { path: '/Summary', heading: 'A summary to share', marker: (page) => page.getByRole('heading', { level: 1, name: 'A summary to share' }) },
  { path: '/support-now', heading: "You don't have to hold this alone.", marker: (page) => page.getByRole('heading', { level: 1, name: "You don't have to hold this alone." }) },
  { path: '/privacy', heading: 'Privacy policy', marker: (page) => page.getByRole('heading', { level: 1, name: 'Privacy policy' }) },
  { path: '/terms', heading: 'Terms of use', marker: (page) => page.getByRole('heading', { level: 1, name: 'Terms of use' }) },
  { path: '/support', heading: 'Support', marker: (page) => page.getByRole('heading', { level: 1, name: 'Support' }) },
  { path: '/help-now', heading: 'Help for this moment.', marker: (page) => page.getByRole('heading', { name: 'What feels present?' }) },
];

/** The front page's headline, for visitors who aren't signed in. */
export const LANDING_HEADING = 'See how the people and habits in your life affect you.';

/** Opens Settings, through the menu on a phone. */
export async function openSettings(page, testInfo) {
  if (testInfo.project.name === 'mobile') await page.getByRole('button', { name: 'Open menu' }).click();
  await page.getByRole('button', { name: /Settings/ }).first().click();
}
