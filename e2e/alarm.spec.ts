import { test, expect } from '@playwright/test';
import { onboard } from './helpers';

test('medicine alarm: rings at the set time, stays until answered, snooze rings again', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-26T07:58:00') });
  await onboard(page);
  await page.goto('/medicines');
  await page.getByRole('button', { name: 'Add medicine' }).click();
  await page.getByLabel('Medicine *').fill('Levetiracetam'); await page.getByLabel('Dose', { exact: true }).fill('2 ml');
  await page.getByRole('button', { name: 'Save' }).click();
  const alarm = page.getByRole('alertdialog');
  await expect(alarm).toHaveCount(0);
  await page.clock.fastForward('03:00');
  await expect(alarm).toBeVisible();
  await expect(alarm).toContainText('Levetiracetam');
  await expect(alarm).toContainText('2 ml · 08:00');
  await page.goto('/'); // moving around the app does not silence it
  await page.clock.fastForward('00:20');
  await expect(alarm).toBeVisible();
  await alarm.getByRole('button', { name: 'Remind me in 10 minutes' }).click();
  await expect(alarm).toHaveCount(0);
  await page.clock.fastForward('11:00');
  await expect(alarm).toBeVisible();
  await alarm.getByRole('button', { name: 'Given' }).click();
  await expect(alarm).toHaveCount(0);
  await page.clock.fastForward('05:00');
  await expect(alarm).toHaveCount(0);
  await page.goto('/medicines');
  await expect(page.getByRole('button', { name: 'Given', pressed: true })).toBeVisible();
});
