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
  await expect(page.getByText('Children who cannot speak still feel pain.', { exact: false }).first()).toBeVisible();
  await page.getByRole('button', { name: 'Start timer' }).click();
  await page.waitForTimeout(1300);
  await page.getByRole('button', { name: 'Stop' }).click();
  await page.getByLabel('What happened? What helped?').fill('Cried after lunch, eased after changing position');
  await page.getByText("Our team's plan for Ammu").click();
  await page.getByLabel("Our team's plan for Ammu").fill('Check for constipation first');
  await page.getByText('Who in the team can help').click();
  await expect(page.getByText('Physiotherapist')).toHaveCount(0);
  await expect(page.getByText('Palliative or supportive care team')).toBeVisible();
  // Steps one at a time
  await expect(page.getByText('Step 1 of')).toBeVisible();
  await page.getByRole('button', { name: 'Next →' }).click();
  await expect(page.getByText('Step 2 of')).toBeVisible();
  await page.waitForTimeout(400);
  await page.reload();
  await expect(page.getByText('Cried after lunch, eased after changing position')).toBeVisible();
  await page.getByText("Our team's plan for Ammu").click();
  await expect(page.getByLabel("Our team's plan for Ammu")).toHaveValue('Check for constipation first');
  await page.goto('/care/stiffness');
  await expect(page.getByText(/does not have a separate section/)).toBeVisible();
  await page.goto('/care/seizure');
  await expect(page).toHaveURL(/\/seizure$/);
});

test('care plan, therapy play and schemes', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await onboard(page);
  // Interdisciplinary care plan
  await page.goto('/care');
  await page.getByRole('link', { name: /Our care plan/ }).click();
  await page.getByRole('button', { name: 'Add a team member' }).click();
  await page.getByRole('dialog').getByLabel('Role').selectOption('physio');
  await page.getByRole('dialog').getByLabel('Name', { exact: true }).fill('Dr Meera');
  await page.getByRole('dialog').getByLabel('Phone').fill('9876543210');
  await page.getByRole('dialog').getByRole('button', { name: 'Make main contact' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Save' }).click();
  await expect(page.getByText('Dr Meera')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Call Dr Meera' })).toHaveAttribute('href', 'tel:9876543210');
  await page.getByRole('button', { name: 'Add a goal' }).click();
  await page.getByRole('dialog').getByLabel('Goal', { exact: true }).fill('Sit with support for 10 minutes');
  await page.getByRole('dialog').getByLabel('What we do at home').fill('Supported sitting after breakfast');
  await page.getByRole('dialog').getByRole('button', { name: 'Save' }).click();
  await page.getByRole('button', { name: 'Working on it' }).click();
  await expect(page.getByRole('button', { name: 'Working on it' })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Add a meeting' }).click();
  await page.getByRole('dialog').getByLabel('What we decided').fill('Start daily stretches');
  await page.getByRole('dialog').getByRole('button', { name: 'Save' }).click();
  await expect(page.getByText('Start daily stretches')).toBeVisible();
  await expect(page.getByText('A short written summary of the diagnosis', { exact: false })).toBeVisible();
  // Therapy play
  await page.goto('/therapy');
  await page.getByRole('button', { name: 'Add an exercise' }).click();
  await page.getByRole('dialog').getByLabel('Exercise name (as your therapist calls it)').fill('Leg stretch');
  await page.getByRole('dialog').getByLabel('How many').fill('3');
  await page.getByRole('dialog').getByRole('button', { name: 'rocket' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Save' }).click();
  await page.getByRole('button', { name: 'Play' }).click();
  const tapBtn = page.getByRole('button', { name: /Tap for each one/ });
  for (let i = 0; i < 3; i++) await tapBtn.click();
  await expect(page.getByText('Well done!')).toBeVisible();
  await page.getByRole('button', { name: '✓' }).click();
  await expect(page.getByText(/Today: ⭐/)).toBeVisible();
  // Schemes and help
  await page.goto('/help');
  await expect(page.getByText('UDID card (Unique Disability ID)')).toBeVisible();
  await page.getByRole('tab', { name: 'Kerala' }).click();
  await expect(page.getByText('Thalolam (Kerala Social Security Mission)')).toBeVisible();
  await expect(page.getByText('Haqdarshak', { exact: true })).toBeVisible();
  await expect(page.getByText(/Karnataka: Department/)).toHaveCount(0);
  await page.reload();
  await page.goto('/care/plan');
  await expect(page.getByText('Dr Meera')).toBeVisible();
});

test('animal sounds board: each animal calls out', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await onboard(page);
  await page.goto('/play/animal-sounds');
  const rec = page.waitForResponse((r) => r.url().endsWith('/sounds/animals/cat.mp3') && r.status() === 200);
  await page.getByRole('button', { name: "Let's play" }).click();
  await rec; // the real recording is there
  await page.getByRole('button', { name: 'cat', exact: true }).click();
  await expect(page.getByText('Meow!')).toBeVisible();
  await page.getByRole('tab', { name: /Birds/ }).click();
  await page.getByRole('button', { name: 'owl' }).click();
  await expect(page.getByText('Hoo hoo!')).toBeVisible();
});

test('care guide steps: swipe left for next, right for previous', async ({ browser }) => {
  const ctx = await browser.newContext({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  await onboard(page);
  await page.goto('/care/eating');
  await expect(page.getByText('Step 1 of')).toBeVisible();
  const cdp = await ctx.newCDPSession(page);
  const swipe = async (from: number, to: number) => {
    const y = 420;
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: from, y }] });
    for (let k = 1; k <= 8; k++) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: from + ((to - from) * k) / 8, y }] });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await page.waitForTimeout(350);
  };
  await swipe(320, 80);
  await expect(page.getByText('Step 2 of')).toBeVisible();
  await swipe(320, 80);
  await expect(page.getByText('Step 3 of')).toBeVisible();
  await swipe(80, 320);
  await expect(page.getByText('Step 2 of')).toBeVisible();
  await ctx.close();
});

test('palliative centre finder: state, district, search and call', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await onboard(page);
  await page.goto('/help');
  await expect(page.getByText('BharathMD Foundation')).toBeVisible();
  await page.getByRole('link', { name: /Find a centre near you/ }).click();
  await expect(page).toHaveURL(/\/help\/palliative/);
  await page.getByLabel('District').selectOption('Kozhikode');
  await expect(page.getByText('Institute of Palliative Medicine').first()).toBeVisible();
  await page.getByLabel('State').selectOption('Karnataka');
  await page.getByPlaceholder('Search by place or name').fill('Karunashraya');
  await expect(page.getByRole('link', { name: /Call \+91/ }).first()).toBeVisible();
});

test('palliative centres one tap from Home and SOS, district remembered', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await onboard(page);
  await page.getByRole('link', { name: /Find a palliative care centre/ }).click();
  await page.getByLabel('District').selectOption('Thrissur');
  await page.goto('/sos');
  await page.getByRole('button', { name: 'Palliative team' }).click();
  await expect(page.getByLabel('District')).toHaveValue('Thrissur');
  await expect(page.getByRole('link', { name: /Call \+91/ }).first()).toBeVisible();
});

test('daily living skills and parent distress tools', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await onboard(page);
  await page.goto('/care');
  await page.getByRole('link', { name: /Daily living skills/ }).click();
  await page.getByRole('button', { name: /^Drinking from a cup/ }).click();
  for (const l of ['Full help', 'Some help', 'By myself', 'By myself']) await page.getByRole('button', { name: l }).click();
  await expect(page.getByText('All steps done!')).toBeVisible();
  await page.getByRole('button', { name: '✓' }).click();
  await expect(page.getByText('Last time: 2 of 4 by myself')).toBeVisible();
  await page.getByRole('button', { name: 'Add your own task' }).click();
  await page.getByRole('dialog').getByLabel('Task name').fill('Feed the cat');
  await page.getByRole('dialog').getByLabel('One step per line.').fill('Open the tin\nFill the bowl');
  await page.getByRole('dialog').getByRole('button', { name: 'Save' }).click();
  await expect(page.getByRole('button', { name: /^Feed the cat/ })).toBeVisible();
  await page.goto('/me');
  await page.getByRole('button', { name: '8', exact: true }).click();
  await expect(page.getByText('That is a lot to carry.', { exact: false })).toBeVisible();
  await page.getByRole('button', { name: '5-4-3-2-1: come back to now' }).click();
  await expect(page.getByText('Name 5 things you can see.', { exact: false })).toBeVisible();
  await expect(page.getByText('Your feelings', { exact: true })).toBeVisible();
});
