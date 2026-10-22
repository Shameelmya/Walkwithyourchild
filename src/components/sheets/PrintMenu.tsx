import { useState } from 'react';
import { Printer, FileDown } from 'lucide-react';
import { useT } from '../../i18n';
import { Modal, Seg, useToast } from '../ui';
import { useChildId } from '../../lib/hooks';
import { loadSheetData } from '../../lib/sheets';
import { workbook } from '../../lib/content';
import { PrintSheet } from './PrintSheet';
import { pdfFromNode, printNode } from '../../lib/printing';
import { shareOrDownload } from '../../lib/util';

export function PrintMenu({ sheetIds, filename }: { sheetIds: string[]; filename: string }) {
  const { t, lang } = useT();
  const childId = useChildId();
  const toast = useToast((s) => s.show);
  const [open, setOpen] = useState(false);
  const [blank, setBlank] = useState(false);
  const [busy, setBusy] = useState(false);
  const build = async () => {
    const sheets = workbook.sheets.filter((s) => sheetIds.includes(s.id));
    const data = await Promise.all(sheets.map((s) => loadSheetData(s.id, childId, lang)));
    return <>{sheets.map((s, i) => <PrintSheet key={s.id} sheet={s} data={data[i]} lang={lang} blank={blank} />)}</>;
  };
  const run = async (kind: 'print' | 'pdf') => {
    setBusy(true);
    try {
      const node = await build();
      if (kind === 'print') await printNode(node);
      else { const b = await pdfFromNode(node); await shareOrDownload(b, `${filename}${blank ? '-blank' : ''}.pdf`, filename); }
      setOpen(false);
    } catch (e) { console.warn(e); toast(t('somethingWrong')); }
    setBusy(false);
  };
  return (
    <>
      <button className="btn-outline !min-h-[44px] px-4" onClick={() => setOpen(true)}><Printer size={18} aria-hidden /> {t('printOrPdf')}</button>
      <Modal open={open} onClose={() => setOpen(false)} title={t('printOrPdf')}>
        <p className="label">{t('whatToPrint')}</p>
        <Seg label={t('whatToPrint')} value={blank ? 'b' : 'f'} onChange={(v) => setBlank(v === 'b')} options={[{ v: 'f', l: t('filledIn') }, { v: 'b', l: t('blankPages') }]} />
        <p className="text-sm text-muted mt-3">{t('printLangNote')}</p>
        <div className="grid sm:grid-cols-2 gap-3 mt-5">
          <button className="btn-outline" disabled={busy} onClick={() => run('print')}><Printer aria-hidden /> {t('print')}</button>
          <button className="btn-primary" disabled={busy} onClick={() => run('pdf')}><FileDown aria-hidden /> {busy ? t('preparing') : t('downloadPdf')}</button>
        </div>
      </Modal>
    </>
  );
}
