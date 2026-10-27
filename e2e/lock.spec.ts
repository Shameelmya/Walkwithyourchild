import { test, expect } from '@playwright/test';

test('lock screen: PIN, dark mode in header, fingerprint unlock', async ({ page, context }) => {
  // A virtual fingerprint sensor that always recognises the owner.
  const cdp = await context.newCDPSession(page);
  await cdp.send('WebAuthn.enable');
  await cdp.send('WebAuthn.addVirtualAuthenticator', { options: { protocol: 'ctap2', transport: 'internal', hasResidentKey: true, hasUserVerification: true, isUserVerified: true, automaticPresenceSimulation: true } });
  await page.goto('/');
  await page.getByRole('button', { name: /English/ }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'I understand' }).click();
  await page.getByLabel("Child's name *").fill('Arjun');
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByText('Choose a 4-number PIN')).toBeVisible(); await page.keyboard.type('1234'); await expect(page.getByText('Type the PIN again')).toBeVisible(); await page.keyboard.type('1234'); await page.waitForTimeout(800);
  await page.getByRole('button', { name: 'Start' }).click();
  await page.goto('/settings');
  await page.getByRole('checkbox', { name: /Fingerprint unlock/ }).click(); // ticks once the phone confirms
  await expect(page.getByText('Fingerprint unlock is on')).toBeVisible();
  // Lock: leave the app for longer than the quick-reopen window.
  await page.evaluate(() => localStorage.setItem('wwyc-seen', '0'));
  await page.goto('about:blank'); await page.evaluate(() => localStorage.setItem('wwyc-seen', '0')).catch(() => {});
  await page.waitForTimeout(5500);
  await page.goto('/');
  // Fingerprint is asked for straight away and opens the app.
  await expect(page.getByRole('button', { name: 'Switch child' })).toContainText('Arjun', { timeout: 15000 });
});

test('lock screen: wrong PIN is refused, right PIN opens', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /English/ }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'I understand' }).click();
  await page.getByLabel("Child's name *").fill('Arjun');
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByText('Choose a 4-number PIN')).toBeVisible(); await page.keyboard.type('1234'); await expect(page.getByText('Type the PIN again')).toBeVisible(); await page.keyboard.type('1234'); await page.waitForTimeout(800);
  await page.getByRole('button', { name: 'Start' }).click(); await page.waitForTimeout(300);
  await page.goto('about:blank'); await page.waitForTimeout(5500);
  await page.goto('/');
  await expect(page.getByText('Enter your PIN')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Dark mode' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Unlock with fingerprint' })).toHaveCount(0);
  await page.keyboard.type('9999');
  await expect(page.getByText('That PIN is not right')).toBeVisible();
  await page.keyboard.type('1234');
  await expect(page.getByRole('button', { name: 'Switch child' })).toContainText('Arjun');
});
