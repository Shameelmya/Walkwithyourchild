import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { BellRing, Check, X, AlarmClock } from 'lucide-react';
import { db, getSetting } from '../lib/db';
import { logDose, todaySlots, type Slot } from '../lib/meds';
import { alarm } from '../lib/audio';
import { addDays, hhmm, isoDate } from '../lib/util';
import { useT } from '../i18n';
import { useChildId } from '../lib/hooks';

const WINDOW_MIN = 180; // a dose missed by more than 3 hours no longer rings; it stays in today's schedule
const SNOOZE_MIN = 10;
const minutes = (s: string) => { const [h, m] = s.split(':').map(Number); return h * 60 + m; };
const key = (s: Slot) => `${isoDate()}:${s.med.id}:${s.time}`;
const store = {
  get: (k: string) => { try { return localStorage.getItem(k); } catch { return null; } },
  set: (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* */ } },
};
const snoozedUntil = (s: Slot) => Number(store.get('snooze:' + key(s)) || 0);

async function notify(title: string, body: string, tag: string, sticky: boolean) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  const opts = { body, tag, icon: '/icons/icon-192.png', badge: '/icons/icon-192.png', requireInteraction: sticky, renotify: sticky, vibrate: [600, 300, 600, 300, 600], data: { url: '/medicines' } };
  try {
    const reg = await navigator.serviceWorker?.getRegistration();
    if (reg) await reg.showNotification(title, opts as NotificationOptions);
    else new Notification(title, opts as NotificationOptions);
  } catch { /* ignore */ }
}
const once = (k: string) => { if (store.get('n:' + k)) return false; store.set('n:' + k, '1'); return true; };

/**
 * Medicine alarm. When a dose is due, a full-screen alarm opens and keeps ringing (sound and vibration)
 * until it is confirmed as given or not given, or put off for 10 minutes. While the app is in the
 * background, a notification that stays until tapped is shown, and repeated every 2 minutes.
 */
export function Reminders() {
  const { t } = useT();
  const childId = useChildId();
  const [due, setDue] = useState<Slot[]>([]);
  const lastPing = useRef<Record<string, number>>({});

  useEffect(() => {
    let live = true;
    const check = async () => {
      if (!childId) return;
      const on = await getSetting('reminders', true);
      const now = minutes(hhmm());
      const midnight = new Date(); midnight.setHours(0, 0, 0, 0);
      // A dose rings only if its time came after the medicine was added (adding at 9:00 a medicine taken at 8:00 does not ring).
      const slots = on ? (await todaySlots(childId)).filter((s) => !s.log && minutes(s.time) <= now && now - minutes(s.time) <= WINDOW_MIN
        && midnight.getTime() + minutes(s.time) * 60_000 >= (s.med.createdAt ?? 0) && snoozedUntil(s) <= Date.now()) : [];
      if (!live) return;
      setDue(slots);
      if (!on) return;
      for (const s of slots) {
        const k = key(s);
        if (document.visibilityState === 'hidden' && Date.now() - (lastPing.current[k] ?? 0) > 2 * 60_000) {
          lastPing.current[k] = Date.now();
          void notify(t('medDueTitle'), `${s.med.name} · ${s.med.dose} · ${s.time}`, `med-${k}`, true);
        }
      }
      const tomorrow = isoDate(addDays(new Date(), 1));
      const visits = await db.visits.where('date').equals(tomorrow).toArray();
      for (const v of visits) if (!v.done && once(`visit:${v.id}`)) void notify(t('visitTomorrowTitle'), [v.doctor, v.hospital, v.time].filter(Boolean).join(' · '), `visit-${v.id}`, false);
    };
    void check();
    const h = setInterval(check, 15_000);
    const vis = () => { if (document.visibilityState === 'visible') void check(); };
    document.addEventListener('visibilitychange', vis);
    return () => { live = false; clearInterval(h); document.removeEventListener('visibilitychange', vis); };
  }, [childId, t]);

  // Ring until every due dose is answered.
  const ringing = due.length > 0;
  useEffect(() => {
    if (!ringing) return;
    const ring = () => { try { alarm(); } catch { /* sound blocked until the next tap */ } try { navigator.vibrate?.([600, 300, 600, 300, 600]); } catch { /* */ } };
    ring();
    const h = setInterval(ring, 3500);
    return () => { clearInterval(h); try { navigator.vibrate?.(0); } catch { /* */ } };
  }, [ringing]);

  if (!ringing) return null;
  const answer = async (s: Slot, status: 'given' | 'skipped') => {
    await logDose(s.med.childId, s.med.id!, s.time, status);
    setDue((d) => d.filter((x) => key(x) !== key(s)));
    void navigator.serviceWorker?.getRegistration().then((r) => r?.getNotifications({ tag: `med-${key(s)}` })).then((ns) => ns?.forEach((n) => n.close())).catch(() => {});
  };
  const snooze = () => {
    for (const s of due) store.set('snooze:' + key(s), String(Date.now() + SNOOZE_MIN * 60_000));
    setDue([]);
  };
  return createPortal(
    <div role="alertdialog" aria-modal="true" aria-labelledby="med-alarm-title" className="fixed inset-0 z-[90] bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-3">
      <div className="w-full max-w-md bg-surface rounded-[2rem] shadow-2xl p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] anim-sheet">
        <div className="flex items-center gap-3 mb-4">
          <span className="w-14 h-14 rounded-full bg-[rgb(var(--danger)/0.12)] text-[rgb(var(--danger))] grid place-items-center animate-pulse"><BellRing size={28} aria-hidden /></span>
          <h2 id="med-alarm-title" className="text-2xl font-extrabold">{t('medDueTitle')}</h2>
        </div>
        <ul className="grid gap-3 max-h-[55vh] overflow-y-auto">
          {due.map((s) => (
            <li key={key(s)} className="rounded-2xl border border-line p-4">
              <p className="text-lg font-extrabold">{s.med.name}</p>
              <p className="text-muted">{[s.med.dose, s.time].filter(Boolean).join(' · ')}</p>
              <div className="grid grid-cols-2 gap-2 mt-3">
                <button className="btn-primary !min-h-[56px]" onClick={() => answer(s, 'given')}><Check size={20} aria-hidden /> {t('given')}</button>
                <button className="btn-ghost !min-h-[56px]" onClick={() => answer(s, 'skipped')}><X size={20} aria-hidden /> {t('skipped')}</button>
              </div>
            </li>
          ))}
        </ul>
        <button className="btn-outline w-full mt-3 !min-h-[52px]" onClick={snooze}><AlarmClock size={20} aria-hidden /> {t('snooze10')}</button>
        <p className="text-sm text-muted mt-3 text-center">{t('alarmStops')}</p>
      </div>
    </div>,
    document.body,
  );
}
