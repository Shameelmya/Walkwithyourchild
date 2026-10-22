import { memo } from 'react';
import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { HelpCircle, PenLine, Phone, Plus, Check, Info, HeartPulse } from 'lucide-react';
import { db, FAMILY, getSheet, saveSheet } from '../lib/db';
import { meta, loc, type Block, type L10n, callTel } from '../lib/content';
import { useT } from '../i18n';
import { useToast } from './ui';
import { useUI } from '../lib/store';
import { isoDate, cx } from '../lib/util';

export async function addQuestion(childId: number, q: string) {
  const d = await getSheet(childId, 'questions');
  const rows = ((d.rows as Record<string, string>[]) ?? []).filter((r) => Object.values(r).some(Boolean));
  if (rows.some((r) => r.question === q)) return false;
  await saveSheet(childId, 'questions', { ...d, rows: [...rows, { date: isoDate(), question: q, answer: '' }] });
  return true;
}

const Html = ({ html, className }: { html: string; className?: string }) => <div className={className} dangerouslySetInnerHTML={{ __html: html }} />;

function Checklist({ items, chapter, index }: { items: string[]; chapter: string; index: number }) {
  const state = useLiveQuery(() => db.checklists.where('chapter').equals(chapter).toArray(), [chapter]) ?? [];
  return (
    <ul className="my-4 grid gap-2 list-none !pl-0">
      {items.map((h, i) => {
        const id = `${chapter}:${index}:${i}`;
        const on = state.find((s) => s.id === id)?.checked ?? false;
        return (
          <li key={i} className="!m-0">
            <label className={cx('flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer min-h-[48px] transition', on ? 'border-[var(--pc)] bg-[var(--pt)]' : 'border-line bg-surface')}>
              <input type="checkbox" className="sr-only" checked={on} onChange={() => db.checklists.put({ id, childId: FAMILY, chapter, blockIndex: index, item: i, checked: !on })} />
              <span aria-hidden className={cx('mt-0.5 w-7 h-7 shrink-0 rounded-lg border-2 flex items-center justify-center', on ? 'bg-[var(--pc)] border-[var(--pc)] text-white' : 'border-muted/60')}>{on && <Check size={18} />}</span>
              <span dangerouslySetInnerHTML={{ __html: h }} />
            </label>
          </li>
        );
      })}
    </ul>
  );
}

export const BlockView = memo(function BlockView({ b, chapter, index }: { b: Block; chapter: string; index: number }) {
  const { t, lang } = useT();
  const toast = useToast((s) => s.show);
  const childId = useUI((s) => s.activeChildId);
  if (b.t === 'h') return <h3 dangerouslySetInnerHTML={{ __html: b.html }} />;
  if (b.t === 'html') return <Html html={b.html} />;
  if (b.t === 'check') return <Checklist items={b.items} chapter={chapter} index={index} />;
  const label = loc((meta.calloutLabels as Record<string, L10n>)[b.kind], lang);
  switch (b.kind) {
    case 'ask':
      return (
        <aside className="callout my-5 rounded-2xl p-4 bg-[var(--pt)] font-ui" aria-label={label}>
          <p className="flex items-center gap-2 font-extrabold text-[var(--pc)] mb-2 font-head"><HelpCircle size={20} aria-hidden /> {label}</p>
          <ul className="grid gap-2 list-none !pl-0 !m-0">
            {(b.questions ?? []).map((q, i) => (
              <li key={i} className="!m-0 bg-surface rounded-xl p-3 flex flex-col sm:flex-row sm:items-center gap-2">
                <span className="flex-1 font-read">“{q}”</span>
                <button className="chip shrink-0 self-start" onClick={async () => toast((await addQuestion(childId, q)) ? t('questionAdded') : t('questionExists'))}><Plus size={16} aria-hidden /> {t('addToQuestions')}</button>
              </li>
            ))}
          </ul>
        </aside>
      );
    case 'try':
      return (
        <aside className="callout my-5 rounded-2xl p-4 border-2 border-dashed border-[var(--pc)] bg-surface">
          <p className="flex items-center gap-2 font-extrabold text-[var(--pc)] mb-2 font-head"><PenLine size={20} aria-hidden /> {label}</p>
          <Html html={b.html} />
          <Link to={b.link === 'notes' ? '/notebook/notes' : `/notebook/${b.link}`} className="btn-outline mt-3 !min-h-[44px] text-sm font-ui">{t('openInNotebook')}</Link>
        </aside>
      );
    case 'urgent':
    case 'alert':
    case 'care':
      return (
        <aside role="note" className={cx('callout my-5 rounded-2xl p-4 border-2', b.kind === 'care' ? 'bg-[var(--pt)] border-[var(--pc)]' : 'bg-[var(--urt)] border-[var(--ur)]')}>
          <p className={cx('flex items-center gap-2 font-extrabold mb-2 font-head', b.kind === 'care' ? 'text-[var(--pc)]' : 'text-[var(--ur)]')}>{b.kind === 'care' ? <HeartPulse size={20} aria-hidden /> : <Phone size={20} aria-hidden />} {label}</p>
          <Html html={b.html} />
          {!!b.numbers?.length && <div className="flex flex-wrap gap-2 mt-3 font-ui">{b.numbers.map((n) => <a key={n} href={callTel(n)} className="btn-danger !min-h-[48px]"><Phone size={18} aria-hidden /> {t('callNumber', { n })}</a>)}</div>}
        </aside>
      );
    case 'why':
      return (
        <aside className="callout my-4 rounded-xl px-3 py-2 bg-[var(--pt)] flex flex-col sm:flex-row gap-2 items-start">
          <span className="shrink-0 rounded-full bg-[var(--pc)] text-white text-xs font-extrabold px-3 py-1 font-ui">{label}</span>
          <Html html={b.html} className="text-[0.95em]" />
        </aside>
      );
    case 'soft':
      return <aside className="callout my-5 border-l-4 border-[var(--ur)] pl-4 py-1"><Html html={b.html} /></aside>;
    case 'note':
      return <aside className="callout my-5 text-sm text-muted flex gap-2"><Info size={16} className="shrink-0 mt-1" aria-hidden /><Html html={b.html} /></aside>;
    default:
      return <Html html={b.html} />;
  }
});
