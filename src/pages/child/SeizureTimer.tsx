import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, Video, Square, X } from 'lucide-react';
import { useT } from '../../i18n';
import { db, getSetting, putBlob } from '../../lib/db';
import { useChild, useChildId } from '../../lib/hooks';
import { useWakeLock } from '../../components/ui';
import { loadBook, toc, type Block } from '../../lib/content';
import { BlockView } from '../../components/Blocks';
import { alarm } from '../../lib/audio';
import { startRecording, type Rec } from '../../lib/media';
import { fmtDur } from '../../lib/util';

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
  return (
    <main id="main" className={`min-h-screen flex flex-col ${over ? 'bg-[var(--urt)]' : 'bg-bg'}`}>
      <div className="flex items-center justify-between px-3 pt-3">
        <button className="icon-btn" onClick={() => nav(-1)} aria-label={t('cancel')}><X /></button>
        <a href="tel:108" className="btn-danger px-4"><Phone size={18} aria-hidden /> {t('call108')}</a>
      </div>
      <section className="text-center px-4 pt-2" aria-live="off">
        <p className="font-bold text-muted">{t('seizureTimer')}</p>
        <p className="font-extrabold tabular-nums leading-none my-2" style={{ fontSize: 'min(28vw, 9rem)' }} role="timer" aria-label={t('elapsed')}>{fmtDur(sec)}</p>
        <p className="text-muted">{t('rescueAt', { m: rescueMin })}</p>
      </section>
      <div className="px-4 py-4 grid gap-3 max-w-xl w-full mx-auto">
        <button className="btn-primary !min-h-[72px] text-2xl" onClick={stopped}><Square aria-hidden /> {t('stopped')}</button>
        <div className="grid grid-cols-1 gap-2">
          <div className="rounded-2xl bg-surface p-4 border-2 border-[var(--ur)]">
            <p className="text-xl font-extrabold">1. {t('aidSide')}</p>
            <p className="text-xl font-extrabold mt-1">2. {t('aidMouth')}</p>
          </div>
        </div>
        {rec ? (
          <div className="rounded-2xl overflow-hidden bg-black relative"><video ref={preview} muted playsInline className="w-full max-h-56 object-cover" />
            <button className="btn-danger absolute bottom-2 left-1/2 -translate-x-1/2" onClick={stopVideo}><Square size={18} aria-hidden /> {t('stopVideo')}</button></div>
        ) : videoId ? <p className="text-center font-bold text-[var(--p2)]">{t('videoSaved')}</p> : (
          <button className="btn-outline" onClick={startVideo}><Video aria-hidden /> {t('recordVideo')}</button>
        )}
        {recErr && <p role="alert" className="text-danger text-center">{recErr}</p>}
        <details className="card p-4" open>
          <summary className="font-extrabold cursor-pointer min-h-[32px]">{t('firstAidFromBook')}</summary>
          <div className="prose-read mt-2" style={{ ['--pc' as string]: 'var(--p2)', ['--pt' as string]: 'var(--p2t)' }}>{aid.map((b, i) => <BlockView key={i} b={b} chapter="c5" index={toc.anchors.firstAid.from + i} />)}</div>
        </details>
      </div>
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
