import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Phone, Plus, Wind } from 'lucide-react';
import { useT } from '../../i18n';
import { Page, PageHeader, Section } from '../../components/ui';
import { WeeklyEditor } from '../../components/sheets/Weekly';
import { BlockView } from '../../components/Blocks';
import { loadBook, toc, type Block } from '../../lib/content';
import { useSheet } from '../../lib/hooks';
import { fmtDate, isoDate } from '../../lib/util';

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
      <p className="text-sm text-muted mt-2">{t('breathingHint')}</p>
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

export default function ForMe() {
  const { t, lang } = useT();
  const [relax, setRelax] = useState<Block[]>([]);
  useEffect(() => { const a = toc.anchors.relax; loadBook(lang).then((b) => setRelax(b.chapters.find((c) => c.id === a.c)?.blocks.slice(a.from, a.to + 1) ?? [])); }, [lang]);
  return (
    <Page>
      <PageHeader title={t('navForMe')} sub={t('forMeSub')} />
      <a href="tel:14416" className="card p-4 mb-6 flex items-center gap-4 bg-[var(--p1t)]">
        <span className="w-14 h-14 rounded-full bg-[var(--p1)] text-white flex items-center justify-center shrink-0"><Phone aria-hidden /></span>
        <span><b className="text-lg block">{t('teleManas')}</b><span className="text-sm">{t('teleManasSub')}</span></span>
      </a>
      <Section title={t('breathing')}><Breathing /></Section>
      <Section title={t('relaxation')}><div className="card p-4 prose-read" style={{ ['--pc' as string]: 'var(--p3)', ['--pt' as string]: 'var(--p3t)' }}>{relax.map((b, i) => <BlockView key={i} b={b} chapter="c10" index={toc.anchors.relax.from + i} />)}</div></Section>
      <Section title={t('weeklyCheck')}><WeeklyEditor currentOnly /></Section>
      <Section title={t('goodMoments')}><GoodMoments /></Section>
      <Section title={t('supportCircle')}><Link to="/notebook/support" className="btn-outline w-full">{t('openSupportCircle')}</Link><p className="text-sm text-muted mt-2">{t('supportCircleHint')}</p></Section>
    </Page>
  );
}
