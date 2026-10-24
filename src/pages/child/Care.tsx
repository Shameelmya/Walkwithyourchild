import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { Phone, Play, Square, ChevronRight, Users, NotebookPen, Timer, PenLine, Trash2, BookOpen } from 'lucide-react';
import { useT } from '../../i18n';
import { Page, PageHeader, useWakeLock } from '../../components/ui';
import { BlockView } from '../../components/Blocks';
import { db, getSetting, setSetting, getSheet } from '../../lib/db';
import { useChild, useChildId } from '../../lib/hooks';
import { loadBook, meta, partColor, type Book } from '../../lib/content';
import { CONDITIONS, ROLES, TEAM_SRC, section, type Src } from '../../lib/care';
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
    <section className="card !rounded-3xl p-4 grid gap-2">
      <h2 className="font-extrabold">{t('ourTeamPlan', { name: child?.name ?? '' })}</h2>
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
    <section className="card !rounded-3xl p-4 grid gap-3">
      <div className="flex items-center gap-2"><Users size={18} aria-hidden className="text-muted" /><h2 className="font-extrabold">{t('whoHelps')}</h2></div>
      <ul className="flex flex-wrap gap-2">{roles.map((r) => <li key={r} className="chip">{ROLES[r][lang]}</li>)}</ul>
      <Link to="/notebook/emergency" className="flex items-center gap-3 rounded-2xl bg-surface2 p-3 min-h-[56px]">
        <span className="flex-1 min-w-0"><span className="block text-xs font-bold text-muted">{t('mainContact')}</span><b className="block truncate">{contact || t('addMainContact')}</b></span><ChevronRight size={18} aria-hidden />
      </Link>
    </section>
  );
}

export function CareGuide() {
  const { t, lang } = useT();
  const childId = useChildId();
  const recent = useLiveQuery(() => db.episodes.where('childId').equals(childId).reverse().sortBy('start').then((l) => l.slice(0, 5)), [childId]) ?? [];
  return (
    <Page>
      <PageHeader title={t('careGuide')} />
      <p className="text-sm text-muted mb-4">{t('careGuideIntro')}</p>
      <div className="grid grid-cols-2 gap-2.5 mb-3">
        {CONDITIONS.filter((c) => c.emergency).map((c) => (
          <Link key={c.id} to={c.to ?? `/care/${c.id}`} className={cx('tile min-h-[104px] flex flex-col justify-between', c.tile)}>
            <span className="relative z-[1] text-3xl" aria-hidden>{c.e}</span><b className="relative z-[1] leading-tight">{c.name[lang]}</b>
          </Link>
        ))}
      </div>
      <a href="tel:108" className="btn-danger w-full !min-h-[56px] mb-6"><Phone size={18} aria-hidden /> {t('call108')}</a>
      <div className="grid gap-2.5 mb-5">
        {([['/care/plan', '🧩', 'carePlan', 'carePlanSub', 't-blue'], ['/therapy', '🎯', 'therapy', 'therapySub', 't-green'], ['/help', '🤝', 'help', 'helpSub', 't-amber']] as const).map(([to, e, k, s2, c]) => (
          <Link key={to} to={to} className={cx('tile !p-4 flex items-center gap-3', c)}>
            <span className="relative z-[1] w-12 h-12 rounded-2xl bg-white/25 flex items-center justify-center text-2xl shrink-0" aria-hidden>{e}</span>
            <span className="relative z-[1] flex-1 min-w-0"><b className="block">{ct(lang, k)}</b><span className="text-sm opacity-90">{ct(lang, s2)}</span></span>
            <ChevronRight className="relative z-[1]" aria-hidden />
          </Link>
        ))}
      </div>
      <ul className="card divide-y divide-line/60 mb-6">
        {CONDITIONS.filter((c) => !c.emergency).map((c) => (
          <li key={c.id}><Link to={`/care/${c.id}`} className="flex items-center gap-3 p-3 min-h-[64px]">
            <span className={cx('w-11 h-11 rounded-2xl flex items-center justify-center text-2xl shrink-0', c.tile)} aria-hidden>{c.e}</span>
            <b className="flex-1 min-w-0 leading-snug">{c.name[lang]}</b><ChevronRight size={18} aria-hidden className="text-muted shrink-0" />
          </Link></li>
        ))}
      </ul>
      {recent.length > 0 && (
        <section className="mb-6">
          <h2 className="font-extrabold mb-2">{t('recentEpisodes')}</h2>
          <ul className="card divide-y divide-line/60">{recent.map((e) => { const c = CONDITIONS.find((x) => x.id === e.kind); return (
            <li key={e.id}><Link to={`/care/${e.kind}`} className="flex items-center gap-3 p-3 min-h-[56px]"><span aria-hidden className="text-xl">{c?.e}</span><span className="flex-1 min-w-0"><b className="block text-sm truncate">{c?.name[lang]}</b><span className="text-xs text-muted">{fmtDate(e.start, lang, { day: 'numeric', month: 'short' })} · {fmtTime(e.start, lang)}</span></span>{e.durationSec > 0 && <span className="chip !min-h-[30px] tabular-nums">{fmtDur(e.durationSec)}</span>}</Link></li>
          ); })}</ul>
        </section>
      )}
      <section className="mb-6">
        <div className="flex items-center gap-2 mb-2"><Users size={18} aria-hidden className="text-muted" /><h2 className="font-extrabold">{t('workingTogether')}</h2></div>
        <FromBook src={TEAM_SRC} />
        <Link to="/notebook/emergency" className="btn-outline w-full mt-3"><NotebookPen size={18} aria-hidden /> {t('emergencyCard')}</Link>
      </section>
      <p className="text-xs text-muted">{meta.disclaimer[lang]}</p>
    </Page>
  );
}

export function CareDetail() {
  const { t, lang } = useT();
  const { id } = useParams();
  const nav = useNavigate();
  const c = CONDITIONS.find((x) => x.id === id);
  useEffect(() => { if (c?.to) nav(c.to, { replace: true }); }, [c, nav]);
  if (!c) return <Page><PageHeader title={t('careGuide')} /></Page>;
  return (
    <Page>
      <PageHeader title={c.name[lang]} />
      {c.emergency && <a href="tel:108" className="btn-danger w-full !min-h-[60px] mb-4 text-lg"><Phone aria-hidden /> {t('call108')}</a>}
      <div className="grid gap-4">
        <EpisodeTimer kind={c.id} />
        <section>
          <h2 className="font-extrabold mb-2">{t('whatToDoBook')}</h2>
          {c.nearest && <p className="text-sm rounded-2xl bg-soft p-3 mb-3">{t('nearestTopic')}</p>}
          <FromBook src={c.src} />
        </section>
        <TeamPlan kind={c.id} />
        <WhoHelps roles={c.roles} />
        <p className="text-xs text-muted">{meta.disclaimer[lang]}</p>
      </div>
    </Page>
  );
}
