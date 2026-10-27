import { test, expect } from '@playwright/test';

test('skills for hard moments: STOP steps, comfort kit, name a feeling, body care, wise mind', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /English/ }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'I understand' }).click();
  await page.getByLabel("Child's name *").fill('Arjun');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Skip for now' }).click();
  await page.getByRole('button', { name: 'Start' }).click();
  await expect(page.getByRole('button', { name: 'Switch child' })).toBeVisible();
  await page.goto('/me');
  await page.getByRole('link', { name: /Skills for hard moments/ }).click();
  await expect(page.getByRole('heading', { name: 'Skills for hard moments' })).toBeVisible();

  // Very strong: opens STOP, one step at a time.
  await page.getByRole('button', { name: /Very strong/ }).click();
  await expect(page.getByText('Do not move or speak for a moment. Stay still.')).toBeVisible();
  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page.getByText('Breathe in and out slowly before you do anything.')).toBeVisible();

  // Comfort kit is kept.
  await page.getByRole('button', { name: 'Comfort yourself with the five senses' }).click();
  await page.getByRole('button', { name: 'Jasmine or other flowers' }).click();
  await page.getByPlaceholder('Add your own').fill('My mother\'s voice');
  await page.getByPlaceholder('Add your own').press('Enter');
  await expect(page.locator('#soothe li')).toHaveCount(2);

  // Name a feeling, check the facts, get the opposite action, save to the diary.
  await page.getByRole('tab', { name: 'Understand it' }).click();
  await page.getByRole('radio', { name: 'Guilt', exact: true }).click();
  await page.getByRole('button', { name: 'Not fully' }).click();
  await expect(page.getByText(/This illness is no one's fault/)).toBeVisible();
  await page.locator('#name').getByRole('button', { name: 'Save' }).click();
  await expect(page.getByText('My feelings diary')).toBeVisible();

  await page.getByRole('button', { name: 'Look after the body' }).click();
  await page.getByText('Ate at least two proper meals').click();
  await expect(page.getByRole('checkbox', { name: 'Ate at least two proper meals' })).toBeChecked();

  // Everything stays after a reload.
  await page.reload();
  await page.getByRole('button', { name: 'Comfort yourself with the five senses' }).click();
  await expect(page.locator('#soothe li')).toHaveCount(2);

  await page.getByRole('tab', { name: 'Accept it' }).click();
  await expect(page.getByText('This is what is happening now.')).toBeVisible();
  await page.getByRole('button', { name: 'Wise mind' }).click();
  await page.locator('#wise').getByRole('button', { name: 'Start' }).click();
  await expect(page.getByText('Breathe in: wise')).toBeVisible();
});
