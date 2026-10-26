import { test, expect } from '@playwright/test';
import { onboard, watchErrors } from './helpers';

// One row per language offered in the app: its name in the language picker, the title of chapter 5 and the page direction.
const LANGUAGES = [
  { code: 'kn', native: 'ಕನ್ನಡ', c5: 'ಪ್ರತಿದಿನ ನಿಮ್ಮ ಮಗುವಿನ ಆರೈಕೆ', dir: 'ltr' },
  { code: 'hi', native: 'हिन्दी', c5: 'हर दिन अपने बच्चे की देखभाल करना', dir: 'ltr' },
  { code: 'ta', native: 'தமிழ்', c5: 'ஒவ்வொரு நாளும் உங்கள் குழந்தையைப் பராமரித்தல்', dir: 'ltr' },
  { code: 'te', native: 'తెలుగు', c5: 'ప్రతిరోజూ మీ బిడ్డను చూసుకోవడం', dir: 'ltr' },
  { code: 'bn', native: 'বাংলা', c5: 'প্রতিদিন আপনার সন্তানের যত্ন নেওয়া', dir: 'ltr' },
  { code: 'ur', native: 'اردو', c5: 'ہر دن اپنے بچے کی دیکھ بھال کرنا', dir: 'rtl' },
];

for (const L of LANGUAGES) {
  test(`${L.code}: the book, the app text and the disclaimer appear in ${L.native}`, async ({ page }) => {
    const errs = watchErrors(page);
    await page.setViewportSize({ width: 390, height: 844 });
    await onboard(page);
    await page.goto('/book/c5');
    await page.getByRole('button', { name: 'Switch language' }).click();
    await page.getByRole('menuitemradio', { name: L.native }).click();
    await expect(page.locator('html')).toHaveAttribute('lang', L.code);
    await expect(page.locator('html')).toHaveAttribute('dir', L.dir);
    await expect(page.getByRole('heading', { level: 1 })).toContainText(L.c5);
    // the book is the translated one, not the English fallback
    await expect(page.getByText('Caring for your child day by day')).toHaveCount(0);
    // the disclaimer is shown on the About page in this language
    await page.goto('/about');
    await expect(page.locator('html')).toHaveAttribute('lang', L.code);
    await expect(page.getByText('This app does not replace advice')).toHaveCount(0);
    expect(errs).toEqual([]);
  });
}
