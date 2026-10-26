import type { Lang } from './store';
import { xt } from '../i18n/xt';

export const pad = (n: number) => String(n).padStart(2, '0');
export const isoDate = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const hhmm = (d = new Date()) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
export const addDays = (d: Date, n: number) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
export const parseISO = (s: string) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, (m || 1) - 1, d || 1); };
export const weekStart = (d = new Date()) => { const x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); const wd = (x.getDay() + 6) % 7; return isoDate(addDays(x, -wd)); };
const locale = (l: Lang) => `${l}-IN`;
export const fmtDate = (s: string | number | undefined, lang: Lang, opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' }) => {
  if (s === undefined || s === '') return '';
  const d = typeof s === 'number' ? new Date(s) : parseISO(s);
  return isNaN(+d) ? String(s) : d.toLocaleDateString(locale(lang), opts);
};
export const fmtTime = (t: number, lang: Lang) => new Date(t).toLocaleTimeString(locale(lang), { hour: 'numeric', minute: '2-digit' });
export const fmtDur = (sec: number) => `${Math.floor(sec / 60)}:${pad(Math.floor(sec % 60))}`;
export const ageFrom = (dob?: string) => {
  if (!dob) return null;
  const b = parseISO(dob); const n = new Date();
  let y = n.getFullYear() - b.getFullYear(); let m = n.getMonth() - b.getMonth();
  if (n.getDate() < b.getDate()) m--; if (m < 0) { y--; m += 12; }
  return { y, m };
};
export const fill = (s: string, v: Record<string, string | number>) => s.replace(/\{(\w+)\}/g, (_, k) => String(v[k] ?? ''));
export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ');
export const download = (blob: Blob, name: string) => {
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
};
export async function shareOrDownload(blob: Blob, name: string, title: string) {
  const file = new File([blob], name, { type: blob.type });
  const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
  if (nav.share && nav.canShare?.({ files: [file] })) {
    try { await nav.share({ files: [file], title }); return 'shared'; } catch (e) { if ((e as Error).name === 'AbortError') return 'cancelled'; }
  }
  download(blob, name); return 'downloaded';
}

/** A text in the reader's language, or English when that language has no translation of it yet. */
export type Tx = { en: string } & Partial<Record<Lang, string>>;
export const pick = <T,>(o: { en: T } & Partial<Record<Lang, T>>, l: Lang): T => o[l] ?? (typeof o.en === 'string' ? (xt(l, o.en) as T) : o.en);
