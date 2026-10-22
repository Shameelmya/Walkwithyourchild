import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Download, Camera, BookOpen, NotebookPen, HeartHandshake, ArrowLeft, Smartphone, Lock, ArrowRight, Check } from 'lucide-react';
import { useT } from '../i18n';
import { LANGS, useUI } from '../lib/store';
import { meta } from '../lib/content';
import { db, putBlob, setSetting } from '../lib/db';
import { hashPin } from '../lib/crypto';
import { compressImage } from '../lib/media';
import { PathMotif } from '../components/Path';
import { FileButton } from '../components/ui';
import { Keypad } from '../components/Lock';
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

  const Feature = ({ I, c, title, text }: { I: typeof BookOpen; c: string; title: string; text: string }) => (
    <li className="card p-4 flex gap-4 items-start text-left"><span className={cx('w-12 h-12 rounded-2xl text-white flex items-center justify-center shrink-0', c)}><I size={22} aria-hidden /></span><span><b className="block">{title}</b><span className="text-sm text-muted">{text}</span></span></li>
  );

  const body = [
    <div key="lang">
      <div className="tile t-blue !p-6 !rounded-[32px] mb-8 text-center">
        <div className="relative z-[1]">
          <div className="bg-white/95 rounded-3xl p-2 mb-5 shadow-lift"><PathMotif height={84} filled={0.35} /></div>
          <p className="text-sm font-bold opacity-90">{meta.kicker[lang]}</p>
          <h1 className="font-display text-[1.9rem] font-bold leading-tight mt-1">{meta.appTitle.en}</h1>
          <p className="font-display text-lg font-bold opacity-95 mt-1" lang="ml">{meta.appTitle.ml}</p>
          <p className="font-display text-lg font-bold opacity-95" lang="kn">{(meta.appTitle as { kn?: string }).kn}</p>
        </div>
      </div>
      <h2 className="text-xl font-extrabold mb-1">{t('chooseLanguage')}</h2>
      <div className="mb-4" />
      <div className="grid gap-3">
        {LANGS.map((l) => (
          <button key={l.v} lang={l.v} onClick={() => { setLang(l.v); next(); }} className={cx('card flex items-center gap-4 p-4 text-left transition active:scale-[0.98]', lang === l.v && '!border-[rgb(var(--accent))] ring-4 ring-[rgb(var(--accent)/0.12)]')}>
            <span className="w-12 h-12 rounded-2xl bg-soft text-[rgb(var(--accent))] text-xl font-extrabold flex items-center justify-center">{l.short}</span>
            <span className="flex-1 text-lg font-extrabold">{l.native}</span>
            <ArrowRight size={20} className="text-muted" aria-hidden />
          </button>
        ))}
      </div>
    </div>,
    <div key="welcome">
      <p className="eyebrow">{meta.kicker[lang]}</p>
      <h1 className="font-display text-[2rem] font-bold leading-tight mt-1 mb-2">{t('welcomeTitle')}</h1>
      <p className="text-muted mb-6">{meta.subtitle[lang]}</p>
      <ul className="grid gap-3 mb-8">
        <Feature I={BookOpen} c="t-mint" title={t('featBookTitle')} text={t('featBookText')} />
        <Feature I={NotebookPen} c="t-amber" title={t('featNotebookTitle')} text={t('featNotebookText')} />
        <Feature I={HeartHandshake} c="t-violet" title={t('featCareTitle')} text={t('featCareText')} />
      </ul>
<div className="mt-auto sticky bottom-0 pt-4 pb-[max(12px,env(safe-area-inset-bottom))] bg-bg grid gap-3"><button className="btn-primary w-full" onClick={next}>{t('continue')} <ArrowRight size={18} aria-hidden /></button></div>
    </div>,
    <div key="privacy">
      <span className="w-16 h-16 rounded-3xl t-mint text-white flex items-center justify-center shadow-lift mb-5"><ShieldCheck size={30} aria-hidden /></span>
      <h1 className="font-display text-[2rem] font-bold leading-tight mb-2">{t('privacyTitle')}</h1>
      <p className="text-muted mb-6">{t('privacyLead')}</p>
      <div className="card p-5 mb-3 flex gap-3"><Smartphone className="text-[var(--p1)] shrink-0 mt-0.5" aria-hidden /><p className="font-semibold">{meta.privacy[lang]}</p></div>
      <div className="card p-5 mb-8 flex gap-3 !bg-[var(--urt)] border-transparent"><ShieldCheck className="text-[var(--ur)] shrink-0 mt-0.5" aria-hidden /><div><p className="text-sm font-extrabold mb-1">{t('disclaimer')}</p><p>{meta.disclaimer[lang]}</p></div></div>
<div className="mt-auto sticky bottom-0 pt-4 pb-[max(12px,env(safe-area-inset-bottom))] bg-bg grid gap-3"><button className="btn-primary w-full" onClick={async () => { try { await navigator.storage?.persist?.(); } catch { /* */ } next(); }}><Check size={18} aria-hidden /> {t('iUnderstand')}</button></div>
    </div>,
    <div key="child">
      <h1 className="font-display text-[2rem] font-bold leading-tight mb-2">{t('aboutChild')}</h1>
      <p className="text-muted mb-6">{t('aboutChildSub')}</p>
      <div className="flex justify-center mb-6">
        <FileButton className="relative w-32 h-32 rounded-full bg-surface2 border-2 border-dashed border-line flex items-center justify-center overflow-hidden" accept="image/*" onFile={async (f) => setPhoto(await compressImage(f, 600))}>
          {photo ? <img src={URL.createObjectURL(photo)} alt="" className="w-full h-full object-cover" /> : <span className="flex flex-col items-center text-muted text-xs font-bold gap-1"><Camera size={28} aria-hidden />{t('photoOptional')}</span>}
        </FileButton>
      </div>
      <div className="card p-5 grid gap-4 mb-6">
        <div><label className="label" htmlFor="ob-name">{t('childName')} *</label><input id="ob-name" className="input text-lg" value={name} onChange={(e) => setName(e.target.value)} autoComplete="off" placeholder={t('childNamePlaceholder')} /></div>
        <div><label className="label" htmlFor="ob-dob">{t('dobOptional')}</label><input id="ob-dob" type="date" className="input" value={dob} onChange={(e) => setDob(e.target.value)} /></div>
      </div>
      {err && <p role="alert" className="text-danger font-bold mb-3">{err}</p>}
<div className="mt-auto sticky bottom-0 pt-4 pb-[max(12px,env(safe-area-inset-bottom))] bg-bg grid gap-3"><button className="btn-primary w-full" disabled={busy} onClick={saveChild}>{t('continue')} <ArrowRight size={18} aria-hidden /></button></div>
    </div>,
    <div key="pin">
      {!pin1 ? (
        <Keypad key="a" title={t('pinTitle')} sub={t('pinSub')} onSubmit={(p) => setPin1(p)} />
      ) : (
        <Keypad key="b" title={t('repeatPin')} sub={t('pinConfirmSub')} error={err} onSubmit={async (p) => {
          if (p !== pin1) { setErr(t('pinMismatch')); setPin1(''); return; }
          await setSetting('pin', await hashPin(p)); next();
        }} />
      )}
<div className="mt-auto sticky bottom-0 pt-4 pb-[max(12px,env(safe-area-inset-bottom))] bg-bg grid gap-3"><button className="btn-ghost w-full" onClick={() => { setPin1(''); next(); }}>{t('skipForNow')}</button></div>
    </div>,
    <div key="install" className="text-center">
      <span className="w-20 h-20 rounded-[28px] t-blue text-white inline-flex items-center justify-center shadow-lift mb-6"><Download size={34} aria-hidden /></span>
      <h1 className="font-display text-[2rem] font-bold leading-tight mb-2">{t('installTitle')}</h1>
      <p className="text-muted mb-8">{inst.ios ? t('installIos') : t('installText')}</p>
      <div className="card p-4 mb-8 flex items-center gap-3 text-left"><Lock className="text-[var(--p1)] shrink-0" aria-hidden /><p className="text-sm">{t('readyNote')}</p></div>
<div className="mt-auto sticky bottom-0 pt-4 pb-[max(12px,env(safe-area-inset-bottom))] bg-bg grid gap-3">
        {inst.can && !inst.standalone && <button className="btn-outline" onClick={inst.install}><Download size={18} aria-hidden /> {t('installApp')}</button>}
        <button className="btn-primary" onClick={finish}>{t('startUsing')} <ArrowRight size={18} aria-hidden /></button>
      </div>
    </div>,
  ];
  return (
    <main id="main" className="min-h-[100dvh] flex flex-col items-center px-5 pt-4">
      <div className="w-full max-w-md flex items-center gap-3 mb-6">
        {step > 0 && step < 4 ? <button className="icon-chip" onClick={() => setStep(step - 1)} aria-label={t('back')}><ArrowLeft size={20} /></button> : <span className="w-12" />}
        <div className="flex-1 flex gap-1.5" aria-label={t('stepOf', { n: step + 1, all: STEPS })} role="progressbar" aria-valuenow={step + 1} aria-valuemin={1} aria-valuemax={STEPS}>
          {Array.from({ length: STEPS }, (_, i) => <span key={i} className={cx('h-1.5 flex-1 rounded-full transition', i <= step ? 'bg-[rgb(var(--accent))]' : 'bg-line')} />)}
        </div>
        <LangButton />
      </div>
      <div className="w-full max-w-md anim-in flex-1 flex flex-col [&>div]:flex-1 [&>div]:flex [&>div]:flex-col" key={step}>{body[step]}</div>
    </main>
  );
}
