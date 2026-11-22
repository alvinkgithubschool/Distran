import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
async function enter(page: Page, creator = false) {
  await page.route('http://127.0.0.1:8000/v1/**', (route) => route.abort());
  await page.goto('/');
  await page.getByRole('button', { name: creator ? 'Try as a creator' : 'Try as a user' }).click();
  await page.getByRole('button', { name: 'Skip for now' }).click();
}
test('creator customizations and claim requests persist without granting ownership', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await enter(page, true);
  await page.goto('/#/creators/creator%40distran.test');
  await expect(page.getByRole('heading', { name: 'Night Room Studio', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Customize page' }).click();
  await page.getByRole('textbox', { name: 'Your headline' }).fill('Small studio. Infinite worlds.');
  await page.getByRole('button', { name: 'Accent #c4a1dd' }).click();
  await page.locator('.featured-picker button').filter({ hasText: 'Dune' }).click();
  await page.getByRole('button', { name: 'Save creator page' }).click();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Small studio. Infinite worlds.' })).toBeVisible();
  await expect(page.locator('.creator-portfolio .work-card')).toHaveCount(1);
  await page.goto('/#/title/dune');
  await page.getByRole('button', { name: 'Claim your credit' }).click();
  await page.getByRole('textbox', { name: 'Your credited role' }).fill('Producer');
  await page
    .getByRole('textbox', { name: 'Public evidence link' })
    .fill('https://example.com/credits');
  await page.getByRole('button', { name: 'Save claim request' }).click();
  await expect(page.getByRole('link', { name: /Claim pending/ })).toBeVisible();
  await page.getByRole('link', { name: /Claim pending/ }).click();
  await page.reload();
  await expect(page.locator('.claim-row')).toContainText('Pending verification');
  await expect(page.locator('.claim-row')).toContainText('Producer');
  await page.screenshot({ path: '../../docs/preview/creator-page-desktop.png', fullPage: true });
  await page.getByRole('button', { name: 'Withdraw', exact: true }).click();
  await expect(page.locator('.claim-row')).toHaveCount(0);
  expect(errors).toEqual([]);
});
test('profile picture, banner, display name and unique username survive reload', async ({
  page,
}) => {
  await enter(page);
  await page.goto('/#/settings');
  await page.getByRole('button', { name: 'Edit profile' }).click();
  await page.getByRole('textbox', { name: 'Name', exact: true }).fill('Alex River');
  await page.getByRole('textbox', { name: 'Handle', exact: true }).fill('alexriver');
  await page.getByLabel('Upload avatar').setInputFiles('public/artwork/it-takes-two.jpg');
  await expect(page.getByAltText('avatar preview')).toBeVisible();
  await page.getByLabel('Upload banner').setInputFiles('public/artwork/it-takes-two-hero.jpg');
  await expect(page.getByAltText('banner preview')).toBeVisible();
  await page.getByRole('button', { name: 'Save profile', exact: true }).click();
  await page.goto('/#/profile');
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Alex River', exact: true })).toBeVisible();
  await expect(page.locator('.handle')).toHaveText('@alexriver');
  await expect(page.getByAltText('Your profile banner')).toBeVisible();
  await expect(page.locator('.profile-identity .avatar img')).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: '../../docs/preview/custom-profile-mobile.png', fullPage: true });
});
test('spotlight controls, creator search and centered mobile poster work', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await enter(page);
  const spotlight = page.getByRole('region', { name: 'Featured recommendations' });
  await expect(spotlight.getByRole('heading', { name: 'It Takes Two' })).toBeVisible();
  await page.getByRole('button', { name: 'Next recommendation' }).click();
  await expect(spotlight.getByRole('heading', { name: 'Dune: Part Two' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Play recommendations' })).toBeVisible();
  await page.getByRole('button', { name: 'Previous recommendation' }).click();
  await expect(spotlight.getByRole('heading', { name: 'It Takes Two' })).toBeVisible();
  await page.goto('/#/creators');
  await page.getByRole('searchbox', { name: 'Search creators' }).fill('Night Room');
  await expect(page.locator('.directory-card.on-distran')).toHaveCount(1);
  await page.locator('.directory-card.on-distran').click();
  await expect(page).toHaveURL(/creators\/creator/);
  await expect(page.locator('.creator-identity .creator-badge')).toBeVisible();
  await page.goto('/#/title/dune');
  const poster = await page.locator('.title-poster').boundingBox();
  const stats = await page.locator('.title-score').boundingBox();
  const actions = await page.locator('.title-actions').boundingBox();
  expect(poster!.width).toBeGreaterThan(210);
  expect(Math.abs(poster!.x + poster!.width / 2 - 195)).toBeLessThan(2);
  expect(stats!.y).toBeGreaterThan(poster!.y + poster!.height);
  expect(actions!.y).toBeGreaterThan(stats!.y);
  await expect(page.getByRole('button', { name: 'Remove from Top 4', exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
  await page.screenshot({
    path: '../../docs/preview/poster-title-mobile.png',
    fullPage: true,
    animations: 'disabled',
  });
});

test('live creator directory opens credits and preserves a readable follow', async ({ page }) => {
  await enter(page);
  const creator = {
    id: 'tmdb:person:525',
    name: 'Christopher Nolan',
    kind: 'Directing',
    provider: 'tmdb',
    bio: 'Stories across space and time.',
    sourceUrl: 'https://www.themoviedb.org/person/525',
  };
  await page.route('http://127.0.0.1:8000/v1/creators/search?**', (route) =>
    route.fulfill({
      json: { items: [creator], status: 'ok', errors: [], page: 1, hasMore: false },
    }),
  );
  await page.route('http://127.0.0.1:8000/v1/creators/tmdb%3Aperson%3A525', (route) =>
    route.fulfill({ json: { creator, works: [], cache: 'hit' } }),
  );
  await page.goto('/#/discover');
  await page.getByRole('link', { name: 'Find creators' }).click();
  await page.getByRole('searchbox', { name: 'Search creators' }).fill('Christopher Nolan');
  await expect(
    page.locator('.directory-card').filter({ hasText: 'Christopher Nolan' }),
  ).toBeVisible();
  await page.locator('.directory-card').filter({ hasText: 'Christopher Nolan' }).click();
  await expect(page.getByRole('heading', { name: 'Christopher Nolan', exact: true })).toBeVisible();
  await expect(page.locator('.creator-identity .creator-badge')).toHaveCount(0);
  await page.getByRole('button', { name: 'Follow creator' }).click();
  await page.goto('/#/profile');
  await expect(
    page.locator('.creator-pills').getByRole('link', { name: 'Christopher Nolan' }),
  ).toBeVisible();
  await page.locator('.creator-pills').getByRole('link', { name: 'Christopher Nolan' }).click();
  await expect(page.getByRole('heading', { name: 'Christopher Nolan', exact: true })).toBeVisible();
});
