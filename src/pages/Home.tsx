import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { Activity, BookOpen, NotebookPen, MessageSquareHeart, Pill, Stethoscope, CloudUpload, ChevronRight, Check } from 'lucide-react';
import { useT } from '../i18n';
import { Avatar, Page } from '../components/ui';
import { PathMotif } from '../components/Path';
import { useChild, useChildId } from '../lib/hooks';
import { db, getSetting } from '../lib/db';
import { todaySlots } from '../lib/meds';
import { getReading, journeyPct } from '../lib/reading';
import { loc, meta, toc } from '../lib/content';
import { fmtDate, isoDate, cx } from '../lib/util';

export default function Home() {
  const { t, lang } = useT();
  const child = useChild();
  const childId = useChildId();
  const slots = useLiveQuery(() => (childId ? todaySlots(childId) : []), [childId]) ?? [];
  const visit = useLiveQuery(() => db.visits.where('date').aboveOrEqual(isoDate()).filter((v) => v.childId === childId && !v.done).sortBy('date').then((v) => v[0]), [childId]);
  const reading = useLiveQuery(() => getReading(), []);
  const lastBackup = useLiveQuery(() => getSetting<number>('lastBackup', 0), []);
  const hasData = useLiveQuery(async () => (await db.notebook.count()) + (await db.medicines.count()) + (await db.seizures.count()) > 0, []);
  const h = new Date().getHours();
  const greet = t(h < 12 ? 'goodMorning' : h < 17 ? 'goodAfternoon' : 'goodEvening');
  const pct = journeyPct(reading);
  const curPart = toc.toc.find((c) => c.id === reading?.chapter)?.part;
  const ch = toc.toc.find((c) => c.id === (reading?.chapter ?? 'c0'));
  const backupDue = hasData && (!lastBackup || Date.now() - lastBackup > 30 * 86400_000);
  const pending = slots.filter((s) => !s.log);
  const big = [
    { to: '/seizure', I: Activity, l: t('seizureBtn'), s: t('seizureBtnSub'), cls: 'bg-danger text-ondanger' },
    { to: `/book/${reading?.chapter ?? 'c0'}`, I: BookOpen, l: loc(meta.reader.continue, lang), s: ch ? loc(ch.title, lang) : '', cls: 'bg-[var(--p1)] text-white' },
    { to: '/notebook', I: NotebookPen, l: t('navNotebook'), s: t('notebookSub'), cls: 'bg-[var(--pi)] text-white' },
    { to: '/talk', I: MessageSquareHeart, l: t('navTalk'), s: t('talkSub'), cls: 'bg-[var(--p4)] text-white' },
  ];
  return (
    <Page wide>
      <section className="pt-5 pb-4 flex items-center gap-4">
        <Avatar blobId={child?.photoBlobId} name={child?.name} size={64} />
        <div className="min-w-0">
          <p className="text-muted font-semibold">{greet}</p>
          <h1 className="text-3xl font-extrabold truncate">{child?.name ?? ''}</h1>
          <p className="text-muted text-sm">{meta.appTitle[lang]}</p>
        </div>
      </section>

      {backupDue && (
        <Link to="/settings#backup" className="card flex items-center gap-3 p-4 mb-4 bg-soft border-accent/30">
          <CloudUpload className="text-accent shrink-0" aria-hidden />
          <span className="flex-1"><b>{t('backupReminder')}</b><br /><span className="text-sm text-muted">{lastBackup ? t('lastBackupOn', { date: fmtDate(lastBackup, lang) }) : t('neverBackedUp')}</span></span>
          <ChevronRight aria-hidden />
        </Link>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {big.map(({ to, I, l, s, cls }) => (
          <Link key={to} to={to} className={cx('rounded-3xl p-4 min-h-[128px] min-w-0 overflow-hidden flex flex-col justify-between shadow-card active:scale-[0.98] transition', cls)}>
            <I size={32} aria-hidden />
            <span><span className="block text-lg font-extrabold leading-tight">{l}</span><span className="text-sm opacity-90 line-clamp-2 break-words">{s}</span></span>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mb-6">
        <Link to="/medicines" className="card p-4 block">
          <div className="flex items-center gap-2 mb-2"><Pill className="text-[var(--p1)]" aria-hidden /><h2 className="font-extrabold text-lg flex-1">{t('medsToday')}</h2><ChevronRight aria-hidden /></div>
          {slots.length === 0 ? <p className="text-muted">{t('noMedsToday')}</p> : (
            <>
              <p className="text-sm text-muted mb-2">{t('medsGivenOf', { done: slots.length - pending.length, all: slots.length })}</p>
              <ul className="grid gap-1">
                {slots.slice(0, 5).map((s) => (
                  <li key={`${s.med.id}-${s.time}`} className="flex items-center gap-2">
                    <span className={cx('w-6 h-6 rounded-full flex items-center justify-center', s.log ? 'bg-[var(--p2)] text-white' : 'border-2 border-line')}>{s.log && <Check size={14} />}</span>
                    <span className="font-bold w-14">{s.time}</span><span className="truncate">{s.med.name} · {s.med.dose}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Link>
        <Link to="/visits" className="card p-4 block">
          <div className="flex items-center gap-2 mb-2"><Stethoscope className="text-[var(--p5)]" aria-hidden /><h2 className="font-extrabold text-lg flex-1">{t('nextVisit')}</h2><ChevronRight aria-hidden /></div>
          {visit ? (<><p className="text-xl font-extrabold">{fmtDate(visit.date, lang, { weekday: 'long', day: 'numeric', month: 'long' })}{visit.time ? ` · ${visit.time}` : ''}</p><p className="text-muted">{[visit.doctor, visit.hospital].filter(Boolean).join(' · ')}</p></>) : <p className="text-muted">{t('noVisits')}</p>}
        </Link>
      </div>

      <section className="card p-4 mb-6">
        <div className="flex items-baseline justify-between gap-2"><h2 className="font-extrabold text-lg">{t('journey')}</h2><span className="text-sm text-muted">{Math.round(pct * 100)}%</span></div>
        <p className="text-sm text-muted">{t('journeySub')}</p>
        <div className="max-w-2xl mx-auto"><Link to="/book" aria-label={t('openContents')}><PathMotif filled={pct} active={curPart} height={110} labels={toc.parts.map((p) => loc(p.title, lang))} /></Link>
        <div className="grid grid-cols-5 gap-1 text-[0.7rem] text-center text-muted leading-tight">{toc.parts.map((p) => <span key={p.n} style={{ color: `var(--p${p.n})` }} className="font-bold line-clamp-3">{loc(p.title, lang)}</span>)}</div></div>
      </section>
    </Page>
  );
}
