import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Camera, Upload, Share2, Trash2, FileText } from 'lucide-react';
import { useT } from '../../i18n';
import { Page, PageHeader, Empty, FileButton, Modal, Confirm, useToast, BottomBar } from '../../components/ui';
import { db, putBlob, type DocumentRec } from '../../lib/db';
import { useBlobUrl, useChildId } from '../../lib/hooks';
import { sheetById, loc } from '../../lib/content';
import { compressImage } from '../../lib/media';
import { shareOrDownload, fmtDate } from '../../lib/util';

function DocTile({ d, onOpen }: { d: DocumentRec; onOpen: () => void }) {
  const url = useBlobUrl(d.blobId);
  return (
    <button onClick={onOpen} className="card overflow-hidden text-start">
      <div className="aspect-[4/3] bg-surface2 flex items-center justify-center">{d.type.startsWith('image/') && url ? <img src={url} alt="" className="w-full h-full object-cover" /> : <FileText size={36} aria-hidden />}</div>
      <p className="p-2 text-sm font-bold line-clamp-2">{d.title}</p>
    </button>
  );
}

export default function Documents() {
  const { t, lang } = useT();
  const childId = useChildId();
  const toast = useToast((s) => s.show);
  const cats = sheetById('documents')!.items!;
  const docs = useLiveQuery(() => db.documents.where('childId').equals(childId).toArray(), [childId]) ?? [];
  const [cat, setCat] = useState(0);
  const [view, setView] = useState<DocumentRec | null>(null);
  const [del, setDel] = useState(false);
  const url = useBlobUrl(view?.blobId);
  const add = async (f: File, c: number) => {
    const b = await compressImage(f);
    const blobId = await putBlob(b, childId, f.name);
    await db.documents.add({ childId, category: c, title: c < cats.length ? loc(cats[c], lang) : f.name, blobId, type: b.type, createdAt: Date.now() });
    toast(t('saved'));
  };
  const groups = [...cats.map((c, i) => ({ i, title: loc(c, lang) })), { i: cats.length, title: t('otherDocuments') }];
  return (
    <Page wide>
      <PageHeader title={t('navDocuments')} />
      <div className="card p-4 mb-6 grid gap-3">
        <label className="label" htmlFor="doc-cat">{t('category')}</label>
        <select id="doc-cat" className="input" value={cat} onChange={(e) => setCat(+e.target.value)}>{groups.map((g) => <option key={g.i} value={g.i}>{g.title}</option>)}</select>
      </div>
      {!docs.length ? <Empty kind="doc" title={t('noDocuments')} text={t('noDocumentsText')} /> : groups.filter((g) => docs.some((d) => d.category === g.i)).map((g) => (
        <section key={g.i} className="mb-6">
          <h2 className="font-extrabold mb-2">{g.title}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">{docs.filter((d) => d.category === g.i).map((d) => <DocTile key={d.id} d={d} onOpen={() => setView(d)} />)}</div>
        </section>
      ))}
      <BottomBar>
        <FileButton className="btn-primary flex-1" accept="image/*" capture="environment" onFile={(f) => add(f, cat)}><Camera size={18} aria-hidden /> {t('takePhoto')}</FileButton>
        <FileButton className="btn-outline flex-1" accept="image/*,application/pdf" multiple onFile={(f) => add(f, cat)}><Upload size={18} aria-hidden /> {t('uploadFile')}</FileButton>
      </BottomBar>
      <Modal open={!!view} onClose={() => setView(null)} title={view?.title} full>
        {view && (<>
          {view.type.startsWith('image/') ? <img src={url} alt={view.title} className="w-full rounded-xl" /> : <a className="btn-outline" href={url} target="_blank" rel="noreferrer"><FileText aria-hidden /> {t('openFile')}</a>}
          <p className="text-sm text-muted mt-2">{fmtDate(view.createdAt, lang)}</p>
          <div className="flex gap-2 mt-4 justify-between">
            <button className="btn-ghost text-danger" onClick={() => setDel(true)}><Trash2 size={18} aria-hidden /> {t('delete')}</button>
            <button className="btn-primary" onClick={async () => { const b = await db.blobs.get(view.blobId); if (b) await shareOrDownload(b.blob, `${view.title}.${b.type.includes('pdf') ? 'pdf' : 'jpg'}`, view.title); }}><Share2 size={18} aria-hidden /> {t('share')}</button>
          </div>
        </>)}
      </Modal>
      <Confirm open={del} danger text={t('deleteEntryQ')} onNo={() => setDel(false)} onYes={async () => { if (view) { await db.blobs.delete(view.blobId); await db.documents.delete(view.id!); } setDel(false); setView(null); }} />
    </Page>
  );
}
