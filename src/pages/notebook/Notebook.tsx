import { Link } from 'react-router-dom';
import { StickyNote, Link2 } from 'lucide-react';
import { ChevronRight } from '../../components/icons';
import { useT } from '../../i18n';
import { Page } from '../../components/ui';
import { workbook, loc } from '../../lib/content';
import { LINKED } from '../../lib/sheets';
import { PrintMenu } from '../../components/sheets/PrintMenu';

export default function Notebook() {
  const { t, lang } = useT();
  return (
    <Page>
      <section className="tile t-amber !p-6 mb-5">
        <div className="relative z-[1]"><p className="text-[0.78rem] font-bold opacity-90">{t('elevenSheets')}</p><h1 className="font-display text-[1.9rem] font-bold leading-tight">{loc(workbook.title, lang)}</h1><p className="opacity-90 mt-2 max-w-lg">{loc(workbook.intro, lang)}</p></div>
      </section>
      <div className="mb-5"><PrintMenu sheetIds={workbook.sheets.map((s) => s.id)} filename="my-notebook" /></div>
      <ul className="grid sm:grid-cols-2 gap-3">
        {workbook.sheets.map((s) => (
          <li key={s.id}>
            <Link to={`/notebook/${s.id}`} className="card flex items-center gap-4 p-3.5 min-h-[72px] hover:bg-surface2 transition">
              <span className={`w-12 h-12 rounded-2xl text-white font-display text-xl font-bold flex items-center justify-center shrink-0 ${s.id === 'emergency' ? 't-rose' : 't-amber'}`}>{s.n}</span>
              <span className="flex-1 min-w-0"><span className="block font-bold">{loc(s.title, lang)}</span>{LINKED[s.id] && <span className="text-xs text-muted inline-flex items-center gap-1"><Link2 size={12} aria-hidden /> {t('linkedSheet')}</span>}</span>
              <ChevronRight aria-hidden className="text-muted" />
            </Link>
          </li>
        ))}
        <li>
          <Link to="/notebook/notes" className="card flex items-center gap-4 p-3.5 min-h-[72px] hover:bg-surface2">
            <span className="w-12 h-12 rounded-2xl t-blue text-white flex items-center justify-center shrink-0"><StickyNote aria-hidden /></span>
            <span className="flex-1 font-bold">{t('myNotes')}</span><ChevronRight aria-hidden className="text-muted" />
          </Link>
        </li>
      </ul>
    </Page>
  );
}
