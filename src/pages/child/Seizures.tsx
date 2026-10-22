import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { Activity, Pencil, Trash2, Plus, Video } from 'lucide-react';
import { useT } from '../../i18n';
import { Page, PageHeader, Empty, Modal, Confirm, FormFields, useToast, BottomBar, SheetActions, type FDef } from '../../components/ui';
import { db, type Seizure } from '../../lib/db';
import { useBlobUrl, useChildId } from '../../lib/hooks';
import { fmtDate, fmtDur, fmtTime, hhmm, isoDate } from '../../lib/util';
import { BarChart } from '../../components/Charts';

const FIELDS: FDef[] = [
  { key: 'date', label: 'date', type: 'date' }, { key: 'time', label: 'time', type: 'time' }, { key: 'minutes', label: 'durationMin', type: 'number' },
  { key: 'looked', label: 'szLooked', type: 'textarea' }, { key: 'helped', label: 'szHelped', type: 'textarea' }, { key: 'rescue', label: 'szRescue', type: 'yesno' }, { key: 'notes', label: 'notes', type: 'textarea' },
];

function VideoView({ id }: { id: number }) { const url = useBlobUrl(id); return url ? <video src={url} controls playsInline className="w-full rounded-xl mt-2 max-h-64 bg-black" /> : null; }

export default function Seizures() {
  const { t, lang } = useT();
  const childId = useChildId();
  const [sp, setSp] = useSearchParams();
  const toast = useToast((s) => s.show);
  const list = useLiveQuery(() => db.seizures.where('childId').equals(childId).reverse().sortBy('start'), [childId]) ?? [];
  const [edit, setEdit] = useState<{ s?: Seizure; v: Record<string, unknown> } | null>(null);
  const [del, setDel] = useState<Seizure | null>(null);
  const open = (s?: Seizure) => setEdit({ s, v: s ? { date: isoDate(new Date(s.start)), time: hhmm(new Date(s.start)), minutes: Math.round(s.durationSec / 6) / 10, looked: s.looked, helped: s.helped, rescue: s.rescue, notes: s.notes } : { date: isoDate(), time: hhmm(), minutes: 1 } });
  const saved = sp.get('saved') ?? (() => { try { return sessionStorage.getItem('wwyc-open-seizure'); } catch { return null; } })();
  useEffect(() => {
    if (!saved || !list.length) return;
    const s = list.find((x) => x.id === +saved);
    if (s) { toast(t('seizureSaved')); open(s); try { sessionStorage.removeItem('wwyc-open-seizure'); } catch { /* */ } if (sp.get('saved')) setSp({}, { replace: true }); }
  }, [saved, list]); // eslint-disable-line
  const save = async () => {
    if (!edit) return;
    const v = edit.v; const [y, m, d] = String(v.date).split('-').map(Number); const [hh, mm] = String(v.time || '00:00').split(':').map(Number);
    const start = new Date(y, m - 1, d, hh, mm).getTime(); const durationSec = Math.round(Number(v.minutes || 0) * 60);
    const rec = { childId, start, end: start + durationSec * 1000, durationSec, looked: String(v.looked ?? ''), helped: String(v.helped ?? ''), rescue: (v.rescue ?? '') as Seizure['rescue'], notes: String(v.notes ?? '') };
    if (edit.s?.id) await db.seizures.update(edit.s.id, rec); else await db.seizures.add(rec);
    setEdit(null); toast(t('saved'));
  };
  const weeks = useMemo(() => {
    const out: { label: string; v: number }[] = [];
    const now = Date.now();
    for (let w = 11; w >= 0; w--) {
      const a = now - (w + 1) * 7 * 86400_000, b = now - w * 7 * 86400_000;
      out.push({ label: fmtDate(b, lang, { day: 'numeric', month: 'short' }), v: list.filter((s) => s.start > a && s.start <= b).length });
    }
    return out;
  }, [list, lang]);
  return (
    <Page>
      <PageHeader title={t('navSeizures')} actions={<button className="btn-ghost px-4" onClick={() => open()}><Plus size={18} aria-hidden /> {t('addPast')}</button>} />
      {!list.length ? <Empty kind="chart" title={t('noSeizures')} text={t('noSeizuresText')} /> : (
        <>
          <section className="card p-4 mb-5"><h2 className="font-extrabold mb-2">{t('seizuresPerWeek')}</h2><BarChart data={weeks} color="var(--p5)" /></section>
          <ul className="grid gap-2">
            {list.map((s) => (
              <li key={s.id} className="card p-3">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-extrabold">{fmtDate(s.start, lang, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })} · {fmtTime(s.start, lang)}</p>
                    <p className="text-muted">{t('lasted', { d: fmtDur(s.durationSec) })}{s.rescue === 'yes' ? ` · ${t('rescueGiven')}` : ''}{s.videoBlobId ? ' · ' : ''}{s.videoBlobId && <Video size={14} className="inline" aria-label={t('video')} />}</p>
                    {s.looked && <p className="text-sm mt-1">{s.looked}</p>}
                    {!s.looked && !s.helped && <button className="text-sm font-bold text-accent underline mt-1 min-h-[32px]" onClick={() => open(s)}>{t('addDetailsLater')}</button>}
                  </div>
                  <button className="icon-btn" aria-label={t('edit')} onClick={() => open(s)}><Pencil size={20} /></button>
                  <button className="icon-btn" aria-label={t('delete')} onClick={() => setDel(s)}><Trash2 size={20} /></button>
                </div>
                {s.videoBlobId && <details><summary className="text-sm font-bold cursor-pointer min-h-[40px] flex items-center">{t('watchVideo')}</summary><VideoView id={s.videoBlobId} /></details>}
              </li>
            ))}
          </ul>
        </>
      )}
      <Modal open={!!edit} onClose={() => setEdit(null)} title={t('seizureDetails')}>
        {edit && <><FormFields fields={FIELDS} value={edit.v} onChange={(v) => setEdit({ ...edit, v })} /><SheetActions><button className="btn-primary" onClick={save}>{t('save')}</button></SheetActions></>}
      </Modal>
      <BottomBar><Link to="/seizure" className="btn-danger w-full !min-h-[60px] text-lg"><Activity aria-hidden /> {t('startSeizureTimer')}</Link></BottomBar>
      <Confirm open={!!del} danger text={t('deleteEntryQ')} onNo={() => setDel(null)} onYes={async () => { if (del?.videoBlobId) await db.blobs.delete(del.videoBlobId); await db.seizures.delete(del!.id!); setDel(null); }} />
    </Page>
  );
}
