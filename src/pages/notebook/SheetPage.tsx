import { Link, Navigate, useParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { ExternalLink, Siren } from 'lucide-react';
import { useT } from '../../i18n';
import { Page, PageHeader, Empty } from '../../components/ui';
import { sheetById, loc } from '../../lib/content';
import { useChildId } from '../../lib/hooks';
import { loadSheetData, LINKED } from '../../lib/sheets';
import { PrintMenu } from '../../components/sheets/PrintMenu';
import { BoxesEditor, ChecklistEditor, FormEditor, TableEditor, TreatmentsEditor } from '../../components/sheets/Editors';
import { WeeklyEditor } from '../../components/sheets/Weekly';
import { fmtDate } from '../../lib/util';

function ReadOnlyRows({ sheetId }: { sheetId: string }) {
  const { t, lang } = useT();
  const childId = useChildId();
  const sheet = sheetById(sheetId)!;
  const data = useLiveQuery(() => loadSheetData(sheetId, childId, lang), [sheetId, childId, lang]);
  if (!data) return null;
  if (!data.rows.length) return <Empty kind={sheetId === 'medicines' ? 'pills' : 'chart'} title={t('nothingYet')} action={<Link className="btn-primary" to={LINKED[sheetId]}>{t(sheetId === 'medicines' ? 'manageMedicines' : 'openSeizureDiary')}</Link>} />;
  return (
    <>
      <ul className="grid gap-2">
        {data.rows.map((r, i) => (
          <li key={i} className="card p-3"><dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
            {sheet.columns!.filter((c) => r[c.id]).map((c) => <div key={c.id} className="contents"><dt className="text-sm font-bold text-muted">{loc(c.label, lang)}</dt><dd>{c.input === 'date' ? fmtDate(r[c.id], lang) : c.input === 'yesno' ? t(r[c.id] === 'yes' ? 'yes' : 'no') : r[c.id]}</dd></div>)}
          </dl></li>
        ))}
      </ul>
      <Link className="btn-primary mt-4" to={LINKED[sheetId]}><ExternalLink size={18} aria-hidden /> {t(sheetId === 'medicines' ? 'manageMedicines' : 'openSeizureDiary')}</Link>
    </>
  );
}

export default function SheetPage() {
  const { sheetId = '' } = useParams();
  const { t, lang } = useT();
  const sheet = sheetById(sheetId);
  if (!sheet) return <Navigate to="/notebook" replace />;
  let body;
  if (sheet.id === 'medicines' || sheet.id === 'seizures') body = <ReadOnlyRows sheetId={sheet.id} />;
  else if (sheet.id === 'treatments') body = <TreatmentsEditor sheet={sheet} />;
  else if (sheet.type === 'form' || sheet.type === 'card') body = <FormEditor sheet={sheet} />;
  else if (sheet.type === 'table') body = <TableEditor sheet={sheet} />;
  else if (sheet.type === 'checklist') body = <ChecklistEditor sheet={sheet} />;
  else if (sheet.type === 'boxes') body = <BoxesEditor sheet={sheet} />;
  else body = <WeeklyEditor />;
  return (
    <Page>
      <PageHeader back="/notebook" title={<><span className="text-[var(--pi)]">{sheet.n}.</span> {loc(sheet.title, lang)}</>} help={sheet.hint ? loc(sheet.hint, lang) : undefined} />
      <div className="flex flex-wrap gap-2 mb-5">
        <PrintMenu sheetIds={[sheet.id]} filename={`sheet-${sheet.n}-${sheet.id}`} />
        {sheet.id === 'emergency' && <Link to="/sos" className="btn-danger !min-h-[44px] px-4"><Siren size={18} aria-hidden /> {t('openEmergencyCard')}</Link>}
      </div>
      <p className="text-xs text-muted mb-3" aria-live="polite">{t('autosaved')}</p>
      {body}
    </Page>
  );
}
