import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Phone, Plus, Star, Trash2, Pencil, Share2, Users, Target, CalendarCheck } from 'lucide-react';
import { useT } from '../../i18n';
import { Page, PageHeader, Modal, SheetActions, useToast } from '../../components/ui';
import { getSetting, setSetting } from '../../lib/db';
import { useChild, useChildId } from '../../lib/hooks';
import { ROLES, TEAM_ROLES, PLAN_SRC } from '../../lib/care';
import { ct } from '../../lib/careText';
import { cx, fmtDate, isoDate, pick, shareOrDownload } from '../../lib/util';
import { FromBook } from './Care';

interface Member { id: number; role: string; name: string; phone: string; place: string; main?: boolean }
interface Goal { id: number; area: string; goal: string; home: string; review: string; status: 'todo' | 'doing' | 'done' }
interface Meeting { id: number; date: string; who: string; notes: string; next: string }
interface Plan { team: Member[]; goals: Goal[]; meetings: Meeting[] }
const EMPTY: Plan = { team: [], goals: [], meetings: [] };
const STATUS: Goal['status'][] = ['todo', 'doing', 'done'];
const STATUS_C = { todo: 'bg-surface2 text-muted', doing: 'bg-[var(--tb2,#e3ecfb)] text-[#2F6FD6]', done: 'bg-[#e3f3e8] text-[#2e7d4f]' };

/** The interdisciplinary care plan: who is in the team, what each discipline is working on, and what each review decided. */
export default function CarePlan() {
  const { t, lang } = useT();
  const L = (k: Parameters<typeof ct>[1], v?: Record<string, string | number>) => ct(lang, k, v);
  const child = useChild();
  const childId = useChildId();
  const key = `plan:${childId}`;
  const plan = useLiveQuery(() => getSetting<Plan>(key, EMPTY), [key]) ?? EMPTY;
  const save = (p: Plan) => setSetting(key, p);
  const [m, setM] = useState<Member | null>(null);
  const [g, setG] = useState<Goal | null>(null);
  const [mt, setMt] = useState<Meeting | null>(null);
  const toast = useToast((s) => s.show);
  const upsert = <T extends { id: number }>(list: T[], x: T) => (list.some((y) => y.id === x.id) ? list.map((y) => (y.id === x.id ? x : y)) : [...list, x]);
  const share = async () => {
    const lines = [`${L('carePlan')}: ${child?.name ?? ''}`, '', `${L('team')}:`, ...plan.team.map((x) => `- ${(ROLES[x.role] ? pick(ROLES[x.role], lang) : x.role)}: ${x.name}${x.phone ? ', ' + x.phone : ''}${x.place ? ' (' + x.place + ')' : ''}${x.main ? ' ★' : ''}`), '',
      `${L('goals')}:`, ...plan.goals.map((x) => `- [${L(x.status)}] ${x.goal} (${pick(ROLES[x.area] ?? { en: '' }, lang)})${x.home ? '\n  ' + L('atHome') + ': ' + x.home : ''}${x.review ? '\n  ' + L('reviewBy') + ': ' + x.review : ''}`), '',
      `${L('meetings')}:`, ...plan.meetings.slice().reverse().map((x) => `- ${x.date}: ${x.notes}${x.who ? ' (' + x.who + ')' : ''}${x.next ? '\n  ' + L('nextReview') + ': ' + x.next : ''}`)];
    const text = lines.join('\n');
    try { if (navigator.share) { await navigator.share({ title: L('carePlan'), text }); return; } } catch { return; }
    await shareOrDownload(new Blob([text], { type: 'text/plain' }), `care-plan-${isoDate()}.txt`, L('carePlan'));
    toast(t('saved'));
  };
  const next = plan.meetings.map((x) => x.next).filter((x) => x && x >= isoDate()).sort()[0];
  return (
    <Page>
      <PageHeader title={L('carePlan')} actions={<button className="icon-btn" aria-label={L('sharePlan')} onClick={share}><Share2 /></button>} />
      <p className="text-sm text-muted mb-4">{L('planHint')}</p>
      {next && <p className="card p-3 mb-4 flex items-center gap-2 font-bold"><CalendarCheck size={18} className="text-[rgb(var(--accent))]" aria-hidden /> {L('nextReview')}: {fmtDate(next, lang)}</p>}

      <section className="mb-6">
        <div className="flex items-center gap-2 mb-2"><Users size={18} className="text-muted" aria-hidden /><h2 className="font-extrabold flex-1">{L('team')}</h2></div>
        <ul className="card divide-y divide-line/60">
          {plan.team.length === 0 && <li className="p-4 text-sm text-muted">{L('empty')}</li>}
          {plan.team.map((x) => (
            <li key={x.id} className="flex items-center gap-3 p-3 min-h-[64px]">
              <button className="flex-1 min-w-0 text-start" onClick={() => setM(x)} aria-label={`${L('edit')} ${x.name}`}>
                <span className="block text-xs font-bold text-muted">{pick(ROLES[x.role] ?? { en: '' }, lang)}{x.main && <span className="ms-1.5 text-[#b4842f]">★ {L('mainContactTag')}</span>}</span>
                <b className="block truncate">{x.name}</b>{x.place && <span className="block text-sm text-muted truncate">{x.place}</span>}
              </button>
              {x.phone && <a href={`tel:${x.phone.replace(/[^\d+]/g, '')}`} className="icon-chip shrink-0" aria-label={`${L('call')} ${x.name}`}><Phone size={18} /></a>}
            </li>
          ))}
        </ul>
        <button className="btn-ghost mt-2" onClick={() => setM({ id: Date.now(), role: 'doctor', name: '', phone: '', place: '' })}><Plus size={18} aria-hidden /> {L('addMember')}</button>
      </section>

      <section className="mb-6">
        <div className="flex items-center gap-2 mb-2"><Target size={18} className="text-muted" aria-hidden /><h2 className="font-extrabold flex-1">{L('goals')}</h2></div>
        <div className="grid gap-2.5">
          {plan.goals.length === 0 && <p className="card p-4 text-sm text-muted">{L('empty')}</p>}
          {plan.goals.map((x) => (
            <article key={x.id} className="card p-4">
              <div className="flex items-start gap-2">
                <div className="flex-1 min-w-0"><p className="text-xs font-bold text-muted">{pick(ROLES[x.area] ?? { en: '' }, lang)}</p><b className="block leading-snug">{x.goal}</b></div>
                <button className="icon-btn !w-10 !h-10 shrink-0" aria-label={L('edit')} onClick={() => setG(x)}><Pencil size={16} /></button>
              </div>
              {x.home && <p className="text-sm mt-1.5"><span className="text-muted">{L('atHome')}: </span>{x.home}</p>}
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                {STATUS.map((s) => <button key={s} aria-pressed={x.status === s} onClick={() => save({ ...plan, goals: upsert(plan.goals, { ...x, status: s }) })} className={cx('chip !min-h-[36px] text-xs', x.status === s && STATUS_C[s], x.status === s && 'chip-on')}>{s === 'done' && '✓ '}{L(s)}</button>)}
                {x.review && <span className="text-xs text-muted ms-auto">{L('reviewBy')}: {fmtDate(x.review, lang)}</span>}
              </div>
            </article>
          ))}
        </div>
        <button className="btn-ghost mt-2" onClick={() => setG({ id: Date.now(), area: 'physio', goal: '', home: '', review: '', status: 'todo' })}><Plus size={18} aria-hidden /> {L('addGoal')}</button>
      </section>

      <section className="mb-6">
        <div className="flex items-center gap-2 mb-2"><CalendarCheck size={18} className="text-muted" aria-hidden /><h2 className="font-extrabold flex-1">{L('meetings')}</h2></div>
        <ul className="card divide-y divide-line/60">
          {plan.meetings.length === 0 && <li className="p-4 text-sm text-muted">{L('empty')}</li>}
          {plan.meetings.slice().sort((a, b) => b.date.localeCompare(a.date)).map((x) => (
            <li key={x.id}><button className="w-full text-start p-3 min-h-[60px]" onClick={() => setMt(x)}>
              <b className="block">{fmtDate(x.date, lang)}</b>{x.who && <span className="block text-xs text-muted">{x.who}</span>}<span className="block text-sm mt-0.5 line-clamp-3 whitespace-pre-line">{x.notes}</span>
            </button></li>
          ))}
        </ul>
        <button className="btn-ghost mt-2" onClick={() => setMt({ id: Date.now(), date: isoDate(), who: '', notes: '', next: '' })}><Plus size={18} aria-hidden /> {L('addMeeting')}</button>
      </section>

      <section className="mb-6">
        <h2 className="font-extrabold mb-2">{L('fromBookPlan')}</h2>
        <FromBook src={PLAN_SRC} />
      </section>

      {m && (
        <Modal open onClose={() => setM(null)} title={L('team')}>
          <div className="grid gap-3">
            <label><span className="label">{L('role')}</span><select className="input" value={m.role} onChange={(e) => setM({ ...m, role: e.target.value })}>{TEAM_ROLES.map((r) => <option key={r} value={r}>{pick(ROLES[r], lang)}</option>)}</select></label>
            <label><span className="label">{L('name')}</span><input className="input" value={m.name} onChange={(e) => setM({ ...m, name: e.target.value })} /></label>
            <label><span className="label">{L('phone')}</span><input className="input" type="tel" inputMode="tel" value={m.phone} onChange={(e) => setM({ ...m, phone: e.target.value })} /></label>
            <label><span className="label">{L('place')}</span><input className="input" value={m.place} onChange={(e) => setM({ ...m, place: e.target.value })} /></label>
            <button className={cx('chip self-start', m.main && 'chip-on')} aria-pressed={!!m.main} onClick={() => setM({ ...m, main: !m.main })}><Star size={16} aria-hidden fill={m.main ? 'currentColor' : 'none'} /> {L('makeMain')}</button>
            <SheetActions>
              {plan.team.some((y) => y.id === m.id) ? <button className="btn-ghost text-danger" onClick={() => { void save({ ...plan, team: plan.team.filter((y) => y.id !== m.id) }); setM(null); }}><Trash2 size={18} aria-hidden /> {L('delete')}</button> : <span />}
              <button className="btn-primary" disabled={!m.name.trim()} onClick={() => { const team = upsert(plan.team.map((y) => (m.main ? { ...y, main: false } : y)), m); void save({ ...plan, team }); setM(null); }}>{L('save')}</button>
            </SheetActions>
          </div>
        </Modal>
      )}
      {g && (
        <Modal open onClose={() => setG(null)} title={L('goals')}>
          <div className="grid gap-3">
            <label><span className="label">{L('area')}</span><select className="input" value={g.area} onChange={(e) => setG({ ...g, area: e.target.value })}>{TEAM_ROLES.map((r) => <option key={r} value={r}>{pick(ROLES[r], lang)}</option>)}</select></label>
            <label><span className="label">{L('goal')}</span><textarea className="input min-h-[70px]" value={g.goal} onChange={(e) => setG({ ...g, goal: e.target.value })} /></label>
            <label><span className="label">{L('atHome')}</span><textarea className="input min-h-[70px]" value={g.home} onChange={(e) => setG({ ...g, home: e.target.value })} /></label>
            <label><span className="label">{L('reviewBy')}</span><input className="input" type="date" value={g.review} onChange={(e) => setG({ ...g, review: e.target.value })} /></label>
            <SheetActions>
              {plan.goals.some((y) => y.id === g.id) ? <button className="btn-ghost text-danger" onClick={() => { void save({ ...plan, goals: plan.goals.filter((y) => y.id !== g.id) }); setG(null); }}><Trash2 size={18} aria-hidden /> {L('delete')}</button> : <span />}
              <button className="btn-primary" disabled={!g.goal.trim()} onClick={() => { void save({ ...plan, goals: upsert(plan.goals, g) }); setG(null); }}>{L('save')}</button>
            </SheetActions>
          </div>
        </Modal>
      )}
      {mt && (
        <Modal open onClose={() => setMt(null)} title={L('meetings')}>
          <div className="grid gap-3">
            <label><span className="label">{L('date')}</span><input className="input" type="date" value={mt.date} onChange={(e) => setMt({ ...mt, date: e.target.value })} /></label>
            <label><span className="label">{L('who')}</span><input className="input" value={mt.who} onChange={(e) => setMt({ ...mt, who: e.target.value })} /></label>
            <label><span className="label">{L('decided')}</span><textarea className="input min-h-[100px]" value={mt.notes} onChange={(e) => setMt({ ...mt, notes: e.target.value })} /></label>
            <label><span className="label">{L('nextReview')}</span><input className="input" type="date" value={mt.next} onChange={(e) => setMt({ ...mt, next: e.target.value })} /></label>
            <SheetActions>
              {plan.meetings.some((y) => y.id === mt.id) ? <button className="btn-ghost text-danger" onClick={() => { void save({ ...plan, meetings: plan.meetings.filter((y) => y.id !== mt.id) }); setMt(null); }}><Trash2 size={18} aria-hidden /> {L('delete')}</button> : <span />}
              <button className="btn-primary" disabled={!mt.notes.trim()} onClick={() => { void save({ ...plan, meetings: upsert(plan.meetings, mt) }); setMt(null); }}>{L('save')}</button>
            </SheetActions>
          </div>
        </Modal>
      )}
    </Page>
  );
}
