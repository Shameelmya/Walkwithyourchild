import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { Activity, NotebookPen, MessageSquareHeart, Pill, Stethoscope, CloudUpload, ChevronRight, Check, Gamepad2, Wind, Phone, BookOpen, ArrowRight, HelpCircle } from 'lucide-react';
import { useT } from '../i18n';
import { Page } from '../components/ui';
import { PathMotif } from '../components/Path';
import { useChild, useChildId } from '../lib/hooks';
import { db, getSetting, getSheet } from '../lib/db';
import { logDose, todaySlots } from '../lib/meds';
import { chapterPct, getReading, journeyPct } from '../lib/reading';
import { loc, meta, toc } from '../lib/content';
import { addDays, fmtDate, isoDate, cx, hhmm } from '../lib/util';

export default function Home() {
  const { t, lang } = useT();
  const child = useChild();
  const childId = useChildId();
  const slots = useLiveQuery(() => (childId ? todaySlots(childId) : []), [childId]) ?? [];
  const visit = useLiveQuery(() => db.visits.where('date').aboveOrEqual(isoDate()).filter((v) => v.childId === childId && !v.done).sortBy('date').then((v) => v[0]), [childId]);
  const openQs = useLiveQuery(async () => (((await getSheet(childId, 'questions')).rows as Record<string, string>[]) ?? []).filter((r) => r.question && !r.answer).length, [childId]) ?? 0;
  const reading = useLiveQuery(() => getReading(), []);
  const lastBackup = useLiveQuery(() => getSetting<number>('lastBackup', 0), []);
  const hasData = useLiveQuery(async () => (await db.notebook.count()) + (await db.medicines.count()) + (await db.seizures.count()) > 0, []);
  const h = new Date().getHours();
  const greet = t(h < 12 ? 'goodMorning' : h < 17 ? 'goodAfternoon' : 'goodEvening');
  const pct = journeyPct(reading);
  const chId = reading?.chapter ?? 'c0';
  const ch = toc.toc.find((c) => c.id === chId)!;
  const part = toc.parts.find((p) => p.n === ch.part);
  const g = ch.part >= 1 && ch.part <= 5 ? ch.part : 'i';
  const cpct = Math.round(chapterPct(reading, chId) * 100);
  const backupDue = hasData && (!lastBackup || Date.now() - lastBackup > 30 * 86400_000);
  const done = slots.filter((s) => s.log).length;
  const now = hhmm();
  const week = Array.from({ length: 7 }, (_, i) => addDays(new Date(), i - 3));
  const quick = [
    { to: '/seizure', I: Activity, l: t('seizureBtn'), s: t('seizureBtnSub'), cls: 'grad-r' },
    { to: '/talk', I: MessageSquareHeart, l: t('navTalk'), s: t('talkSub'), cls: 'grad-4' },
    { to: '/play', I: Gamepad2, l: t('navPlay'), s: t('playSub'), cls: 'grad-2' },
    { to: '/medicines', I: Pill, l: t('navMedicines'), s: slots.length ? t('medsGivenOf', { done, all: slots.length }) : t('medsSub'), cls: 'grad-1' },
    { to: '/notebook', I: NotebookPen, l: t('navNotebook'), s: t('notebookSub'), cls: 'grad-i' },
    { to: '/me', I: Wind, l: t('navForMe'), s: t('forMeShort'), cls: 'grad-3' },
  ];
  return (
    <Page wide>
      <section className="pt-1 pb-5">
        <p className="eyebrow">{greet}{child?.name ? ` · ${child.name}` : ''}</p>
        <h1 className="font-display text-[1.9rem] sm:text-4xl font-bold leading-tight tracking-tight mt-1 max-w-xl">{t('homeHeadline')}</h1>
      </section>

      {backupDue && (
        <Link to="/settings#backup" className="card flex items-center gap-3 p-4 mb-5 !bg-soft border-transparent">
          <span className="w-11 h-11 rounded-2xl grad-a text-white flex items-center justify-center shrink-0"><CloudUpload size={20} aria-hidden /></span>
          <span className="flex-1 min-w-0"><b className="block">{t('backupReminder')}</b><span className="text-sm text-muted">{lastBackup ? t('lastBackupOn', { date: fmtDate(lastBackup, lang) }) : t('neverBackedUp')}</span></span>
          <ChevronRight aria-hidden />
        </Link>
      )}

      <div className="grid lg:grid-cols-[1.35fr_1fr] gap-4 mb-7">
        <Link to={`/book/${chId}`} className={cx('tile !p-5 sm:!p-6 flex gap-4 min-h-[190px]', `grad-${g}`)}>
          <div className="flex-1 min-w-0 flex flex-col relative z-[1]">
            <p className="text-[0.78rem] font-bold opacity-90">{loc(meta.reader.continue, lang)}{part ? ` · ${meta.partLabel[lang]} ${part.n}` : ''}</p>
            <p className="font-display text-2xl font-bold leading-snug mt-1 line-clamp-3">{loc(ch.title, lang)}</p>
            <div className="mt-auto pt-4">
              <div className="flex justify-between text-xs font-bold opacity-90 mb-1.5"><span>{t('chapterProgress')}</span><span>{cpct}%</span></div>
              <div className="h-2 rounded-full bg-white/25 overflow-hidden"><div className="h-full rounded-full bg-white" style={{ width: `${Math.max(4, cpct)}%` }} /></div>
              <span className="inline-flex items-center gap-2 mt-4 bg-white text-[#2a231d] rounded-2xl px-4 min-h-[44px] font-extrabold text-sm">{t('readNow')} <ArrowRight size={16} aria-hidden /></span>
            </div>
          </div>
          <div aria-hidden className="flex w-[96px] sm:w-[118px] shrink-0 self-center relative z-[1]">
            <div className="w-full aspect-[3/4.3] rounded-r-xl rounded-l-md bg-white/95 shadow-lift rotate-[4deg] p-2.5 flex flex-col border-l-[6px] border-black/20">
              <BookOpen size={18} className="text-[#2a231d]/70" />
              <p className="font-display text-[0.62rem] leading-tight font-bold text-[#2a231d] mt-2 line-clamp-4">{meta.appTitle[lang]}</p>
              <div className="mt-auto"><PathMotif height={22} filled={pct} /></div>
            </div>
          </div>
        </Link>
        <section className="card p-5 flex flex-col">
          <div className="flex items-center justify-between gap-2"><h2 className="font-extrabold text-lg">{t('journey')}</h2><span className="chip chip-on !min-h-[30px] !px-3 text-xs">{Math.round(pct * 100)}%</span></div>
          <p className="text-sm text-muted">{t('journeySub')}</p>
          <Link to="/book" aria-label={t('openContents')} className="block mt-auto"><PathMotif filled={pct} active={ch.part} height={92} labels={toc.parts.map((p) => loc(p.title, lang))} /></Link>
        </section>
      </div>

      <section className="mb-7">
        <h2 className="text-lg font-extrabold tracking-tight mb-3">{t('quickHelp')}</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {quick.map(({ to, I, l, s, cls }) => (
            <Link key={to} to={to} className={cx('tile min-h-[142px] flex flex-col justify-between', cls)}>
              <span className="glass relative z-[1]"><I size={22} aria-hidden /></span>
              <span className="relative z-[1]"><span className="block text-[1.05rem] font-extrabold leading-tight">{l}</span><span className="block text-[0.78rem] opacity-90 mt-0.5 line-clamp-2">{s}</span></span>
            </Link>
          ))}
        </div>
      </section>

      <div className="grid lg:grid-cols-2 gap-4 mb-7">
        <section className="card p-5">
          <div className="flex items-center justify-between mb-3"><h2 className="font-extrabold text-lg">{t('today')}</h2><Link to="/medicines" className="text-sm font-bold text-[rgb(var(--accent))] min-h-[40px] inline-flex items-center">{t('seeAll')}</Link></div>
          <div className="flex gap-1.5 mb-4" aria-hidden>
            {week.map((d) => { const on = isoDate(d) === isoDate(); return (
              <span key={+d} className={cx('flex-1 rounded-2xl py-2 flex flex-col items-center text-xs font-bold', on ? 'grad-a text-white shadow-lift' : 'bg-surface2 text-muted')}>
                <span>{d.toLocaleDateString(`${lang}-IN`, { weekday: 'narrow' })}</span><span className="text-base font-extrabold">{d.getDate()}</span>
              </span>); })}
          </div>
          {slots.length === 0 ? <p className="text-muted text-sm">{t('noMedsToday')}</p> : (
            <ol className="relative grid gap-2 before:absolute before:left-[27px] before:top-3 before:bottom-3 before:w-0.5 before:bg-line">
              {slots.slice(0, 5).map((s) => (
                <li key={`${s.med.id}-${s.time}`} className="relative flex items-center gap-3">
                  <span className={cx('relative z-[1] w-14 shrink-0 text-center text-xs font-extrabold rounded-xl py-1.5', s.log ? 'bg-[var(--p2t)] text-[var(--p2)]' : s.time <= now ? 'bg-soft text-[rgb(var(--accent))]' : 'bg-surface2 text-muted')}>{s.time}</span>
                  <span className="flex-1 min-w-0"><b className="block truncate">{s.med.name}</b><span className="text-xs text-muted">{s.med.dose}</span></span>
                  {s.log ? <span className="w-10 h-10 rounded-full bg-[var(--p2)] text-white flex items-center justify-center" aria-label={t(s.log.status)}><Check size={18} /></span>
                    : <button className="chip !min-h-[40px]" onClick={() => logDose(childId, s.med.id!, s.time, 'given')}>{t('given')}</button>}
                </li>
              ))}
            </ol>
          )}
        </section>
        <div className="grid gap-4">
          <Link to="/visits" className="card p-5 flex gap-4 items-center">
            <span className="w-14 h-14 rounded-2xl grad-5 text-white flex flex-col items-center justify-center shrink-0 leading-none">
              {visit ? <><span className="text-[0.65rem] font-bold">{fmtDate(visit.date, lang, { month: 'short' })}</span><span className="text-xl font-extrabold">{visit.date.slice(8)}</span></> : <Stethoscope aria-hidden />}
            </span>
            <span className="flex-1 min-w-0"><span className="eyebrow block">{t('nextVisit')}</span>
              {visit ? <><b className="block truncate">{[visit.doctor, visit.hospital].filter(Boolean).join(' · ') || t('doctorVisit')}</b><span className="text-sm text-muted">{fmtDate(visit.date, lang, { weekday: 'long' })}{visit.time ? ` · ${visit.time}` : ''}</span></> : <b className="block">{t('noVisits')}</b>}
            </span>
            <ChevronRight aria-hidden className="text-muted" />
          </Link>
          <Link to="/notebook/questions" className="card p-5 flex gap-4 items-center">
            <span className="w-14 h-14 rounded-2xl grad-i text-white flex items-center justify-center shrink-0"><HelpCircle aria-hidden /></span>
            <span className="flex-1 min-w-0"><span className="eyebrow block">{t('questionsForDoctor')}</span><b>{openQs ? t('questionsToAsk', { n: openQs }) : t('noOpenQuestions')}</b></span>
            <ChevronRight aria-hidden className="text-muted" />
          </Link>
          <div className="grid grid-cols-2 gap-3">
            <a href="tel:108" className="card p-4 flex items-center gap-3"><span className="w-11 h-11 rounded-2xl grad-r text-white flex items-center justify-center shrink-0"><Phone size={19} aria-hidden /></span><span className="min-w-0"><b className="block text-lg leading-none">108</b><span className="text-xs text-muted line-clamp-1">{t('ambulance')}</span></span></a>
            <a href="tel:14416" className="card p-4 flex items-center gap-3"><span className="w-11 h-11 rounded-2xl grad-1 text-white flex items-center justify-center shrink-0"><Phone size={19} aria-hidden /></span><span className="min-w-0"><b className="block text-lg leading-none">14416</b><span className="text-xs text-muted line-clamp-1">Tele-MANAS</span></span></a>
          </div>
        </div>
      </div>
    </Page>
  );
}
