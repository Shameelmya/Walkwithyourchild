import { expect, type Page } from '@playwright/test';
export async function onboard(page: Page, name = 'Ammu') {
  await page.goto('/');
  await page.getByRole('button', { name: /English/ }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'I understand' }).click();
  await page.getByLabel("Child's name *").fill(name);
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Skip for now' }).click();
  await page.getByRole('button', { name: 'Start' }).click();
  await expect(page.getByRole('button', { name: 'Switch child' })).toContainText(name);
}
export function watchErrors(page: Page) {
  const errs: string[] = [];
  page.on('pageerror', (e) => errs.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource.*(favicon|net::ERR_ABORTED)/.test(m.text())) errs.push(m.text()); });
  page.on('response', (r) => { if (r.status() >= 400 && new URL(r.url()).origin === new URL(page.url() || 'http://localhost:4173').origin) errs.push(`${r.status()} ${r.url()}`); });
  return errs;
}
