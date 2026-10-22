import metaJson from '../generated/meta.json';
import workbookJson from '../generated/workbook.json';
import tocJson from '../generated/toc.json';
import type { Lang } from './store';

export type L10n = { en: string; ml: string };
export type Block =
  | { t: 'h'; html: string; text: string }
  | { t: 'html'; html: string; text: string }
  | { t: 'check'; items: string[]; text: string }
  | { t: 'callout'; kind: string; html: string; text: string; questions?: string[]; numbers?: string[]; link?: string };
export interface Chapter { id: string; n: number; part: number; title: string; blocks: Block[] }
export interface Book { parts: { n: number; title: string; intro: string }[]; chapters: Chapter[] }

export interface Field { id: string; label: L10n; size?: string; input: string; sub?: L10n; width?: number }
export interface Sheet {
  id: string; n: number; type: 'form' | 'table' | 'checklist' | 'card' | 'boxes' | 'weekly';
  title: L10n; hint?: L10n; fields?: Field[]; columns?: Field[]; rows?: number | Field[]; items?: L10n[]; boxes?: L10n[];
  prefilled?: L10n[]; note?: L10n; banner?: L10n; weeks?: number; rowHeader?: L10n; weekLabel?: L10n; warning?: L10n; linkedTo?: string;
}

export const meta = metaJson as typeof metaJson;
export const workbook = workbookJson as unknown as { title: L10n; intro: L10n; sheets: Sheet[] };
export const toc = tocJson as { toc: { id: string; n: number; part: number; blocks: number; title: L10n }[]; parts: { n: number; title: L10n }[]; anchors: Record<string, { c: string; from: number; to: number }> };

export const sheetById = (id: string) => workbook.sheets.find((s) => s.id === id);
export const loc = (v: L10n | undefined, lang: Lang) => (v ? v[lang] ?? v.en : '');

export function partColor(part: number) {
  if (part >= 1 && part <= 5) return { c: `var(--p${part})`, t: `var(--p${part}t)` };
  if (part === 0) return { c: 'var(--pi)', t: 'var(--pit)' };
  return { c: 'var(--pp)', t: 'var(--ppt)' };
}

const cache: Partial<Record<Lang, Promise<Book>>> = {};
export function loadBook(lang: Lang): Promise<Book> {
  if (!cache[lang]) {
    cache[lang] = (lang === 'ml' ? import('../generated/book.ml.json') : import('../generated/book.en.json')).then((m) => m.default as unknown as Book);
  }
  return cache[lang]!;
}

export const callTel = (n: string) => `tel:${n.replace(/[^\d+]/g, '')}`;
export const extractPhone = (s: string | undefined) => (s ?? '').match(/(\+?\d[\d\s-]{6,}\d)/)?.[1]?.replace(/[\s-]/g, '') ?? '';
