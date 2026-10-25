import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { Plus, Pencil, Trash2, ClipboardCheck, HelpCircle } from 'lucide-react';
import { useT } from '../../i18n';
import { Page, PageHeader, Empty, Modal, Confirm, FormFields, Section, useToast, BottomBar, SheetActions, type FDef } from '../../components/ui';
import { db, getSheet, type Visit } from '../../lib/db';
import { useChildId } from '../../lib/hooks';
import { fmtDate, isoDate } from '../../lib/util';

const FIELDS: FDef[] = [
  { key: 'date', label: 'date', type: 'date', required: true }, { key: 'time', label: 'time', type: 'time' },
  { key: 'doctor', label: 'doctor', type: 'text' }, { key: 'hospital', label: 'hospital', type: 'text' }, { key: 'purpose', label: 'visitPurpose', type: 'textarea' },
];

export default function Visits() {
  const { t, lang } = useT();
  const childId = useChildId();
  const nav = useNavigate();
  const toast = useToast((s) => s.show);
  const visits = useLiveQuery(() => db.visits.where('childId').equals(childId).sortBy('date'), [childId]) ?? [];
  const questions = useLiveQuery(async () => (((await getSheet(childId, 'questions')).rows as Record<string, string>[]) ?? []).filter((r) => r.question && !r.answer), [childId]) ?? [];
  const [edit, setEdit] = useState<Record<string, unknown> | null>(null);
  const [del, setDel] = useState<Visit | null>(null);
  const today = isoDate();
  const upcoming = visits.filter((v) => !v.done && v.date >= today);
  const past = visits.filter((v) => v.done || v.date < today).reverse();
  const save = async () => {
    if (!edit?.date) return toast(t('dateNeeded'));
    const v = { childId, date: String(edit.date), time: String(edit.time ?? ''), doctor: String(edit.doctor ?? ''), hospital: String(edit.hospital ?? ''), purpose: String(edit.purpose ?? ''), done: !!edit.done };
    if (edit.id) await db.visits.update(edit.id as number, v); else await db.visits.add(v);
    setEdit(null); toast(t('saved'));
  };
  const record = async (v: Visit) => {
    await db.visits.update(v.id!, { done: true });
    const id = await db.consultations.add({ childId, date: v.date, doctor: v.doctor, hospital: v.hospital, reason: v.purpose, findings: '', advice: '', next: '' });
    nav(`/records/consultations?edit=${id}`);
  };
  const card = (v: Visit, up: boolean) => (
    <li key={v.id} className="card p-4">
      <div className="flex gap-2 items-start">
        <div className="flex-1 min-w-0">
          <p className="text-lg font-extrabold">{fmtDate(v.date, lang, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}{v.time ? ` · ${v.time}` : ''}</p>
          <p className="text-muted">{[v.doctor, v.hospital].filter(Boolean).join(' · ')}</p>
          {v.purpose && <p className="mt-1">{v.purpose}</p>}
        </div>
        <button className="icon-btn" aria-label={t('edit')} onClick={() => setEdit({ ...v })}><Pencil size={20} /></button>
        <button className="icon-btn" aria-label={t('delete')} onClick={() => setDel(v)}><Trash2 size={20} /></button>
      </div>
      {up && !!questions.length && (
        <div className="mt-3 rounded-xl bg-[var(--p5t)] p-3">
          <p className="font-extrabold flex items-center gap-2 mb-1"><HelpCircle size={18} aria-hidden /> {t('questionsToAsk', { n: questions.length })}</p>
          <ul className="list-disc ps-5 grid gap-1">{questions.map((q, i) => <li key={i}>{q.question}</li>)}</ul>
        </div>
      )}
      {!v.done && <button className="btn-outline mt-3" onClick={() => record(v)}><ClipboardCheck size={18} aria-hidden /> {t('recordVisit')}</button>}
    </li>
  );
  return (
    <Page>
      <PageHeader title={t('navVisits')} />
      <Section title={t('upcoming')}>{upcoming.length ? <ul className="grid gap-3">{upcoming.map((v) => card(v, true))}</ul> : <Empty kind="calendar" title={t('noVisits')} text={t('noVisitsText')} />}</Section>
      {!!past.length && <Section title={t('pastVisits')}><ul className="grid gap-3">{past.map((v) => card(v, false))}</ul></Section>}
      <Modal open={!!edit} onClose={() => setEdit(null)} title={t('doctorVisit')}>
        {edit && <><FormFields fields={FIELDS} value={edit} onChange={setEdit} /><p className="text-sm text-muted mt-3">{t('visitReminderNote')}</p><SheetActions><button className="btn-primary" onClick={save}>{t('save')}</button></SheetActions></>}
      </Modal>
      <BottomBar><button className="btn-primary w-full" onClick={() => setEdit({ date: '' })}><Plus size={18} aria-hidden /> {t('doctorVisit')}</button></BottomBar>
      <Confirm open={!!del} danger text={t('deleteEntryQ')} onNo={() => setDel(null)} onYes={async () => { await db.visits.delete(del!.id!); setDel(null); }} />
    </Page>
  );
}
