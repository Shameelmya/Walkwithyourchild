import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useT, type TKey } from '../../i18n';
import { Page, PageHeader, Empty, Modal, Confirm, FormFields, useToast, BottomBar, SheetActions, type FDef } from '../../components/ui';
import { Attachments, Thumb } from '../../components/Attachments';
import { db, type GenericRecord } from '../../lib/db';
import { useChildId } from '../../lib/hooks';
import { fmtDate, fmtDur, isoDate, cx } from '../../lib/util';

type Kind = 'consultations' | 'diagnoses' | 'reports' | 'admissions' | 'treatments';
const KINDS: Record<Kind, { label: TKey; fields: FDef[]; title: string; color: string }> = {
  consultations: { label: 'consultations', title: 'doctor', color: 'var(--p5)', fields: [
    { key: 'date', label: 'date', type: 'date', required: true }, { key: 'doctor', label: 'doctor', type: 'text' }, { key: 'hospital', label: 'hospital', type: 'text' },
    { key: 'reason', label: 'reason', type: 'textarea' }, { key: 'findings', label: 'findings', type: 'textarea' }, { key: 'advice', label: 'advice', type: 'textarea' }, { key: 'next', label: 'nextVisitDate', type: 'date' }] },
  diagnoses: { label: 'diagnoses', title: 'name', color: 'var(--p4)', fields: [
    { key: 'date', label: 'date', type: 'date', required: true }, { key: 'name', label: 'diagnosisName', type: 'text' }, { key: 'doctor', label: 'doctor', type: 'text' }, { key: 'hospital', label: 'hospital', type: 'text' }, { key: 'notes', label: 'notes', type: 'textarea' }] },
  reports: { label: 'reports', title: 'name', color: 'var(--p1)', fields: [
    { key: 'date', label: 'date', type: 'date', required: true }, { key: 'name', label: 'testName', type: 'text' }, { key: 'hospital', label: 'labOrHospital', type: 'text' }, { key: 'result', label: 'result', type: 'textarea' }] },
  admissions: { label: 'admissions', title: 'hospital', color: 'var(--p3)', fields: [
    { key: 'date', label: 'admittedOn', type: 'date', required: true }, { key: 'until', label: 'dischargedOn', type: 'date' }, { key: 'hospital', label: 'hospital', type: 'text' }, { key: 'reason', label: 'reason', type: 'textarea' }, { key: 'summary', label: 'dischargeSummary', type: 'textarea' }] },
  treatments: { label: 'treatments', title: 'treatment', color: 'var(--p2)', fields: [
    { key: 'date', label: 'date', type: 'date', required: true }, { key: 'treatment', label: 'treatmentTried', type: 'text' }, { key: 'where', label: 'where', type: 'text' }, { key: 'cost', label: 'totalCost', type: 'number' }, { key: 'changed', label: 'whatChanged', type: 'textarea' }] },
};
const ALL = Object.keys(KINDS) as Kind[];

interface TItem { date: string; kind: string; title: string; sub?: string; files?: number[]; to: string; color: string }

function Timeline() {
  const { t, lang } = useT();
  const childId = useChildId();
  const [filter, setFilter] = useState<string>('all');
  const items = useLiveQuery(async () => {
    const out: TItem[] = [];
    for (const k of ALL) for (const r of await db[k].where('childId').equals(childId).toArray())
      out.push({ date: r.date, kind: k, title: String(r[KINDS[k].title] || t(KINDS[k].label)), sub: [r.hospital, r.doctor].filter(Boolean).join(' · '), files: r.files as number[] | undefined, to: `/records/${k}?edit=${r.id}`, color: KINDS[k].color });
    for (const s of await db.seizures.where('childId').equals(childId).toArray()) out.push({ date: isoDate(new Date(s.start)), kind: 'seizures', title: t('seizureOf', { d: fmtDur(s.durationSec) }), to: '/seizures', color: 'var(--ur)' });
    for (const v of await db.visits.where('childId').equals(childId).toArray()) out.push({ date: v.date, kind: 'visits', title: t('doctorVisit'), sub: [v.doctor, v.hospital].filter(Boolean).join(' · '), to: '/visits', color: 'var(--p5)' });
    for (const p of await db.progress.where('childId').equals(childId).toArray()) out.push({ date: p.date, kind: 'progress', title: t('checkIn'), sub: p.notes, to: '/progress', color: 'var(--p2)' });
    return out.sort((a, b) => b.date.localeCompare(a.date));
  }, [childId, lang]) ?? [];
  const kinds = ['all', ...ALL, 'seizures', 'visits', 'progress'];
  const shown = filter === 'all' ? items : items.filter((i) => i.kind === filter);
  return (
    <>
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 mb-3 -mx-4 px-4" role="group" aria-label={t('filter')}>
        {kinds.map((k) => <button key={k} aria-pressed={filter === k} className={cx('chip shrink-0', filter === k && 'chip-on')} onClick={() => setFilter(k)}>{t((k === 'all' ? 'all' : k === 'seizures' ? 'navSeizures' : k === 'visits' ? 'navVisits' : k === 'progress' ? 'navProgress' : KINDS[k as Kind].label) as TKey)}</button>)}
      </div>
      {!shown.length ? <Empty kind="doc" title={t('nothingYet')} text={t('recordsEmptyText')} /> : (
        <ol className="relative border-s-2 border-line ms-3 grid gap-3">
          {shown.map((i, n) => (
            <li key={n} className="ms-5 relative">
              <span className="absolute -start-[29px] top-4 w-4 h-4 rounded-full border-4 border-bg" style={{ background: i.color }} aria-hidden />
              <Link to={i.to} className="card block p-3 hover:bg-surface2">
                <p className="text-xs font-extrabold" style={{ color: i.color }}>{fmtDate(i.date, lang)} · {t((i.kind === 'seizures' ? 'navSeizures' : i.kind === 'visits' ? 'navVisits' : i.kind === 'progress' ? 'navProgress' : KINDS[i.kind as Kind].label) as TKey)}</p>
                <p className="font-bold">{i.title}</p>{i.sub && <p className="text-sm text-muted line-clamp-2">{i.sub}</p>}
              </Link>
            </li>
          ))}
        </ol>
      )}
    </>
  );
}

function KindList({ kind }: { kind: Kind }) {
  const { t, lang } = useT();
  const childId = useChildId();
  const toast = useToast((s) => s.show);
  const [sp, setSp] = useSearchParams();
  const cfg = KINDS[kind];
  const list = useLiveQuery(() => db[kind].where('childId').equals(childId).reverse().sortBy('date'), [childId, kind]) ?? [];
  const [edit, setEdit] = useState<GenericRecord | null>(null);
  const [del, setDel] = useState<GenericRecord | null>(null);
  useEffect(() => { const id = sp.get('edit'); if (id) db[kind].get(+id).then((r) => { if (r) setEdit(r); setSp({}, { replace: true }); }); }, [sp, kind, setSp]);
  const save = async () => {
    if (!edit?.date) return toast(t('dateNeeded'));
    if (edit.id) await db[kind].put(edit); else await db[kind].add(edit);
    setEdit(null); toast(t('saved'));
  };
  return (
    <>
      {!list.length ? <Empty kind="doc" title={t('nothingYet')} /> : (
        <ul className="grid gap-2">
          {list.map((r) => (
            <li key={r.id} className="card p-3 flex gap-2 items-start">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-extrabold" style={{ color: cfg.color }}>{fmtDate(r.date, lang)}{r.until ? ` – ${fmtDate(String(r.until), lang)}` : ''}</p>
                <p className="font-bold">{String(r[cfg.title] || '—')}</p>
                {cfg.fields.filter((f) => f.type === 'textarea' && r[f.key]).slice(0, 2).map((f) => <p key={f.key} className="text-sm"><b className="text-muted">{t(f.label)}:</b> {String(r[f.key])}</p>)}
                {!!(r.files as number[] | undefined)?.length && <div className="flex gap-2 mt-2 flex-wrap">{(r.files as number[]).map((id) => <Thumb key={id} id={id} />)}</div>}
              </div>
              <button className="icon-btn" aria-label={t('edit')} onClick={() => setEdit(r)}><Pencil size={20} /></button>
              <button className="icon-btn" aria-label={t('delete')} onClick={() => setDel(r)}><Trash2 size={20} /></button>
            </li>
          ))}
        </ul>
      )}
      <Modal open={!!edit} onClose={() => setEdit(null)} title={t(cfg.label)}>
        {edit && (<>
          <FormFields fields={cfg.fields} value={edit} onChange={(v) => setEdit(v as GenericRecord)} />
          {kind !== 'treatments' && <div className="mt-4"><Attachments value={(edit.files as number[]) ?? []} onChange={(files) => setEdit({ ...edit, files })} /></div>}
          <SheetActions><button className="btn-primary" onClick={save}>{t('save')}</button></SheetActions>
        </>)}
      </Modal>
      <BottomBar><button className="btn-primary w-full" onClick={() => setEdit({ childId, date: isoDate(), files: [] })}><Plus size={18} aria-hidden /> {t(cfg.label)}</button></BottomBar>
      <Confirm open={!!del} danger text={t('deleteEntryQ')} onNo={() => setDel(null)} onYes={async () => { await db[kind].delete(del!.id!); setDel(null); }} />
    </>
  );
}

export default function Records() {
  const { kind } = useParams();
  const { t } = useT();
  const k = ALL.includes(kind as Kind) ? (kind as Kind) : null;
  return (
    <Page>
      <PageHeader title={k ? t(KINDS[k].label) : t('navRecords')} back={k ? '/records' : true} />
      <nav className="flex flex-wrap gap-2 mb-5" aria-label={t('navRecords')}>
        <Link to="/records" className={cx('chip justify-center', !k && 'chip-on')}>{t('timeline')}</Link>
        {ALL.map((x) => <Link key={x} to={`/records/${x}`} className={cx('chip text-center', k === x && 'chip-on')}>{t(KINDS[x].label)}</Link>)}
      </nav>
      {k ? <KindList kind={k} /> : <Timeline />}
    </Page>
  );
}
