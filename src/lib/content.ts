import metaJson from '../generated/meta.json';
import workbookJson from '../generated/workbook.json';
import tocJson from '../generated/toc.json';
import type { Lang } from './store';

export type L10n = { en: string } & Partial<Record<Lang, string>>;
export type Block =
  | { t: 'h'; html: string; text: string }
  | { t: 'html'; html: string; text: string }
  | { t: 'check'; items: string[]; text: string }
  | { t: 'callout'; kind: string; html: string; text: string; questions?: string[]; numbers?: string[]; link?: string };
export interface Chapter { id: string; n: number; part: number; title: string; blocks: Block[] }
export interface Book { fallback?: boolean; parts: { n: number; title: string; intro: string }[]; chapters: Chapter[] }

export interface Field { id: string; label: L10n; size?: string; input: string; sub?: L10n; width?: number }
export interface Sheet {
  id: string; n: number; type: 'form' | 'table' | 'checklist' | 'card' | 'boxes' | 'weekly';
  title: L10n; hint?: L10n; fields?: Field[]; columns?: Field[]; rows?: number | Field[]; items?: L10n[]; boxes?: L10n[];
  prefilled?: L10n[]; note?: L10n; banner?: L10n; weeks?: number; rowHeader?: L10n; weekLabel?: L10n; warning?: L10n; linkedTo?: string;
}

// Every {en, ml} pair in meta.json is read as a text in any language; a language with no label reads English (see tr / pick).
type Deep<T> = T extends { en: string; ml: string } ? Record<Lang, string> : T extends (infer U)[] ? Deep<U>[] : T extends object ? { [K in keyof T]: Deep<T[K]> } : T;
export const meta = metaJson as unknown as Deep<typeof metaJson>;
export const workbook = workbookJson as unknown as { title: L10n; intro: L10n; sheets: Sheet[] };
export const toc = tocJson as { toc: { id: string; n: number; part: number; blocks: number; title: L10n }[]; parts: { n: number; title: L10n }[]; anchors: Record<string, { c: string; from: number; to: number }> };

export const sheetById = (id: string) => workbook.sheets.find((s) => s.id === id);
export const loc = (v: L10n | undefined, lang: Lang) => (v ? v[lang] ?? v.en : '');
export const L = (v: L10n, lang: Lang) => v[lang] ?? v.en;

export function partColor(part: number) {
  if (part >= 1 && part <= 5) return { c: `var(--p${part})`, t: `var(--p${part}t)` };
  if (part === 0) return { c: 'var(--pb)', t: 'var(--pbt)' };
  return { c: 'var(--pp)', t: 'var(--ppt)' };
}

// Books that exist as src/generated/book.<lang>.json; a language without one reads the English book.
const books = import.meta.glob('../generated/book.*.json');
const cache: Partial<Record<Lang, Promise<Book>>> = {};
export function loadBook(lang: Lang): Promise<Book> {
  if (!cache[lang]) {
    const load = books[`../generated/book.${lang}.json`];
    cache[lang] = load
      ? load().then((m) => (m as { default: unknown }).default as Book)
      : lang === 'en' ? Promise.reject(new Error('English book missing')) : loadBook('en').then((b) => ({ ...b, fallback: true }));
  }
  return cache[lang]!;
}

export const callTel = (n: string) => `tel:${n.replace(/[^\d+]/g, '')}`;
export const extractPhone = (s: string | undefined) => (s ?? '').match(/(\+?\d[\d\s-]{6,}\d)/)?.[1]?.replace(/[\s-]/g, '') ?? '';
