import { test, expect } from '@playwright/test';
import { onboard, watchErrors } from './helpers';

test('story book: make, draw, read, PDF, delete', async ({ page }) => {
  const errs = watchErrors(page);
  await onboard(page, 'Ammu');
  await page.goto('/memory');
  await page.getByRole('link', { name: /Make a story book/ }).click();
  await expect(page).toHaveURL(/\/stories$/);
  await page.getByRole('button', { name: 'Start a new book' }).click();
  await page.getByRole('button', { name: /All about me/ }).click();
  await expect(page.getByLabel('Book title')).toHaveValue('All about me');
  await expect(page.getByLabel('Written by')).toHaveValue('Ammu');
  await page.getByLabel('Things I am good at').fill('Singing with Amma');
  await page.getByRole('button', { name: 'Draw' }).first().click();
  const c = page.locator('canvas'); const b = (await c.boundingBox())!;
  await page.mouse.move(b.x + 40, b.y + 40); await page.mouse.down(); await page.mouse.move(b.x + 200, b.y + 160, { steps: 8 }); await page.mouse.up();
  await page.getByRole('dialog').getByRole('button', { name: 'Save' }).click();
  await expect(page.getByRole('img', { name: 'Draw' })).toBeVisible();
  await page.getByRole('button', { name: 'Add a page' }).click();
  await expect(page.getByText('Page 6 of 6')).toBeVisible();
  await page.reload();
  await expect(page.getByLabel('Things I am good at')).toHaveValue('Singing with Amma');
  await page.getByRole('button', { name: 'Read the book' }).click();
  await expect(page.getByRole('heading', { name: 'All about me' }).last()).toBeVisible();
  for (let i = 0; i < 3; i++) await page.getByRole('button', { name: 'Next page' }).click();
  await expect(page.getByText('Singing with Amma')).toBeVisible();
  await page.getByRole('button', { name: 'Edit' }).click();
  const dl = page.waitForEvent('download', { timeout: 90_000 }); await page.getByRole('button', { name: 'Save as PDF' }).click(); expect((await dl).suggestedFilename()).toMatch(/\.pdf$/);
  await page.goto('/stories'); await expect(page.getByRole('link', { name: /All about me/ })).toBeVisible();
  await page.getByRole('link', { name: /All about me/ }).click();
  await page.getByRole('button', { name: 'Delete this book' }).click();
  await page.getByRole('dialog').getByRole('button').last().click();
  await expect(page.getByText('No books yet')).toBeVisible();
  await page.goto('/more'); await expect(page.getByRole('link', { name: 'Story books' })).toBeVisible();
  expect(errs).toEqual([]);
});

test('story book in Malayalam', async ({ page }) => {
  await onboard(page);
  await page.evaluate(() => { const s = JSON.parse(localStorage.getItem('wwyc-ui') || '{}'); (s.state ??= {}).lang = 'ml'; localStorage.setItem('wwyc-ui', JSON.stringify(s)); });
  await page.goto('/stories');
  await expect(page.getByText('കഥാപുസ്തകങ്ങൾ').first()).toBeVisible();
});
