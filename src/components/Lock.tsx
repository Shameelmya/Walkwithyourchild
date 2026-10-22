import { useEffect, useRef, useState } from 'react';
import { Delete, Lock, Phone } from 'lucide-react';
import { getSetting } from '../lib/db';
import { verifyPin, type PinHash } from '../lib/crypto';
import { useT } from '../i18n';
import { meta } from '../lib/content';
import { cx } from '../lib/util';
import { PathMotif } from './Path';
import { LangButton } from './LangButton';

export function useAutoLock(enabled: boolean, lock: () => void) {
  const hiddenAt = useRef<number | null>(null);
  useEffect(() => {
    if (!enabled) return;
    const f = () => {
      if (document.visibilityState === 'hidden') hiddenAt.current = Date.now();
      else if (hiddenAt.current && Date.now() - hiddenAt.current > 5 * 60_000) lock();
    };
    document.addEventListener('visibilitychange', f);
    return () => document.removeEventListener('visibilitychange', f);
  }, [enabled, lock]);
}

/** Phone-style PIN keypad with dots. Works with the on-screen keys or a keyboard. */
export function Keypad({ onSubmit, error, busy, title, sub, length = 4 }: { onSubmit: (pin: string) => void; error?: string; busy?: boolean; title: string; sub?: string; length?: number }) {
  const { t } = useT();
  const [pin, setPin] = useState('');
  const [shake, setShake] = useState(0);
  useEffect(() => { if (error) { cur.current = ''; setPin(''); setShake((s) => s + 1); } }, [error]);
  const cur = useRef('');
  const submit = useRef(onSubmit); submit.current = onSubmit;
  const set = (p: string) => { cur.current = p; setPin(p); };
  const press = (d: string) => {
    if (busy || cur.current.length >= length) return;
    const p = cur.current + d; set(p);
    if (p.length === length) { setTimeout(() => submit.current(p), 120); setTimeout(() => set(''), 650); }
  };
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (/^\d$/.test(e.key)) press(e.key); else if (e.key === 'Backspace') set(cur.current.slice(0, -1)); };
    addEventListener('keydown', k); return () => removeEventListener('keydown', k);
  });
  return (
    <div className="w-full max-w-[320px] mx-auto text-center">
      <span className="w-14 h-14 rounded-2xl grad-a text-white inline-flex items-center justify-center shadow-lift mb-4"><Lock size={24} aria-hidden /></span>
      <h1 className="text-2xl font-extrabold">{title}</h1>
      {sub && <p className="text-muted mt-1">{sub}</p>}
      <div key={shake} className={cx('flex justify-center gap-4 my-7', shake > 0 && 'anim-pop')} aria-label={t('pin')} aria-live="polite" role="status">
        {Array.from({ length }, (_, i) => <span key={i} className={cx('w-4 h-4 rounded-full transition', i < pin.length ? 'bg-[rgb(var(--accent))] scale-110' : 'bg-line')} />)}
      </div>
      <p role="alert" className="text-danger font-bold min-h-[1.6em] -mt-3 mb-2">{error ?? ''}</p>
      <div className="grid grid-cols-3 gap-3">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => <button key={d} type="button" onClick={() => press(d)} className="h-16 rounded-3xl bg-surface shadow-card border border-line/50 text-2xl font-bold active:scale-95 transition hover:bg-surface2">{d}</button>)}
        <span />
        <button type="button" onClick={() => press('0')} className="h-16 rounded-3xl bg-surface shadow-card border border-line/50 text-2xl font-bold active:scale-95 transition hover:bg-surface2">0</button>
        <button type="button" aria-label={t('delete')} onClick={() => set(cur.current.slice(0, -1))} className="h-16 rounded-3xl flex items-center justify-center text-muted hover:bg-surface2"><Delete aria-hidden /></button>
      </div>
    </div>
  );
}
export const PinPad = Keypad;

export function LockScreen({ onUnlock }: { onUnlock: () => void }) {
  const { t, lang } = useT();
  const [err, setErr] = useState<string>();
  const [busy, setBusy] = useState(false);
  return (
    <main id="main" className="min-h-screen flex flex-col items-center px-6 py-6 gap-6">
      <div className="w-full max-w-md flex items-center justify-between"><p className="font-display font-bold text-lg">{meta.appTitle[lang]}</p><LangButton /></div>
      <div className="w-full max-w-xs"><PathMotif height={44} filled={1} /></div>
      <Keypad title={t('enterPin')} sub={t('welcomeBack')} error={err} busy={busy} onSubmit={async (p) => {
        setBusy(true); setErr(undefined); const h = await getSetting<PinHash | null>('pin', null);
        if (h && (await verifyPin(p, h))) onUnlock(); else setErr(t('wrongPin'));
        setBusy(false);
      }} />
      <a className="btn-danger" href="tel:108"><Phone size={18} aria-hidden /> {t('call108')}</a>
    </main>
  );
}
