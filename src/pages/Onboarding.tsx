import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Download, Camera, Heart } from 'lucide-react';
import { useT } from '../i18n';
import { useUI, type Lang } from '../lib/store';
import { meta } from '../lib/content';
import { db, putBlob, setSetting } from '../lib/db';
import { hashPin } from '../lib/crypto';
import { compressImage } from '../lib/media';
import { PathMotif } from '../components/Path';
import { FileButton } from '../components/ui';
import { useInstall } from '../components/Install';

export default function Onboarding() {
  const { t, lang } = useT();
  const setLang = useUI((s) => s.setLang);
  const setActive = useUI((s) => s.setActiveChild);
  const nav = useNavigate();
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  const [photo, setPhoto] = useState<Blob | null>(null);
  const [pin, setPin] = useState('');
  const [pin2, setPin2] = useState('');
  const [err, setErr] = useState('');
  const inst = useInstall();
  const next = () => { setErr(''); setStep((s) => s + 1); };

  const saveChild = async () => {
    if (!name.trim()) { setErr(t('nameNeeded')); return; }
    const photoBlobId = photo ? await putBlob(photo, 0, 'photo') : undefined;
    const id = await db.children.add({ name: name.trim(), dob: dob || undefined, photoBlobId, rescueMinutes: 5, createdAt: Date.now() });
    if (photoBlobId) await db.blobs.update(photoBlobId, { childId: id });
    setActive(id);
    next();
  };
  const savePin = async () => {
    if (pin) {
      if (pin.length < 4) { setErr(t('pinShort')); return; }
      if (pin !== pin2) { setErr(t('pinMismatch')); return; }
      await setSetting('pin', await hashPin(pin));
    }
    next();
  };
  const finish = async () => { await setSetting('onboarded', true); await setSetting('defaultRescue', 5); nav('/', { replace: true }); };

  const steps = [
    <div key="lang" className="text-center">
      <PathMotif height={90} filled={0.05} />
      <h1 className="text-3xl font-extrabold mt-4">{meta.appTitle.en}</h1>
      <p className="font-head text-2xl font-bold text-accent mb-8">{meta.appTitle.ml}</p>
      <p className="font-bold mb-3">{t('chooseLanguage')}</p>
      <div className="grid gap-3">
        {(['ml', 'en'] as Lang[]).map((l) => (
          <button key={l} lang={l} className={l === lang ? 'btn-primary text-lg' : 'btn-outline text-lg'} onClick={() => { setLang(l); next(); }}>{l === 'en' ? 'English' : 'മലയാളം'}</button>
        ))}
      </div>
    </div>,
    <div key="welcome" className="text-center">
      <Heart className="mx-auto text-[var(--p3)] mb-3" size={44} aria-hidden />
      <p className="text-muted font-bold">{meta.kicker[lang]}</p>
      <h1 className="text-3xl font-extrabold my-2">{meta.appTitle[lang]}</h1>
      <p className="text-lg mb-4">{meta.subtitle[lang]}</p>
      <p className="text-muted mb-8">{t('welcomeText')}</p>
      <button className="btn-primary w-full" onClick={next}>{t('continue')}</button>
    </div>,
    <div key="privacy">
      <ShieldCheck className="mx-auto text-[var(--p1)] mb-3" size={44} aria-hidden />
      <h1 className="text-2xl font-extrabold text-center mb-4">{t('privacyTitle')}</h1>
      <div className="card p-4 mb-3 bg-[var(--p1t)]"><p className="font-semibold">{meta.privacy[lang]}</p></div>
      <div className="card p-4 mb-6"><p className="text-sm font-bold text-muted mb-1">{t('disclaimer')}</p><p>{meta.disclaimer[lang]}</p></div>
      <button className="btn-primary w-full" onClick={async () => { try { await navigator.storage?.persist?.(); } catch { /* */ } next(); }}>{t('iUnderstand')}</button>
    </div>,
    <div key="child">
      <h1 className="text-2xl font-extrabold mb-1">{t('aboutChild')}</h1>
      <p className="text-muted mb-5">{t('aboutChildSub')}</p>
      <label className="label" htmlFor="ob-name">{t('childName')} *</label>
      <input id="ob-name" className="input mb-4" value={name} onChange={(e) => setName(e.target.value)} autoComplete="off" />
      <label className="label" htmlFor="ob-dob">{t('dobOptional')}</label>
      <input id="ob-dob" type="date" className="input mb-4" value={dob} onChange={(e) => setDob(e.target.value)} />
      <div className="flex items-center gap-3 mb-6">
        {photo && <img src={URL.createObjectURL(photo)} alt="" className="w-16 h-16 rounded-full object-cover" />}
        <FileButton accept="image/*" onFile={async (f) => setPhoto(await compressImage(f, 600))}><Camera size={18} /> {t('photoOptional')}</FileButton>
      </div>
      {err && <p role="alert" className="text-danger font-bold mb-3">{err}</p>}
      <button className="btn-primary w-full" onClick={saveChild}>{t('continue')}</button>
    </div>,
    <div key="pin">
      <h1 className="text-2xl font-extrabold mb-1">{t('pinTitle')}</h1>
      <p className="text-muted mb-5">{t('pinSub')}</p>
      <label className="label" htmlFor="ob-pin">{t('newPin')}</label>
      <input id="ob-pin" className="input mb-3" type="password" inputMode="numeric" maxLength={8} value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))} />
      <label className="label" htmlFor="ob-pin2">{t('repeatPin')}</label>
      <input id="ob-pin2" className="input mb-4" type="password" inputMode="numeric" maxLength={8} value={pin2} onChange={(e) => setPin2(e.target.value.replace(/\D/g, ''))} />
      {err && <p role="alert" className="text-danger font-bold mb-3">{err}</p>}
      <div className="grid gap-3"><button className="btn-primary" onClick={savePin} disabled={!pin}>{t('setPin')}</button><button className="btn-ghost" onClick={() => { setPin(''); next(); }}>{t('skipForNow')}</button></div>
    </div>,
    <div key="install" className="text-center">
      <Download className="mx-auto text-accent mb-3" size={44} aria-hidden />
      <h1 className="text-2xl font-extrabold mb-2">{t('installTitle')}</h1>
      <p className="text-muted mb-6">{inst.ios ? t('installIos') : t('installText')}</p>
      <div className="grid gap-3">
        {inst.can && !inst.standalone && <button className="btn-outline" onClick={inst.install}>{t('installApp')}</button>}
        <button className="btn-primary" onClick={finish}>{t('startUsing')}</button>
      </div>
    </div>,
  ];
  return (
    <main id="main" className="min-h-screen flex flex-col items-center justify-center px-5 py-10">
      <div className="w-full max-w-md anim-in" key={step}>{steps[step]}</div>
      <div className="flex gap-2 mt-8" aria-hidden>{steps.map((_, i) => <span key={i} className={`h-2 rounded-full transition-all ${i === step ? 'w-6 bg-accent' : 'w-2 bg-line'}`} />)}</div>
    </main>
  );
}
