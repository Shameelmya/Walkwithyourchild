import { test, expect } from '@playwright/test';
import { onboard } from './helpers';

test('back always returns to where you came from, never loops', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await onboard(page);
  const path = () => new URL(page.url()).pathname;

  // Games menu -> game -> phone back returns to the games menu
  await page.goto('/play');
  await page.getByRole('button', { name: 'Bubbles', exact: true }).click();
  await expect(page).toHaveURL(/\/play\/bubbles/);
  await page.goBack();
  await expect(page).toHaveURL(/\/play$/);

  // Notebook -> sheet -> header back -> notebook; phone back then leaves the notebook (no loop)
  await page.goto('/');
  await page.locator('a:visible', { hasText: /^Notebook$/ }).first().click();
  await page.getByRole('link', { name: /Questions for the doctor/ }).click();
  await page.getByRole('button', { name: 'Back' }).click();
  await expect(page).toHaveURL(/\/notebook$/);
  await page.goBack();
  expect(path()).toBe('/');

  // A pop-up closes with the phone's back button instead of leaving the page
  await page.goto('/medicines');
  await page.getByRole('button', { name: 'Add medicine' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.goBack();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  expect(path()).toBe('/medicines');

  // Profile save goes back, not forward
  await page.goto('/child');
  await page.getByRole('link', { name: 'Edit profile' }).click();
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page).toHaveURL(/\/child$/);
  await page.goBack();
  expect(path()).not.toBe('/child/profile');

  // Seizure: diary -> timer -> stop -> add details returns to the same diary page
  await page.goto('/seizures');
  await page.getByRole('link', { name: 'Start seizure timer' }).click();
  await page.waitForTimeout(1200);
  await page.getByRole('button', { name: 'Stop', exact: true }).click();
  await page.getByRole('button', { name: 'Add details' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  expect(path()).toBe('/seizures');
});

test('settings: check for updates and set a PIN', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await onboard(page);
  await page.goto('/child');
  await expect(page.getByRole('link', { name: /Emergency card/ })).toBeVisible();
  await page.goto('/settings');
  await page.getByRole('button', { name: 'Check for updates' }).click();
  await expect(page.getByText(/latest version|Updating|No internet/)).toBeVisible({ timeout: 15000 });
  await page.getByRole('button', { name: 'Set PIN' }).click();
  await page.getByLabel('New PIN (4 numbers)').fill('2468');
  await page.getByLabel('Type the PIN again').fill('2468');
  await page.getByRole('dialog').getByRole('button', { name: 'Save' }).click();
  await expect(page.getByText('The app asks for your PIN when it opens.')).toBeVisible({ timeout: 15000 });
});
