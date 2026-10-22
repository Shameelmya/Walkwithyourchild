import { test, expect } from '@playwright/test';
test('talk board speaks the full sentence right from the tap, in the chosen language', async ({ page }) => {
  await page.addInitScript(() => {
    const said: { text: string; lang: string }[] = [];
    (window as unknown as { __said: typeof said }).__said = said;
    const fake = { speaking: false, pending: false, getVoices: () => [], cancel() {}, resume() {}, addEventListener() {}, removeEventListener() {},
      speak(u: SpeechSynthesisUtterance) { said.push({ text: u.text, lang: u.lang }); setTimeout(() => u.onstart?.(new Event('start') as SpeechSynthesisEvent), 10); } };
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

test('a phone without a Malayalam voice speaks English instead and says how to add one', async ({ page }) => {
  await page.addInitScript(() => {
    const said: { text: string; lang: string }[] = [];
    (window as unknown as { __said: typeof said }).__said = said;
    const en = { name: 'English India', lang: 'en-IN', voiceURI: 'en-IN', localService: true, default: true };
    const fake = { speaking: false, pending: false, getVoices: () => [en], cancel() {}, resume() {}, addEventListener() {}, removeEventListener() {},
      speak(u: SpeechSynthesisUtterance) { said.push({ text: u.text, lang: u.lang }); setTimeout(() => u.onstart?.(new Event('start') as SpeechSynthesisEvent), 10); } };
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
  await page.getByRole('button', { name: 'Switch language' }).click();
  await page.getByRole('menuitemradio', { name: 'മലയാളം' }).click();
  await page.getByRole('button', { name: 'ഭക്ഷണം', exact: true }).click();
  await expect.poll(() => page.evaluate(() => (window as unknown as { __said: { text: string; lang: string }[] }).__said.at(-1))).toEqual({ text: 'I want food, please.', lang: 'en-IN' });
  await page.getByRole('button', { name: 'ശബ്ദം' }).click();
  await expect(page).toHaveURL(/\/settings#voice/);
  await expect(page.getByLabel('English', { exact: true })).toBeVisible();
  await expect(page.getByText(/ഈ ഫോണിൽ മലയാളം ശബ്ദം/).first()).toBeVisible();
});

test('a phone that refuses a named voice still speaks with a simpler request', async ({ page }) => {
  await page.addInitScript(() => {
    const said: string[] = [];
    (window as unknown as { __said: typeof said }).__said = said;
    let n = 0;
    const fake = { speaking: false, pending: false, paused: false, getVoices: () => [], cancel() {}, resume() {}, addEventListener() {}, removeEventListener() {},
      speak(u: SpeechSynthesisUtterance) {
        n++;
        // The first request fails like some Android phones do; the retry speaks.
        if (n === 1) setTimeout(() => u.onerror?.({ error: 'synthesis-failed' } as SpeechSynthesisErrorEvent), 10);
        else { said.push(u.text); setTimeout(() => u.onstart?.(new Event('start') as SpeechSynthesisEvent), 10); }
      } };
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
  await page.getByRole('button', { name: 'Water', exact: true }).click();
  await expect.poll(() => page.evaluate(() => (window as unknown as { __said: string[] }).__said)).toEqual(['I want some water.']);
  await expect(page.getByText(/did not speak/)).toHaveCount(0);
});

test('record your own voice for every card in one go, and taps play it', async ({ browser }) => {
  const ctx = await browser.newContext({ permissions: ['microphone'] });
  const page = await ctx.newPage();
  await page.addInitScript(() => {
    (window as unknown as { __played: number }).__played = 0;
    HTMLMediaElement.prototype.play = function () { (window as unknown as { __played: number }).__played++; return Promise.resolve(); };
    // A pretend microphone: the recorder hands back a small audio blob.
    navigator.mediaDevices.getUserMedia = async () => new MediaStream();
    class FakeRec { state = 'inactive'; mimeType = 'audio/webm'; ondataavailable: ((e: { data: Blob }) => void) | null = null; onstop: (() => void) | null = null;
      static isTypeSupported() { return true; }
      start() { this.state = 'recording'; }
      stop() { this.state = 'inactive'; this.ondataavailable?.({ data: new Blob(['x'], { type: 'audio/webm' }) }); setTimeout(() => this.onstop?.(), 10); } }
    (window as unknown as { MediaRecorder: unknown }).MediaRecorder = FakeRec;
  });
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
  await page.goto('/talk');
  await page.getByRole('button', { name: 'Record voices' }).click();
  const dlg = page.getByRole('dialog');
  await expect(dlg.getByText('“I want food, please.”')).toBeVisible();
  await dlg.getByRole('button', { name: 'Record your voice' }).click();
  await page.waitForTimeout(700);
  await dlg.getByRole('button', { name: 'Stop recording' }).click();
  await expect(dlg.getByLabel('Saved')).toBeVisible();
  await dlg.getByRole('button', { name: /Next/ }).click();
  await expect(dlg.getByText('“I want some water.”')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  const before = await page.evaluate(() => (window as unknown as { __played: number }).__played);
  await page.getByRole('button', { name: 'Food', exact: true }).click();
  await expect.poll(() => page.evaluate(() => (window as unknown as { __played: number }).__played)).toBeGreaterThan(before);
  await ctx.close();
});
