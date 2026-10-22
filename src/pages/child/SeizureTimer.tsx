import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, Video, Square, X, History, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { useT } from '../../i18n';
import { db, getSetting, putBlob } from '../../lib/db';
import { useChild, useChildId } from '../../lib/hooks';
import { useWakeLock, BottomBar } from '../../components/ui';
import { loadBook, toc, type Block } from '../../lib/content';
import { BlockView } from '../../components/Blocks';
import { alarm } from '../../lib/audio';
import { startRecording, type Rec } from '../../lib/media';
import { fmtDur, fmtDate, fmtTime } from '../../lib/util';
import { LangButton } from '../../components/LangButton';

export default function SeizureTimer() {
  const { t, lang } = useT();
  const nav = useNavigate();
  const child = useChild();
  const childId = useChildId();
  const [start] = useState(() => Date.now());
  const [now, setNow] = useState(Date.now());
  const [rescueMin, setRescueMin] = useState(5);
  const [alerted, setAlerted] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [rec, setRec] = useState<Rec | null>(null);
  const [videoId, setVideoId] = useState<number>();
  const [recErr, setRecErr] = useState('');
  const [aid, setAid] = useState<Block[]>([]);
  const preview = useRef<HTMLVideoElement>(null);
  const recRef = useRef<Rec | null>(null);
  useWakeLock(true);

  useEffect(() => { const h = setInterval(() => setNow(Date.now()), 250); return () => clearInterval(h); }, []);
  useEffect(() => { (async () => setRescueMin(child?.rescueMinutes ?? (await getSetting('defaultRescue', 5))))(); }, [child]);
  useEffect(() => { const a = toc.anchors.firstAid; loadBook(lang).then((b) => setAid(b.chapters.find((c) => c.id === a.c)?.blocks.slice(a.from, a.to + 1) ?? [])); }, [lang]);
  const sec = (now - start) / 1000;
  useEffect(() => {
    if (!alerted && sec >= rescueMin * 60) {
      setAlerted(true); setShowAlert(true);
      try { navigator.vibrate?.([600, 300, 600, 300, 600, 300, 1200]); } catch { /* */ }
      try { alarm(); } catch { /* */ }
    }
  }, [sec, rescueMin, alerted]);
  useEffect(() => () => { void recRef.current?.stop(); }, []);

  const startVideo = async () => {
    setRecErr('');
    try {
      const r = await startRecording('video', 120_000, async (b) => { setVideoId(await putBlob(b, childId, 'seizure-video')); setRec(null); recRef.current = null; });
      recRef.current = r; setRec(r);
      if (preview.current) { preview.current.srcObject = r.stream; void preview.current.play(); }
    } catch { setRecErr(t('cameraNotAvailable')); }
  };
  const stopVideo = async () => { const r = recRef.current; if (!r) return; recRef.current = null; setRec(null); const b = await r.stop(); const id = await putBlob(b, childId, 'seizure-video'); setVideoId(id); return id; };

  const stopped = async () => {
    const end = Date.now();
    let vid = videoId;
    if (recRef.current) vid = await stopVideo();
    const id = await db.seizures.add({ childId, start, end, durationSec: Math.round((end - start) / 1000), videoBlobId: vid, rescue: '' });
    nav(`/seizures?saved=${id}`, { replace: true });
  };
  const over = sec >= rescueMin * 60;
  const recent = useLiveQuery(() => db.seizures.where('childId').equals(childId).reverse().sortBy('start').then((l) => l.slice(0, 5)), [childId]) ?? [];
  const R = 112, C = 2 * Math.PI * R, frac = Math.min(1, sec / (rescueMin * 60));
  return (
    <main id="main" className={`min-h-screen flex flex-col transition-colors duration-700 ${over ? 'bg-[var(--urt)]' : 'bg-bg'}`}>
      <div className="flex items-center gap-2 px-3 pt-3">
        <button className="icon-chip" onClick={() => nav(-1)} aria-label={t('cancel')}><X size={20} /></button>
        <Link to="/seizures" className="icon-chip" aria-label={t('seizureHistory')}><History size={20} /></Link>
        <span className="flex-1" />
        <LangButton />
        <a href="tel:108" className="btn-danger !px-4"><Phone size={18} aria-hidden /> 108</a>
      </div>
      <section className="flex flex-col items-center px-4 pt-4">
        <p className="eyebrow">{t('seizureTimer')}</p>
        <div className="relative my-3" style={{ width: 260, height: 260 }}>
          <svg viewBox="0 0 260 260" className="absolute inset-0 -rotate-90" aria-hidden>
            <circle cx="130" cy="130" r={R} fill="none" stroke="rgb(var(--border))" strokeWidth="14" />
            <circle cx="130" cy="130" r={R} fill="none" stroke={over ? 'rgb(var(--danger))' : 'rgb(var(--accent))'} strokeWidth="14" strokeLinecap="round" strokeDasharray={`${frac * C} ${C}`} style={{ transition: 'stroke-dasharray 0.25s linear' }} />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="font-extrabold tabular-nums leading-none text-[4.2rem]" role="timer" aria-label={t('elapsed')}>{fmtDur(sec)}</p>
            <p className="text-sm text-muted mt-2">{t('rescueAt', { m: rescueMin })}</p>
          </div>
        </div>
      </section>
      <div className="px-4 pb-10 grid gap-4 max-w-xl w-full mx-auto">
        <div className="card !rounded-3xl p-4 border-2 !border-[var(--ur)]">
          <p className="text-lg font-extrabold">1. {t('aidSide')}</p>
          <p className="text-lg font-extrabold mt-1">2. {t('aidMouth')}</p>
        </div>
        {rec ? (
          <div className="rounded-3xl overflow-hidden bg-black relative"><video ref={preview} muted playsInline className="w-full max-h-56 object-cover" />
            <button className="btn-danger absolute bottom-2 left-1/2 -translate-x-1/2" onClick={stopVideo}><Square size={18} aria-hidden /> {t('stopVideo')}</button></div>
        ) : videoId ? <p className="text-center font-bold text-[var(--p2)]">{t('videoSaved')}</p> : (
          <button className="btn-outline" onClick={startVideo}><Video aria-hidden /> {t('recordVideo')}</button>
        )}
        {recErr && <p role="alert" className="text-danger text-center">{recErr}</p>}
        <details className="card !rounded-3xl p-4">
          <summary className="font-extrabold cursor-pointer min-h-[32px]">{t('firstAidFromBook')}</summary>
          <div className="prose-read mt-2" style={{ ['--pc' as string]: 'var(--p2)', ['--pt' as string]: 'var(--p2t)' }}>{aid.map((b, i) => <BlockView key={i} b={b} chapter="c5" index={toc.anchors.firstAid.from + i} />)}</div>
        </details>
        <section className="card !rounded-3xl p-4">
          <div className="flex items-center justify-between mb-2"><h2 className="font-extrabold">{t('seizureHistory')}</h2><Link to="/seizures" className="text-sm font-bold text-[rgb(var(--accent))] inline-flex items-center min-h-[40px]">{t('seeAll')} <ChevronRight size={16} aria-hidden /></Link></div>
          {!recent.length ? <p className="text-sm text-muted">{t('noSeizures')}</p> : (
            <ul className="divide-y divide-line/60">
              {recent.map((r) => <li key={r.id} className="flex items-center gap-3 py-2.5"><span className="flex-1 min-w-0"><b className="block">{fmtDate(r.start, lang, { day: 'numeric', month: 'short' })} · {fmtTime(r.start, lang)}</b></span><span className="chip !min-h-[32px] tabular-nums">{fmtDur(r.durationSec)}</span></li>)}
            </ul>
          )}
        </section>
      </div>
      <BottomBar bare>
        <button className="btn-danger w-full !min-h-[76px] !rounded-3xl text-xl" onClick={stopped}><Square aria-hidden fill="currentColor" /> {t('stopAndSave')}</button>
      </BottomBar>
      {showAlert && (
        <div role="alertdialog" aria-modal="true" aria-labelledby="rescue-title" className="fixed inset-0 z-50 bg-danger text-ondanger flex flex-col items-center justify-center p-6 gap-5 text-center">
          <p id="rescue-title" className="text-3xl font-extrabold">{t('rescueTitle', { m: rescueMin })}</p>
          <p className="text-6xl font-extrabold tabular-nums">{fmtDur(sec)}</p>
          <a href="tel:108" className="btn bg-white text-danger text-2xl w-full max-w-sm !min-h-[72px]"><Phone aria-hidden /> {t('call108')}</a>
          <p className="text-xl font-bold bg-white/15 rounded-2xl p-4 max-w-sm">{t('giveRescue')}</p>
          <div className="flex gap-3 flex-wrap justify-center">
            <button className="btn bg-white/20 text-ondanger" onClick={() => setShowAlert(false)}>{t('backToTimer')}</button>
            <button className="btn bg-white text-danger" onClick={stopped}>{t('stopped')}</button>
          </div>
        </div>
      )}
    </main>
  );
}
