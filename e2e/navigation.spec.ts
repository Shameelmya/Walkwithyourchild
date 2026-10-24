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
  // A quick refresh stays open; opening again after a while asks for the PIN.
  await page.reload();
  await expect(page.getByRole('button', { name: 'Check for updates' })).toBeVisible();
  await page.goto('about:blank'); await page.waitForTimeout(5500);
  await page.goto('/');
  await expect(page.getByText('Enter your PIN')).toBeVisible();
});

test('header: dark mode and text size in one tap', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await onboard(page);
  await page.getByRole('button', { name: 'Dark mode' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'night');
  await page.getByRole('button', { name: 'Dark mode' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'white');
  await page.getByRole('button', { name: 'Text size' }).click();
  await page.getByRole('radio', { name: '130%' }).click();
  await expect.poll(() => page.evaluate(() => document.documentElement.style.fontSize)).toBe('20.8px');
});

test('Home continue card shows the chapter being read and opens at that place', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await onboard(page);
  await page.getByRole('link', { name: /Read now|Continue reading/ }).first().click();
  await page.mouse.wheel(0, 30000); await page.waitForTimeout(800);
  await page.getByRole('button', { name: /Next chapter/ }).click(); await page.waitForTimeout(1000);
  await page.mouse.wheel(0, 800); await page.waitForTimeout(1500);
  await page.goBack(); // next chapter replaced the page, so back leaves the book
  await page.goto('/book/c0'); await page.waitForTimeout(500); // just passing through
  await page.goto('/');
  const card = page.locator('a[href^="/book/c"]').first();
  await expect(card).toContainText('The search for a name');
  await card.click();
  await expect(page).toHaveURL(/\/book\/c1/);
  await page.waitForTimeout(1200);
  expect(await page.evaluate(() => scrollY)).toBeGreaterThan(200);
});

test('child photo can be zoomed, moved, turned and cropped before saving', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await onboard(page);
  await page.goto('/child/profile');
  await page.locator('input[type=file]').first().setInputFiles({ name: 'kid.png', mimeType: 'image/png', buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAFAAAAA8CAIAAAB+RarbAAAAY0lEQVR4nO3PAQ3AIADAMEAmSpCIrLv4k71VsM179viT9XXA2wzXGa4zXGe4znCd4TrDdYbrDNcZrjNcZ7jOcJ3hOsN1husM1xmuM1xnuM5wneE6w3WG6wzXGa4zXGe4znDdA+9nAhJXh013AAAAAElFTkSuQmCC', 'base64') });
  const dlg = page.getByRole('dialog', { name: 'Adjust photo' });
  await expect(dlg).toBeVisible();
  await dlg.getByRole('button', { name: 'Zoom in' }).click();
  await dlg.getByRole('button', { name: 'Turn' }).click();
  await page.mouse.move(195, 400); await page.mouse.down(); await page.mouse.move(230, 420, { steps: 5 }); await page.mouse.up();
  await dlg.getByRole('button', { name: 'Use photo' }).click();
  await expect(dlg).toHaveCount(0);
  await expect(page.locator('main img').first()).toBeVisible();
});

test('care guide: book steps, episode timer, team plan and who helps', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await onboard(page);
  await page.getByRole('link', { name: /Care guide/ }).first().click();
  await expect(page).toHaveURL(/\/care$/);
  await page.getByRole('link', { name: /Pain, crying and sleep/ }).click();
  await expect(page.getByText('Children who cannot speak still feel pain.', { exact: false })).toBeVisible();
  await page.getByRole('button', { name: 'Start timer' }).click();
  await page.waitForTimeout(1300);
  await page.getByRole('button', { name: 'Stop' }).click();
  await page.getByLabel('What happened? What helped?').fill('Cried after lunch, eased after changing position');
  await page.getByLabel("Our team's plan for Ammu").fill('Check for constipation first');
  await expect(page.getByText('Physiotherapist')).toHaveCount(0);
  await expect(page.getByText('Palliative or supportive care team')).toBeVisible();
  await page.waitForTimeout(400);
  await page.reload();
  await expect(page.getByText('Cried after lunch, eased after changing position')).toBeVisible();
  await expect(page.getByLabel("Our team's plan for Ammu")).toHaveValue('Check for constipation first');
  await page.goto('/care/stiffness');
  await expect(page.getByText(/does not have a separate section/)).toBeVisible();
  await page.goto('/care/seizure');
  await expect(page).toHaveURL(/\/seizure$/);
});
