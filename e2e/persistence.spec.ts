import { test, expect } from '@playwright/test';
import { onboard, watchErrors } from './helpers';

test('everything you enter is still there after closing and reopening', async ({ page }) => {
  test.setTimeout(300_000);
  await page.setViewportSize({ width: 390, height: 844 });
  const errs = watchErrors(page);
  await onboard(page);

  // Notebook: form, table, boxes, checklist, emergency card. Leave each page right after typing.
  await page.goto('/notebook/my-child');
  await page.getByLabel('Allergies').fill('Penicillin');
  await page.waitForTimeout(150); // a person can't leave faster than this
  await page.goto('/notebook/emergency');
  await page.getByLabel('Our plan in an emergency').fill('Give rescue medicine, call Dr Rao'); await page.waitForTimeout(150);
  await page.goto('/notebook/joy');
  await page.getByLabel('Favourite songs and music').fill('Lullabies'); await page.waitForTimeout(150);
  await page.goto('/notebook/documents');
  await page.getByRole('checkbox', { name: /Bank passbook/ }).click();
  await expect(page.getByRole('checkbox', { name: /Bank passbook/ })).toHaveAttribute('aria-checked', 'true');
  await page.waitForTimeout(150);
  await page.goto('/notebook/good-moments');
  await page.locator('textarea').first().fill('She laughed at the rain'); await page.waitForTimeout(150);
  await page.goto('/');

  // Questions from the book, with confirmation
  await page.goto('/book/c2?b=0');
  await page.getByRole('button', { name: 'Add to my questions' }).first().click();
  await page.getByRole('dialog').getByRole('button', { name: 'Add', exact: true }).click();
  await expect(page.getByText('Added to your questions for the doctor')).toBeVisible();

  // Notes: close straight after typing
  await page.goto('/notebook/notes');
  await page.getByRole('button', { name: 'New note' }).click();
  await page.getByLabel('Title').fill('Three things I know');
  await page.getByRole('dialog').getByLabel('Note').fill('Line one');
  await page.getByRole('button', { name: 'Done' }).click(); await expect(page.getByRole('dialog')).toHaveCount(0);

  // Medicine + dose
  await page.goto('/medicines');
  await page.getByRole('button', { name: 'Add medicine' }).click();
  await page.getByLabel('Medicine *').fill('Levetiracetam');
  await page.getByLabel('Dose', { exact: true }).fill('2 ml');
  await page.getByRole('dialog').getByRole('button', { name: 'Save' }).click(); await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByText('Levetiracetam').first()).toBeVisible();

  // Visit, record, progress
  await page.goto('/visits');
  await page.getByRole('button', { name: 'Doctor visit' }).click();
  await page.getByLabel('Date *').fill('2030-01-15');
  await page.getByLabel('Doctor', { exact: true }).fill('Dr Rao');
  await page.getByRole('dialog').getByRole('button', { name: 'Save' }).click(); await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.goto('/records/consultations');
  await page.getByRole('button', { name: 'Consultations' }).last().click();
  await page.getByLabel('Doctor', { exact: true }).fill('Dr Menon');
  await page.getByRole('dialog').getByRole('button', { name: 'Save' }).click(); await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.goto('/progress');
  await page.getByRole('button', { name: 'Check-in' }).last().click();
  await page.getByRole('button', { name: /^3: / }).first().click();
  await page.getByLabel('Weight (kg)').fill('18.5');
  await page.getByRole('dialog').getByRole('button', { name: 'Save' }).click(); await expect(page.getByRole('dialog')).toHaveCount(0);

  // Seizure with details
  await page.goto('/seizure');
  await page.waitForTimeout(1500);
  await page.getByRole('button', { name: 'Stop', exact: true }).click();
  await page.getByRole('button', { name: 'Add details' }).click();
  await page.getByLabel('What it looked like').fill('Arms jerking');
  await page.getByRole('dialog').getByRole('button', { name: 'Save' }).click(); await expect(page.getByRole('dialog')).toHaveCount(0);

  // Self-care, talk board, memory, bookmark, colouring, settings
  await page.goto('/me');
  await page.getByRole('checkbox', { name: /good night's sleep/ }).click();
  await expect(page.getByRole('checkbox', { name: /good night's sleep/ })).toHaveAttribute('aria-checked', 'true');
  await page.goto('/talk');
  await page.getByRole('button', { name: 'Edit cards' }).click();
  await page.getByRole('button', { name: 'Water', exact: true }).click();
  await page.getByLabel('Word on the card').fill('Juice');
  await page.getByRole('dialog').getByRole('button', { name: 'Save' }).click(); await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.goto('/memory');
  await page.getByRole('button', { name: 'Note' }).click();
  await page.getByRole('dialog').getByLabel('Title').fill('First smile');
  await page.getByRole('dialog').getByRole('button', { name: 'Save' }).click(); await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.goto('/book/c1?b=0');
  await page.getByRole('button', { name: 'Bookmark', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Bookmark', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.goto('/play');
  await page.getByRole('button', { name: 'Colouring book', exact: true }).click();
  await page.mouse.click(195, 330);
  await page.waitForTimeout(300);
  await page.goto('/settings');
  await page.getByRole('radio', { name: 'Night' }).click();

  // Reopen the app
  await page.waitForTimeout(800);
  await page.reload();
  await page.goto('/notebook/my-child'); await expect(page.getByLabel('Allergies')).toHaveValue('Penicillin');
  await page.goto('/notebook/emergency'); await expect(page.getByLabel('Our plan in an emergency')).toHaveValue('Give rescue medicine, call Dr Rao');
  await page.goto('/notebook/joy'); await expect(page.getByLabel('Favourite songs and music')).toHaveValue('Lullabies');
  await page.goto('/notebook/documents'); await expect(page.getByRole('checkbox', { name: /Bank passbook/ })).toHaveAttribute('aria-checked', 'true');
  await page.goto('/notebook/good-moments'); await expect(page.locator('textarea').first()).toHaveValue('She laughed at the rain');
  await page.goto('/notebook/questions'); await expect(page.locator('textarea').first()).toHaveValue(/What do the test results mean|Can you|What|Is|How/);
  await page.goto('/notebook/notes'); await expect(page.getByText('Three things I know')).toBeVisible();
  await page.goto('/medicines'); await expect(page.getByText('Levetiracetam').first()).toBeVisible();
  await page.goto('/notebook/medicines'); await expect(page.getByText('Levetiracetam')).toBeVisible();
  await page.goto('/visits'); await expect(page.getByText('Dr Rao').first()).toBeVisible();
  await page.goto('/records'); await expect(page.getByText('Dr Menon').first()).toBeVisible();
  await page.goto('/progress'); await expect(page.getByText('18.5 kg')).toBeVisible();
  await page.goto('/seizures'); await expect(page.getByText('Arms jerking').first()).toBeVisible();
  await page.goto('/notebook/seizures'); await expect(page.getByText('Arms jerking').first()).toBeVisible();
  await page.goto('/me'); await expect(page.getByRole('checkbox', { name: /good night's sleep/ })).toHaveAttribute('aria-checked', 'true');
  await page.goto('/talk'); await expect(page.getByRole('button', { name: 'Juice', exact: true })).toBeVisible();
  await page.goto('/memory'); await expect(page.getByText('First smile')).toBeVisible();
  await page.goto('/book/bookmarks'); await expect(page.locator('main li')).toHaveCount(1);
  await page.goto('/'); await expect(page.locator('html')).toHaveAttribute('data-theme', 'night');
  expect(await page.evaluate(() => Object.keys(JSON.parse(localStorage.getItem('wwyc-colouring') || '{}')).length)).toBeGreaterThan(0);
  expect(errs).toEqual([]);
});
