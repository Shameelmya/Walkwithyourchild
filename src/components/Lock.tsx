import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Delete, Lock, Phone, Fingerprint } from 'lucide-react';
import { getSetting } from '../lib/db';
import { verifyPin, type PinHash } from '../lib/crypto';
import { useT } from '../i18n';
import { meta } from '../lib/content';
import { cx } from '../lib/util';
import { LangButton } from './LangButton';
import { ThemeButton } from './HeaderTools';
import { Avatar } from './ui';
import { useChild } from '../lib/hooks';
import { bioEnabled, bioUnlock } from '../lib/biometric';

const SEEN = 'wwyc-seen';
/** The app was open (and unlocked) less than 5 seconds ago: a refresh or a quick reopen needs no PIN. */
export function openedRecently() { try { return Date.now() - Number(localStorage.getItem(SEEN) || 0) < 5000; } catch { return false; } }
/** While unlocked, keep a heartbeat so a reload within 5 seconds stays unlocked. */
export function useSeenHeartbeat(on: boolean) {
  useEffect(() => {
    if (!on) return;
    const mark = () => { try { localStorage.setItem(SEEN, String(Date.now())); } catch { /* */ } };
    mark(); const h = setInterval(() => document.visibilityState === 'visible' && mark(), 1000);
    addEventListener('pagehide', mark);
    return () => { clearInterval(h); removeEventListener('pagehide', mark); };
  }, [on]);
}

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

/** Phone-style PIN keypad with dots. Works with the on-screen keys or a keyboard. `corner` fills the empty key at the bottom left. */
export function Keypad({ onSubmit, error, busy, title, sub, length = 4, fill = false, head, corner }: { onSubmit: (pin: string) => void; error?: string; busy?: boolean; title: string; sub?: string; length?: number; fill?: boolean; head?: ReactNode; corner?: ReactNode }) {
  const { t } = useT();
  const [pin, setPin] = useState('');
  const [shake, setShake] = useState(0);
  useEffect(() => { if (error) { cur.current = ''; setPin(''); setShake((s) => s + 1); } }, [error]);
  const cur = useRef('');
  const submit = useRef(onSubmit); submit.current = onSubmit;
  const set = (p: string) => { cur.current = p; setPin(p); };
  // Each tap lights up its key: the counter restarts the animation on every press.
  const [hit, setHit] = useState<{ d: string; n: number }>({ d: '', n: 0 });
  const press = (d: string) => {
    if (busy || cur.current.length >= length) return;
    setHit((h) => ({ d, n: h.n + 1 }));
    try { navigator.vibrate?.(12); } catch { /* not every phone can */ }
    const p = cur.current + d; set(p);
    if (p.length === length) { setTimeout(() => submit.current(p), 120); setTimeout(() => set(''), 650); }
  };
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (/^\d$/.test(e.key)) press(e.key); else if (e.key === 'Backspace') set(cur.current.slice(0, -1)); };
    addEventListener('keydown', k); return () => removeEventListener('keydown', k);
  });
  const key = 'relative overflow-hidden w-[74px] h-[74px] rounded-full bg-surface border border-line/70 text-[1.7rem] font-semibold text-ink shadow-[0_1px_2px_rgb(var(--shadow)/0.06)] active:scale-90 active:bg-soft transition grid place-items-center';
  const digit = (d: string) => (
    <button key={d} type="button" onClick={() => press(d)} className={key}>
      {hit.d === d && <span key={hit.n} className="key-flash" aria-hidden />}
      <span key={hit.d === d ? hit.n : 0} className={cx('relative', hit.d === d && hit.n > 0 && 'key-hit')}>{d}</span>
    </button>
  );
  return (
    <div className={cx('w-full max-w-[320px] mx-auto text-center', fill && 'flex-1 flex flex-col')}>
      <div className={cx(fill && 'flex-1 flex flex-col items-center justify-center')}>
        {head ?? <span className="w-14 h-14 rounded-2xl t-blue text-white inline-flex items-center justify-center shadow-lift mb-4"><Lock size={24} aria-hidden /></span>}
        <h1 className="text-[1.45rem] font-extrabold tracking-tight">{title}</h1>
        {sub && <p className="text-muted mt-1 text-[0.95rem]">{sub}</p>}
        <div key={shake} className={cx('flex justify-center gap-5 my-7', shake > 0 && 'anim-pop')} aria-label={t('pin')} aria-live="polite" role="status">
          {Array.from({ length }, (_, i) => <span key={i} className={cx('w-3.5 h-3.5 rounded-full border-2 transition', i < pin.length ? 'bg-[rgb(var(--accent))] border-[rgb(var(--accent))] scale-110 dot-pop' : 'border-muted/50')} />)}
        </div>
        <p role="alert" className="text-danger font-semibold text-sm min-h-[1.5em] -mt-3 mb-3">{busy ? <span className="inline-flex items-center gap-2 text-muted"><span className="w-4 h-4 rounded-full border-2 border-line border-t-[rgb(var(--accent))] animate-spin" aria-hidden /> {t('checking')}</span> : error ?? ''}</p>
      </div>
      <div className="grid grid-cols-3 gap-y-4 justify-items-center">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => digit(d))}
        <div className="w-[74px] h-[74px] grid place-items-center">{corner}</div>
        {digit('0')}
        <button type="button" aria-label={t('delete')} onClick={() => set(cur.current.slice(0, -1))} className="w-[74px] h-[74px] rounded-full grid place-items-center text-muted active:bg-surface2 transition"><Delete size={26} aria-hidden /></button>
      </div>
    </div>
  );
}
export const PinPad = Keypad;

const greeting = (t: ReturnType<typeof useT>['t']) => { const h = new Date().getHours(); return t(h < 12 ? 'goodMorning' : h < 17 ? 'goodAfternoon' : 'goodEvening'); };

export function LockScreen({ onUnlock }: { onUnlock: () => void }) {
  const { t, lang } = useT();
  const child = useChild();
  const [err, setErr] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [bio, setBio] = useState(false);
  const tryBio = useCallback(async () => { if (await bioUnlock()) onUnlock(); else setErr(t('fingerprintFailed')); }, [onUnlock, t]);
  useEffect(() => {
    let live = true;
    // When fingerprint unlock is on, ask for it straight away; the PIN keys stay ready if it is dismissed.
    void bioEnabled().then((on) => { if (!live) return; setBio(on); if (on) void bioUnlock().then((ok) => live && ok && onUnlock()); });
    return () => { live = false; };
  }, [onUnlock]);
  return (
    <main id="main" className="min-h-[100dvh] flex flex-col bg-bg">
      <header className="w-full max-w-md mx-auto flex items-center gap-3 px-4 pt-[max(1rem,env(safe-area-inset-top))]">
        <img src="/icons/icon-192.png" alt="" className="w-10 h-10 rounded-xl shadow-card" />
        <p className="flex-1 min-w-0 font-display font-bold leading-tight truncate">{meta.appTitle[lang]}</p>
        <ThemeButton />
        <LangButton />
      </header>
      <div className="flex-1 flex flex-col px-6 pt-4">
        <Keypad fill title={t('enterPin')} sub={t('enterPinSub')} error={err} busy={busy}
          head={(
            <div className="flex flex-col items-center mb-5">
              <span className="relative">
                <Avatar blobId={child?.photoBlobId} name={child?.name} size={88} />
                <span className="absolute -bottom-1 -end-1 w-8 h-8 rounded-full bg-surface border border-line grid place-items-center text-[rgb(var(--accent))] shadow-card"><Lock size={15} aria-hidden /></span>
              </span>
              <p className="text-muted text-sm mt-3">{greeting(t)}{child?.name ? ` · ${child.name}` : ''}</p>
            </div>
          )}
          corner={bio ? <button type="button" onClick={tryBio} aria-label={t('useFingerprint')} className="w-[74px] h-[74px] rounded-full grid place-items-center text-[rgb(var(--accent))] active:bg-soft transition"><Fingerprint size={34} aria-hidden /></button> : null}
          onSubmit={async (p) => {
            setBusy(true); setErr(undefined); const h = await getSetting<PinHash | null>('pin', null);
            if (h && (await verifyPin(p, h))) onUnlock(); else setErr(t('wrongPin'));
            setBusy(false);
          }} />
      </div>
      <footer className="w-full max-w-[320px] mx-auto px-6 pt-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
        <a className="w-full min-h-[50px] rounded-2xl border-2 border-[rgb(var(--danger)/0.35)] text-[rgb(var(--danger))] font-bold flex items-center justify-center gap-2 active:bg-[rgb(var(--danger)/0.08)] transition" href="tel:108"><Phone size={18} aria-hidden /> {t('emergency108')}</a>
      </footer>
    </main>
  );
}
