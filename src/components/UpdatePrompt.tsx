import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { useT } from '../i18n';

// Screens where a sudden reload would interrupt something important.
const BUSY = /^\/(seizure|sos|onboarding|play)/;

let registration: ServiceWorkerRegistration | undefined;
/** Used by Settings → Check for updates. Resolves to what happened; a found update installs and the app reloads itself. */
export async function checkForUpdates(): Promise<'latest' | 'updating' | 'offline' | 'error'> {
  if (!navigator.onLine) return 'offline';
  const reg = registration ?? (await navigator.serviceWorker?.getRegistration());
  if (!reg) return 'error';
  try { await reg.update(); } catch { return 'error'; }
  if (reg.installing || reg.waiting) {
    const sw = reg.waiting;
    if (sw) sw.postMessage({ type: 'SKIP_WAITING' });
    setTimeout(() => location.reload(), 4000); // in case the switch-over event is missed
    return 'updating';
  }
  return 'latest';
}

/** Keeps the installed app current: checks for a new version on open, on return to the app and every 30 minutes,
 *  and switches to it straight away unless an emergency screen is open (then it waits and offers a button). */
export function UpdatePrompt() {
  const { t } = useT();
  const loc = useLocation();
  const [pending, setPending] = useState(false);
  const { needRefresh: [need], updateServiceWorker } = useRegisterSW({
    immediate: true,
    onRegisteredSW(_url, reg) {
      if (!reg) return;
      registration = reg;
      const check = () => { if (navigator.onLine) void reg.update().catch(() => {}); };
      setInterval(check, 30 * 60_000);
      document.addEventListener('visibilitychange', () => document.visibilityState === 'visible' && check());
    },
  });
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    let had = !!navigator.serviceWorker.controller;
    const onChange = () => {
      if (!had) { had = true; return; } // first install: nothing to refresh
      if (BUSY.test(location.pathname)) setPending(true); else location.reload();
    };
    navigator.serviceWorker.addEventListener('controllerchange', onChange);
    return () => navigator.serviceWorker.removeEventListener('controllerchange', onChange);
  }, []);
  // A waiting update (older service worker without skipWaiting) is activated right away, or when leaving a busy screen.
  useEffect(() => { if (need && !BUSY.test(loc.pathname)) void updateServiceWorker(true); }, [need, loc.pathname, updateServiceWorker]);
  useEffect(() => { if (pending && !BUSY.test(loc.pathname)) location.reload(); }, [pending, loc.pathname]);
  if (!pending && !need) return null;
  return (
    <div role="status" className="fixed z-[65] left-4 right-4 top-4 lg:left-auto lg:right-6 lg:w-96 glass-panel rounded-2xl shadow-lift border border-line/60 p-3 flex items-center gap-3 anim-zoom">
      <p className="flex-1 text-sm font-semibold">{t('updateReady')}</p>
      <button className="btn-primary !min-h-[40px] px-4 text-sm" onClick={() => (need ? updateServiceWorker(true) : location.reload())}>{t('update')}</button>
    </div>
  );
}
