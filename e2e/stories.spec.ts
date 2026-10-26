import { test, expect } from '@playwright/test';
import { onboard, watchErrors } from './helpers';

test('story book: make, draw, theme, read with page turns, PDF, delete', async ({ page }) => {
  const errs = watchErrors(page);
  await onboard(page, 'Ammu');
  await page.goto('/memory');
  await page.getByRole('link', { name: /Make a story book/ }).click();
  await expect(page).toHaveURL(/\/stories$/);
  await expect(page.getByText(/just as they say it/)).toBeHidden();
  await page.getByRole('button', { name: 'More information' }).click();
  await expect(page.getByText(/just as they say it/)).toBeVisible();
  await page.getByRole('button', { name: 'More information' }).click();
  await page.getByRole('button', { name: 'New book' }).click();
  await page.getByRole('button', { name: /All about me/ }).click();
  await expect(page.getByLabel('Title')).toHaveValue('All about me');
  await expect(page.getByLabel('Written by')).toHaveValue('Ammu');
  await page.getByRole('button', { name: 'Forest' }).click();
  await expect(page.getByRole('button', { name: 'Forest' })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Layout 3' }).click();
  await page.getByRole('button', { name: 'Page 3 of 5' }).click();
  await expect(page.getByLabel('Starts with')).toHaveValue('I am really good at');
  await page.getByPlaceholder(/write their words/).fill('Singing with Amma');
  await page.getByRole('button', { name: 'Draw' }).click();
  const c = page.locator('canvas'); const b = (await c.boundingBox())!;
  await page.mouse.move(b.x + 40, b.y + 40); await page.mouse.down(); await page.mouse.move(b.x + 200, b.y + 160, { steps: 8 }); await page.mouse.up();
  await page.getByRole('dialog').getByRole('button', { name: 'Done' }).click();
  await expect(page.getByRole('button', { name: 'Remove: Draw' })).toBeVisible();
  await page.getByRole('button', { name: 'Add a page' }).click();
  await expect(page.getByRole('button', { name: 'Page 6 of 6' })).toBeVisible();
  await page.reload();
  await page.getByRole('button', { name: 'Page 3 of 6' }).click();
  await expect(page.getByPlaceholder(/write their words/)).toHaveValue('Singing with Amma');
  await page.getByRole('button', { name: 'Read', exact: true }).click();
  await expect(page).toHaveURL(/read=1/);
  for (let i = 0; i < 3; i++) { await page.getByRole('button', { name: 'Next page' }).click(); await page.waitForTimeout(800); }
  await expect(page.getByText('Singing with Amma')).toBeVisible();
  await page.goBack();
  const dl = page.waitForEvent('download', { timeout: 90_000 }); await page.getByRole('button', { name: 'PDF' }).click();
  const file = await dl; expect(file.suggestedFilename()).toMatch(/\.pdf$/);
  if (process.env.PDF_OUT) await file.saveAs(process.env.PDF_OUT);
  await page.goto('/stories'); await expect(page.getByRole('link', { name: 'All about me' })).toBeVisible();
  await page.getByRole('link', { name: 'All about me' }).click();
  await page.getByRole('button', { name: 'Delete book' }).click();
  await page.getByRole('dialog').getByRole('button').last().click();
  await expect(page.getByText('Start your first book')).toBeVisible();
  await page.goto('/more'); await expect(page.locator('#main').getByRole('link', { name: 'Story books' })).toBeVisible();
  expect(errs).toEqual([]);
});

test('story book in Malayalam', async ({ page }) => {
  await onboard(page);
  await page.evaluate(() => { const s = JSON.parse(localStorage.getItem('wwyc-ui') || '{}'); (s.state ??= {}).lang = 'ml'; localStorage.setItem('wwyc-ui', JSON.stringify(s)); });
  await page.goto('/stories');
  await expect(page.getByText('കഥാപുസ്തകങ്ങൾ').first()).toBeVisible();
});

test('whole app follows the language: games, care, skills in Hindi and Tamil', async ({ page }) => {
  await onboard(page);
  const setLang = (l: string) => page.evaluate((x) => { const s = JSON.parse(localStorage.getItem('wwyc-ui') || '{}'); (s.state ??= {}).lang = x; localStorage.setItem('wwyc-ui', JSON.stringify(s)); }, l);
  await setLang('hi');
  await page.goto('/play'); await expect(page.getByText('रंग भरो')).toBeVisible();
  await page.goto('/skills'); await expect(page.getByText('हाथ धोना').first()).toBeVisible();
  await setLang('ta');
  await page.goto('/care'); await expect(page.getByText('மூச்சுத் திணறல்').first()).toBeVisible();
  await page.goto('/updates'); await expect(page.getByText('வரவேற்கிறோம்')).toBeVisible();
});

