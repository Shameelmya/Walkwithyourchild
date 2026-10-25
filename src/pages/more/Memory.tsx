import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Camera, Mic, Video, StickyNote, Hand, Square, Trash2 } from 'lucide-react';
import { useT } from '../../i18n';
import { Page, PageHeader, Empty, FileButton, Modal, Confirm, useToast } from '../../components/ui';
import { PinPad } from '../../components/Lock';
import { db, getSetting, putBlob, type Memory as Mem } from '../../lib/db';
import { useBlobUrl, useChildId } from '../../lib/hooks';
import { verifyPin, type PinHash } from '../../lib/crypto';
import { compressImage, startRecording, type Rec } from '../../lib/media';
import { fmtDate, isoDate } from '../../lib/util';

function MemoryItem({ m, onOpen }: { m: Mem; onOpen: () => void }) {
  const url = useBlobUrl(m.blobId);
  return (
    <button onClick={onOpen} className="card overflow-hidden text-start">
      <div className="aspect-square bg-[var(--p4t)] flex items-center justify-center">
        {(m.kind === 'photo' || m.kind === 'handprint') && url ? <img src={url} alt="" className="w-full h-full object-cover" /> : m.kind === 'video' ? <Video size={40} className="text-[var(--p4)]" aria-hidden /> : m.kind === 'voice' ? <Mic size={40} className="text-[var(--p4)]" aria-hidden /> : <p className="p-3 font-read line-clamp-6">{m.text}</p>}
      </div>
      <p className="p-2 text-sm"><b className="line-clamp-1">{m.title || '·'}</b><span className="text-muted text-xs">{fmtDate(m.date, 'en')}</span></p>
    </button>
  );
}

function Viewer({ m, onClose }: { m: Mem; onClose: () => void }) {
  const { t, lang } = useT();
  const url = useBlobUrl(m.blobId);
  const [del, setDel] = useState(false);
  return (
    <Modal open onClose={onClose} title={m.title || fmtDate(m.date, lang)} full>
      {(m.kind === 'photo' || m.kind === 'handprint') && url && <img src={url} alt={m.title} className="w-full rounded-xl" />}
      {m.kind === 'video' && url && <video src={url} controls playsInline className="w-full rounded-xl bg-black" />}
      {m.kind === 'voice' && url && <audio src={url} controls className="w-full" />}
      {m.text && <p className="font-read text-lg whitespace-pre-wrap mt-3">{m.text}</p>}
      <p className="text-sm text-muted mt-2">{fmtDate(m.date, lang)}</p>
      <button className="btn-ghost text-danger mt-4" onClick={() => setDel(true)}><Trash2 size={18} aria-hidden /> {t('delete')}</button>
      <Confirm open={del} danger text={t('deleteMemoryQ')} onNo={() => setDel(false)} onYes={async () => { if (m.blobId) await db.blobs.delete(m.blobId); await db.memories.delete(m.id!); onClose(); }} />
    </Modal>
  );
}

export default function Memory() {
  const { t } = useT();
  const childId = useChildId();
  const toast = useToast((s) => s.show);
  const pin = useLiveQuery(() => getSetting<PinHash | null>('pin', null), []);
  const [unlocked, setUnlocked] = useState(false);
  const [err, setErr] = useState('');
  const items = useLiveQuery(() => db.memories.where('childId').equals(childId).reverse().sortBy('date'), [childId]) ?? [];
  const [open, setOpen] = useState<Mem | null>(null);
  const [note, setNote] = useState<{ title: string; text: string } | null>(null);
  const [rec, setRec] = useState<{ r: Rec; kind: 'voice' | 'video' } | null>(null);
  const add = async (kind: Mem['kind'], blob?: Blob, title = '', text = '') => {
    const blobId = blob ? await putBlob(blob, childId, kind) : undefined;
    await db.memories.add({ childId, kind, date: isoDate(), title, text, blobId, createdAt: Date.now() });
    toast(t('memorySaved'));
  };
  if (pin === undefined) return null;
  if (pin && !unlocked) return <Page><PageHeader title={t('navMemory')} /><div className="py-10"><PinPad title={t('memoryPin')} error={err} onSubmit={async (p) => { if (await verifyPin(p, pin)) setUnlocked(true); else setErr(t('wrongPin')); }} /></div></Page>;
  return (
    <Page wide>
      <PageHeader title={t('navMemory')} />
      <div className="flex flex-wrap gap-2 mb-6">
        <FileButton accept="image/*" onFile={async (f) => add('photo', await compressImage(f, 2000, 0.85))}><Camera size={18} aria-hidden /> {t('photo')}</FileButton>
        <FileButton accept="image/*" capture="environment" onFile={async (f) => add('handprint', await compressImage(f, 2000, 0.85), t('handprint'))}><Hand size={18} aria-hidden /> {t('handprint')}</FileButton>
        {rec ? <button className="btn-danger" onClick={async () => { const b = await rec.r.stop(); const k = rec.kind; setRec(null); await add(k, b); }}><Square size={18} aria-hidden /> {t('stopRecording')}</button> : <>
          <button className="btn-ghost" onClick={async () => { try { setRec({ r: await startRecording('audio', 5 * 60_000), kind: 'voice' }); } catch { toast(t('micNotAvailable')); } }}><Mic size={18} aria-hidden /> {t('voiceClip')}</button>
          <FileButton accept="video/*" capture="environment" onFile={(f) => add('video', f)}><Video size={18} aria-hidden /> {t('videoClip')}</FileButton>
        </>}
        <button className="btn-ghost" onClick={() => setNote({ title: '', text: '' })}><StickyNote size={18} aria-hidden /> {t('note')}</button>
      </div>
      {!items.length ? <Empty kind="box" title={t('memoryEmpty')} text={t('memoryEmptyText')} /> : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">{items.map((m) => <MemoryItem key={m.id} m={m} onOpen={() => setOpen(m)} />)}</div>
      )}
      {open && <Viewer m={open} onClose={() => setOpen(null)} />}
      <Modal open={!!note} onClose={() => setNote(null)} title={t('note')}>
        {note && <div className="grid gap-3">
          <input className="input" placeholder={t('title')} aria-label={t('title')} value={note.title} onChange={(e) => setNote({ ...note, title: e.target.value })} />
          <textarea className="input min-h-[200px] font-read" aria-label={t('note')} value={note.text} onChange={(e) => setNote({ ...note, text: e.target.value })} />
          <button className="btn-primary" onClick={async () => { await add('note', undefined, note.title, note.text); setNote(null); }}>{t('save')}</button>
        </div>}
      </Modal>
    </Page>
  );
}
