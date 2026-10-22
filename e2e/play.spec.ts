import { test, expect } from '@playwright/test';
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
  const names = ['Colouring book', 'Finger paint', 'Bubbles', 'Fireworks', 'Colour lights', 'Music pad', 'Drums', 'Xylophone', 'Wind chimes', 'Maracas', 'Balloons', 'Find the picture', 'Rolling ball', 'Follow the star', 'Peekaboo', 'Quiet sea'];
  for (const n of names) {
    await page.getByRole('button', { name: n, exact: true }).click();
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
  const parts = page.locator('svg[viewBox="0 0 300 300"] > :not(path[fill="none"])');
  const n = await parts.count();
  for (let i = 1; i < n; i++) await parts.nth(i).dispatchEvent('pointerdown');
  await expect(page.getByRole('img', { name: '★' })).toBeVisible();
});
