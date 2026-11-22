import { test, expect } from '@playwright/test';
import { getWork } from '../src/lib/catalog';

test('provider-backed seeds identify studios/directors and link full credits to creator pages', async ({
  page,
}) => {
  await page.route('http://127.0.0.1:8000/v1/**', (route) => route.abort());
  await page.goto('/');
  await page.getByRole('button', { name: 'Try as a user' }).click();
  await page.getByRole('button', { name: 'Skip for now' }).click();
  const personal = page.getByRole('region', { name: 'Personal recommendations' });
  await expect(personal.getByText('For you · From your taste')).toBeVisible();
  await expect(personal.locator('.buddy-work-card')).toHaveCount(0);
  await expect(personal.locator('[data-recommendation-source="standard"]')).toHaveCount(4);
  await page.goto('/#/title/cyberpunk'); // Old bookmarks still resolve.
  const game = getWork('cyberpunk')!;
  const studio = game.creators![0];
  await expect(page.locator('.maker-link')).toContainText('Studio');
  await expect(page.locator('.maker-link .creator-name').first()).toContainText(studio.name);
  await expect(page.locator('.maker-link .creator-name').first()).toHaveAttribute(
    'href',
    `#/creators/${encodeURIComponent(studio.id)}`,
  );
  await expect(page.locator('.maker-link .creator-page-mark').first()).toBeVisible();
  await page.getByRole('button', { name: 'Behind the work' }).click();
  await expect(page.locator('.work-facts')).toContainText('PUBLISHER');
  await expect(page.locator('.work-facts .creator-name')).not.toHaveCount(0);
  await page.goto('/#/title/edgerunners');
  const tv = getWork('edgerunners')!;
  await expect(page.locator('.maker-link')).toContainText('Director');
  await expect(page.locator('.maker-link')).toContainText(tv.creators![0].name);
  await expect(page.locator('.maker-link')).not.toContainText('Studio Trigger');
  await page.getByRole('button', { name: 'Behind the work' }).click();
  await expect(page.locator('.work-facts')).toContainText('SERIES DIRECTOR');
  await expect(page.locator('.work-facts .creator-page-mark')).not.toHaveCount(0);
  await page.locator('.maker-link .creator-name').first().click();
  await expect(
    page.getByRole('heading', { name: tv.creators![0].name, exact: true }),
  ).toBeVisible();
  await page.goto('/#/creators');
  await expect(page.locator('.directory-card.on-distran .creator-badge')).toBeVisible();
  await expect(page.locator('.creator-catalog .directory-card .creator-page-mark')).not.toHaveCount(
    0,
  );
  await page.screenshot({ path: 'test-results/creator-identities-desktop.png', fullPage: true });
});
