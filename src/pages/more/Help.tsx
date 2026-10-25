import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { ExternalLink, Search, Phone, Plus, Trash2 } from 'lucide-react';
import { useT } from '../../i18n';
import { Page, PageHeader, Modal, SheetActions } from '../../components/ui';
import { getSetting, setSetting } from '../../lib/db';
import { SCHEMES, ORGS, FINDERS, PALLIATIVE, REVIEWED, searchUrl, type HelpItem } from '../../lib/help';
import { HELP_SRC } from '../../lib/care';
import { ct } from '../../lib/careText';
import { cx, fmtDate } from '../../lib/util';
import { FromBook } from '../child/Care';

interface Contact { id: number; name: string; phone: string; what: string }
type Where = 'all' | HelpItem['where'];

/** Welfare schemes and organisations, with a way to reach each one, and the family's own list of contacts. */
export default function Help() {
  const { lang } = useT();
  const L = (k: Parameters<typeof ct>[1], v?: Record<string, string | number>) => ct(lang, k, v);
  const [where, setWhere] = useState<Where>('all');
  const mine = useLiveQuery(() => getSetting<Contact[]>('helpContacts', []), []) ?? [];
  const [edit, setEdit] = useState<Contact | null>(null);
  const show = (l: HelpItem[]) => l.filter((x) => where === 'all' || x.where === where || (where !== 'india' && x.where === 'india'));
  const Item = ({ x }: { x: HelpItem }) => (
    <li className="p-4">
      <div className="flex items-start gap-3">
        <span className="w-11 h-11 rounded-2xl bg-surface2 flex items-center justify-center text-2xl shrink-0" aria-hidden>{x.e}</span>
        <div className="flex-1 min-w-0">
          <b className="block leading-snug">{x.name}</b>
          <span className="text-[11px] font-bold text-muted">{L(x.where)}</span>
          <p className="text-sm mt-1">{x.what[lang]}</p>
          <div className="flex flex-wrap gap-2 mt-2.5">
            {x.phone && <a className="chip" href={`tel:${x.phone}`}><Phone size={15} aria-hidden /> {L('call')} {x.phone}</a>}
            {x.url ? <a className="chip" href={x.url} target="_blank" rel="noopener noreferrer"><ExternalLink size={15} aria-hidden /> {L('open')}</a>
              : !x.phone && <a className="chip" href={searchUrl(x.name)} target="_blank" rel="noopener noreferrer"><Search size={15} aria-hidden /> {L('find')}</a>}
          </div>
        </div>
      </div>
    </li>
  );
  return (
    <Page>
      <PageHeader title={L('help')} />
      <p className="text-sm rounded-2xl bg-soft p-3 mb-4 font-semibold">{L('helpIntro')}</p>
      <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar" role="tablist">
        {(['all', 'india', 'kerala', 'karnataka'] as Where[]).map((w) => <button key={w} role="tab" aria-selected={where === w} className={cx('chip shrink-0', where === w && 'chip-on')} onClick={() => setWhere(w)}>{w === 'all' ? '✦' : L(w)}</button>)}
      </div>
      <section className="mb-6"><h2 className="font-extrabold mb-2">{L('finders')}</h2><ul className="card divide-y divide-line/60">{FINDERS.map((x) => <Item key={x.id} x={x} />)}</ul></section>
      <section className="mb-6"><h2 className="font-extrabold mb-2">{L('schemes')}</h2><ul className="card divide-y divide-line/60">{show(SCHEMES).map((x) => <Item key={x.id} x={x} />)}</ul></section>
      <section className="mb-6"><h2 className="font-extrabold mb-2">{L('orgs')}</h2><ul className="card divide-y divide-line/60">{show(ORGS).map((x) => <Item key={x.id} x={x} />)}</ul></section>
      <section className="mb-6"><h2 className="font-extrabold mb-2">{L('palliative')}</h2><ul className="card divide-y divide-line/60">{show(PALLIATIVE).map((x) => <Item key={x.id} x={x} />)}</ul></section>
      <section className="mb-6">
        <h2 className="font-extrabold mb-2">{L('myContacts')}</h2>
        <ul className="card divide-y divide-line/60">
          {mine.length === 0 && <li className="p-4 text-sm text-muted">{L('empty')}</li>}
          {mine.map((c) => (
            <li key={c.id} className="flex items-center gap-3 p-3 min-h-[60px]">
              <button className="flex-1 min-w-0 text-left" onClick={() => setEdit(c)}><b className="block truncate">{c.name}</b>{c.what && <span className="block text-sm text-muted line-clamp-2">{c.what}</span>}</button>
              {c.phone && <a className="icon-chip shrink-0" href={`tel:${c.phone.replace(/[^\d+]/g, '')}`} aria-label={`${L('call')} ${c.name}`}><Phone size={18} /></a>}
            </li>
          ))}
        </ul>
        <button className="btn-ghost mt-2" onClick={() => setEdit({ id: Date.now(), name: '', phone: '', what: '' })}><Plus size={18} aria-hidden /> {L('addContact')}</button>
      </section>
      <section className="mb-6"><h2 className="font-extrabold mb-2">{L('fromBookHelp')}</h2><FromBook src={HELP_SRC} /></section>
      <p className="text-xs text-muted">{L('reviewed', { d: fmtDate(`${REVIEWED}-01`, lang, { month: 'long', year: 'numeric' }) })}</p>
      {edit && (
        <Modal open onClose={() => setEdit(null)} title={L('myContacts')}>
          <div className="grid gap-3">
            <label><span className="label">{L('name')}</span><input className="input" value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /></label>
            <label><span className="label">{L('phone')}</span><input className="input" type="tel" inputMode="tel" value={edit.phone} onChange={(e) => setEdit({ ...edit, phone: e.target.value })} /></label>
            <label><span className="label">{L('whatFor')}</span><textarea className="input min-h-[70px]" value={edit.what} onChange={(e) => setEdit({ ...edit, what: e.target.value })} /></label>
            <SheetActions>
              {mine.some((y) => y.id === edit.id) ? <button className="btn-ghost text-danger" onClick={() => { void setSetting('helpContacts', mine.filter((y) => y.id !== edit.id)); setEdit(null); }}><Trash2 size={18} aria-hidden /> {L('delete')}</button> : <span />}
              <button className="btn-primary" disabled={!edit.name.trim()} onClick={() => { void setSetting('helpContacts', mine.some((y) => y.id === edit.id) ? mine.map((y) => (y.id === edit.id ? edit : y)) : [...mine, edit]); setEdit(null); }}>{L('save')}</button>
            </SheetActions>
          </div>
        </Modal>
      )}
    </Page>
  );
}
