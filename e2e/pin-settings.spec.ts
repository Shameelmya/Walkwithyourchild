import { test, expect } from '@playwright/test';
test('PIN fields in settings keep focus while typing', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /English/ }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'I understand' }).click();
  await page.getByLabel("Child's name *").fill('Ammu');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Skip for now' }).click();
  await page.getByRole('button', { name: 'Start' }).click();
  await expect(page.getByRole('button', { name: 'Switch child' })).toContainText('Ammu');
  await page.goto('/settings');
  await page.getByRole('button', { name: 'Set PIN' }).click();
  await page.getByLabel('New PIN (4 numbers)').pressSequentially('1234');
  await page.getByLabel('Type the PIN again').pressSequentially('1234');
  await expect(page.getByLabel('New PIN (4 numbers)')).toHaveValue('1234');
  await expect(page.getByLabel('Type the PIN again')).toHaveValue('1234');
  await page.getByRole('dialog').getByRole('button', { name: 'Save' }).click();
  await expect(page.getByText('The app asks for your PIN when it opens.')).toBeVisible();
  // Change PIN: three fields, each must keep focus
  await page.getByRole('button', { name: 'Change PIN' }).click();
  await page.getByLabel('Current PIN').pressSequentially('1234');
  await page.getByLabel('New PIN (4 numbers)').pressSequentially('5678');
  await page.getByLabel('Type the PIN again').pressSequentially('5678');
  await expect(page.getByLabel('Current PIN')).toHaveValue('1234');
  await expect(page.getByLabel('New PIN (4 numbers)')).toHaveValue('5678');
  await page.getByRole('dialog').getByRole('button', { name: 'Save' }).click();
  await expect(page.getByText('PIN saved')).toBeVisible();
});

test('child switcher dialog covers the screen, not just the header', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByRole('button', { name: /English/ }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'I understand' }).click();
  await page.getByLabel("Child's name *").fill('Abc');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Skip for now' }).click();
  await page.getByRole('button', { name: 'Start' }).click();
  await page.getByRole('button', { name: 'Switch child' }).click();
  await page.waitForTimeout(800);
  const box = await page.getByRole('dialog').boundingBox();
  expect(box!.y).toBeGreaterThan(300);
  expect(box!.y + box!.height).toBeLessThanOrEqual(845);
});
