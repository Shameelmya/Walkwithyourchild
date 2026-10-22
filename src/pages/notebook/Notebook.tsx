import { Link } from 'react-router-dom';
import { ChevronRight, StickyNote, Link2 } from 'lucide-react';
import { useT } from '../../i18n';
import { Page, PageHeader } from '../../components/ui';
import { workbook, loc } from '../../lib/content';
import { LINKED } from '../../lib/sheets';
import { PrintMenu } from '../../components/sheets/PrintMenu';

export default function Notebook() {
  const { t, lang } = useT();
  return (
    <Page>
      <PageHeader back={false} title={loc(workbook.title, lang)} sub={loc(workbook.intro, lang)} />
      <div className="mb-5"><PrintMenu sheetIds={workbook.sheets.map((s) => s.id)} filename="my-notebook" /></div>
      <ul className="grid gap-2">
        {workbook.sheets.map((s) => (
          <li key={s.id}>
            <Link to={`/notebook/${s.id}`} className="card flex items-center gap-3 p-3 min-h-[64px] hover:bg-surface2">
              <span className="w-11 h-11 rounded-2xl bg-[var(--pit)] text-[var(--pi)] font-extrabold flex items-center justify-center shrink-0">{s.n}</span>
              <span className="flex-1 min-w-0"><span className="block font-bold">{loc(s.title, lang)}</span>{LINKED[s.id] && <span className="text-xs text-muted inline-flex items-center gap-1"><Link2 size={12} aria-hidden /> {t('linkedSheet')}</span>}</span>
              <ChevronRight aria-hidden className="text-muted" />
            </Link>
          </li>
        ))}
        <li>
          <Link to="/notebook/notes" className="card flex items-center gap-3 p-3 min-h-[64px] hover:bg-surface2">
            <span className="w-11 h-11 rounded-2xl bg-soft text-accent flex items-center justify-center shrink-0"><StickyNote aria-hidden /></span>
            <span className="flex-1 font-bold">{t('myNotes')}</span><ChevronRight aria-hidden className="text-muted" />
          </Link>
        </li>
      </ul>
    </Page>
  );
}
