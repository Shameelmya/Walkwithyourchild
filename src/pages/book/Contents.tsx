import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { Search, Bookmark, Check, ArrowRight } from 'lucide-react';
import { useT } from '../../i18n';
import { Page } from '../../components/ui';
import { PathMotif } from '../../components/Path';
import { loc, meta, toc, partColor } from '../../lib/content';
import { chapterPct, getReading, journeyPct } from '../../lib/reading';
import { cx } from '../../lib/util';

export function TocList({ current, onPick }: { current?: string; onPick?: () => void }) {
  const { t, lang } = useT();
  const r = useLiveQuery(() => getReading(), []);
  const chapters = toc.toc;
  const groups: { part: number; items: typeof chapters }[] = [];
  for (const c of chapters) { const g = groups[groups.length - 1]; if (g && g.part === c.part) g.items.push(c); else groups.push({ part: c.part, items: [c] }); }
  return (
    <div className="grid gap-5">
      {groups.map((g) => {
        const p = toc.parts.find((x) => x.n === g.part);
        const col = partColor(g.part);
        return (
          <section key={g.part + ':' + g.items[0].id} style={{ ['--pc' as string]: col.c, ['--pt' as string]: col.t }} className="card !rounded-[26px] overflow-hidden">
            <div id={p ? `part-${p.n}` : undefined} className="cover !rounded-none !shadow-none !border-0 px-5 py-4">
              <div className="relative z-[1]">
                <p className="text-[0.75rem] font-bold text-[var(--pc)]">{p ? `${meta.partLabel[lang]} ${p.n}` : g.part === 0 ? t('introduction') : t('appendix')}</p>
                <h2 className="font-display text-xl font-bold leading-snug">{p ? loc(p.title, lang) : loc(g.items[0].title, lang)}</h2>
              </div>
            </div>
            <ul className="p-2">
              {g.items.map((c) => {
                const pct = chapterPct(r, c.id);
                return (
                  <li key={c.id}>
                    <Link to={`/book/${c.id}?b=0`} onClick={onPick} aria-current={current === c.id ? 'page' : undefined} className={cx('flex items-center gap-3 p-3 rounded-2xl min-h-[60px] transition hover:bg-surface2', current === c.id && 'bg-[var(--pt)]')}>
                      <span className="w-11 h-11 rounded-2xl flex items-center justify-center font-extrabold shrink-0 bg-[var(--pt)] text-[var(--pc)]">{pct >= 0.98 ? <Check size={18} /> : c.id === 'appendix' ? '✦' : c.n}</span>
                      <span className="flex-1 min-w-0"><span className="block font-bold leading-snug">{loc(c.title, lang)}</span>
                        <span className="flex items-center gap-2 mt-1.5" aria-hidden><span className="flex-1 h-1.5 rounded-full bg-line/60 overflow-hidden"><span className="block h-full rounded-full" style={{ width: `${pct * 100}%`, background: 'var(--pc)' }} /></span><span className="text-[0.7rem] font-bold text-muted w-8 text-right">{Math.round(pct * 100)}%</span></span></span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

export default function Contents() {
  const { t, lang } = useT();
  const r = useLiveQuery(() => getReading(), []);
  const ch = toc.toc.find((c) => c.id === (r?.chapter ?? 'c0'))!;
  const pct = journeyPct(r);
  return (
    <Page>
      <section className="pt-1 pb-5">
        <h1 className="font-display text-[1.9rem] font-bold leading-tight mt-1">{meta.appTitle[lang]}</h1>
      </section>
      <div className="flex gap-2 mb-5">
        <Link to="/book/search" className="flex-1 input !min-h-[52px] flex items-center gap-3 text-muted !bg-surface shadow-card border-line/50"><Search size={20} aria-hidden /> {t('searchPlaceholder')}</Link>
        <Link to="/book/bookmarks" className="icon-chip !w-[52px] !h-[52px]" aria-label={t('bookmarks')}><Bookmark size={20} /></Link>
      </div>
      <Link to={`/book/${ch.id}`} className="tile t-blue !p-5 flex items-center gap-4 mb-5">
        <div className="relative z-[1] flex-1 min-w-0">
          <p className="text-[0.78rem] font-bold opacity-90">{r?.updatedAt ? meta.reader.continue[lang] : t('startReading')}</p>
          <p className="font-display text-xl font-bold leading-snug line-clamp-2">{loc(ch.title, lang)}</p>
          <p className="text-[0.78rem] font-bold opacity-90 mt-2">{t('bookRead', { n: Math.round(pct * 100) })}</p>
        </div>
        <span className="relative z-[1] w-12 h-12 rounded-full bg-white text-[#2a231d] flex items-center justify-center shrink-0"><ArrowRight aria-hidden /></span>
      </Link>
      <div className="card p-3 mb-6"><div className="max-w-xl mx-auto">
        <PathMotif filled={pct} active={ch.part} onStop={(n) => document.getElementById(`part-${n}`)?.scrollIntoView({ behavior: 'smooth' })} labels={toc.parts.map((p) => loc(p.title, lang))} />
      </div></div>
      <TocList current={r?.chapter} />
    </Page>
  );
}
