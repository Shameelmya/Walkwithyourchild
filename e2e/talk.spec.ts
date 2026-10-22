import { test, expect } from '@playwright/test';
test('talk board speaks the full sentence right from the tap, in the chosen language', async ({ page }) => {
  await page.addInitScript(() => {
    const said: { text: string; lang: string }[] = [];
    (window as unknown as { __said: typeof said }).__said = said;
    const fake = { speaking: false, pending: false, getVoices: () => [], cancel() {}, resume() {}, addEventListener() {}, removeEventListener() {},
      speak(u: SpeechSynthesisUtterance) { said.push({ text: u.text, lang: u.lang }); } };
    Object.defineProperty(window, 'speechSynthesis', { value: fake, configurable: true });
  });
  await page.goto('/');
  await page.getByRole('button', { name: /English/ }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'I understand' }).click();
  await page.getByLabel("Child's name *").fill('Ammu');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Skip for now' }).click();
  await page.getByRole('button', { name: 'Start' }).click();
  await expect(page.getByRole('button', { name: 'Switch child' })).toContainText('Ammu');
  await page.goto('/talk');
  await page.getByRole('button', { name: 'Food', exact: true }).click();
  await expect.poll(() => page.evaluate(() => (window as unknown as { __said: { text: string }[] }).__said.map((s) => s.text))).toContain('I want food, please.');
  await page.getByRole('button', { name: 'Switch language' }).click();
  await page.getByRole('menuitemradio', { name: 'മലയാളം' }).click();
  await page.getByRole('button', { name: 'ഭക്ഷണം', exact: true }).click();
  await expect.poll(() => page.evaluate(() => (window as unknown as { __said: { text: string; lang: string }[] }).__said.at(-1))).toEqual({ text: 'എനിക്ക് ഭക്ഷണം വേണം.', lang: 'ml-IN' });
});

test('read aloud in the reader queues the chapter from the tap', async ({ page }) => {
  await page.addInitScript(() => {
    const said: string[] = [];
    (window as unknown as { __said: string[] }).__said = said;
    (window as unknown as { SpeechSynthesisUtterance: unknown }).SpeechSynthesisUtterance = class { text: string; lang = ''; voice: unknown = null; rate = 1; pitch = 1; volume = 1; onend: unknown; onerror: unknown; constructor(t: string) { this.text = t; } };
    const fake = { speaking: false, pending: false, getVoices: () => [{ lang: 'en-IN', name: 'Google English', localService: true }], cancel() {}, resume() {}, addEventListener() {}, removeEventListener() {},
      speak(u: { text: string }) { said.push(u.text); } };
    Object.defineProperty(window, 'speechSynthesis', { value: fake, configurable: true });
  });
  await page.goto('/');
  await page.getByRole('button', { name: /English/ }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'I understand' }).click();
  await page.getByLabel("Child's name *").fill('Ammu');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Skip for now' }).click();
  await page.getByRole('button', { name: 'Start' }).click();
  await expect(page.getByRole('button', { name: 'Switch child' })).toContainText('Ammu');
  await page.goto('/book/c1?b=0');
  await page.getByRole('button', { name: 'Reading settings' }).click();
  await page.getByRole('button', { name: 'Read aloud' }).click();
  await expect.poll(() => page.evaluate(() => (window as unknown as { __said: string[] }).__said.length)).toBeGreaterThan(10);
  expect(await page.getByRole('navigation', { name: 'Main navigation' }).count()).toBe(0);
});
