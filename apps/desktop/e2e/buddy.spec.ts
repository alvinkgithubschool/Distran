import { test, expect } from '@playwright/test';
import { getWork } from '../src/lib/catalog';

test('Buddy conversation returns catalog cards, remembers refinements and saves a chosen list', async ({
  page,
}) => {
  const requests: Record<string, unknown>[] = [];
  const work = getWork('disco-elysium')!;
  await page.route('http://127.0.0.1:8000/v1/**', async (route) => {
    if (!route.request().url().endsWith('/buddy/query')) return route.abort();
    const body = route.request().postDataJSON();
    requests.push(body);
    const hello = body.prompt === 'Hello Buddy';
    return route.fulfill({
      json: {
        reply: hello
          ? 'Hello from Buddy.'
          : 'This catalog pick connects mystery with an unusual city.',
        items: hello
          ? []
          : [
              {
                work,
                reason: 'Catalog tags: Detective, Narrative',
                evidence: work.description,
                score: 0.8,
              },
            ],
        context: {
          theme: hello ? '' : `Hopeful mysteries in strange cities; ${body.prompt}`,
          medium: body.context ? 'game' : 'all',
          max_minutes: null,
          work_ids: [work.id],
        },
        route: 'conversation',
        model: 'nvidia/nemotron-3.5-super-vl:free',
        degraded: false,
        free_only: true,
        catalog_size: 148,
        discovery: {
          scope: 'live_catalog',
          providers: ['tmdb', 'igdb'],
          candidate_count: 148,
          errors: [],
        },
      },
    });
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Try as a user' }).click();
  await page.getByRole('button', { name: 'Skip for now' }).click();
  await page.goto('/#/chat');
  const panel = page.getByRole('region', { name: 'Buddy recommendations' });
  await panel.getByLabel('What are you looking for?').fill('Hopeful mysteries in strange cities');
  await panel.getByRole('button', { name: 'Ask Buddy', exact: true }).click();
  await expect(panel.getByRole('heading', { name: 'Disco Elysium' })).toBeVisible();
  await expect(
    panel.getByText('Searched TMDB + IGDB · 148 catalog candidates considered.'),
  ).toBeVisible();
  await panel.getByLabel('Your next message').fill('more hopeful, games only');
  await panel.getByRole('button', { name: 'Send to Buddy' }).click();
  await expect(panel.locator('.buddy-user-message')).toHaveCount(2);
  await expect(panel.getByRole('heading', { name: 'Disco Elysium' })).toBeVisible();
  await expect(panel.locator('.buddy-work-card')).toHaveCount(1);
  await expect(panel.getByText('Buddy pick', { exact: true })).toBeVisible();
  await page.screenshot({ path: 'test-results/buddy-conversation-desktop.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: 'test-results/buddy-conversation-mobile.png', fullPage: true });
  await panel.getByLabel('List name').fill('Strange city nights');
  await panel.getByLabel('Include Disco Elysium in list').uncheck();
  await expect(panel.getByRole('button', { name: 'Save list', exact: true })).toBeDisabled();
  await panel.getByLabel('Include Disco Elysium in list').check();
  await panel.getByRole('button', { name: 'Save list', exact: true }).click();
  await panel.getByRole('link', { name: 'Open saved list' }).click();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Strange city nights' })).toBeVisible();
  await expect(page.getByText('Started with Buddy', { exact: true })).toBeVisible();
  await expect(page.locator('.buddy-work-row')).toHaveCount(1);
  await page.getByRole('button', { name: 'Edit list' }).click();
  await page.getByRole('button', { name: 'Save list', exact: true }).click();
  await expect(page.getByText('Started with Buddy', { exact: true })).toBeVisible();
  await page.goto('/#/chat');
  await panel.getByLabel('What are you looking for?').fill('Hello Buddy');
  await panel.getByRole('button', { name: 'Ask Buddy', exact: true }).click();
  await expect(panel.getByText('Hello from Buddy.')).toBeVisible();
  expect(requests.map((r) => r.mode)).toEqual(['chat', 'chat', 'chat']);
  expect(requests[1].prompt).toBe('more hopeful, games only');
  expect((requests[1].context as { theme: string }).theme).toContain('Hopeful mysteries');
  expect((requests[1].history as unknown[]).length).toBe(2);
  expect(requests[2]).not.toHaveProperty('context');
  for (const request of requests) {
    expect(request).not.toHaveProperty('model');
    expect(request).not.toHaveProperty('api_key');
    expect(request).not.toHaveProperty('account');
    expect(request).not.toHaveProperty('notes');
  }
  await panel.getByRole('button', { name: 'New conversation' }).click();
  await expect(panel.locator('.buddy-user-message')).toHaveCount(0);
  await expect(panel.getByLabel('What are you looking for?')).toHaveValue('');
  expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(
    false,
  );
});

test('Buddy displays backend errors and explicit local fallback results', async ({ page }) => {
  let calls = 0;
  await page.route('http://127.0.0.1:8000/v1/**', async (route) => {
    if (!route.request().url().endsWith('/buddy/query')) return route.abort();
    if (++calls === 1) return route.fulfill({ status: 503, json: { detail: 'Unavailable' } });
    return route.fulfill({
      json: {
        reply: 'No indexed works meet those filters.',
        items: [],
        route: 'conversation',
        model: null,
        degraded: true,
        free_only: true,
      },
    });
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Try as a user' }).click();
  await page.getByRole('button', { name: 'Skip for now' }).click();
  await page.goto('/#/chat');
  await page.getByLabel('What are you looking for?').fill('Space');
  await page.getByRole('button', { name: 'Ask Buddy', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('unavailable');
  await page.getByRole('button', { name: 'Ask Buddy', exact: true }).click();
  await expect(page.getByText('The free model is unavailable', { exact: false })).toBeVisible();
});
