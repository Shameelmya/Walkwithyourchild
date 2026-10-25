import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { Plus, Play, Pause, Pencil, Trash2, X, RotateCcw } from 'lucide-react';
import { useT } from '../../i18n';
import { Page, PageHeader, Modal, SheetActions, useWakeLock } from '../../components/ui';
import { db, getSetting, setSetting } from '../../lib/db';
import { useChildId } from '../../lib/hooks';
import { EXERCISE_SRC } from '../../lib/care';
import { ct } from '../../lib/careText';
import { play, midi } from '../../lib/audio';
import { useUI } from '../../lib/store';
import { addDays, cx, isoDate } from '../../lib/util';
import { FromBook } from './Care';
import { Celebrate } from '../play/games-colour';

type Area = 'physio' | 'ot' | 'speech' | 'other';
type Theme = 'balloon' | 'rocket' | 'flower' | 'turtle';
interface Exercise { id: number; name: string; area: Area; kind: 'count' | 'hold'; target: number; theme: Theme; note: string }
const THEMES: { v: Theme; e: string }[] = [{ v: 'balloon', e: '🎈' }, { v: 'rocket', e: '🚀' }, { v: 'flower', e: '🌻' }, { v: 'turtle', e: '🐢' }];
const AREA_C: Record<Area, string> = { physio: 't-blue', ot: 't-violet', speech: 't-amber', other: 't-mint' };
const NOTES = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24];

/** Home exercises from the child's own therapist, played as a game, with stars for each day. */
export default function Therapy() {
  const { lang } = useT();
  const L = (k: Parameters<typeof ct>[1], v?: Record<string, string | number>) => ct(lang, k, v);
  const childId = useChildId();
  const key = `ex:${childId}`;
  const list = useLiveQuery(() => getSetting<Exercise[]>(key, []), [key]) ?? [];
  const logs = useLiveQuery(() => db.episodes.where('childId').equals(childId).filter((e) => e.kind === 'therapy' && e.start > Date.now() - 60 * 86400_000).toArray(), [childId]) ?? [];
  const [edit, setEdit] = useState<Exercise | null>(null);
  const [run, setRun] = useState<Exercise | null>(null);
  const days = Array.from({ length: 7 }, (_, i) => addDays(new Date(), i - 6));
  const perDay = (d: Date) => logs.filter((l) => isoDate(new Date(l.start)) === isoDate(d)).length;
  let streak = 0; for (let i = 0; i < 60; i++) { if (logs.some((l) => isoDate(new Date(l.start)) === isoDate(addDays(new Date(), -i)))) streak++; else if (i > 0) break; }
  const todayDone = (id: number) => logs.filter((l) => l.note === String(id) && isoDate(new Date(l.start)) === isoDate()).length;
  return (
    <Page>
      <PageHeader title={L('therapy')} />
      <p className="text-sm text-muted mb-4">{L('therapyIntro')}</p>
      <section className="card p-4 mb-5">
        <div className="flex items-center justify-between mb-3"><h2 className="font-extrabold">{L('week')}</h2>{streak > 0 && <span className="chip chip-on !min-h-[30px] text-xs">🔥 {L('streak', { n: streak })}</span>}</div>
        <div className="grid grid-cols-7 gap-1.5 text-center">
          {days.map((d) => { const n = perDay(d); return (
            <div key={d.toISOString()} className={cx('rounded-2xl py-2', isoDate(d) === isoDate() ? 'bg-soft' : 'bg-surface2')}>
              <p className="text-[11px] font-bold text-muted">{d.toLocaleDateString(lang === 'en' ? 'en-IN' : `${lang}-IN`, { weekday: 'narrow' })}</p>
              <p className="text-xl leading-tight" aria-label={`${n}`}>{n ? '⭐' : '·'}</p>
              <p className="text-[11px] font-bold tabular-nums">{n || ''}</p>
            </div>
          ); })}
        </div>
      </section>
      {list.length === 0 && <p className="card p-4 text-sm text-muted mb-3">{L('noEx')}</p>}
      <div className="grid gap-3 mb-3">
        {list.map((x) => (
          <div key={x.id} className={cx('tile !p-4 flex items-center gap-3', AREA_C[x.area])}>
            <span className="relative z-[1] w-14 h-14 rounded-2xl bg-white/25 flex items-center justify-center text-3xl shrink-0" aria-hidden>{THEMES.find((t) => t.v === x.theme)?.e}</span>
            <div className="relative z-[1] flex-1 min-w-0">
              <p className="text-xs font-bold opacity-90">{L(x.area)} · {x.kind === 'count' ? `${x.target}×` : `${x.target}s`}</p>
              <b className="block leading-snug">{x.name}</b>
              {todayDone(x.id) > 0 && <p className="text-xs font-bold mt-0.5">{L('today')}: {'⭐'.repeat(Math.min(5, todayDone(x.id)))}</p>}
            </div>
            <button className="relative z-[1] w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center shrink-0" aria-label={`${L('edit')} ${x.name}`} onClick={() => setEdit(x)}><Pencil size={16} /></button>
            <button className="relative z-[1] h-12 px-4 rounded-2xl bg-white text-[#1d2430] font-extrabold flex items-center gap-1.5 shrink-0" onClick={() => setRun(x)}><Play size={18} fill="currentColor" aria-hidden /> {L('play')}</button>
          </div>
        ))}
      </div>
      <button className="btn-primary w-full mb-6" onClick={() => setEdit({ id: Date.now(), name: '', area: 'physio', kind: 'count', target: 10, theme: 'balloon', note: '' })}><Plus size={18} aria-hidden /> {L('addExercise')}</button>
      <Link to="/skills" className="card !rounded-3xl p-3 flex items-center gap-3 mb-6"><span className="w-12 h-12 rounded-2xl bg-soft flex items-center justify-center text-2xl" aria-hidden>🪥</span><span className="flex-1"><b className="block">{L('skills')}</b><span className="text-sm text-muted">{L('skillsSub')}</span></span></Link>
      <section className="mb-6"><h2 className="font-extrabold mb-2">{L('rightAmount')}</h2><FromBook src={EXERCISE_SRC} /></section>
      {edit && <Editor x={edit} onClose={() => setEdit(null)} onSave={(x) => { void setSetting(key, list.some((y) => y.id === x.id) ? list.map((y) => (y.id === x.id ? x : y)) : [...list, x]); setEdit(null); }}
        onDelete={list.some((y) => y.id === edit.id) ? () => { void setSetting(key, list.filter((y) => y.id !== edit.id)); setEdit(null); } : undefined} />}
      {run && <PlayRun x={run} onClose={() => setRun(null)} onDone={(sec) => db.episodes.add({ childId, kind: 'therapy', start: Date.now() - sec * 1000, end: Date.now(), durationSec: sec, note: String(run.id) })} />}
    </Page>
  );
}

function Editor({ x: x0, onSave, onClose, onDelete }: { x: Exercise; onSave: (x: Exercise) => void; onClose: () => void; onDelete?: () => void }) {
  const { lang } = useT();
  const L = (k: Parameters<typeof ct>[1]) => ct(lang, k);
  const [x, setX] = useState(x0);
  return (
    <Modal open onClose={onClose} title={L('addExercise')}>
      <div className="grid gap-3">
        <label><span className="label">{L('exName')}</span><input className="input" value={x.name} onChange={(e) => setX({ ...x, name: e.target.value })} /></label>
        <div><span className="label">{L('exArea')}</span><div className="flex flex-wrap gap-2">{(['physio', 'ot', 'speech', 'other'] as Area[]).map((a) => <button key={a} aria-pressed={x.area === a} className={cx('chip', x.area === a && 'chip-on')} onClick={() => setX({ ...x, area: a })}>{L(a)}</button>)}</div></div>
        <div><span className="label">{L('exKind')}</span><div className="flex flex-wrap gap-2">{(['count', 'hold'] as const).map((k) => <button key={k} aria-pressed={x.kind === k} className={cx('chip', x.kind === k && 'chip-on')} onClick={() => setX({ ...x, kind: k, target: k === 'hold' ? 10 : 10 })}>{L(k)}</button>)}</div></div>
        <label><span className="label">{L('target')}</span><input className="input w-32" type="number" inputMode="numeric" min={1} max={300} value={x.target} onChange={(e) => setX({ ...x, target: Math.max(1, Math.min(300, +e.target.value || 1)) })} /></label>
        <div><span className="label">{L('theme')}</span><div className="flex gap-2">{THEMES.map((t) => <button key={t.v} aria-label={t.v} aria-pressed={x.theme === t.v} className={cx('w-14 h-14 rounded-2xl text-3xl border-2', x.theme === t.v ? 'border-[rgb(var(--accent))] bg-soft' : 'border-line')} onClick={() => setX({ ...x, theme: t.v })}>{t.e}</button>)}</div></div>
        <label><span className="label">{L('exNote')}</span><textarea className="input min-h-[80px]" value={x.note} onChange={(e) => setX({ ...x, note: e.target.value })} /></label>
        <SheetActions>
          {onDelete ? <button className="btn-ghost text-danger" onClick={onDelete}><Trash2 size={18} aria-hidden /> {L('delete')}</button> : <span />}
          <button className="btn-primary" disabled={!x.name.trim()} onClick={() => onSave({ ...x, name: x.name.trim() })}>{L('save')}</button>
        </SheetActions>
      </div>
    </Modal>
  );
}

/** The game: every repetition (or every second held) moves the picture on; the finish is celebrated and starred. */
function PlayRun({ x, onClose, onDone }: { x: Exercise; onClose: () => void; onDone: (sec: number) => void }) {
  const { lang } = useT();
  const L = (k: Parameters<typeof ct>[1]) => ct(lang, k);
  const volume = useUI((s) => s.volume);
  const [n, setN] = useState(0);
  const [going, setGoing] = useState(false);
  const [party, setParty] = useState(0);
  const t0 = useRef(Date.now());
  const saved = useRef(false);
  useWakeLock(true);
  const p = Math.min(1, n / x.target);
  const finished = n >= x.target;
  const step = () => {
    if (finished) return;
    const k = n + 1; setN(k);
    play(midi(60 + NOTES[Math.min(NOTES.length - 1, Math.floor((k / x.target) * (NOTES.length - 1)))]), 'kalimba', volume, 0.5);
    try { navigator.vibrate?.(20); } catch { /* */ }
  };
  // Hold: one step every second while running.
  useEffect(() => { if (x.kind !== 'hold' || !going || finished) return; const h = setInterval(() => setN((k) => { const v = Math.min(x.target, k + 1); play(midi(72 + (v % 2 ? 0 : 7)), 'marimba', volume * 0.5, 0.2); return v; }), 1000); return () => clearInterval(h); }, [going, finished, x.kind, x.target, volume]);
  useEffect(() => {
    if (!finished || saved.current) return; saved.current = true; setGoing(false); setParty((q) => q + 1);
    [0, 4, 7, 12].forEach((d, i) => play(midi(72 + d), 'bell', volume * 0.7, 1.2, i * 0.13));
    onDone(Math.round((Date.now() - t0.current) / 1000));
  }, [finished, onDone, volume]);
  useEffect(() => { const k = (e: KeyboardEvent) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); if (x.kind === 'count') step(); else setGoing((g) => !g); } }; addEventListener('keydown', k); return () => removeEventListener('keydown', k); });
  const again = () => { setN(0); saved.current = false; t0.current = Date.now(); };
  const art = () => {
    switch (x.theme) {
      case 'rocket': return <><span className="absolute left-1/2 text-[5.5rem] transition-all duration-500 ease-out" style={{ bottom: `${6 + p * 70}%`, transform: 'translateX(-50%)' }}>🚀</span><span className="absolute top-[6%] left-1/2 -translate-x-1/2 text-6xl">🌙</span></>;
      case 'flower': return <span className="absolute left-1/2 bottom-[8%] -translate-x-1/2 transition-all duration-500 leading-none" style={{ fontSize: `${4 + p * 6}rem` }}>{p < 0.4 ? '🌱' : p < 1 ? '🌷' : '🌻'}</span>;
      case 'turtle': return <><span className="absolute bottom-[30%] text-[4.5rem] transition-all duration-500" style={{ left: `${4 + p * 66}%` }}>🐢</span><span className="absolute bottom-[30%] end-[4%] text-6xl">🏁</span></>;
      default: return finished ? <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[8rem]">🎉</span> : <span className="absolute left-1/2 top-[45%] transition-transform duration-500 leading-none" style={{ fontSize: '6rem', transform: `translate(-50%,-50%) scale(${0.5 + p * 1.3})` }}>🎈</span>;
    }
  };
  const sky = x.theme === 'rocket' ? 'linear-gradient(#1d2a55,#3a4f8f 70%,#6b86c9)' : x.theme === 'turtle' ? 'linear-gradient(#bfe6ff,#e9f7ff 60%,#bfe3a8 60%)' : x.theme === 'flower' ? 'linear-gradient(#e9f6ff,#fff7e0 70%,#cdeaa8 70%)' : 'linear-gradient(#fde7f0,#e9f2ff)';
  return createPortal(
    <div className="fixed inset-0 z-[80] flex flex-col select-none" style={{ background: sky }} role="dialog" aria-modal="true" aria-label={x.name}>
      <div className="flex items-center gap-2 p-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <button className="w-12 h-12 rounded-full bg-black/20 text-white flex items-center justify-center" aria-label={L('cancel')} onClick={onClose}><X /></button>
        <p className="flex-1 font-extrabold text-center truncate px-2 rounded-full bg-white/70 py-2">{x.name}</p>
        <button className="w-12 h-12 rounded-full bg-black/20 text-white flex items-center justify-center" aria-label={L('again')} onClick={again}><RotateCcw size={20} /></button>
      </div>
      <div className="relative flex-1 overflow-hidden" aria-hidden>{art()}</div>
      <p className="text-center text-5xl font-extrabold tabular-nums text-[#1d2430] drop-shadow-sm" aria-live="polite">{finished ? L('well') : `${n} / ${x.target}${x.kind === 'hold' ? 's' : ''}`}</p>
      {x.note && !finished && <p className="text-center text-sm px-6 mt-1 text-[#1d2430]/80 line-clamp-2">{x.note}</p>}
      <div className="p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        {finished ? (
          <div className="grid grid-cols-2 gap-3"><button className="btn bg-white text-[#1d2430] !min-h-[64px] !rounded-3xl text-lg" onClick={again}><RotateCcw aria-hidden /> {L('again')}</button><button className="btn-primary !min-h-[64px] !rounded-3xl text-lg" onClick={onClose}>✓</button></div>
        ) : x.kind === 'count' ? (
          <button className="w-full min-h-[120px] rounded-[2rem] bg-white shadow-lift text-[#1d2430] text-2xl font-extrabold active:scale-[0.97] transition" onClick={step}>＋1 · {L('tap')}</button>
        ) : (
          <button className="w-full min-h-[120px] rounded-[2rem] bg-white shadow-lift text-[#1d2430] text-2xl font-extrabold flex items-center justify-center gap-3 active:scale-[0.97] transition" onClick={() => setGoing(!going)}>{going ? <><Pause aria-hidden /> {L('pause')}</> : <><Play aria-hidden fill="currentColor" /> {L('start')}</>}</button>
        )}
      </div>
      {party > 0 && <Celebrate key={party} />}
    </div>, document.body,
  );
}
