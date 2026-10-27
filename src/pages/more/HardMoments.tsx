import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Phone, Plus, Shuffle, X } from 'lucide-react';
import { useT } from '../../i18n';
import { Page, PageHeader, Section, Hint, useWakeLock } from '../../components/ui';
import { getSetting, setSetting } from '../../lib/db';
import { dbt, type DbtDict } from '../../lib/dbtText';
import { cx, fmtDate, isoDate, addDays } from '../../lib/util';
import { Breathing } from './ForMe';

type Tab = 'through' | 'understand' | 'accept';
/** A setting kept on this phone, read live. */
function useStored<T>(key: string, init: T): [T, (v: T) => void] {
  const v = useLiveQuery(() => getSetting<T>(key, init), [key]) ?? init;
  return [v, (n: T) => { void setSetting(key, n); }];
}

/** A titled card that opens to its practice. */
function Skill({ id, icon, title, intro, children, open: start = false }: { id: string; icon: string; title: string; intro?: string; children: ReactNode; open?: boolean }) {
  const [open, setOpen] = useState(start);
  useEffect(() => { if (start) setOpen(true); }, [start]);
  return (
    <div id={id} className="card !rounded-3xl overflow-hidden scroll-mt-20">
      <button className="w-full flex items-center gap-3 p-4 text-start min-h-[64px]" aria-expanded={open} onClick={() => setOpen(!open)}>
        <span className="text-2xl w-10 h-10 rounded-2xl bg-[var(--p3t)] flex items-center justify-center shrink-0" aria-hidden>{icon}</span>
        <span className="flex-1 font-extrabold text-lg">{title}</span>
        <span className={cx('text-muted transition-transform', open && 'rotate-180')} aria-hidden>⌄</span>
      </button>
      {open && <div className="px-4 pb-4 -mt-1">{intro && <p className="text-muted mb-3">{intro}</p>}{children}</div>}
    </div>
  );
}

/** One step at a time, with a big letter or number. */
function Stepper({ steps, d }: { steps: { mark: string; title?: string; text: string }[]; d: DbtDict }) {
  const [i, setI] = useState(0);
  const s = steps[i];
  return (
    <div className="rounded-2xl bg-surface2 p-4 text-center">
      <p className="text-5xl font-extrabold text-accent mb-1" aria-hidden>{s.mark}</p>
      {s.title && <p className="font-extrabold text-lg">{s.title}</p>}
      <p className="text-lg min-h-[3.5rem] mb-3" aria-live="polite">{s.text}</p>
      <div className="flex gap-1.5 justify-center mb-3" aria-hidden>{steps.map((_, k) => <span key={k} className={cx('h-1.5 rounded-full transition-all', k === i ? 'w-6 bg-accent' : 'w-1.5 bg-line')} />)}</div>
      <button className="btn-primary w-full" onClick={() => setI(i >= steps.length - 1 ? 0 : i + 1)}>{i >= steps.length - 1 ? d.again : d.next}</button>
    </div>
  );
}

/** Tighten for 5 seconds, let go for 10, one part of the body after another. */
function TenseRelease({ d }: { d: DbtDict }) {
  const [step, setStep] = useState(-1);
  const [left, setLeft] = useState(0);
  useWakeLock(step >= 0);
  useEffect(() => {
    if (step < 0) return;
    const total = d.tenseParts.length * 2;
    if (step >= total) { setStep(-1); return; }
    const secs = step % 2 === 0 ? 5 : 10;
    setLeft(secs);
    let n = secs;
    const h = setInterval(() => { n--; setLeft(n); if (n <= 0) { clearInterval(h); setStep((s) => s + 1); } }, 1000);
    return () => clearInterval(h);
  }, [step, d.tenseParts.length]);
  if (step < 0) return <button className="btn-outline w-full mt-3" onClick={() => setStep(0)}>{d.tenseGo}</button>;
  const tight = step % 2 === 0;
  return (
    <div className="rounded-2xl p-4 mt-3 text-center transition-colors duration-700" style={{ background: tight ? 'var(--p1t)' : 'var(--p3t)' }} aria-live="polite">
      <p className="font-bold">{d.tenseParts[Math.floor(step / 2)]}</p>
      <p className="text-2xl font-extrabold my-2">{tight ? d.tense : d.release} <span className="tabular-nums">{left}</span></p>
      <button className="btn-ghost" onClick={() => setStep(-1)}>{d.stop}</button>
    </div>
  );
}

function ComfortKit({ d }: { d: DbtDict }) {
  const [kit, setKit] = useStored<string[]>('comfortKit', []);
  const [own, setOwn] = useState('');
  const toggle = (x: string) => setKit(kit.includes(x) ? kit.filter((k) => k !== x) : [...kit, x]);
  return (
    <>
      <div className="grid gap-3">
        {d.senses.map(([e, name, ideas]) => (
          <div key={name}>
            <p className="font-bold mb-1.5"><span aria-hidden>{e}</span> {name}</p>
            <div className="flex flex-wrap gap-2">{ideas.map((x) => (
              <button key={x} aria-pressed={kit.includes(x)} onClick={() => toggle(x)} className={cx('chip min-h-[44px] text-start', kit.includes(x) && 'chip-on')}>{x}</button>
            ))}</div>
          </div>
        ))}
      </div>
      <div className="rounded-2xl bg-[var(--p3t)] p-3 mt-4">
        <p className="font-extrabold mb-2">{d.myKit}</p>
        {kit.length ? <ul className="grid gap-1.5 mb-2">{kit.map((x) => (
          <li key={x} className="flex items-center gap-2"><span className="flex-1">• {x}</span><button className="icon-btn !w-10 !h-10" aria-label={`${d.stop}: ${x}`} onClick={() => toggle(x)}><X size={16} /></button></li>
        ))}</ul> : <p className="text-sm text-muted mb-2">{d.kitEmpty}</p>}
        <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); const v = own.trim(); if (v && !kit.includes(v)) setKit([...kit, v]); setOwn(''); }}>
          <input className="input" placeholder={d.addOwn} aria-label={d.addOwn} value={own} onChange={(e) => setOwn(e.target.value)} />
          <button className="btn-primary px-4 shrink-0" aria-label={d.addOwn}><Plus /></button>
        </form>
      </div>
    </>
  );
}

function Away({ d }: { d: DbtDict }) {
  const [i, setI] = useState(() => Math.floor(Math.random() * d.awayIdeas.length));
  return (
    <div className="rounded-2xl bg-surface2 p-4 text-center">
      <p className="text-xl font-bold min-h-[4rem] flex items-center justify-center" aria-live="polite">{d.awayIdeas[i % d.awayIdeas.length]}</p>
      <button className="btn-outline w-full mt-3" onClick={() => setI((i + 1 + Math.floor(Math.random() * (d.awayIdeas.length - 1))) % d.awayIdeas.length)}><Shuffle size={18} aria-hidden /> {d.another}</button>
    </div>
  );
}

function Words({ d }: { d: DbtDict }) {
  const [mine, setMine] = useStored<string[]>('myWords', []);
  return (
    <div className="mt-4">
      <p className="font-extrabold mb-2">{d.wordsTitle}</p>
      <div className="grid gap-2">{d.words.map((w) => (
        <button key={w} aria-pressed={mine.includes(w)} onClick={() => setMine(mine.includes(w) ? mine.filter((x) => x !== w) : [...mine, w])}
          className={cx('rounded-2xl p-3 text-start font-bold min-h-[48px] transition', mine.includes(w) ? 'bg-[var(--p2)] text-white' : 'bg-surface2')}>{w}</button>
      ))}</div>
      <Hint className="mt-2">{d.keepWords}</Hint>
    </div>
  );
}

interface Entry { at: number; f: string; v: number; note: string; fits?: boolean }
function NameIt({ d }: { d: DbtDict }) {
  const { lang } = useT();
  const [diary, setDiary] = useStored<Entry[]>('feelingsDiary', []);
  const [f, setF] = useState<string>();
  const [v, setV] = useState(5);
  const [note, setNote] = useState('');
  const [fits, setFits] = useState<boolean>();
  const [saved, setSaved] = useState(false);
  const feel = d.feelings.find((x) => x[0] === f);
  const reset = () => { setF(undefined); setV(5); setNote(''); setFits(undefined); setSaved(false); };
  return (
    <>
      <div className="flex flex-wrap gap-2 mb-4" role="radiogroup" aria-label={d.nameTitle}>{d.feelings.map(([id, name]) => (
        <button key={id} role="radio" aria-checked={f === id} onClick={() => { setF(id); setFits(undefined); setSaved(false); }} className={cx('chip min-h-[44px]', f === id && 'chip-on')}>{name}</button>
      ))}</div>
      {feel && (
        <div className="grid gap-4">
          <div>
            <p className="font-bold mb-2">{d.howStrongIs}</p>
            <input type="range" min={0} max={10} value={v} onChange={(e) => setV(+e.target.value)} className="w-full accent-[rgb(var(--accent))]" aria-label={d.howStrongIs} />
            <p className="text-center font-extrabold text-2xl tabular-nums" aria-hidden>{v}</p>
          </div>
          <label className="block"><span className="font-bold block mb-1">{d.whatHappened}</span><textarea className="input min-h-[80px]" value={note} onChange={(e) => setNote(e.target.value)} /></label>
          <div className="rounded-2xl bg-surface2 p-3">
            <p className="font-extrabold mb-2">{d.checkTitle}</p>
            <ul className="grid gap-1.5 mb-3">{d.checkQs.map((q) => <li key={q}>• {q}</li>)}</ul>
            <div className="grid grid-cols-2 gap-2">
              <button aria-pressed={fits === true} className={fits === true ? 'btn-primary' : 'btn-outline'} onClick={() => setFits(true)}>{d.fits}</button>
              <button aria-pressed={fits === false} className={fits === false ? 'btn-primary' : 'btn-outline'} onClick={() => setFits(false)}>{d.notFits}</button>
            </div>
          </div>
          {fits !== undefined && (
            <div className="rounded-2xl bg-[var(--p3t)] p-3" aria-live="polite">
              {fits ? <p>{d.fitsText}</p> : <><p className="font-extrabold mb-1">{d.oppTitle}</p><p>{feel[2]}</p></>}
            </div>
          )}
          {fits !== undefined && (saved
            ? <button className="btn-ghost w-full" onClick={reset}>✓ {d.saved} · {d.again}</button>
            : <button className="btn-primary w-full" onClick={() => { setDiary([...diary, { at: Date.now(), f: feel[0], v, note: note.trim(), fits }].slice(-100)); setSaved(true); }}>{d.save}</button>)}
        </div>
      )}
      {diary.length > 0 && (
        <div className="mt-5">
          <p className="font-extrabold">{d.diary}</p>
          <p className="text-xs text-muted mb-2">{d.diaryHint}</p>
          <ul className="grid gap-2">{[...diary].reverse().slice(0, 5).map((e) => (
            <li key={e.at} className="rounded-xl bg-surface2 p-3">
              <span className="text-xs font-bold text-muted">{fmtDate(isoDate(new Date(e.at)), lang)}</span>
              <p className="font-bold">{d.feelings.find((x) => x[0] === e.f)?.[1] ?? e.f} · {e.v}/10</p>
              {e.note && <p className="text-sm">{e.note}</p>}
            </li>
          ))}</ul>
        </div>
      )}
    </>
  );
}

function BodyCare({ d }: { d: DbtDict }) {
  const { lang } = useT();
  const [log, setLog] = useStored<Record<string, number[]>>('bodyCare', {});
  const today = isoDate();
  const ticks = log[today] ?? [];
  const toggle = (i: number) => {
    const next = ticks.includes(i) ? ticks.filter((x) => x !== i) : [...ticks, i];
    const keep = Object.fromEntries(Object.entries({ ...log, [today]: next }).filter(([k]) => k >= isoDate(addDays(new Date(), -30))));
    setLog(keep);
  };
  const week = Array.from({ length: 7 }, (_, i) => isoDate(addDays(new Date(), i - 6)));
  return (
    <>
      <ul className="grid gap-2">{d.bodyItems.map((x, i) => (
        <li key={i}><label className="flex items-center gap-3 rounded-2xl bg-surface2 p-3 min-h-[52px] cursor-pointer">
          <input type="checkbox" className="w-6 h-6 accent-[rgb(var(--accent))] shrink-0" checked={ticks.includes(i)} onChange={() => toggle(i)} />
          <span>{x}</span>
        </label></li>
      ))}</ul>
      <p className="font-bold mt-4 mb-2">{d.thisWeek}</p>
      <div className="grid grid-cols-7 gap-1.5">{week.map((day) => {
        const n = (log[day] ?? []).length;
        return (
          <div key={day} className="text-center">
            <div className="h-14 rounded-xl bg-surface2 flex items-end overflow-hidden" aria-label={`${fmtDate(day, lang)}: ${n}/${d.bodyItems.length}`}>
              <span className="w-full bg-[var(--p3)] rounded-xl transition-all" style={{ height: `${(n / d.bodyItems.length) * 100}%` }} />
            </div>
            <span className="text-[11px] text-muted">{new Date(`${day}T12:00`).toLocaleDateString(lang, { weekday: 'narrow' })}</span>
          </div>
        );
      })}</div>
    </>
  );
}

/** A quiet minute, with a ring that fills. */
function Minute({ d }: { d: DbtDict }) {
  const [left, setLeft] = useState(0);
  useWakeLock(left > 0);
  useEffect(() => { if (left <= 0) return; const h = setTimeout(() => setLeft(left - 1), 1000); return () => clearTimeout(h); }, [left]);
  const pct = left > 0 ? (60 - left) / 60 : 0;
  return left > 0 ? (
    <div className="flex flex-col items-center mt-3">
      <svg viewBox="0 0 100 100" className="w-32 h-32" aria-hidden><circle cx="50" cy="50" r="44" fill="none" stroke="var(--p3t)" strokeWidth="8" /><circle cx="50" cy="50" r="44" fill="none" stroke="var(--p3)" strokeWidth="8" strokeLinecap="round" strokeDasharray={`${pct * 276.5} 276.5`} transform="rotate(-90 50 50)" style={{ transition: 'stroke-dasharray 1s linear' }} /><text x="50" y="57" textAnchor="middle" fontSize="22" fontWeight="800" fill="currentColor">{left}</text></svg>
      <button className="btn-ghost mt-2" onClick={() => setLeft(0)}>{d.stop}</button>
    </div>
  ) : <button className="btn-outline w-full mt-3" onClick={() => setLeft(60)}>{d.minute}</button>;
}

/** Ten breaths with the words "wise" and "mind". */
function WiseMind({ d }: { d: DbtDict }) {
  const [n, setN] = useState(0);
  const [phase, setPhase] = useState<'in' | 'out'>('in');
  const on = n > 0 && n <= 10;
  useWakeLock(on);
  const t = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => {
    if (!on) return;
    t.current = setTimeout(() => { if (phase === 'in') setPhase('out'); else { setPhase('in'); setN(n + 1); } }, phase === 'in' ? 4000 : 6000);
    return () => clearTimeout(t.current);
  }, [on, n, phase]);
  if (n === 0) return <button className="btn-outline w-full mt-3" onClick={() => { setPhase('in'); setN(1); }}>{d.start}</button>;
  if (n > 10) return (
    <div className="rounded-2xl bg-[var(--p3t)] p-4 mt-3 text-center">
      <p className="text-xl font-extrabold">{d.wiseAsk}</p>
      <button className="btn-ghost mt-2" onClick={() => setN(0)}>{d.done}</button>
    </div>
  );
  return (
    <div className="rounded-2xl p-4 mt-3 text-center bg-surface2" aria-live="polite">
      <p className="text-sm text-muted">{d.breathN.replace('{n}', String(n))}</p>
      <p className="text-2xl font-extrabold my-3">{phase === 'in' ? d.wiseIn : d.wiseOut}</p>
      <button className="btn-ghost" onClick={() => setN(0)}>{d.stop}</button>
    </div>
  );
}

export default function HardMoments() {
  const { t, lang } = useT();
  const d = dbt(lang);
  const [tab, setTab] = useState<Tab>('through');
  const [focus, setFocus] = useState<string>();
  const go = (tb: Tab, id: string) => { setTab(tb); setFocus(id); setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60); };
  const tabs: { v: Tab; l: string }[] = [{ v: 'through', l: d.tabThrough }, { v: 'understand', l: d.tabUnderstand }, { v: 'accept', l: d.tabAccept }];
  return (
    <Page>
      <PageHeader title={d.title} sub={d.sub} back="/me" help={<p>{d.intro}</p>} />
      <Section title={d.howStrong}>
        <div className="grid gap-2">
          <button className="card p-4 text-start font-bold min-h-[56px] border-s-8 border-[var(--p1)]" onClick={() => go('through', 'stop')}>{d.lvlHigh}</button>
          <button className="card p-4 text-start font-bold min-h-[56px] border-s-8 border-[var(--p2)]" onClick={() => go('through', 'soothe')}>{d.lvlMid}</button>
          <button className="card p-4 text-start font-bold min-h-[56px] border-s-8 border-[var(--p3)]" onClick={() => go('understand', 'name')}>{d.lvlLow}</button>
        </div>
      </Section>
      <div role="tablist" aria-label={d.title} className="flex gap-1 p-1 rounded-2xl bg-surface2 mb-5 sticky top-2 z-10">
        {tabs.map((x) => <button key={x.v} role="tab" aria-selected={tab === x.v} onClick={() => setTab(x.v)} className={cx('flex-1 min-w-0 rounded-xl px-1.5 py-2 font-bold text-sm leading-tight break-words min-h-[48px] transition', tab === x.v ? 'bg-surface shadow text-accent' : 'text-muted')}>{x.l}</button>)}
      </div>
      <div className="grid gap-3 mb-7" role="tabpanel">
        {tab === 'through' && <>
          <Skill id="stop" icon="✋" title={d.stopTitle} intro={d.stopIntro} open={focus === 'stop'}>
            <Stepper d={d} steps={d.stopSteps.map(([mark, title, text]) => ({ mark, title, text }))} />
          </Skill>
          <Skill id="cool" icon="💧" title={d.coolTitle} intro={d.coolIntro}>
            <ul className="grid gap-2">{d.coolItems.map(([h, x]) => <li key={h} className="rounded-2xl bg-surface2 p-3"><b className="block">{h}</b>{x}</li>)}</ul>
            <div className="mt-3"><Breathing /></div>
            <TenseRelease d={d} />
            <p className="text-sm rounded-2xl bg-[var(--p1t)] p-3 mt-3">{d.coolCaution}</p>
          </Skill>
          <Skill id="soothe" icon="🌼" title={d.sootheTitle} intro={d.sootheIntro} open={focus === 'soothe'}><ComfortKit d={d} /></Skill>
          <Skill id="away" icon="🧺" title={d.awayTitle} intro={d.awayIntro}><Away d={d} /></Skill>
          <Skill id="better" icon="🕯️" title={d.betterTitle}>
            <ul className="grid gap-2">{d.betterItems.map(([h, x]) => <li key={h} className="rounded-2xl bg-surface2 p-3"><b className="block">{h}</b>{x}</li>)}</ul>
            <Words d={d} />
          </Skill>
        </>}
        {tab === 'understand' && <>
          <Skill id="name" icon="💬" title={d.nameTitle} intro={d.nameIntro} open><NameIt d={d} /></Skill>
          <Skill id="body" icon="🍲" title={d.bodyTitle} intro={d.bodyIntro}><BodyCare d={d} /></Skill>
        </>}
        {tab === 'accept' && <>
          <Skill id="accept" icon="🌊" title={d.acceptTitle} intro={d.acceptIntro} open>
            <Stepper d={d} steps={d.acceptLines.map((text, i) => ({ mark: String(i + 1), text }))} />
            <p className="text-sm text-muted mt-3">{d.turnMind}</p>
          </Skill>
          <Skill id="hands" icon="🤲" title={d.handsTitle} intro={d.handsText}><Minute d={d} /></Skill>
          <Skill id="wise" icon="🪷" title={d.wiseTitle} intro={d.wiseText}><WiseMind d={d} /></Skill>
        </>}
      </div>
      <div className="card p-4 bg-[var(--p1t)]">
        <p className="mb-3">{d.help}</p>
        <a href="tel:14416" className="btn-primary w-full"><Phone size={18} aria-hidden /> {t('teleManas')}</a>
      </div>
    </Page>
  );
}
