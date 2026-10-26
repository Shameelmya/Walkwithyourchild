import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Phone, Plus, Wind } from 'lucide-react';
import { useT } from '../../i18n';
import { Page, PageHeader, Section, Hint } from '../../components/ui';
import { WeeklyEditor } from '../../components/sheets/Weekly';
import { BlockView } from '../../components/Blocks';
import { loadBook, toc, type Block } from '../../lib/content';
import { useSheet } from '../../lib/hooks';
import { cx, fmtDate, isoDate } from '../../lib/util';
import { useLiveQuery } from 'dexie-react-hooks';
import { getSetting, setSetting } from '../../lib/db';
import { ct } from '../../lib/careText';
import { FromBook } from '../child/Care';

function Breathing() {
  const { t } = useT();
  const [on, setOn] = useState(false);
  const [phase, setPhase] = useState<'in' | 'out'>('in');
  const [count, setCount] = useState(4);
  useEffect(() => {
    if (!on) return;
    let ph: 'in' | 'out' = 'in'; let c = 4; setPhase('in'); setCount(4);
    const h = setInterval(() => { c--; if (c <= 0) { ph = ph === 'in' ? 'out' : 'in'; c = ph === 'in' ? 4 : 6; setPhase(ph); } setCount(c); }, 1000);
    return () => clearInterval(h);
  }, [on]);
  const scale = !on ? 0.6 : phase === 'in' ? 1 : 0.55;
  return (
    <div className="card p-5 flex flex-col items-center text-center">
      <div className="relative w-56 h-56 flex items-center justify-center my-2" aria-live="polite">
        <span className="absolute inset-0 rounded-full bg-[var(--p1t)]" />
        <span className="absolute inset-0 rounded-full bg-[var(--p1)] opacity-80" style={{ transform: `scale(${scale})`, transition: `transform ${phase === 'in' ? 4 : 6}s ease-in-out` }} />
        <span className="relative text-white font-extrabold text-2xl drop-shadow">{on ? <>{t(phase === 'in' ? 'breatheIn' : 'breatheOut')}<br /><span className="text-4xl">{count}</span></> : ''}</span>
      </div>
      <button className={on ? 'btn-ghost' : 'btn-primary'} onClick={() => setOn(!on)}><Wind size={18} aria-hidden /> {on ? t('stop') : t('startBreathing')}</button>
      <Hint className="mt-2">{t('breathingHint')}</Hint>
    </div>
  );
}

function GoodMoments() {
  const { t, lang } = useT();
  const [data, setData] = useSheet('good-moments');
  const [txt, setTxt] = useState('');
  if (!data) return null;
  const rows = ((data.rows as Record<string, string>[]) ?? []).filter((r) => r.moment);
  return (
    <div className="card p-4">
      <form className="flex gap-2 mb-3" onSubmit={(e) => { e.preventDefault(); if (!txt.trim()) return; setData({ ...data, rows: [...rows, { date: isoDate(), moment: txt.trim() }] }); setTxt(''); }}>
        <input className="input" placeholder={t('goodMomentPlaceholder')} aria-label={t('goodMomentPlaceholder')} value={txt} onChange={(e) => setTxt(e.target.value)} />
        <button className="btn-primary px-4 shrink-0" aria-label={t('add')}><Plus /></button>
      </form>
      <ul className="grid gap-2">{[...rows].reverse().slice(0, 6).map((r, i) => <li key={i} className="rounded-xl bg-[var(--p3t)] p-3"><span className="text-xs font-bold text-muted">{fmtDate(r.date, lang)}</span><p>{r.moment}</p></li>)}</ul>
      <Link to="/notebook/good-moments" className="text-sm font-bold text-accent underline inline-block mt-2 min-h-[32px]">{t('seeAll')}</Link>
    </div>
  );
}

/** A 0–10 feelings check; a high score points straight to someone to talk to. */
function Thermometer() {
  const { t, lang } = useT();
  const L = (k: Parameters<typeof ct>[1]) => ct(lang, k);
  const log = useLiveQuery(() => getSetting<{ at: number; v: number }[]>('distress', []), []) ?? [];
  const [v, setV] = useState<number | null>(null);
  const [saved, setSaved] = useState(false);
  const hue = (n: number) => `hsl(${140 - n * 14} 60% 45%)`;
  return (
    <div className="card p-4">
      <p className="font-bold mb-1">{L('thermo')}</p>
      <p className="text-sm text-muted mb-3">{L('thermoHint')}</p>
      <div className="grid grid-cols-11 gap-1 mb-3">{Array.from({ length: 11 }, (_, n) => (
        <button key={n} aria-pressed={v === n} className={cx('h-12 rounded-xl font-extrabold tabular-nums text-sm transition', v === n ? 'text-white scale-110' : 'bg-surface2')} style={v === n ? { background: hue(n) } : undefined} onClick={() => { setV(n); setSaved(false); }}>{n}</button>
      ))}</div>
      {v !== null && !saved && <button className="btn-primary w-full" onClick={() => { void setSetting('distress', [...log, { at: Date.now(), v }].slice(-60)); setSaved(true); }}>{L('logIt')}</button>}
      {v !== null && v >= 7 && (
        <div className="rounded-2xl bg-[var(--p1t)] p-3 mt-3">
          <p className="font-bold mb-2">{L('thermoHigh')}</p>
          <a href="tel:14416" className="btn-primary w-full"><Phone size={18} aria-hidden /> {t('teleManas')}</a>
        </div>
      )}
      {log.length > 0 && <div className="flex items-end gap-1 h-12 mt-4" aria-hidden>{log.slice(-14).map((x) => <span key={x.at} className="flex-1 rounded-t" style={{ height: `${10 + x.v * 9}%`, background: hue(x.v) }} />)}</div>}
    </div>
  );
}

/** 5-4-3-2-1 grounding, one prompt at a time. */
function Grounding() {
  const { lang } = useT();
  const L = (k: Parameters<typeof ct>[1]) => ct(lang, k);
  const steps = ['g5', 'g4', 'g3', 'g2', 'g1'] as const;
  const [i, setI] = useState(-1);
  return (
    <div className="card p-4 text-center">
      {i < 0 ? <button className="btn-outline w-full" onClick={() => setI(0)}>{L('ground')}</button> : (
        <>
          <p className="text-5xl font-extrabold mb-2 text-accent" aria-hidden>{5 - Math.min(i, 4)}</p>
          <p className="text-lg font-bold mb-4 min-h-[3.5rem]" aria-live="polite">{L(steps[Math.min(i, 4)])}</p>
          <button className="btn-primary w-full" onClick={() => setI(i >= 4 ? -1 : i + 1)}>{i >= 4 ? '✓' : L('next')}</button>
        </>
      )}
    </div>
  );
}

export default function ForMe() {
  const { t, lang } = useT();
  const [relax, setRelax] = useState<Block[]>([]);
  useEffect(() => { const a = toc.anchors.relax; loadBook(lang).then((b) => setRelax(b.chapters.find((c) => c.id === a.c)?.blocks.slice(a.from, a.to + 1) ?? [])); }, [lang]);
  return (
    <Page>
      <PageHeader title={t('navForMe')} />
      <a href="tel:14416" className="card p-4 mb-6 flex items-center gap-4 bg-[var(--p1t)]">
        <span className="w-14 h-14 rounded-full bg-[var(--p1)] text-white flex items-center justify-center shrink-0"><Phone aria-hidden /></span>
        <span><b className="text-lg block">{t('teleManas')}</b><span className="text-sm">{t('teleManasSub')}</span></span>
      </a>
      <Section title={ct(lang, 'tooMuch')}><div className="grid gap-3"><Thermometer /><Grounding /></div></Section>
      <Section title={t('breathing')}><Breathing /></Section>
      <Section title={t('relaxation')}><div className="card p-4 prose-read" style={{ ['--pc' as string]: 'var(--p3)', ['--pt' as string]: 'var(--p3t)' }}>{relax.map((b, i) => <BlockView key={i} b={b} chapter="c10" index={toc.anchors.relax.from + i} />)}</div></Section>
      <Section title={ct(lang, 'fromBookCare')}><FromBook src={[2, 4, 6, 7].map((h) => ({ c: 'c10', h }))} /></Section>
      <Section title={t('weeklyCheck')}><WeeklyEditor currentOnly /></Section>
      <Section title={t('goodMoments')}><GoodMoments /></Section>
      <Section title={t('supportCircle')}><Link to="/notebook/support" className="btn-outline w-full">{t('openSupportCircle')}</Link><p className="text-sm text-muted mt-2">{t('supportCircleHint')}</p></Section>
    </Page>
  );
}
