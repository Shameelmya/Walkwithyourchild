import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { Phone, Play, Square, ChevronRight, NotebookPen, Timer, PenLine, Trash2, BookOpen } from 'lucide-react';
import { useT } from '../../i18n';
import { Page, PageHeader, useWakeLock } from '../../components/ui';
import { BlockView } from '../../components/Blocks';
import { db, getSetting, setSetting, getSheet } from '../../lib/db';
import { useChild, useChildId } from '../../lib/hooks';
import { loadBook, meta, partColor, type Book } from '../../lib/content';
import { CONDITIONS, ROLES, TEAM_SRC, section, type Src } from '../../lib/care';
import { toParts, picFor } from '../../lib/careSteps';
import { cx, fmtDate, fmtDur, fmtTime } from '../../lib/util';
import { ct } from '../../lib/careText';

function useBook() {
  const { lang } = useT();
  const [book, setBook] = useState<Book | null>(null);
  useEffect(() => { let live = true; loadBook(lang).then((b) => live && setBook(b)); return () => { live = false; }; }, [lang]);
  return book;
}
/** The book's own words for these sections. */
export function FromBook({ src }: { src: Src[] }) {
  const { lang } = useT();
  const book = useBook();
  if (!book) return null;
  return (
    <div className="grid gap-4">
      {src.map((s) => {
        const blocks = section(book, s);
        const col = partColor(book.chapters.find((c) => c.id === s.c)?.part ?? 2);
        return (
          <div key={s.c + s.h} className="card !rounded-3xl p-4 prose-read care-book" style={{ ['--pc' as string]: col.c, ['--pt' as string]: col.t }}>
            {blocks.map(({ b, i, c }) => <BlockView key={i} b={b} chapter={c} index={i} />)}
            <Link to={`/book/${s.c}?b=${blocks[0]?.i ?? 0}`} className="not-prose inline-flex items-center gap-1.5 text-sm font-bold text-[rgb(var(--accent))] mt-2 min-h-[40px]"><BookOpen size={16} aria-hidden /> {`${meta.chapterLabel[lang]} ${book.chapters.find((c) => c.id === s.c)?.n ?? ''}`}</Link>
          </div>
        );
      })}
    </div>
  );
}

/** One tap starts the clock; stop saves the episode. A note can be added straight after. */
function EpisodeTimer({ kind }: { kind: string }) {
  const { t, lang } = useT();
  const childId = useChildId();
  const [start, setStart] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  const [last, setLast] = useState<number>();
  const [note, setNote] = useState('');
  useWakeLock(!!start);
  useEffect(() => { if (!start) return; const h = setInterval(() => setNow(Date.now()), 250); return () => clearInterval(h); }, [start]);
  const list = useLiveQuery(() => db.episodes.where('childId').equals(childId).filter((e) => e.kind === kind).reverse().sortBy('start').then((l) => l.slice(0, 8)), [childId, kind]) ?? [];
  const stop = async () => {
    if (!start) return; const end = Date.now();
    const id = await db.episodes.add({ childId, kind, start, end, durationSec: Math.round((end - start) / 1000) });
    setStart(null); setLast(id); setNote('');
  };
  const noteNow = async () => { const at = Date.now(); setLast(await db.episodes.add({ childId, kind, start: at, end: at, durationSec: 0 })); setNote(''); };
  return (
    <section className="card !rounded-3xl p-4 grid gap-3">
      <div className="flex items-center gap-2"><Timer size={18} aria-hidden className="text-muted" /><h2 className="font-extrabold flex-1">{t('episodeTimer')}</h2></div>
      {start ? (
        <div className="flex items-center gap-3">
          <p className="flex-1 text-5xl font-extrabold tabular-nums" role="timer" aria-label={t('elapsed')}>{fmtDur((now - start) / 1000)}</p>
          <button className="btn-danger !min-h-[60px] !px-6" onClick={stop}><Square size={18} fill="currentColor" aria-hidden /> {t('stopShort')}</button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2.5">
          <button className="btn-primary !min-h-[56px]" onClick={() => { setStart(Date.now()); setNow(Date.now()); setLast(undefined); }}><Play size={18} fill="currentColor" aria-hidden /> {t('startTimer')}</button>
          <button className="btn-outline !min-h-[56px]" onClick={noteNow}><PenLine size={18} aria-hidden /> {t('noteItNow')}</button>
        </div>
      )}
      {last !== undefined && !start && (
        <div className="grid gap-2 anim-in">
          <p className="text-sm font-bold text-[var(--p2)]" role="status">✓ {t('stoppedSaved')}</p>
          <label className="block"><span className="label">{t('whatHappened')}</span>
            <textarea className="input min-h-[80px]" value={note} onChange={(e) => { setNote(e.target.value); void db.episodes.update(last, { note: e.target.value }); }} /></label>
        </div>
      )}
      {list.length > 0 && (
        <ul className="divide-y divide-line/60 -mx-1">
          {list.map((e) => (
            <li key={e.id} className="flex items-center gap-2 py-2 px-1">
              <span className="flex-1 min-w-0"><b className="block text-sm">{fmtDate(e.start, lang, { day: 'numeric', month: 'short' })} · {fmtTime(e.start, lang)}</b>{e.note && <span className="block text-sm text-muted line-clamp-2">{e.note}</span>}</span>
              {e.durationSec > 0 && <span className="chip !min-h-[30px] tabular-nums">{fmtDur(e.durationSec)}</span>}
              <button className="icon-btn !w-10 !h-10 text-muted" aria-label={t('delete')} onClick={() => db.episodes.delete(e.id!)}><Trash2 size={16} /></button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/** Your own team's instructions for this child, written down so everyone at home follows the same plan. */
function TeamPlan({ kind }: { kind: string }) {
  const { t } = useT();
  const child = useChild();
  const childId = useChildId();
  const key = `carePlan:${childId}:${kind}`;
  const [v, setV] = useState('');
  const loaded = useRef('');
  useEffect(() => { getSetting(key, '').then((x) => { setV(x); loaded.current = key; }); }, [key]);
  return (
    <section className="grid gap-2">
      <p className="text-sm text-muted">{t('ourTeamPlanHint')}</p>
      <textarea className="input min-h-[110px]" aria-label={t('ourTeamPlan', { name: child?.name ?? '' })} value={v} onChange={(e) => { setV(e.target.value); if (loaded.current === key) void setSetting(key, e.target.value); }} />
    </section>
  );
}

function WhoHelps({ roles }: { roles: string[] }) {
  const { t, lang } = useT();
  const childId = useChildId();
  const contact = useLiveQuery(async () => String(((await getSheet(childId, 'emergency')) as Record<string, unknown>).contact ?? ''), [childId]);
  return (
    <section className="grid gap-3">
      <ul className="flex flex-wrap gap-2">{roles.map((r) => <li key={r} className="chip">{ROLES[r][lang]}</li>)}</ul>
      <Link to="/notebook/emergency" className="flex items-center gap-3 rounded-2xl bg-surface2 p-3 min-h-[56px]">
        <span className="flex-1 min-w-0"><span className="block text-xs font-bold text-muted">{t('mainContact')}</span><b className="block truncate">{contact || t('addMainContact')}</b></span><ChevronRight size={18} aria-hidden />
      </Link>
    </section>
  );
}

/** Folded section: the extras stay out of the way until needed. */
function Fold({ title, icon, children, open = false }: { title: string; icon: string; children: React.ReactNode; open?: boolean }) {
  return (
    <details className="card !rounded-3xl group" open={open}>
      <summary className="list-none flex items-center gap-3 p-4 min-h-[60px] cursor-pointer select-none">
        <span className="text-2xl" aria-hidden>{icon}</span><b className="flex-1">{title}</b>
        <ChevronRight size={18} aria-hidden className="text-muted transition-transform group-open:rotate-90" />
      </summary>
      <div className="px-4 pb-4">{children}</div>
    </details>
  );
}

/** The book's steps, one at a time, each with a picture. */
function StepCards({ src, kind }: { src: Src[]; kind: string }) {
  const { t, lang } = useT();
  const book = useBook();
  const [en, setEn] = useState<Book | null>(null);
  const [i, setI] = useState(0);
  const [dx, setDx] = useState(0);
  const sw = useRef<{ x: number; y: number; on: boolean } | null>(null);
  useEffect(() => { loadBook('en').then(setEn); }, []);
  useEffect(() => setI(0), [kind, lang]);
  if (!book || !en) return null;
  const parts = toParts(book, src); const enParts = toParts(en, src);
  const n = parts.steps.length; if (!n) return null;
  const k = Math.min(i, n - 1); const st = parts.steps[k];
  const pic = picFor(enParts.steps[k]?.html ?? '');
  // Swipe left for the next step, right for the previous one; vertical scrolling still works.
  const go = (d: number) => { const j = Math.max(0, Math.min(n - 1, k + d)); if (j !== k) { setI(j); try { navigator.vibrate?.(10); } catch { /* */ } } };
  const touch = {
    onTouchStart: (e: React.TouchEvent) => { const p = e.touches[0]; sw.current = { x: p.clientX, y: p.clientY, on: false }; },
    onTouchMove: (e: React.TouchEvent) => {
      const s0 = sw.current; if (!s0) return; const p = e.touches[0]; const ddx = p.clientX - s0.x, ddy = p.clientY - s0.y;
      if (!s0.on && Math.abs(ddx) > 12 && Math.abs(ddx) > Math.abs(ddy) * 1.3) s0.on = true;
      if (s0.on) setDx(ddx * ((k === 0 && ddx > 0) || (k === n - 1 && ddx < 0) ? 0.3 : 1));
    },
    onTouchEnd: () => { const s0 = sw.current; sw.current = null; if (s0?.on && Math.abs(dx) > 60) go(dx < 0 ? 1 : -1); setDx(0); },
    // The phone may take over the touch (scrolling, a system gesture): always settle back.
    onTouchCancel: () => { sw.current = null; setDx(0); },
  };
  const slide = { transform: dx ? `translateX(${dx}px)` : undefined, opacity: dx ? Math.max(0.35, 1 - Math.abs(dx) / 400) : 1, transition: dx ? 'none' : 'transform .3s var(--ease), opacity .3s' };
  return (
    <section {...touch} className="card !rounded-3xl p-5 flex flex-col items-center text-center gap-3 overflow-hidden touch-pan-y select-none" aria-roledescription="carousel">
      <p className="text-xs font-bold text-muted uppercase tracking-wide">{t('stepOf', { n: k + 1, all: n })}</p>
      <div className="w-full flex flex-col items-center gap-3" style={slide}>
        <span key={k} className="anim-zoom w-28 h-28 rounded-full bg-soft flex items-center justify-center text-[3.6rem]" aria-hidden>{pic}</span>
        {st.head && <p className="text-sm font-bold text-[rgb(var(--accent))]">{st.head}</p>}
        <div key={'t' + k} className="anim-in text-lg leading-relaxed min-h-[5.5rem] prose-step" dangerouslySetInnerHTML={{ __html: st.html }} />
      </div>
      <div className="flex gap-1.5 flex-wrap justify-center" aria-hidden>{parts.steps.map((_, j) => <span key={j} className={cx('h-2 rounded-full transition-all', j === k ? 'w-6 bg-[rgb(var(--accent))]' : 'w-2 bg-line')} />)}</div>
      <div className="grid grid-cols-2 gap-2.5 w-full mt-1">
        <button className="btn-outline !min-h-[56px]" disabled={k === 0} onClick={() => go(-1)}>← {t('back')}</button>
        {k < n - 1 ? <button className="btn-primary !min-h-[56px]" onClick={() => go(1)}>{t('next')} →</button>
          : <button className="btn-primary !min-h-[56px]" onClick={() => setI(0)}>✓ {t('done')}</button>}
      </div>
    </section>
  );
}
function BookBits({ src, pick }: { src: Src[]; pick: 'why' | 'ask' | 'urgent' }) {
  const book = useBook();
  if (!book) return null;
  const list = toParts(book, src)[pick];
  return <>{list.map((h, j) => <div key={j} className="prose-step text-base leading-relaxed [&_li]:mb-1.5" dangerouslySetInnerHTML={{ __html: h }} />)}</>;
}
function useHas(src: Src[], pick: 'why' | 'ask' | 'urgent') { const book = useBook(); return !!book && toParts(book, src)[pick].length > 0; }

export function CareGuide() {
  const { t, lang } = useT();
  const childId = useChildId();
  const recent = useLiveQuery(() => db.episodes.where('childId').equals(childId).reverse().sortBy('start').then((l) => l.slice(0, 3)), [childId]) ?? [];
  return (
    <Page>
      <PageHeader title={t('careGuide')} />
      <p className="text-muted mb-4">{t('careGuideShort')}</p>
      <div className="grid grid-cols-2 gap-2.5 mb-3">
        {CONDITIONS.filter((c) => c.emergency).map((c) => (
          <Link key={c.id} to={c.to ?? `/care/${c.id}`} className={cx('tile min-h-[110px] flex flex-col justify-between', c.tile)}>
            <span className="relative z-[1] text-4xl" aria-hidden>{c.e}</span><b className="relative z-[1] leading-tight">{c.name[lang]}</b>
          </Link>
        ))}
      </div>
      <a href="tel:108" className="btn-danger w-full !min-h-[56px] mb-6"><Phone size={18} aria-hidden /> {t('call108')}</a>
      <h2 className="font-extrabold mb-2">{t('whatIsHappening')}</h2>
      <div className="grid grid-cols-2 gap-2.5 mb-6">
        {CONDITIONS.filter((c) => !c.emergency).map((c) => (
          <Link key={c.id} to={`/care/${c.id}`} className="card !rounded-3xl p-4 min-h-[118px] flex flex-col gap-2 active:scale-[0.98] transition">
            <span className={cx('w-12 h-12 rounded-2xl flex items-center justify-center text-2xl', c.tile)} aria-hidden>{c.e}</span>
            <b className="leading-snug text-[0.95rem]">{c.name[lang]}</b>
          </Link>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-2 mb-6">
        {([['/care/plan', '🧩', 'carePlan', 't-blue'], ['/therapy', '🎯', 'therapy', 't-green'], ['/help', '🤝', 'help', 't-amber']] as const).map(([to, e, k, c]) => (
          <Link key={to} to={to} className={cx('tile !p-3 min-h-[96px] flex flex-col justify-between', c)}>
            <span className="relative z-[1] text-2xl" aria-hidden>{e}</span><b className="relative z-[1] text-sm leading-tight">{ct(lang, k)}</b>
          </Link>
        ))}
      </div>
      {recent.length > 0 && (
        <section className="mb-6">
          <h2 className="font-extrabold mb-2">{t('recentEpisodes')}</h2>
          <ul className="card divide-y divide-line/60">{recent.map((e) => { const c = CONDITIONS.find((x) => x.id === e.kind); return (
            <li key={e.id}><Link to={`/care/${e.kind}`} className="flex items-center gap-3 p-3 min-h-[56px]"><span aria-hidden className="text-xl">{c?.e}</span><span className="flex-1 min-w-0"><b className="block text-sm truncate">{c?.name[lang]}</b><span className="text-xs text-muted">{fmtDate(e.start, lang, { day: 'numeric', month: 'short' })} · {fmtTime(e.start, lang)}</span></span>{e.durationSec > 0 && <span className="chip !min-h-[30px] tabular-nums">{fmtDur(e.durationSec)}</span>}</Link></li>
          ); })}</ul>
        </section>
      )}
      <div className="mb-6"><Fold title={t('workingTogether')} icon="👥"><FromBook src={TEAM_SRC} /><Link to="/notebook/emergency" className="btn-outline w-full mt-3"><NotebookPen size={18} aria-hidden /> {t('emergencyCard')}</Link></Fold></div>
      <p className="text-xs text-muted">{meta.disclaimer[lang]}</p>
    </Page>
  );
}

export function CareDetail() {
  const { t, lang } = useT();
  const { id } = useParams();
  const nav = useNavigate();
  const child = useChild();
  const c = CONDITIONS.find((x) => x.id === id);
  useEffect(() => { if (c?.to) nav(c.to, { replace: true }); }, [c, nav]);
  const src = c?.src ?? [];
  const urgent = useHas(src, 'urgent'); const why = useHas(src, 'why'); const ask = useHas(src, 'ask');
  if (!c) return <Page><PageHeader title={t('careGuide')} /></Page>;
  return (
    <Page>
      <PageHeader title={c.name[lang]} />
      <div className="grid gap-4">
        {(urgent || c.emergency) && (
          <section className="rounded-3xl p-4 border-2 border-[var(--ur)] bg-[var(--urt)] grid gap-3">
            <p className="font-extrabold flex items-center gap-2 text-lg"><span className="text-2xl" aria-hidden>🚑</span>{t('getHelpNow')}</p>
            <BookBits src={src} pick="urgent" />
            <a href="tel:108" className="btn-danger w-full !min-h-[56px]"><Phone size={18} aria-hidden /> {t('call108')}</a>
          </section>
        )}
        {c.nearest && <p className="text-sm rounded-2xl bg-soft p-3">{t('nearestTopic')}</p>}
        <StepCards src={src} kind={c.id} />
        <EpisodeTimer kind={c.id} />
        {why && <Fold title={t('whyItMatters')} icon="💡"><BookBits src={src} pick="why" /></Fold>}
        {ask && <Fold title={t('askYourTeam')} icon="❓"><BookBits src={src} pick="ask" /></Fold>}
        <Fold title={t('ourTeamPlan', { name: child?.name ?? '' })} icon="📝"><TeamPlan kind={c.id} /></Fold>
        <Fold title={t('whoHelps')} icon="👩‍⚕️"><WhoHelps roles={c.roles} /></Fold>
        <Fold title={t('readInBook')} icon="📖"><FromBook src={src} /></Fold>
        <p className="text-xs text-muted">{meta.disclaimer[lang]}</p>
      </div>
    </Page>
  );
}
