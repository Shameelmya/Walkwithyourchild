import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { Pencil, Plus, Trash2, X, RotateCcw } from 'lucide-react';
import { useT } from '../../i18n';
import { Page, PageHeader, Modal, SheetActions } from '../../components/ui';
import { db, getSetting, setSetting } from '../../lib/db';
import { useChildId } from '../../lib/hooks';
import { ct } from '../../lib/careText';
import { SKILLS } from '../../lib/skills';
import { play, midi } from '../../lib/audio';
import { useUI, type Lang } from '../../lib/store';
import { cx } from '../../lib/util';
import { FromBook } from './Care';
import { Celebrate } from '../play/games-colour';

/** 0 full help, 1 some help, 2 by myself */
type Level = 0 | 1 | 2;
interface Own { id: string; name: string; steps: string[] }
interface Saved { edits: Record<string, string[]>; own: Own[] }
interface Task { id: string; e: string; kind: 'adl' | 'iadl' | 'own'; name: string; steps: { e: string; t: string }[]; edited: boolean }
const LEVELS: { v: Level; e: string; k: 'fullHelp' | 'someHelp' | 'byMyself'; c: string }[] = [
  { v: 0, e: '🤝', k: 'fullHelp', c: 't-blue' }, { v: 1, e: '👋', k: 'someHelp', c: 't-violet' }, { v: 2, e: '⭐', k: 'byMyself', c: 't-green' },
];

const tasks = (lang: Lang, saved: Saved): Task[] => [
  ...SKILLS.map((s) => {
    const ed = saved.edits[s.id];
    return { id: s.id, e: s.e, kind: s.kind, name: s.name[lang], edited: !!ed, steps: ed ? ed.map((t, i) => ({ e: s.steps[i]?.e ?? '•', t })) : s.steps.map((x) => ({ e: x.e, t: x.t[lang] })) };
  }),
  ...saved.own.map((o) => ({ id: o.id, e: '✨', kind: 'own' as const, name: o.name, edited: true, steps: o.steps.map((t) => ({ e: '•', t })) })),
];

/** Everyday tasks (ADL and IADL) broken into small steps; each try records how much help was needed. */
export default function Skills() {
  const { lang } = useT();
  const L = (k: Parameters<typeof ct>[1], v?: Record<string, string | number>) => ct(lang, k, v);
  const childId = useChildId();
  const key = `skills:${childId}`;
  const saved = useLiveQuery(() => getSetting<Saved>(key, { edits: {}, own: [] }), [key]) ?? { edits: {}, own: [] };
  const logs = useLiveQuery(() => db.episodes.where('childId').equals(childId).filter((e) => e.kind === 'skill').toArray(), [childId]) ?? [];
  const [run, setRun] = useState<Task | null>(null);
  const [edit, setEdit] = useState<Task | null>(null);
  const list = tasks(lang, saved);
  const last = (id: string) => { const l = logs.filter((x) => x.note?.startsWith(`${id}:`)).sort((a, b) => b.start - a.start)[0]; return l ? (l.note ?? '').slice(id.length + 1).split('').map(Number) : null; };
  const save = (t: Task, name: string, steps: string[]) => {
    if (t.kind === 'own') { const o = { id: t.id, name, steps }; void setSetting(key, { ...saved, own: saved.own.some((x) => x.id === t.id) ? saved.own.map((x) => (x.id === t.id ? o : x)) : [...saved.own, o] }); }
    else void setSetting(key, { ...saved, edits: { ...saved.edits, [t.id]: steps } });
    setEdit(null);
  };
  const reset = (t: Task) => {
    if (t.kind === 'own') void setSetting(key, { ...saved, own: saved.own.filter((x) => x.id !== t.id) });
    else { const { [t.id]: _, ...edits } = saved.edits; void setSetting(key, { ...saved, edits }); }
    setEdit(null);
  };
  const group = (k: Task['kind'], title: string) => {
    const g = list.filter((t) => t.kind === k); if (!g.length) return null;
    return (
      <section className="mb-6">
        <h2 className="font-extrabold mb-2">{title}</h2>
        <div className="grid gap-2">{g.map((t) => { const l = last(t.id); const mine = l ? l.filter((v) => v === 2).length : 0; return (
          <div key={t.id} className="card !rounded-3xl p-2 pl-3 flex items-center gap-3">
            <button className="flex-1 min-w-0 flex items-center gap-3 text-left min-h-[56px]" onClick={() => setRun(t)}>
              <span className="w-12 h-12 rounded-2xl bg-soft flex items-center justify-center text-2xl shrink-0" aria-hidden>{t.e}</span>
              <span className="min-w-0"><b className="block leading-snug">{t.name}</b>{l && <span className="text-xs text-muted">{L('lastTime', { n: mine, all: l.length })}</span>}</span>
            </button>
            <button className="w-12 h-12 rounded-xl flex items-center justify-center text-muted shrink-0" aria-label={`${L('editSteps')}: ${t.name}`} onClick={() => setEdit(t)}><Pencil size={16} /></button>
          </div>
        ); })}</div>
      </section>
    );
  };
  return (
    <Page>
      <PageHeader title={L('skills')} />
      <p className="text-sm text-muted mb-5">{L('skillsIntro')}</p>
      {group('adl', L('adl'))}
      {group('iadl', L('iadl'))}
      {group('own', L('addTask'))}
      <button className="btn-primary w-full mb-3" onClick={() => setEdit({ id: `own${Date.now()}`, e: '✨', kind: 'own', name: '', steps: [], edited: false })}><Plus size={18} aria-hidden /> {L('addTask')}</button>
      <p className="text-sm text-muted mb-6">{L('skillsPace')}</p>
      <section className="mb-6"><h2 className="font-extrabold mb-2">{L('changesBook')}</h2><FromBook src={[{ c: 'c11', h: 0 }]} /></section>
      {edit && <Editor t={edit} onClose={() => setEdit(null)} onSave={save} onReset={edit.edited ? () => reset(edit) : undefined} />}
      {run && <Run t={run} onClose={() => setRun(null)} onDone={(lv) => db.episodes.add({ childId, kind: 'skill', start: Date.now(), end: Date.now(), durationSec: 0, note: `${run.id}:${lv.join('')}` })} />}
    </Page>
  );
}

function Editor({ t, onSave, onClose, onReset }: { t: Task; onSave: (t: Task, name: string, steps: string[]) => void; onClose: () => void; onReset?: () => void }) {
  const { lang } = useT();
  const L = (k: Parameters<typeof ct>[1]) => ct(lang, k);
  const [name, setName] = useState(t.name);
  const [txt, setTxt] = useState(t.steps.map((s) => s.t).join('\n'));
  const steps = txt.split('\n').map((s) => s.trim()).filter(Boolean);
  return (
    <Modal open onClose={onClose} title={t.kind === 'own' ? L('addTask') : `${L('editSteps')}: ${t.name}`}>
      <div className="grid gap-3">
        {t.kind === 'own' && <label><span className="label">{L('taskName')}</span><input className="input" value={name} onChange={(e) => setName(e.target.value)} /></label>}
        <label><span className="label">{L('stepsHint')}</span><textarea className="input min-h-[200px] leading-relaxed" value={txt} onChange={(e) => setTxt(e.target.value)} /></label>
        <SheetActions>
          {onReset ? <button className="btn-ghost text-danger" onClick={onReset}>{t.kind === 'own' ? <><Trash2 size={18} aria-hidden /> {L('delete')}</> : <><RotateCcw size={18} aria-hidden /> {L('useOriginal')}</>}</button> : <span />}
          <button className="btn-primary" disabled={!steps.length || (t.kind === 'own' && !name.trim())} onClick={() => onSave(t, name.trim(), steps)}>{L('save')}</button>
        </SheetActions>
      </div>
    </Modal>
  );
}

/** One step at a time, big and clear; the parent taps how much help was needed. */
function Run({ t, onClose, onDone }: { t: Task; onClose: () => void; onDone: (lv: Level[]) => void }) {
  const { lang } = useT();
  const L = (k: Parameters<typeof ct>[1], v?: Record<string, string | number>) => ct(lang, k, v);
  const volume = useUI((s) => s.volume);
  const [lv, setLv] = useState<Level[]>([]);
  const k = lv.length;
  const done = k >= t.steps.length;
  const mark = (v: Level) => {
    const next = [...lv, v]; setLv(next);
    play(midi(64 + v * 4 + Math.min(12, k)), 'marimba', volume * 0.6, 0.4);
    if (next.length >= t.steps.length) { [0, 4, 7, 12].forEach((d, i) => play(midi(72 + d), 'bell', volume * 0.7, 1.2, i * 0.13)); onDone(next); }
  };
  const s = t.steps[k];
  return createPortal(
    <div className="fixed inset-0 z-[80] flex flex-col bg-bg select-none" role="dialog" aria-modal="true" aria-label={t.name}>
      <div className="flex items-center gap-2 p-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <button className="w-12 h-12 rounded-full bg-surface2 flex items-center justify-center" aria-label={L('cancel')} onClick={onClose}><X /></button>
        <p className="flex-1 font-extrabold text-center truncate">{t.name}</p>
        <button className="w-12 h-12 rounded-full bg-surface2 flex items-center justify-center" aria-label={L('again')} disabled={!k} onClick={() => setLv(done ? [] : lv.slice(0, -1))}><RotateCcw size={20} /></button>
      </div>
      <div className="flex gap-1.5 px-4" aria-hidden>{t.steps.map((_, i) => <span key={i} className={cx('h-2 flex-1 rounded-full', i < k ? (lv[i] === 2 ? 'bg-[var(--tg1)]' : 'bg-[rgb(var(--accent))]') : i === k ? 'bg-muted/40' : 'bg-surface2')} />)}</div>
      <div className="flex-1 flex flex-col items-center justify-center text-center px-6" aria-live="polite">
        {done ? (
          <><p className="text-[6rem] leading-none mb-4" aria-hidden>🎉</p><p className="text-3xl font-extrabold mb-2">{L('allSteps')}</p><p className="text-4xl" aria-label={`${lv.filter((v) => v === 2).length} ⭐`}>{lv.map((v) => LEVELS[v].e).join(' ')}</p></>
        ) : (
          <><p className="text-sm font-bold text-muted mb-3">{L('stepOfN', { n: k + 1, all: t.steps.length })}</p><p className="text-[6.5rem] leading-none mb-5" aria-hidden>{s.e}</p><p className="text-3xl font-extrabold leading-snug">{s.t}</p></>
        )}
      </div>
      <div className="p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        {done ? (
          <div className="grid grid-cols-2 gap-3"><button className="btn bg-surface2 !min-h-[64px] !rounded-3xl text-lg" onClick={() => setLv([])}><RotateCcw aria-hidden /> {L('again')}</button><button className="btn-primary !min-h-[64px] !rounded-3xl text-lg" onClick={onClose}>✓</button></div>
        ) : (
          <div className="grid grid-cols-3 gap-2">{LEVELS.map((x) => (
            <button key={x.v} className={cx('tile !p-2 min-h-[96px] flex flex-col items-center justify-center gap-1', x.c)} onClick={() => mark(x.v)}>
              <span className="relative z-[1] text-3xl" aria-hidden>{x.e}</span><b className="relative z-[1] text-sm leading-tight">{L(x.k)}</b>
            </button>
          ))}</div>
        )}
      </div>
      {done && <Celebrate />}
    </div>, document.body,
  );
}
