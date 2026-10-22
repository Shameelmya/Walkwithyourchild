import { useEffect, useRef, useState } from 'react';
import { FileDown, Printer, Share2 } from 'lucide-react';
import { useT } from '../../i18n';
import { Page, PageHeader, Seg, useToast, BottomBar } from '../../components/ui';
import { useChildId } from '../../lib/hooks';
import { loadSummary, SummaryDoc, type SummaryData } from '../../components/SummaryDoc';
import { pdfFromNode, printNode } from '../../lib/printing';
import { download, shareOrDownload } from '../../lib/util';
import { LANGS, type Lang } from '../../lib/store';

export default function Summary() {
  const { t } = useT();
  const childId = useChildId();
  const toast = useToast((s) => s.show);
  const [lang, setLang] = useState<Lang>('en');
  const [d, setD] = useState<SummaryData>();
  const [busy, setBusy] = useState('');
  const [scale, setScale] = useState(0.4);
  const box = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const [h, setH] = useState(1123);
  useEffect(() => { if (inner.current) setH(inner.current.offsetHeight); }, [d, lang, scale]);
  useEffect(() => { loadSummary(childId).then(setD); }, [childId]);
  useEffect(() => { const f = () => box.current && setScale(Math.min(1, box.current.clientWidth / 794)); f(); addEventListener('resize', f); return () => removeEventListener('resize', f); }, [d]);
  const name = `doctor-summary-${(d?.child?.name ?? 'child').replace(/\W+/g, '-').toLowerCase()}.pdf`;
  const pdf = async (mode: 'download' | 'share') => {
    if (!d) return;
    setBusy(mode);
    try {
      const b = await pdfFromNode(<SummaryDoc d={d} lang={lang} />);
      if (mode === 'share') await shareOrDownload(b, name, t('summaryTitle')); else download(b, name);
      document.body.dataset.pdfok = '1';
    } catch (e) { console.warn(e); toast(t('somethingWrong')); }
    setBusy('');
  };
  return (
    <Page wide>
      <PageHeader title={t('navSummary')} />
      <div className="flex flex-wrap gap-3 items-center mb-4">
        <Seg label={t('language')} value={lang} onChange={setLang} options={LANGS.map((x) => ({ v: x.v, l: x.native }))} />
      </div>

      <div ref={box} className="w-full overflow-hidden rounded-xl border border-line bg-white" style={{ height: d ? h * scale : 200 }}>
        {d && <div ref={inner} style={{ transform: `scale(${scale})`, transformOrigin: 'top left', width: 794 }}><SummaryDoc d={d} lang={lang} /></div>}
      </div>
      <BottomBar>
        <button className="btn-primary flex-1" disabled={!d || !!busy} onClick={() => pdf('download')}><FileDown aria-hidden /> {busy === 'download' ? t('preparing') : t('downloadPdf')}</button>
        <button className="btn-outline !px-0 w-14" aria-label={t('print')} disabled={!d} onClick={() => d && printNode(<SummaryDoc d={d} lang={lang} />)}><Printer aria-hidden /></button>
        <button className="btn-outline !px-0 w-14" aria-label={t('share')} disabled={!d || !!busy} onClick={() => pdf('share')}><Share2 aria-hidden /></button>
      </BottomBar>
    </Page>
  );
}
