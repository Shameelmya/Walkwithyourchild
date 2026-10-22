import { test, expect } from '@playwright/test';
import { onboard, watchErrors } from './helpers';

test('every in-app link leads to a real page', async ({ page }) => {
  test.setTimeout(300_000);
  await page.setViewportSize({ width: 1280, height: 900 }); // desktop shows the full side menu
  const errs = watchErrors(page);
  await onboard(page);
  const seen = new Set<string>();
  const queue = ['/', '/book', '/notebook', '/child', '/more', '/settings', '/me', '/records', '/updates', '/book/bookmarks', '/book/search'];
  const broken: string[] = [];
  while (queue.length && seen.size < 160) {
    const url = queue.shift()!;
    if (seen.has(url)) continue;
    seen.add(url);
    await page.goto(url);
    await page.waitForTimeout(250);
    const path = new URL(page.url()).pathname + new URL(page.url()).search;
    const want = url.split('#')[0];
    if (path !== want && !(want.endsWith('?b=0') && path === want)) broken.push(`${url} -> ${path}`);
    if (!(await page.locator('main').count())) broken.push(`${url}: no main content`);
    const hrefs = await page.locator('a[href^="/"]').evaluateAll((as) => as.map((a) => a.getAttribute('href')!));
    for (const h of hrefs) if (!seen.has(h) && !queue.includes(h) && !h.startsWith('/icons')) queue.push(h);
  }
  console.log(`checked ${seen.size} pages`);
  expect(broken).toEqual([]);
  expect(seen.size).toBeGreaterThan(40);
  expect(errs).toEqual([]);
});
