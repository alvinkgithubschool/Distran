import { test, expect } from '@playwright/test';
test('local recommendations render, filter, and survive reload without an API', async ({
  page,
}) => {
  await page.route('http://127.0.0.1:8000/v1/**', (route) => route.abort());
  await page.goto('/');
  await page.getByRole('button', { name: 'Try as a user' }).click();
  await page.getByRole('button', { name: 'Skip for now' }).click();
  const section = page.getByRole('region', { name: 'Personal recommendations' });
  await expect(section.getByRole('heading', { name: 'Your next connection.' })).toBeVisible();
  await expect(section.locator('.work-card')).toHaveCount(4);
  await section.getByRole('combobox', { name: 'Recommendation format' }).selectOption('movie');
  await expect(section.locator('.work-card')).toHaveCount(0);
  await expect(
    section.getByText('You’ve explored this collection. Try another format.'),
  ).toBeVisible();
  await section.getByRole('combobox', { name: 'Recommendation format' }).selectOption('tv');
  await expect(section.locator('.work-card')).toHaveCount(2);
  const titles = await section.locator('.work-card').allTextContents();
  await page.reload();
  await section.getByRole('combobox', { name: 'Recommendation format' }).selectOption('tv');
  await expect(section.locator('.work-card')).toHaveText(titles);
  await page.screenshot({ path: 'test-results/recommendations-desktop.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(section.getByRole('combobox')).toBeVisible();
  await page.screenshot({ path: 'test-results/recommendations-mobile.png', fullPage: true });
});
