import { test, expect } from '@playwright/test';
const film = {
  id: 'tmdb:movie:157336',
  title: 'Interstellar',
  medium: 'movie',
  year: 2014,
  image: 'https://image.tmdb.org/t/p/w500/poster.jpg',
  color: '#dcaa72',
  maker: 'See title details',
  publisher: 'Not listed',
  description: 'A journey beyond Earth.',
  tags: [],
  rating: '4.2',
  duration: 'See title details',
  related: [],
  provider: 'tmdb',
  sourceUrl: 'https://www.themoviedb.org/movie/157336',
};
test('live search debounces, opens details and preserves logged provider metadata offline', async ({
  page,
}) => {
  let searches = 0;
  await page.route('http://127.0.0.1:8000/v1/catalog/search?**', async (route) => {
    searches++;
    await route.fulfill({
      json: {
        items: [film],
        page: 1,
        hasMore: true,
        status: 'ok',
        providers: { tmdb: { cache: 'hit' } },
        errors: [],
      },
    });
  });
  await page.route('http://127.0.0.1:8000/v1/works/**', (route) =>
    route.fulfill({
      json: {
        work: { ...film, maker: 'Christopher Nolan', publisher: 'Paramount', duration: '2h 49m' },
        related: [],
        cache: 'hit',
      },
    }),
  );
  await page.goto('/');
  await page.getByRole('button', { name: 'Try as a user' }).click();
  await page.getByRole('button', { name: 'Skip for now' }).click();
  await page.goto('/#/discover');
  await expect(page.locator('.search-meta')).toContainText('LIVE CATALOG');
  const count = searches;
  const input = page.getByRole('searchbox', { name: 'Search media' });
  await input.fill('I');
  await input.fill('Inte');
  await input.fill('Interstellar');
  await expect(page.locator('.catalog-results .work-card')).toHaveCount(1);
  await expect.poll(() => searches).toBe(count + 1);
  await page.locator('.catalog-results .work-card').click();
  await expect(page.locator('.maker-link')).toContainText('Christopher Nolan');
  await page.getByRole('button', { name: 'Log this film' }).click();
  await page.getByRole('combobox', { name: 'Precise rating' }).selectOption('4.5');
  await page.getByRole('button', { name: 'Save to my ledger' }).click();
  const stored = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('distran.tauri.preview.v1')!),
  );
  expect(stored.works['tmdb:movie:157336'].title).toBe('Interstellar');
  await page.route('http://127.0.0.1:8000/v1/**', (route) => route.abort());
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Interstellar', exact: true })).toBeVisible();
  await expect(page.locator('.catalog-notice')).toContainText('Showing saved title metadata');
});
test('partial-provider failure keeps available results and paginates', async ({ page }) => {
  await page.route('http://127.0.0.1:8000/v1/catalog/search?**', (route) =>
    route.fulfill({
      json: {
        items: [film],
        page: Number(new URL(route.request().url()).searchParams.get('page')),
        hasMore: true,
        status: 'partial',
        providers: { tmdb: { cache: 'stale' } },
        errors: [{ provider: 'igdb', code: 'unavailable' }],
      },
    }),
  );
  await page.goto('/');
  await page.getByRole('button', { name: 'Try as a user' }).click();
  await page.getByRole('button', { name: 'Skip for now' }).click();
  await page.goto('/#/discover');
  await expect(page.locator('.catalog-notice').first()).toContainText('IGDB');
  await expect(page.locator('.catalog-results .work-card')).toHaveCount(1);
  await page.getByRole('button', { name: 'Next page' }).click();
  await expect(page.locator('.catalog-pagination')).toContainText('PAGE 2');
});
