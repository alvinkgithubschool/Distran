import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
test.beforeEach(async ({ page }) => {
  // Existing preview workflows are deterministic and must never consume live quotas.
  await page.route('http://127.0.0.1:8000/v1/**', (route) => route.abort());
});
async function enter(page: Page, creator = false) {
  await page.goto('/');
  await page.getByRole('button', { name: creator ? 'Try as a creator' : 'Try as a user' }).click();
  await expect(page).toHaveURL(/setup/);
  await page.getByRole('button', { name: 'Skip for now' }).click();
  await expect(
    page.getByRole('heading', { name: /Good (morning|afternoon|evening)/ }),
  ).toBeVisible();
}
test('account, ledger, cross-media list and settings survive reload and account switching', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await enter(page);
  await page.goto('/#/discover');
  await page.getByRole('searchbox', { name: 'Search media' }).fill('Dune');
  await expect(page.locator('.catalog-results .work-card')).toHaveCount(1);
  await page.locator('.catalog-results .work-card').click();
  await page.getByRole('button', { name: 'Log this film' }).click();
  await page.getByRole('combobox', { name: 'Precise rating' }).selectOption('4.5');
  await page.getByPlaceholder(/A feeling, a favourite moment/).fill('The desert remembers.');
  await page.getByRole('button', { name: 'Save to my ledger' }).click();
  await expect(page.locator('.toast')).toContainText('cultural memory');
  await page.reload();
  await expect(page.locator('.memory-log')).toContainText('The desert remembers.');
  await page.goto('/#/lists');
  await page.getByRole('button', { name: 'New list', exact: true }).click();
  await page.getByPlaceholder('Something like a feeling…').fill('A shared future');
  await page.getByRole('button', { name: 'Cyberpunk 2077 Game' }).click();
  await page.getByRole('button', { name: 'Dune: Part Two Film' }).click();
  await page.getByRole('button', { name: 'Create list', exact: true }).click();
  await page.reload();
  await expect(page.locator('.shelf-card').filter({ hasText: 'A shared future' })).toBeVisible();
  await page.goto('/#/settings');
  await page.getByRole('switch', { name: 'Private profile' }).click();
  await page.reload();
  await expect(page.getByRole('switch', { name: 'Private profile' })).toHaveAttribute(
    'aria-checked',
    'true',
  );
  await page.getByRole('button', { name: /Sign out/ }).click();
  await expect(page.getByRole('heading', { name: /Welcome back/ })).toBeVisible();
  await page.getByRole('button', { name: 'Try as a creator' }).click();
  await page.getByRole('button', { name: 'Skip for now' }).click();
  await page.goto('/#/profile');
  await expect(page.getByRole('heading', { name: 'Night Room Studio', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'The ledger', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'A memory waiting to happen.' })).toBeVisible();
  await expect(page.locator('.ledger-list')).toHaveCount(0);
  expect(errors).toEqual([]);
});
test('mobile navigation, search, Top 4 and local chat stay usable without horizontal overflow', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await enter(page);
  await expect(page.locator('.mobile-nav')).toBeVisible();
  await page.locator('.mobile-nav').getByRole('link', { name: 'Discover' }).click();
  await page.getByRole('searchbox', { name: 'Search media' }).fill('not a real movie');
  await expect(
    page.getByRole('heading', { name: 'A thread we haven’t found. Yet.' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Explore everything', exact: true }).click();
  await page.goto('/#/profile');
  await page.getByRole('button', { name: 'MAKE IT YOURS' }).first().click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('button', { name: 'Save your Top 4' }).click();
  await page.goto('/#/chat');
  await page.getByRole('button', { name: /Ari @ari0825/ }).click();
  await page.getByRole('textbox', { name: 'Message', exact: true }).fill('A co-op night soon?');
  await page.getByRole('button', { name: 'Save message locally' }).click();
  await page.reload();
  await page.getByRole('button', { name: /Ari @ari0825/ }).click();
  await expect(page.locator('.message-bubble')).toContainText('A co-op night soon?');
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  );
  expect(overflow).toBe(false);
  await expect(page.getByRole('button', { name: /Buddy FOLLOW A FEELING/ })).toBeEnabled();
});
test('capture Figma-inspired desktop and mobile screens with healthy artwork', async ({ page }) => {
  await page.goto('/');
  await page.screenshot({
    path: '../../docs/preview/tauri-signin-desktop.png',
    fullPage: true,
    animations: 'disabled',
  });
  await enter(page);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({
    path: '../../docs/preview/tauri-home-desktop.png',
    fullPage: true,
    animations: 'disabled',
  });
  for (const screen of ['discover', 'lists', 'profile', 'settings']) {
    await page.goto('/#/' + screen);
    await page.screenshot({
      path: `../../docs/preview/tauri-${screen}-desktop.png`,
      fullPage: true,
      animations: 'disabled',
    });
  }
  await page.setViewportSize({ width: 402, height: 874 });
  for (const screen of ['home', 'discover', 'lists', 'profile']) {
    await page.goto('/#/' + screen);
    await expect(page.locator('.mobile-nav')).toBeVisible();
    await page.screenshot({
      path: `../../docs/preview/tauri-${screen}-mobile.png`,
      fullPage: true,
      animations: 'disabled',
    });
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
  }
  await page.goto('/#/discover');
  await expect(page.locator('.catalog-results')).toHaveAttribute('aria-busy', 'false');
  await expect(page.locator('.catalog-results .work-card')).not.toHaveCount(0);
  await page.locator('img').evaluateAll(async (images) => {
    await Promise.all(images.map((img) => img.decode().catch(() => {})));
  });
  const failed = await page
    .locator('.catalog-results img')
    .evaluateAll((images) =>
      images
        .filter((img) => img instanceof HTMLImageElement && img.naturalWidth === 0)
        .map((img) => (img as HTMLImageElement).src),
    );
  expect(failed).toEqual([]);
});
