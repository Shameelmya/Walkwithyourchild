import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { Search, Bookmark } from 'lucide-react';
import { useT } from '../../i18n';
import { Page, PageHeader } from '../../components/ui';
import { PathMotif } from '../../components/Path';
import { loc, meta, toc, partColor } from '../../lib/content';
import { chapterPct, getReading, journeyPct } from '../../lib/reading';

export function TocList({ current, onPick }: { current?: string; onPick?: () => void }) {
  const { lang } = useT();
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
          <section key={g.part + ':' + g.items[0].id} style={{ ['--pc' as string]: col.c, ['--pt' as string]: col.t }}>
            {p && (
              <div id={`part-${p.n}`} className="rounded-2xl p-4 mb-2 bg-[var(--pt)]">
                <p className="text-sm font-extrabold text-[var(--pc)]">{meta.partLabel[lang]} {p.n}</p>
                <h2 className="text-xl font-extrabold">{loc(p.title, lang)}</h2>
              </div>
            )}
            <ul className="grid gap-1">
              {g.items.map((c) => {
                const pct = chapterPct(r, c.id);
                return (
                  <li key={c.id}>
                    <Link to={`/book/${c.id}`} onClick={onPick} aria-current={current === c.id ? 'page' : undefined} className={`flex items-center gap-3 p-3 rounded-xl min-h-[56px] hover:bg-surface2 ${current === c.id ? 'bg-surface2' : ''}`}>
                      <span className="w-10 h-10 rounded-full flex items-center justify-center font-extrabold shrink-0 text-white" style={{ background: 'var(--pc)' }}>{c.id === 'appendix' ? '✦' : c.n}</span>
                      <span className="flex-1 min-w-0"><span className="block font-bold leading-snug">{loc(c.title, lang)}</span>
                        <span className="block h-1.5 rounded-full bg-line/60 mt-1.5 overflow-hidden" aria-hidden><span className="block h-full rounded-full" style={{ width: `${pct * 100}%`, background: 'var(--pc)' }} /></span></span>
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
  const curPart = toc.toc.find((c) => c.id === r?.chapter)?.part;
  return (
    <Page>
      <PageHeader back={false} title={meta.reader.contents[lang]} sub={meta.appTitle[lang]} actions={<>
        <Link to="/book/search" className="icon-btn" aria-label={t('search')}><Search /></Link>
        <Link to="/book/bookmarks" className="icon-btn" aria-label={t('bookmarks')}><Bookmark /></Link>
      </>} />
      {r?.updatedAt ? <Link to={`/book/${r.chapter}`} className="btn-primary w-full mb-4">{meta.reader.continue[lang]}</Link> : null}
      <div className="card p-3 mb-6">
        <div className="max-w-xl mx-auto"><PathMotif filled={journeyPct(r)} active={curPart} onStop={(n) => document.getElementById(`part-${n}`)?.scrollIntoView({ behavior: 'smooth' })} labels={toc.parts.map((p) => loc(p.title, lang))} /></div>
      </div>
      <TocList current={r?.chapter} />
    </Page>
  );
}
