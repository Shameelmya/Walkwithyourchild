import { test, expect } from '@playwright/test';
import { onboard } from './helpers';
test('every game opens, responds to taps and keys, and exits with a long press', async ({ page }) => {
  test.setTimeout(180_000);
  const errs: string[] = []; page.on('pageerror', (e) => errs.push(String(e))); page.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByRole('button', { name: /English/ }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'I understand' }).click();
  await page.getByLabel("Child's name *").fill('Ammu');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Skip for now' }).click();
  await page.getByRole('button', { name: 'Start' }).click();
  await expect(page.getByRole('button', { name: 'Switch child' })).toContainText('Ammu');
  await page.goto('/play');
  const names = ['Colouring book', 'Watercolour', 'Finger paint', 'Bubbles', 'Fireworks', 'Colour lights', 'Piano', 'Song tiles', 'Music pad', 'Drums', 'Xylophone', 'Wind chimes', 'Maracas',
    'Crack the eggs', 'Catch the fruit', 'Roll to the star', 'Balloons', 'Rolling ball', 'Find the picture', 'Follow the star', 'Peekaboo', 'Quiet sea',
    'Animals', 'Fruits and food', 'Colours', 'Shapes', 'Counting', 'ABC letters', 'Malayalam letters', 'Kannada letters', 'Colour cube', 'Sliding puzzle', 'Memory pairs', 'Repeat the tune'];
  for (const n of names) {
    await page.getByRole('button', { name: n, exact: true }).click();
    // Each game first explains how to play.
    await expect(page.getByRole('dialog', { name: n })).toBeVisible();
    await page.getByRole('button', { name: "Let's play" }).click();
    await page.waitForTimeout(400);
    for (const [x, y] of [[120, 300], [260, 500], [200, 650]]) { await page.mouse.move(x, y); await page.mouse.down(); await page.mouse.move(x + 40, y + 30, { steps: 4 }); await page.mouse.up(); }
    await page.keyboard.press('a');
    await page.waitForTimeout(300);
    const exit = page.getByRole('button', { name: 'Press and hold to leave' });
    const b = (await exit.boundingBox())!;
    await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2); await page.mouse.down(); await page.waitForTimeout(2300); await page.mouse.up();
    await expect(page.getByRole('heading', { name: 'Play' })).toBeVisible();
  }
  expect(errs).toEqual([]);
});

test('colouring book celebrates a finished picture', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByRole('button', { name: /English/ }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'I understand' }).click();
  await page.getByLabel("Child's name *").fill('Ammu');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Skip for now' }).click();
  await page.getByRole('button', { name: 'Start' }).click();
  await expect(page.getByRole('button', { name: 'Switch child' })).toContainText('Ammu');
  await page.goto('/play');
  await page.getByRole('button', { name: 'Colouring book', exact: true }).click();
  await page.getByRole('button', { name: "Let's play" }).click();
  const parts = page.locator('svg[viewBox="0 0 300 300"] > :not(path[fill="none"])');
  const n = await parts.count();
  for (let i = 1; i < n; i++) await parts.nth(i).dispatchEvent('pointerdown');
  await expect(page.getByRole('img', { name: '★' })).toBeVisible();
});

test('song tiles play a whole song, quizzes answer, and the mute switch persists', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByRole('button', { name: /English/ }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'I understand' }).click();
  await page.getByLabel("Child's name *").fill('Ammu');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Skip for now' }).click();
  await page.getByRole('button', { name: 'Start' }).click();
  await expect(page.getByRole('button', { name: 'Switch child' })).toContainText('Ammu');
  await page.goto('/play/songs');
  await page.getByRole('button', { name: "Let's play" }).click();
  await page.getByRole('button', { name: /Mary had a little lamb/ }).click();
  await page.getByRole('radio', { name: '100' }).click();
  // Keyboard input plays the next note once its tile reaches the line; the song waits otherwise.
  for (let i = 0; i < 200 && !(await page.getByRole('button', { name: 'Play again' }).isVisible()); i++) { await page.keyboard.press('a'); await page.waitForTimeout(150); }
  await expect(page.getByRole('button', { name: 'Play again' })).toBeVisible();

  await page.goto('/play/q-animals');
  await page.getByRole('button', { name: "Let's play" }).click();
  const prompt = await page.locator('[aria-live="polite"]', { hasText: 'Find the' }).innerText();
  const animal = prompt.replace('Find the ', '').trim();
  await page.getByRole('button', { name: animal, exact: true }).click();
  await expect(page.locator('p', { hasText: '⭐' })).toContainText('1');

  await page.goto('/play/bubbles');
  await page.getByRole('switch', { name: /Sound/ }).click();
  await expect(page.getByRole('switch', { name: /Sound: Off/ })).toBeVisible();
  await page.getByRole('button', { name: "Let's play" }).click();
  await expect(page.getByRole('button', { name: 'Sound' })).toHaveAttribute('aria-pressed', 'false');
});

test('record your own song and it becomes song tiles', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await onboard(page);
  await page.goto('/play/songs'); await page.getByRole('button', { name: "Let's play" }).click();
  await page.getByRole('button', { name: /Twinkle/ }).click(); await page.waitForTimeout(6500);
  await page.keyboard.press('a'); await page.waitForTimeout(200);
  await page.getByRole('button', { name: 'Choose a song' }).click();
  await page.getByRole('button', { name: 'Make your own song' }).click();
  await page.getByPlaceholder('Song name').fill('Amma song');
  await page.getByRole('button', { name: 'Record' }).click();
  for (const m of [60, 62, 64, 60, 60, 62, 64, 60]) { const k = page.getByRole('button', { name: `key ${m}` }); await k.dispatchEvent('pointerdown', { pointerId: 1 }); await page.waitForTimeout(250); await k.dispatchEvent('pointerup', { pointerId: 1 }); await page.waitForTimeout(100); }
  await page.getByRole('button', { name: 'Stop' }).click();
 
  await page.getByRole('button', { name: 'Save song' }).click();
  await expect(page.getByRole('button', { name: 'Amma song', exact: true })).toBeVisible();
 
});
