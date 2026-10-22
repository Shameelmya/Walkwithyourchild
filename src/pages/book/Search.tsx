import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search as SearchIcon } from 'lucide-react';
import { useT } from '../../i18n';
import { Page, PageHeader, Empty } from '../../components/ui';
import { loadBook, loc, toc, type Book } from '../../lib/content';

export default function Search() {
  const { t, lang } = useT();
  const [q, setQ] = useState('');
  const [books, setBooks] = useState<{ en?: Book; ml?: Book }>({});
  useEffect(() => { Promise.all([loadBook('en'), loadBook('ml')]).then(([en, ml]) => setBooks({ en, ml })); }, []);
  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (s.length < 2) return [];
    const out: { l: 'en' | 'ml'; c: string; b: number; text: string }[] = [];
    for (const l of ['en', 'ml'] as const) for (const c of books[l]?.chapters ?? []) c.blocks.forEach((b, i) => {
      const at = b.text.toLowerCase().indexOf(s);
      if (at >= 0) out.push({ l, c: c.id, b: i, text: (at > 40 ? '…' : '') + b.text.slice(Math.max(0, at - 40), at + 120) });
    });
    return out.slice(0, 80);
  }, [q, books]);
  return (
    <Page>
      <PageHeader title={t('searchBook')} back="/book" />
      <div className="relative mb-4">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden />
        <input autoFocus type="search" className="input pl-11" placeholder={t('searchPlaceholder')} aria-label={t('search')} value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      {q.trim().length >= 2 && !results.length && <Empty kind="book" title={t('noResults')} />}
      <p className="sr-only" aria-live="polite">{results.length ? t('resultsCount', { n: results.length }) : ''}</p>
      <ul className="grid gap-2">
        {results.map((r, i) => (
          <li key={i}><Link to={`/book/${r.c}?b=${r.b}`} className="card block p-3 hover:bg-surface2">
            <span className="text-xs font-extrabold text-accent">{r.l === 'en' ? 'English' : 'മലയാളം'} · {loc(toc.toc.find((c) => c.id === r.c)!.title, lang)}</span>
            <span className="block font-read mt-1" lang={r.l}>{r.text}</span>
          </Link></li>
        ))}
      </ul>
    </Page>
  );
}
