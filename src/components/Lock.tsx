import { useEffect, useRef, useState } from 'react';
import { Lock } from 'lucide-react';
import { getSetting } from '../lib/db';
import { verifyPin, type PinHash } from '../lib/crypto';
import { useT } from '../i18n';
import { meta } from '../lib/content';

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

export function PinPad({ onSubmit, error, busy, title }: { onSubmit: (pin: string) => void; error?: string; busy?: boolean; title: string }) {
  const { t } = useT();
  const [pin, setPin] = useState('');
  return (
    <form className="w-full max-w-xs mx-auto text-center" onSubmit={(e) => { e.preventDefault(); if (pin.length >= 4) onSubmit(pin); }}>
      <Lock className="mx-auto mb-3 text-accent" size={36} aria-hidden />
      <h1 className="text-xl font-extrabold mb-4">{title}</h1>
      <input autoFocus className="input text-center text-2xl tracking-[0.5em]" type="password" inputMode="numeric" pattern="[0-9]*" maxLength={8} aria-label={t('pin')} value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))} />
      {error && <p role="alert" className="text-danger font-bold mt-2">{error}</p>}
      <button className="btn-primary w-full mt-4" disabled={busy || pin.length < 4}>{busy ? t('checking') : t('unlock')}</button>
    </form>
  );
}

export function LockScreen({ onUnlock }: { onUnlock: () => void }) {
  const { t, lang } = useT();
  const [err, setErr] = useState<string>();
  const [busy, setBusy] = useState(false);
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 gap-6">
      <p className="font-head font-extrabold text-accent text-center">{meta.appTitle[lang]}</p>
      <PinPad title={t('enterPin')} error={err} busy={busy} onSubmit={async (p) => {
        setBusy(true); const h = await getSetting<PinHash | null>('pin', null);
        if (h && (await verifyPin(p, h))) onUnlock(); else setErr(t('wrongPin'));
        setBusy(false);
      }} />
      <a className="btn-danger" href="tel:108">{t('call108')}</a>
    </div>
  );
}
