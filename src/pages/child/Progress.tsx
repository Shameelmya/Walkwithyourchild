import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Plus, Camera, Trash2 } from 'lucide-react';
import { useT } from '../../i18n';
import { Page, PageHeader, Empty, Modal, FileButton, Section, Confirm, useToast, BottomBar, SheetActions } from '../../components/ui';
import { Thumb } from '../../components/Attachments';
import { LineChart, BarChart } from '../../components/Charts';
import { db, putBlob, type Progress } from '../../lib/db';
import { useChildId } from '../../lib/hooks';
import { compressImage } from '../../lib/media';
import { SCALES, scaleColor, scaleLabel, scaleName } from '../../lib/scales';
import { fmtDate, isoDate, parseISO, cx } from '../../lib/util';

export default function ProgressPage() {
  const { t, lang } = useT();
  const childId = useChildId();
  const toast = useToast((s) => s.show);
  const list = useLiveQuery(() => db.progress.where('childId').equals(childId).sortBy('date'), [childId]) ?? [];
  const seizures = useLiveQuery(() => db.seizures.where('childId').equals(childId).toArray(), [childId]) ?? [];
  const [edit, setEdit] = useState<Progress | null>(null);
  const [del, setDel] = useState<Progress | null>(null);
  const weeks = useMemo(() => Array.from({ length: 12 }, (_, i) => {
    const w = 11 - i; const b = Date.now() - w * 7 * 86400_000, a = b - 7 * 86400_000;
    return { label: fmtDate(b, lang, { day: 'numeric', month: 'short' }), v: seizures.filter((s) => s.start > a && s.start <= b).length };
  }), [seizures, lang]);
  const save = async () => { if (!edit) return; if (edit.id) await db.progress.put(edit); else await db.progress.add(edit); setEdit(null); toast(t('saved')); };
  const x = (d: string) => parseISO(d).getTime();
  const weights = list.filter((p) => p.weight).map((p) => ({ x: x(p.date), y: p.weight! }));
  return (
    <Page>
      <PageHeader title={t('navProgress')} />
      {!list.length && <Empty kind="chart" title={t('noCheckIns')} text={t('noCheckInsText')} />}
      {list.length > 0 && (
        <Section title={t('changesOverTime')}>
          <div className="grid sm:grid-cols-2 gap-3">
            {SCALES.map((s, i) => {
              const pts = list.filter((p) => p.scores[s] !== undefined).map((p) => ({ x: x(p.date), y: p.scores[s]! }));
              if (!pts.length) return null;
              const last = pts[pts.length - 1].y;
              return (
                <div key={s} className="card p-3">
                  <p className="font-extrabold" style={{ color: scaleColor(i) }}>{t(scaleName(s))}</p>
                  <p className="text-sm text-muted mb-1">{t('latest')}: {t(scaleLabel(s, last))}</p>
                  {pts.length > 1 ? <LineChart points={pts} color={scaleColor(i)} labels={[t(scaleLabel(s, 0)), t(scaleLabel(s, 4))]} /> : <p className="text-sm text-muted">{t('needTwoCheckIns')}</p>}
                </div>
              );
            })}
            {weights.length > 1 && <div className="card p-3"><p className="font-extrabold text-[var(--p5)]">{t('weightKg')}</p><LineChart points={weights} min={Math.min(...weights.map((w) => w.y)) - 1} max={Math.max(...weights.map((w) => w.y)) + 1} color="var(--p5)" /></div>}
            <div className="card p-3"><p className="font-extrabold text-[var(--p4)]">{t('seizuresPerWeek')}</p><BarChart data={weeks} color="var(--p4)" height={90} /></div>
          </div>
        </Section>
      )}
      {list.length > 0 && (
        <Section title={t('checkIns')}>
          <ul className="grid gap-2">
            {[...list].reverse().map((p) => (
              <li key={p.id} className="card p-3 flex gap-2">
                <button className="flex-1 text-start min-w-0" onClick={() => setEdit(p)}>
                  <p className="font-extrabold">{fmtDate(p.date, lang)}{p.weight ? ` · ${p.weight} kg` : ''}</p>
                  <p className="text-sm text-muted line-clamp-2">{SCALES.filter((s) => p.scores[s] !== undefined).map((s) => `${t(scaleName(s))}: ${t(scaleLabel(s, p.scores[s]!))}`).join(' · ')}</p>
                  {p.notes && <p className="text-sm mt-1">{p.notes}</p>}
                </button>
                {p.photoBlobId && <Thumb id={p.photoBlobId} />}
                <button className="icon-btn" aria-label={t('delete')} onClick={() => setDel(p)}><Trash2 size={20} /></button>
              </li>
            ))}
          </ul>
        </Section>
      )}
      <Modal open={!!edit} onClose={() => setEdit(null)} title={t('checkIn')} full>
        {edit && (
          <div className="grid gap-5">
            <div><label className="label" htmlFor="pg-date">{t('date')}</label><input id="pg-date" type="date" className="input" value={edit.date} onChange={(e) => setEdit({ ...edit, date: e.target.value })} /></div>
            <p className="text-sm text-muted">{t('checkInHint')}</p>
            {SCALES.map((s) => {
              const v = edit.scores[s];
              return (
                <fieldset key={s}>
                  <legend className="font-extrabold mb-2">{t(scaleName(s))}</legend>
                  <div className="flex gap-2">{[0, 1, 2, 3, 4].map((n) => <button key={n} type="button" aria-pressed={v === n} aria-label={`${n}: ${t(scaleLabel(s, n))}`} onClick={() => setEdit({ ...edit, scores: { ...edit.scores, [s]: v === n ? undefined : n } })} className={cx('flex-1 h-12 rounded-xl border-2 font-extrabold', v === n ? 'bg-accent text-onaccent border-accent' : 'border-line bg-surface')}>{n}</button>)}</div>
                  <p className="text-sm mt-1 min-h-[1.5em]" aria-live="polite">{v !== undefined ? t(scaleLabel(s, v)) : <span className="text-muted">{t(scaleLabel(s, 0))} → {t(scaleLabel(s, 4))}</span>}</p>
                </fieldset>
              );
            })}
            <div><label className="label" htmlFor="pg-w">{t('weightKg')}</label><input id="pg-w" type="number" inputMode="decimal" step="0.1" className="input w-40" value={edit.weight ?? ''} onChange={(e) => setEdit({ ...edit, weight: e.target.value ? +e.target.value : undefined })} /></div>
            <div><label className="label" htmlFor="pg-n">{t('notes')}</label><textarea id="pg-n" className="input min-h-[80px]" value={edit.notes ?? ''} onChange={(e) => setEdit({ ...edit, notes: e.target.value })} /></div>
            <div className="flex items-center gap-3">{edit.photoBlobId && <Thumb id={edit.photoBlobId} />}<FileButton accept="image/*" onFile={async (f) => setEdit({ ...edit, photoBlobId: await putBlob(await compressImage(f), childId, 'progress') })}><Camera size={18} aria-hidden /> {t('addPhoto')}</FileButton></div>
            <SheetActions><button className="btn-primary" onClick={save}>{t('save')}</button></SheetActions>
          </div>
        )}
      </Modal>
      <BottomBar><button className="btn-primary w-full" onClick={() => setEdit({ childId, date: isoDate(), scores: {} })}><Plus size={18} aria-hidden /> {t('checkIn')}</button></BottomBar>
      <Confirm open={!!del} danger text={t('deleteEntryQ')} onNo={() => setDel(null)} onYes={async () => { await db.progress.delete(del!.id!); setDel(null); }} />
    </Page>
  );
}
