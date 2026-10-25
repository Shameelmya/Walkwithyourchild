import { useCallback } from 'react';
import { en } from './en';
import { ml } from './ml';
import { kn } from './kn';
import { useUI, type Lang } from '../lib/store';
import { fill } from '../lib/util';

export type TKey = keyof typeof en;
export const dict: Partial<Record<Lang, Partial<Record<TKey, string>>>> = { en, ml, kn };
export const tr = (lang: Lang, k: TKey, v?: Record<string, string | number>) => {
  const s = dict[lang]?.[k] ?? en[k] ?? k;
  return v ? fill(s, v) : s;
};
export function useT() {
  const lang = useUI((s) => s.lang);
  const t = useCallback((k: TKey, v?: Record<string, string | number>) => tr(lang, k, v), [lang]);
  return { t, lang };
}
