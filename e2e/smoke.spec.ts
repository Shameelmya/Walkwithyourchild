import { test, expect, type Page, type BrowserContext } from '@playwright/test';

test.describe.configure({ mode: 'serial' });
let ctx: BrowserContext;
let page: Page;
const errors: string[] = [];

test.beforeAll(async ({ browser }) => {
  ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  page = await ctx.newPage();
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(String(e)));
});
test.afterAll(async () => { await ctx.close(); });

test('1. onboarding completes', async () => {
  await page.goto('/');
  await expect(page).toHaveURL(/onboarding/);
  await page.getByRole('button', { name: /English/ }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'I understand' }).click();
  await page.getByLabel("Child's name *").fill('Ammu');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Skip for now' }).click();
  await page.getByRole('button', { name: 'Start' }).click();
  await expect(page.getByRole('button', { name: 'Switch child' })).toContainText('Ammu');
});

test('2. switching EN to ML keeps the chapter and position', async () => {
  await page.goto('/book/c5?b=20');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Caring for your child');
  await page.waitForTimeout(800);
  const before = await page.evaluate(() => document.querySelector('[data-b="20"]')!.getBoundingClientRect().top);
  expect(Math.abs(before - 90)).toBeLessThan(60);
  await page.getByRole('button', { name: 'Reading settings' }).click();
  await page.getByRole('radio', { name: 'മലയാളം' }).click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'ml');
  await expect(page).toHaveURL(/\/book\/c5/);
  await expect(page.getByRole('heading', { level: 1 })).not.toContainText('Caring for your child');
  await page.waitForTimeout(600);
  const after = await page.evaluate(() => document.querySelector('[data-b="20"]')!.getBoundingClientRect().top);
  expect(Math.abs(after - 90)).toBeLessThan(60);
  await page.getByRole('radio', { name: 'English' }).click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
});

test('3. a notebook entry persists after reload', async () => {
  await page.goto('/notebook/my-child');
  await page.getByLabel('Allergies').fill('Penicillin');
  await page.waitForTimeout(900);
  await page.reload();
  await expect(page.getByLabel('Allergies')).toHaveValue('Penicillin');
});

test('4. seizure timer starts, stops and creates a log', async () => {
  await page.goto('/seizure');
  await expect(page.getByRole('timer')).toBeVisible();
  await page.waitForTimeout(2200);
  await expect(page.getByRole('timer')).not.toHaveText('0:00');
  await page.getByRole('button', { name: 'Seizure stopped' }).first().click();
  await expect(page).toHaveURL(/\/seizures/);
  await page.keyboard.press('Escape');
  await expect(page.getByText(/Lasted 0:0[1-9]/)).toBeVisible();
});

test('5. doctor summary PDF generates without errors', async () => {
  await page.goto('/summary');
  const dl = page.waitForEvent('download', { timeout: 60_000 });
  await page.getByRole('button', { name: 'Download PDF' }).click();
  const d = await dl;
  expect(d.suggestedFilename()).toMatch(/\.pdf$/);
  const path = await d.path();
  const fs = await import('node:fs');
  expect(fs.readFileSync(path!).subarray(0, 4).toString()).toBe('%PDF');
});

test('6. the app loads offline', async () => {
  await page.goto('/');
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await page.reload();
  await page.waitForFunction(() => !!navigator.serviceWorker.controller);
  await ctx.setOffline(true);
  await page.reload();
  await expect(page.getByRole('button', { name: 'Switch child' })).toContainText('Ammu');
  await page.goto('/book/c10');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Your body');
  await ctx.setOffline(false);
  expect(errors.filter((e) => !/Failed to load resource|ERR_INTERNET_DISCONNECTED/.test(e))).toEqual([]);
});
