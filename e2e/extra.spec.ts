import { test, expect } from '@playwright/test';
test('extra: meds, notebook pdf, backup roundtrip', async ({ page }) => {
  const errs: string[] = []; page.on('pageerror', (e) => errs.push(String(e))); page.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
  const go = async (r: string) => { await page.goto(r).catch(() => page.goto(r)); /* a navigation right after a download can be aborted once */ await page.waitForTimeout(300); if (await page.getByText('Enter your PIN').isVisible()) { await page.keyboard.type('1234'); await page.waitForTimeout(700); } };
  await page.goto('/');
  await page.getByRole('button', { name: /English/ }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'I understand' }).click();
  await page.getByLabel("Child's name *").fill('Kannan');
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByText('Choose a 4-number PIN')).toBeVisible(); await page.keyboard.type('1234'); await expect(page.getByText('Type the PIN again')).toBeVisible(); await page.keyboard.type('1234'); await page.waitForTimeout(800);
  await page.getByRole('button', { name: 'Start' }).click(); await expect(page.getByRole('button', { name: 'Switch child' })).toContainText('Kannan');
    await go('/medicines'); await page.getByRole('button', { name: 'Add medicine' }).click();
  await page.getByLabel('Medicine *').fill('Valproate'); await page.getByLabel('Dose', { exact: true }).fill('5 ml');
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByText('Valproate').first()).toBeVisible();
  await go('/book/c2'); await page.getByRole('button', { name: 'Add to my questions' }).first().click(); await page.getByRole('dialog').getByRole('button', { name: 'Add', exact: true }).click(); await expect(page.getByText('Added to your questions for the doctor')).toBeVisible();
  await go('/notebook/questions'); await expect(page.locator('textarea').first()).not.toHaveValue('');
  await go('/notebook'); await page.getByRole('button', { name: 'Print or PDF' }).click();
  const dl = page.waitForEvent('download', { timeout: 90_000 }); await page.getByRole('button', { name: 'Download PDF' }).click(); expect((await dl).suggestedFilename()).toMatch(/pdf$/);
  await go('/settings'); await page.getByRole('button', { name: 'Make a backup' }).click();
  await page.getByLabel('Backup password').fill('secret12'); await page.getByLabel('Type the password again').fill('secret12');
  const bk = page.waitForEvent('download'); await page.getByRole('dialog').getByRole('button', { name: 'Make a backup' }).click();
  const file = await (await bk).path();
    await go('/settings');
  const chooser = page.waitForEvent('filechooser'); await page.getByRole('button', { name: 'Restore a backup' }).click(); await (await chooser).setFiles(file!);
  await page.getByLabel('Backup password').fill('secret12'); await page.getByRole('dialog').getByRole('button', { name: 'Restore a backup' }).click();
  await page.waitForTimeout(2500); if (await page.getByText('Enter your PIN').isVisible()) { await page.keyboard.type('1234'); await page.waitForTimeout(700); }
  await go('/medicines'); await expect(page.getByText('Valproate').first()).toBeVisible();
  for (const r of ['/talk', '/progress', '/records', '/visits', '/documents', '/me', '/memory', '/sos', '/play', '/updates/welcome', '/summary']) { await go(r); await page.waitForTimeout(400); }
  expect(errs).toEqual([]);
});
