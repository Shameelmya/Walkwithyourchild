import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { Phone, MapPin, X, Activity, Pencil } from 'lucide-react';
import { useT } from '../i18n';
import { db, getSheet } from '../lib/db';
import { useChild, useChildId, useWakeLockSafe } from '../lib/hooks';
import { sheetById, loc, callTel, extractPhone } from '../lib/content';
import { isActive } from '../lib/meds';
import { ageFrom } from '../lib/util';
import { Avatar, BottomBar } from '../components/ui';
import { LangButton } from '../components/LangButton';

export default function SOS() {
  const { t, lang } = useT();
  const nav = useNavigate();
  const child = useChild();
  const childId = useChildId();
  useWakeLockSafe();
  const d = useLiveQuery(async () => ({ card: ((await getSheet(childId, 'emergency')).values ?? {}) as Record<string, string>, me: ((await getSheet(childId, 'my-child')).values ?? {}) as Record<string, string>, meds: (await db.medicines.where('childId').equals(childId).toArray()).filter((m) => isActive(m)) }), [childId]);
  const [loc0, setLoc] = useState<string>('');
  const [locErr, setLocErr] = useState('');
  const sheet = sheetById('emergency')!;
  const contact = extractPhone(d?.card.contact) || extractPhone(d?.me.main_contact);
  const age = ageFrom(child?.dob);
  const share = () => {
    setLocErr('');
    if (!navigator.geolocation) return setLocErr(t('locationUnavailable'));
    navigator.geolocation.getCurrentPosition(async (p) => {
      const url = `https://maps.google.com/?q=${p.coords.latitude.toFixed(6)},${p.coords.longitude.toFixed(6)}`;
      setLoc(url);
      const text = t('locationMsg', { name: child?.name ?? '', url });
      if (navigator.share) { try { await navigator.share({ text }); return; } catch { /* fall through */ } }
      location.href = `https://wa.me/?text=${encodeURIComponent(text)}`;
    }, () => setLocErr(t('locationUnavailable')), { enableHighAccuracy: true, timeout: 15000 });
  };
  const row = (label: string, v?: string) => v ? <div className="py-2 border-b border-line/60"><p className="text-sm font-bold text-muted">{label}</p><p className="text-xl font-bold whitespace-pre-wrap">{v}</p></div> : null;
  return (
    <main id="main" className="min-h-screen bg-bg">
      <div className="t-rose text-white px-4 pt-4 pb-5 rounded-b-[32px] shadow-lift">
        <div className="flex items-center justify-between gap-2"><p className="text-2xl font-extrabold">{loc(sheet.banner, lang)}</p><div className="flex gap-2"><LangButton light /><button className="glass !w-12 !h-12" onClick={() => nav(-1)} aria-label={t('close')}><X /></button></div></div>
      </div>
      <div className="max-w-xl mx-auto px-4 py-4">
        <section className="card p-4" lang={lang}>
          <div className="flex items-center gap-3 mb-2"><Avatar blobId={child?.photoBlobId} name={child?.name} size={64} />
            <div><p className="text-3xl font-extrabold">{child?.name}</p>{age && <p className="text-lg text-muted">{t('ageYm', { y: age.y, m: age.m })}</p>}</div></div>
          {row(loc(sheetById('my-child')!.fields!.find((f) => f.id === 'condition')!.label, lang), d?.me.condition)}
          {row(loc(sheetById('my-child')!.fields!.find((f) => f.id === 'allergies')!.label, lang), d?.me.allergies)}
          {d?.meds.length ? row(t('currentMedicines'), d.meds.map((m) => `${m.name} – ${m.dose} (${m.times.join(', ')})`).join('\n')) : null}
          {sheet.fields!.map((f) => <div key={f.id}>{row(loc(f.label, lang), d?.card[f.id])}</div>)}
          {!d?.card.plan && <button className="btn-ghost mt-3" onClick={() => nav('/notebook/emergency')}><Pencil size={18} aria-hidden /> {t('fillEmergencyCard')}</button>}
        </section>
        {locErr && <p role="alert" className="font-bold text-danger mt-3">{locErr}</p>}
        {loc0 && <a className="underline break-all text-sm block mt-3" href={loc0}>{loc0}</a>}
      </div>
      {/* Thumb zone: every emergency action sits at the bottom of the screen. */}
      <BottomBar bare>
        <div className="w-full grid gap-2.5">
          <div className={contact ? 'grid grid-cols-2 gap-2.5' : 'grid gap-2.5'}>
            <button onClick={share} className="btn-outline !min-h-[56px]"><MapPin size={20} aria-hidden /> {t('shareLocation')}</button>
            {contact && <a href={callTel(contact)} className="btn-outline !min-h-[56px]"><Phone size={20} aria-hidden /> {t('callMainContact')}</a>}
          </div>
          <button className="btn-outline !min-h-[56px]" onClick={() => nav('/seizure')}><Activity size={20} aria-hidden /> {t('startSeizureTimer')}</button>
          <a href="tel:108" className="btn-danger text-2xl !min-h-[76px] !rounded-3xl"><Phone aria-hidden /> {t('call108')}</a>
        </div>
      </BottomBar>
    </main>
  );
}
