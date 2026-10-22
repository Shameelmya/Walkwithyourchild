import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { Plus, Trash2, Phone, Check, ExternalLink, MessageCircle } from 'lucide-react';
import { useT } from '../../i18n';
import { loc, callTel, extractPhone, type Field, type Sheet } from '../../lib/content';
import { useSheet, useChildId } from '../../lib/hooks';
import { db } from '../../lib/db';
import { Seg } from '../ui';
import { cx } from '../../lib/util';
import type { Row } from '../../lib/sheets';

export function FieldInput({ f, value, onChange, id }: { f: Field; value: string; onChange: (v: string) => void; id: string }) {
  const { t, lang } = useT();
  const label = loc(f.label, lang);
  if (f.input === 'yesno') return <Seg label={label} value={value} onChange={(v) => onChange(v === value ? '' : v)} options={[{ v: 'yes', l: t('yes') }, { v: 'no', l: t('no') }]} />;
  if (f.input === 'textarea' || f.size === 'long') return <textarea id={id} className="input min-h-[96px]" value={value} onChange={(e) => onChange(e.target.value)} />;
  const phone = f.input === 'tel-text' || f.input === 'tel' ? extractPhone(value) : '';
  return (
    <div className="flex gap-2">
      <input id={id} className="input" value={value} onChange={(e) => onChange(e.target.value)}
        type={f.input === 'date' ? 'date' : f.input === 'time' ? 'time' : f.input === 'tel' ? 'tel' : 'text'} inputMode={f.input === 'number' ? 'decimal' : f.input === 'tel' ? 'tel' : undefined} />
      {phone && <a className="icon-btn bg-soft shrink-0" href={callTel(phone)} aria-label={t('callNumber', { n: phone })}><Phone size={20} /></a>}
    </div>
  );
}

export function FormEditor({ sheet }: { sheet: Sheet }) {
  const { lang } = useT();
  const [data, setData] = useSheet(sheet.id);
  if (!data) return null;
  const values = (data.values as Record<string, string>) ?? {};
  return (
    <div className={cx('grid gap-4', sheet.type === 'card' && 'border-4 border-[var(--ur)] rounded-3xl p-4')}>
      {sheet.banner && <p className="bg-[var(--ur)] text-white font-extrabold rounded-xl px-4 py-2">{loc(sheet.banner, lang)}</p>}
      {sheet.fields!.map((f) => (
        <div key={f.id}>
          <label className="label" htmlFor={`nb-${f.id}`}>{loc(f.label, lang)}{f.sub && <span className="font-normal"> ({loc(f.sub, lang)})</span>}</label>
          <FieldInput id={`nb-${f.id}`} f={f} value={values[f.id] ?? ''} onChange={(v) => setData({ ...data, values: { ...values, [f.id]: v } })} />
        </div>
      ))}
    </div>
  );
}

export function BoxesEditor({ sheet }: { sheet: Sheet }) {
  const { lang } = useT();
  const [data, setData] = useSheet(sheet.id);
  if (!data) return null;
  const values = (data.values as Record<string, string>) ?? {};
  return (
    <div className="grid sm:grid-cols-2 gap-3">
      {sheet.boxes!.map((b, i) => (
        <div key={i} className="card p-3"><label className="font-extrabold text-[var(--pi)] block mb-1" htmlFor={`bx-${i}`}>{loc(b, lang)}</label>
          <textarea id={`bx-${i}`} className="input min-h-[110px]" value={values[i] ?? ''} onChange={(e) => setData({ ...data, values: { ...values, [i]: e.target.value } })} /></div>
      ))}
    </div>
  );
}

export function RowsEditor({ columns, rows, onChange, onAdd, onDelete, extra, placeholders }: { columns: Field[]; rows: Row[]; onChange: (i: number, col: string, v: string) => void; onAdd: () => void; onDelete: (i: number) => void; extra?: (r: Row, i: number) => React.ReactNode; placeholders?: (i: number, col: string) => string | undefined }) {
  const { t, lang } = useT();
  return (
    <div>
      <ul className="grid gap-3">
        {rows.map((r, i) => (
          <li key={i} className="card p-3">
            <div className="grid sm:grid-cols-2 gap-3">
              {columns.map((c) => (
                <div key={c.id} className={c.input === 'textarea' ? 'sm:col-span-2' : ''}>
                  <label className="label" htmlFor={`r${i}-${c.id}`}>{loc(c.label, lang)}{c.sub && <span className="font-normal"> ({loc(c.sub, lang)})</span>}</label>
                  {placeholders?.(i, c.id) && !r[c.id] ? <input id={`r${i}-${c.id}`} className="input" placeholder={placeholders(i, c.id)} value="" onChange={(e) => onChange(i, c.id, e.target.value)} />
                    : <FieldInput id={`r${i}-${c.id}`} f={c} value={r[c.id] ?? ''} onChange={(v) => onChange(i, c.id, v)} />}
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-2 mt-2">{extra?.(r, i)}<button className="icon-btn text-muted" aria-label={t('deleteRow')} onClick={() => onDelete(i)}><Trash2 size={20} /></button></div>
          </li>
        ))}
      </ul>
      <button className="btn-ghost mt-3" onClick={onAdd}><Plus size={18} aria-hidden /> {t('addRow')}</button>
    </div>
  );
}

export function TableEditor({ sheet }: { sheet: Sheet }) {
  const { lang } = useT();
  const [data, setData] = useSheet(sheet.id);
  if (!data) return null;
  const pre = sheet.prefilled ?? [];
  const stored = (data.rows as Row[]) ?? [];
  const n = Math.max(stored.length, pre.length, 1);
  const rows = Array.from({ length: n }, (_, i) => stored[i] ?? {});
  const set = (rs: Row[]) => setData({ ...data, rows: rs });
  return (
    <RowsEditor columns={sheet.columns!} rows={rows}
      placeholders={(i, col) => (col === 'need' ? pre[i]?.[lang] : undefined)}
      onChange={(i, col, v) => { const rs = [...rows]; rs[i] = { ...rs[i], [col]: v }; set(rs); }}
      onAdd={() => set([...rows, sheet.id === 'questions' || sheet.id === 'good-moments' ? { date: new Date().toISOString().slice(0, 10) } : {}])}
      onDelete={(i) => set(rows.filter((_, j) => j !== i))}
      extra={sheet.id === 'support' ? (r, i) => <SupportActions row={r} need={r.need || pre[i]?.[lang] || ''} /> : undefined} />
  );
}

function SupportActions({ row, need }: { row: Row; need: string }) {
  const { t } = useT();
  const phone = extractPhone(row.phone);
  if (!phone) return null;
  const wa = (l: 'en' | 'ml' | 'kn') => `https://wa.me/${phone.length === 10 ? '91' + phone : phone.replace('+', '')}?text=${encodeURIComponent(t(l === 'en' ? 'helpMsgEn' : l === 'kn' ? 'helpMsgKn' : 'helpMsgMl', { who: row.who ?? '', need }))}`;
  return (
    <>
      <a className="chip" href={wa('ml')} target="_blank" rel="noreferrer"><MessageCircle size={16} aria-hidden /> മലയാളം</a>
      <a className="chip" href={wa('kn')} target="_blank" rel="noreferrer"><MessageCircle size={16} aria-hidden /> ಕನ್ನಡ</a>
      <a className="chip" href={wa('en')} target="_blank" rel="noreferrer"><MessageCircle size={16} aria-hidden /> English</a>
      <a className="icon-btn" href={callTel(phone)} aria-label={t('callNumber', { n: phone })}><Phone size={20} /></a>
    </>
  );
}

export function TreatmentsEditor({ sheet }: { sheet: Sheet }) {
  const childId = useChildId();
  const recs = useLiveQuery(() => db.treatments.where('childId').equals(childId).sortBy('date'), [childId]);
  if (!recs) return null;
  const rows = recs.map((r) => ({ treatment: String(r.treatment ?? ''), where: String(r.where ?? ''), cost: String(r.cost ?? ''), changed: String(r.changed ?? '') }));
  return (
    <RowsEditor columns={sheet.columns!} rows={rows}
      onChange={(i, col, v) => db.treatments.update(recs[i].id!, { [col]: v })}
      onAdd={() => db.treatments.add({ childId, date: new Date().toISOString().slice(0, 10), treatment: '' })}
      onDelete={(i) => db.treatments.delete(recs[i].id!)} />
  );
}

export function ChecklistEditor({ sheet }: { sheet: Sheet }) {
  const { t, lang } = useT();
  const childId = useChildId();
  const [data, setData] = useSheet(sheet.id);
  const auto = useLiveQuery(() => db.documents.where('childId').equals(childId).toArray().then((d) => new Set(d.map((x) => x.category))), [childId]);
  if (!data || !auto) return null;
  const checked = new Set((data.checked as number[]) ?? []);
  return (
    <div>
      <ul className="grid gap-2">
        {sheet.items!.map((it, i) => {
          const a = auto.has(i); const on = a || checked.has(i);
          return (
            <li key={i}><button role="checkbox" aria-checked={on} disabled={a} onClick={() => { const c = new Set(checked); if (c.has(i)) c.delete(i); else c.add(i); setData({ ...data, checked: [...c] }); }}
              className={cx('w-full flex items-start gap-3 p-3 rounded-xl text-left min-h-[56px] border-2', on ? 'border-[var(--pi)] bg-[var(--pit)]' : 'border-line bg-surface')}>
              <span className={cx('w-7 h-7 rounded-lg border-2 flex items-center justify-center shrink-0', on ? 'bg-[var(--pi)] border-[var(--pi)] text-white' : 'border-muted/60')}>{on && <Check size={18} />}</span>
              <span className="flex-1">{loc(it, lang)}{a && <span className="block text-xs font-bold text-[var(--pi)] mt-1">{t('inLocker')}</span>}</span>
            </button></li>
          );
        })}
      </ul>
      {sheet.note && <p className="mt-4 p-3 rounded-xl bg-[var(--pit)]">{loc(sheet.note, lang)}</p>}
      <Link to="/documents" className="btn-outline mt-4"><ExternalLink size={18} aria-hidden /> {t('openLocker')}</Link>
    </div>
  );
}
