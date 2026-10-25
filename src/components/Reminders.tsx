import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BellRing } from 'lucide-react';
import { db, getSetting } from '../lib/db';
import { logDose, todaySlots, type Slot } from '../lib/meds';
import { addDays, hhmm, isoDate } from '../lib/util';
import { useT } from '../i18n';
import { useChildId } from '../lib/hooks';

async function notify(title: string, body: string, tag: string) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  try {
    const reg = await navigator.serviceWorker?.getRegistration();
    if (reg) await reg.showNotification(title, { body, tag, icon: '/icons/icon-192.png', badge: '/icons/icon-192.png' });
    else new Notification(title, { body, tag });
  } catch { /* ignore */ }
}
const seen = (k: string) => { try { if (localStorage.getItem('n:' + k)) return true; localStorage.setItem('n:' + k, '1'); } catch { /* */ } return false; };

export function Reminders() {
  const { t } = useT();
  const childId = useChildId();
  const nav = useNavigate();
  const [due, setDue] = useState<Slot[]>([]);
  useEffect(() => {
    let live = true;
    const check = async () => {
      if (!childId) return;
      const on = await getSetting('reminders', true);
      const now = hhmm(); const today = isoDate();
      const slots = (await todaySlots(childId)).filter((s) => !s.log && s.time <= now && minutes(now) - minutes(s.time) <= 90);
      if (live) setDue(on ? slots : []);
      if (!on) return;
      for (const s of slots) if (!seen(`${today}:${s.med.id}:${s.time}`)) void notify(t('medDueTitle'), `${s.med.name} · ${s.med.dose} · ${s.time}`, `med-${s.med.id}-${s.time}`);
      const tomorrow = isoDate(addDays(new Date(), 1));
      const visits = await db.visits.where('date').equals(tomorrow).toArray();
      for (const v of visits) if (!v.done && !seen(`visit:${v.id}`)) void notify(t('visitTomorrowTitle'), [v.doctor, v.hospital, v.time].filter(Boolean).join(' · '), `visit-${v.id}`);
    };
    void check();
    const h = setInterval(check, 30_000);
    return () => { live = false; clearInterval(h); };
  }, [childId, t]);
  if (!due.length) return null;
  const s = due[0];
  return (
    <div role="alert" className="fixed z-[45] start-3 end-3 top-16 lg:top-4 lg:start-auto lg:end-6 lg:w-[26rem] card p-3 flex items-center gap-3 anim-in border-accent/40">
      <BellRing className="text-accent shrink-0" aria-hidden />
      <button className="flex-1 text-start min-w-0" onClick={() => nav('/medicines')}>
        <p className="font-extrabold truncate">{s.med.name} · {s.time}</p>
        <p className="text-sm text-muted truncate">{s.med.dose}{due.length > 1 ? ` · +${due.length - 1}` : ''}</p>
      </button>
      <button className="btn-primary px-4" onClick={async () => { await logDose(s.med.childId, s.med.id!, s.time, 'given'); setDue(due.slice(1)); }}>{t('given')}</button>
    </div>
  );
}
const minutes = (s: string) => { const [h, m] = s.split(':').map(Number); return h * 60 + m; };
