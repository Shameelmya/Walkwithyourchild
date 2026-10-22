import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Download, Camera, BookOpen, NotebookPen, HeartHandshake, ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { useT } from '../i18n';
import { LANGS, useUI } from '../lib/store';
import { meta } from '../lib/content';
import { db, putBlob, setSetting } from '../lib/db';
import { hashPin } from '../lib/crypto';
import { FileButton } from '../components/ui';
import { Keypad } from '../components/Lock';
import { PhotoCrop } from '../components/PhotoCrop';
import { LangButton } from '../components/LangButton';
import { useInstall } from '../components/Install';
import { cx } from '../lib/util';

export default function Onboarding() {
  const { t, lang } = useT();
  const setLang = useUI((s) => s.setLang);
  const setActive = useUI((s) => s.setActiveChild);
  const nav = useNavigate();
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  const [photo, setPhoto] = useState<Blob | null>(null);
  const [crop, setCrop] = useState<Blob | null>(null);
  const [pin1, setPin1] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const inst = useInstall();
  const next = () => { setErr(''); setStep((s) => s + 1); };
  const STEPS = 6;

  const saveChild = async () => {
    if (!name.trim()) { setErr(t('nameNeeded')); return; }
    setBusy(true);
    const photoBlobId = photo ? await putBlob(photo, 0, 'photo') : undefined;
    const id = await db.children.add({ name: name.trim(), dob: dob || undefined, photoBlobId, rescueMinutes: 5, createdAt: Date.now() });
    if (photoBlobId) await db.blobs.update(photoBlobId, { childId: id });
    setActive(id); setBusy(false);
    next();
  };
  const finish = async () => { await setSetting('onboarded', true); await setSetting('defaultRescue', 5); nav('/', { replace: true }); };

  const Feature = ({ I, c, title }: { I: typeof BookOpen; c: string; title: string }) => (
    <li className="flex items-center gap-4"><span className={cx('w-12 h-12 rounded-2xl text-white flex items-center justify-center shrink-0', c)}><I size={22} aria-hidden /></span><span className="text-[1.05rem] font-semibold">{title}</span></li>
  );
  const Title = ({ children }: { children: React.ReactNode }) => <h1 className="text-[1.9rem] font-bold leading-tight">{children}</h1>;

  const body = [
    <div key="lang">
      <div className="flex-1 flex flex-col justify-center py-12">
        <img src="/icons/icon-192.png" alt="" className="w-[72px] h-[72px] rounded-[22px] shadow-lift mb-8" />
        <Title>{meta.appTitle[lang]}</Title>
      </div>
      <div className="grid gap-3 pb-10">
        {LANGS.map((l) => (
          <button key={l.v} lang={l.v} onClick={() => { setLang(l.v); next(); }} className={cx('flex items-center gap-4 h-16 px-5 rounded-2xl bg-surface border text-left transition duration-300 active:scale-[0.98]', lang === l.v ? 'border-[rgb(var(--accent))]' : 'border-line/70')}>
            <span className="flex-1 text-lg font-semibold">{l.native}</span>
            {lang === l.v ? <Check size={20} className="text-[rgb(var(--accent))]" aria-hidden /> : <ArrowRight size={18} className="text-muted" aria-hidden />}
          </button>
        ))}
      </div>
    </div>,
    <div key="welcome">
      <div className="pt-10"><Title>{t('welcomeTitle')}</Title></div>
      <ul className="grid gap-6 mt-12">
        <Feature I={BookOpen} c="t-blue" title={t('featBookTitle')} />
        <Feature I={NotebookPen} c="t-amber" title={t('featNotebookTitle')} />
        <Feature I={HeartHandshake} c="t-violet" title={t('featCareTitle')} />
      </ul>
      <div className="mt-auto sticky bottom-0 pt-6 pb-[max(20px,env(safe-area-inset-bottom))] bg-bg grid gap-3"><button className="btn-primary w-full" onClick={next}>{t('continue')}</button></div>
    </div>,
    <div key="privacy">
      <div className="pt-10">
        <span className="w-14 h-14 rounded-2xl t-mint text-white flex items-center justify-center mb-8"><ShieldCheck size={26} aria-hidden /></span>
        <Title>{t('privacyTitle')}</Title>
        <p className="text-[1.05rem] leading-relaxed mt-5">{meta.privacy[lang]}</p>
        <p className="text-sm text-muted leading-relaxed mt-8 pt-6 border-t border-line/70">{meta.disclaimer[lang]}</p>
      </div>
      <div className="mt-auto sticky bottom-0 pt-6 pb-[max(20px,env(safe-area-inset-bottom))] bg-bg grid gap-3"><button className="btn-primary w-full" onClick={async () => { try { await navigator.storage?.persist?.(); } catch { /* */ } next(); }}>{t('iUnderstand')}</button></div>
    </div>,
    <div key="child">
      <div className="pt-10"><Title>{t('aboutChild')}</Title></div>
      {crop && <PhotoCrop file={crop} onCancel={() => setCrop(null)} onDone={(b) => { setCrop(null); setPhoto(b); }} />}
      <div className="flex justify-center my-10">
        <FileButton className="relative w-28 h-28 rounded-full bg-surface border border-line/70 flex items-center justify-center overflow-hidden" accept="image/*" onFile={(f) => setCrop(f)}>
          {photo ? <img src={URL.createObjectURL(photo)} alt="" className="w-full h-full object-cover" /> : <Camera size={28} className="text-muted" aria-label={t('photoOptional')} />}
        </FileButton>
      </div>
      <div className="grid gap-5">
        <div><label className="label" htmlFor="ob-name">{t('childName')} *</label><input id="ob-name" className="input text-lg" value={name} onChange={(e) => setName(e.target.value)} autoComplete="off" /></div>
        <div><label className="label" htmlFor="ob-dob">{t('dobOptional')}</label><input id="ob-dob" type="date" className="input" value={dob} onChange={(e) => setDob(e.target.value)} /></div>
      </div>
      {err && <p role="alert" className="text-danger font-semibold mt-4">{err}</p>}
      <div className="mt-auto sticky bottom-0 pt-6 pb-[max(20px,env(safe-area-inset-bottom))] bg-bg grid gap-3"><button className="btn-primary w-full" disabled={busy} onClick={saveChild}>{t('continue')}</button></div>
    </div>,
    <div key="pin">
      <div className="pt-6">
        {!pin1 ? (
          <Keypad key="a" title={t('pinTitle')} onSubmit={(p) => setPin1(p)} />
        ) : (
          <Keypad key="b" title={t('repeatPin')} error={err} busy={busy} onSubmit={async (p) => {
            if (p !== pin1) { setErr(t('pinMismatch')); setPin1(''); return; }
            setBusy(true);
            try { await setSetting('pin', await hashPin(p)); next(); } finally { setBusy(false); }
          }} />
        )}
      </div>
      <div className="mt-auto sticky bottom-0 pt-6 pb-[max(20px,env(safe-area-inset-bottom))] bg-bg grid gap-3"><button className="btn-ghost w-full" onClick={() => { setPin1(''); next(); }}>{t('skipForNow')}</button></div>
    </div>,
    <div key="install">
      <div className="pt-10">
        <span className="w-14 h-14 rounded-2xl t-blue text-white flex items-center justify-center mb-8"><Download size={26} aria-hidden /></span>
        <Title>{t('installTitle')}</Title>
        <p className="text-[1.05rem] text-muted leading-relaxed mt-5">{inst.ios ? t('installIos') : t('installText')}</p>
      </div>
      <div className="mt-auto sticky bottom-0 pt-6 pb-[max(20px,env(safe-area-inset-bottom))] bg-bg grid gap-3">
        {inst.can && !inst.standalone && <button className="btn-outline" onClick={inst.install}><Download size={18} aria-hidden /> {t('installApp')}</button>}
        <button className="btn-primary" onClick={finish}>{t('startUsing')}</button>
      </div>
    </div>,
  ];
  return (
    <main id="main" className="min-h-[100dvh] flex flex-col items-center px-6 pt-5">
      <div className="w-full max-w-sm flex items-center gap-3">
        {step > 0 && step < 4 ? <button className="icon-chip" onClick={() => setStep(step - 1)} aria-label={t('back')}><ArrowLeft size={20} /></button> : <span className="w-12" />}
        <div className={cx('flex-1 flex gap-1.5', step === 0 && 'invisible')} aria-label={t('stepOf', { n: step + 1, all: STEPS })} role="progressbar" aria-valuenow={step + 1} aria-valuemin={1} aria-valuemax={STEPS}>
          {Array.from({ length: STEPS }, (_, i) => <span key={i} className={cx('h-1.5 flex-1 rounded-full transition', i <= step ? 'bg-[rgb(var(--accent))]' : 'bg-line')} />)}
        </div>
        <LangButton />
      </div>
      <div className="w-full max-w-sm anim-in flex-1 flex flex-col [&>div]:flex-1 [&>div]:flex [&>div]:flex-col" key={step}>{body[step]}</div>
    </main>
  );
}
