import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Plus, Pencil, Trash2, Check, X, Clock, Bell } from 'lucide-react';
import { useT } from '../../i18n';
import { Page, PageHeader, Empty, Modal, Confirm, Section, useToast, BottomBar, SheetActions } from '../../components/ui';
import { db, type Medicine, type DoseStatus } from '../../lib/db';
import { useChildId } from '../../lib/hooks';
import { isActive, logDose, todaySlots, undoDose } from '../../lib/meds';
import { fmtDate, isoDate, cx } from '../../lib/util';

const blank = (childId: number): Medicine => ({ childId, name: '', purpose: '', dose: '', times: ['08:00'], start: isoDate(), stop: '', notes: '', createdAt: Date.now() });

export default function Medicines() {
  const { t, lang } = useT();
  const childId = useChildId();
  const toast = useToast((s) => s.show);
  const meds = useLiveQuery(() => db.medicines.where('childId').equals(childId).toArray(), [childId]) ?? [];
  const slots = useLiveQuery(() => todaySlots(childId), [childId]) ?? [];
  const history = useLiveQuery(() => db.doseLogs.where('childId').equals(childId).reverse().sortBy('at').then((l) => l.slice(0, 40)), [childId]) ?? [];
  const [edit, setEdit] = useState<Medicine | null>(null);
  const [del, setDel] = useState<Medicine | null>(null);
  const [perm, setPerm] = useState(typeof Notification !== 'undefined' ? Notification.permission : 'denied');
  const save = async () => {
    if (!edit || !edit.name.trim()) return toast(t('nameNeeded'));
    const m = { ...edit, times: edit.times.filter(Boolean) };
    if (m.id) await db.medicines.put(m); else await db.medicines.add(m);
    setEdit(null); toast(t('saved'));
  };
  const statusBtn = (s: DoseStatus, I: typeof Check) => ({ s, I });
  const btns = [statusBtn('given', Check), statusBtn('late', Clock), statusBtn('skipped', X)];
  const active = meds.filter((m) => isActive(m));
  const past = meds.filter((m) => !isActive(m));
  return (
    <Page>
      <PageHeader title={t('navMedicines')} />
      {perm === 'default' && (
        <button className="card w-full p-3 mb-4 flex items-center gap-3 text-left" onClick={async () => setPerm(await Notification.requestPermission())}>
          <Bell className="text-accent" aria-hidden /><span className="flex-1"><b>{t('enableReminders')}</b><br /><span className="text-sm text-muted">{t('remindersHonest')}</span></span>
        </button>
      )}
      <Section title={t('todaySchedule')}>
        {!slots.length ? <p className="text-muted">{t('noMedsToday')}</p> : (
          <ul className="grid gap-2">
            {slots.map((s) => (
              <li key={`${s.med.id}-${s.time}`} className={cx('card p-3', s.log && 'opacity-90')}>
                <div className="flex items-center gap-3 mb-2"><span className="text-xl font-extrabold w-16">{s.time}</span><span className="flex-1 min-w-0"><b className="block truncate">{s.med.name}</b><span className="text-sm text-muted">{s.med.dose}</span></span>
                  {s.log && <span className="chip chip-on !min-h-[32px]">{t(s.log.status)}</span>}</div>
                <div className="flex gap-2 flex-wrap">
                  {btns.map(({ s: st, I }) => (
                    <button key={st} aria-pressed={s.log?.status === st} className={cx('chip', s.log?.status === st && 'chip-on')} onClick={() => (s.log?.status === st ? undoDose(s.med.id!, s.time) : logDose(childId, s.med.id!, s.time, st))}><I size={16} aria-hidden /> {t(st)}</button>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Section>
      <Section title={t('allMedicines')}>
        {!meds.length ? <Empty kind="pills" title={t('noMedicines')} text={t('noMedicinesText')} /> : (
          <ul className="grid gap-2">
            {[...active, ...past].map((m) => (
              <li key={m.id} className={cx('card p-3 flex gap-3', !isActive(m) && 'opacity-70')}>
                <div className="flex-1 min-w-0">
                  <p className="font-extrabold">{m.name} <span className="font-semibold text-muted">· {m.dose}</span></p>
                  {m.purpose && <p className="text-sm">{m.purpose}</p>}
                  <p className="text-sm text-muted">{m.times.join(', ')}{m.start ? ` · ${t('from')} ${fmtDate(m.start, lang)}` : ''}{m.stop ? ` · ${t('until')} ${fmtDate(m.stop, lang)}` : ''}</p>
                  {m.notes && <p className="text-sm mt-1 whitespace-pre-wrap">{m.notes}</p>}
                </div>
                <div className="flex flex-col"><button className="icon-btn" aria-label={t('edit')} onClick={() => setEdit(m)}><Pencil size={20} /></button><button className="icon-btn" aria-label={t('delete')} onClick={() => setDel(m)}><Trash2 size={20} /></button></div>
              </li>
            ))}
          </ul>
        )}
      </Section>
      {!!history.length && (
        <Section title={t('doseHistory')}>
          <ul className="card divide-y divide-line/60">
            {history.map((h) => <li key={h.id} className="flex gap-3 px-3 py-2 text-sm"><span className="w-28 text-muted">{fmtDate(h.date, lang, { day: 'numeric', month: 'short' })} {h.time}</span><span className="flex-1 truncate">{meds.find((m) => m.id === h.medicineId)?.name}</span><b>{t(h.status)}</b></li>)}
          </ul>
        </Section>
      )}
      <Modal open={!!edit} onClose={() => setEdit(null)} title={edit?.id ? t('editMedicine') : t('addMedicine')}>
        {edit && (
          <div className="grid gap-4">
            {(['name', 'purpose', 'dose'] as const).map((k) => (
              <div key={k}><label className="label" htmlFor={`m-${k}`}>{t(k === 'name' ? 'medName' : k === 'purpose' ? 'medPurpose' : 'medDose')}{k === 'name' && ' *'}</label><input id={`m-${k}`} className="input" value={edit[k]} onChange={(e) => setEdit({ ...edit, [k]: e.target.value })} /></div>
            ))}
            <div><p className="label">{t('medTimes')}</p>
              <div className="grid gap-2">{edit.times.map((tm, i) => (
                <div key={i} className="flex gap-2"><input type="time" aria-label={t('medTimes')} className="input" value={tm} onChange={(e) => { const ts = [...edit.times]; ts[i] = e.target.value; setEdit({ ...edit, times: ts }); }} />
                  <button className="icon-btn" aria-label={t('delete')} onClick={() => setEdit({ ...edit, times: edit.times.filter((_, j) => j !== i) })}><X /></button></div>
              ))}<button className="btn-ghost justify-self-start" onClick={() => setEdit({ ...edit, times: [...edit.times, '20:00'] })}><Plus size={18} aria-hidden /> {t('addTime')}</button></div></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label" htmlFor="m-start">{t('startDate')}</label><input id="m-start" type="date" className="input" value={edit.start ?? ''} onChange={(e) => setEdit({ ...edit, start: e.target.value })} /></div>
              <div><label className="label" htmlFor="m-stop">{t('stopDate')}</label><input id="m-stop" type="date" className="input" value={edit.stop ?? ''} onChange={(e) => setEdit({ ...edit, stop: e.target.value })} /></div>
            </div>
            <div><label className="label" htmlFor="m-notes">{t('medNotes')}</label><textarea id="m-notes" className="input min-h-[80px]" value={edit.notes} onChange={(e) => setEdit({ ...edit, notes: e.target.value })} /></div>
            <SheetActions><button className="btn-primary" onClick={save}>{t('save')}</button></SheetActions>
          </div>
        )}
      </Modal>
      <BottomBar><button className="btn-primary w-full" onClick={() => setEdit(blank(childId))}><Plus size={18} aria-hidden /> {t('addMedicine')}</button></BottomBar>
      <Confirm open={!!del} danger text={t('deleteMedQ')} onNo={() => setDel(null)} onYes={async () => { await db.medicines.delete(del!.id!); setDel(null); }} />
    </Page>
  );
}
