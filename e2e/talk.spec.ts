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
