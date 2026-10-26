import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { BookHeart, Camera, Pencil, Mic, Square, Trash2, Plus, ChevronLeft, ChevronRight, BookOpen, FileDown, Undo2, Eraser, X } from 'lucide-react';
import { useT } from '../../i18n';
import { Page, PageHeader, Empty, FileButton, Modal, Confirm, useToast } from '../../components/ui';
import { db, getSetting, setSetting, putBlob } from '../../lib/db';
import { useBlobUrl, useChild, useChildId } from '../../lib/hooks';
import { compressImage, startRecording, type Rec } from '../../lib/media';
import { pdfFromNode } from '../../lib/printing';
import { isRtl, type Lang } from '../../lib/store';
import { st, storyKinds } from '../../lib/storyText';
import { cx, shareOrDownload } from '../../lib/util';

interface SPage { id: string; prompt: string; text: string; photo?: number; drawing?: number; voice?: number }
interface Book { id: string; kind: string; title: string; author: string; color: string; pages: SPage[]; createdAt: number; updatedAt: number }

const COVERS = ['#2F6FD6', '#D9534F', '#2E9E6B', '#8A5CC2', '#E08A1E', '#1F8A99', '#C2477E', '#5B6B2F'];
const INKS = ['#222222', '#D9534F', '#E08A1E', '#F2C230', '#2E9E6B', '#2F6FD6', '#8A5CC2', '#8B5A2B'];
const uid = () => Math.random().toString(36).slice(2, 10);
const keyOf = (childId: number) => `books:${childId}`;

// Writes go through one queue so they land in the order they were made, and nothing typed is lost.
let chain: Promise<unknown> = Promise.resolve();
function saveBook(childId: number, b: Book) {
  chain = chain.then(async () => {
    const all = await getSetting<Book[]>(keyOf(childId), []);
    const i = all.findIndex((x) => x.id === b.id);
    await setSetting(keyOf(childId), i < 0 ? [...all, b] : all.map((x) => (x.id === b.id ? b : x)));
  }).catch(() => {});
  return chain;
}
const dropBlobs = (ids: (number | undefined)[]) => Promise.all(ids.filter((x): x is number => !!x).map((x) => db.blobs.delete(x)));
const pageBlobs = (p: SPage) => [p.photo, p.drawing, p.voice];

function useBooks(childId: number) {
  return useLiveQuery(() => getSetting<Book[]>(keyOf(childId), []), [childId]);
}

/** The list of books, and starting a new one. */
export default function Stories() {
  const { id } = useParams();
  return id ? <BookPage id={id} /> : <Shelf />;
}

function Shelf() {
  const { lang } = useT();
  const childId = useChildId();
  const child = useChild();
  const nav = useNavigate();
  const books = useBooks(childId);
  const [pick, setPick] = useState(false);
  const s = (k: Parameters<typeof st>[1], v?: Record<string, string | number>) => st(lang, k, v);
  const start = async (kind: string) => {
    const k = storyKinds(lang).find((x) => x.id === kind)!;
    const b: Book = { id: uid(), kind, title: k.name, author: child?.name ?? '', color: COVERS[(books?.length ?? 0) % COVERS.length], pages: k.prompts.map((prompt) => ({ id: uid(), prompt, text: '' })), createdAt: Date.now(), updatedAt: Date.now() };
    await saveBook(childId, b);
    setPick(false);
    nav(`/stories/${b.id}`);
  };
  if (!books) return null;
  return (
    <Page wide>
      <PageHeader title={s('title')} sub={s('intro')} />
      <div className="card p-4 mb-5 grid gap-1 text-sm"><p>💛 {s('tipChild')}</p><p className="text-muted">🌿 {s('tipCare')}</p></div>
      <button className="btn-primary mb-6" onClick={() => setPick(true)}><Plus size={18} aria-hidden /> {s('newBook')}</button>
      {!books.length ? <Empty kind="box" title={s('empty')} text={s('emptyText')} /> : (
        <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {books.slice().sort((a, b) => b.updatedAt - a.updatedAt).map((b) => (
            <li key={b.id}><Link to={`/stories/${b.id}`} className="block rounded-2xl overflow-hidden shadow-md text-white min-h-[180px] p-4 relative" style={{ background: b.color }}>
              <span className="absolute inset-y-0 start-0 w-3 bg-black/20" aria-hidden />
              <span className="text-4xl block mb-3" aria-hidden>{storyKinds(lang).find((k) => k.id === b.kind)?.e ?? '📖'}</span>
              <b className="block text-lg leading-snug line-clamp-3">{b.title}</b>
              <span className="block text-sm opacity-90 mt-1">{b.author}</span>
              <span className="block text-xs opacity-80 mt-2">{s('pages', { n: b.pages.length })}</span>
            </Link></li>
          ))}
        </ul>
      )}
      <Modal open={pick} onClose={() => setPick(false)} title={s('chooseKind')}>
        <ul className="grid grid-cols-2 gap-3">
          {storyKinds(lang).map((k) => (
            <li key={k.id}><button className="card w-full min-h-[96px] p-3 flex flex-col items-center justify-center gap-1 text-center" onClick={() => start(k.id)}>
              <span className="text-3xl" aria-hidden>{k.e}</span><b className="text-sm">{k.name}</b>
            </button></li>
          ))}
        </ul>
      </Modal>
    </Page>
  );
}

function BookPage({ id }: { id: string }) {
  const { t, lang } = useT();
  const childId = useChildId();
  const nav = useNavigate();
  const toast = useToast((x) => x.show);
  const books = useBooks(childId);
  const [book, setBook] = useState<Book | null>(null);
  const [reading, setReading] = useState(false);
  const [del, setDel] = useState(false);
  const [busy, setBusy] = useState(false);
  const s = (k: Parameters<typeof st>[1], v?: Record<string, string | number>) => st(lang, k, v);
  useEffect(() => { if (books && !book) setBook(books.find((b) => b.id === id) ?? null); }, [books, book, id]);
  if (!books) return null;
  if (!book) return <Page><PageHeader title={s('title')} /><Empty kind="box" title={s('empty')} /></Page>;
  const update = (b: Book) => { const n = { ...b, updatedAt: Date.now() }; setBook(n); saveBook(childId, n); };
  const setPage = (p: SPage) => update({ ...book, pages: book.pages.map((x) => (x.id === p.id ? p : x)) });
  const exportPdf = async () => {
    setBusy(true);
    const urls: string[] = [];
    try {
      const url = async (bid?: number) => { const r = bid ? await db.blobs.get(bid) : undefined; if (!r) return undefined; const u = URL.createObjectURL(r.blob); urls.push(u); return u; };
      const pages = await Promise.all(book.pages.map(async (p) => ({ ...p, photoUrl: await url(p.photo), drawUrl: await url(p.drawing) })));
      const blob = await pdfFromNode(<PrintBook book={book} pages={pages} lang={lang} />);
      await shareOrDownload(blob, `${book.title.replace(/[^\p{L}\p{N}]+/gu, '-').slice(0, 40) || 'story'}.pdf`, book.title);
    } catch { toast(t('somethingWrong')); } finally { urls.forEach((u) => URL.revokeObjectURL(u)); setBusy(false); }
  };
  if (reading) return <Reader book={book} onClose={() => setReading(false)} />;
  return (
    <Page>
      <PageHeader title={book.title || s('title')} />
      <div className="card p-4 grid gap-3 mb-5">
        <label className="grid gap-1 text-sm font-bold">{s('bookTitle')}<input className="input font-normal" value={book.title} onChange={(e) => update({ ...book, title: e.target.value })} /></label>
        <label className="grid gap-1 text-sm font-bold">{s('author')}<input className="input font-normal" value={book.author} onChange={(e) => update({ ...book, author: e.target.value })} /></label>
        <fieldset><legend className="text-sm font-bold mb-2">{s('cover')}</legend>
          <div className="flex flex-wrap gap-2">{COVERS.map((c) => (
            <button key={c} className={cx('w-12 h-12 rounded-full border-4', book.color === c ? 'border-[var(--ink,#222)]' : 'border-transparent')} style={{ background: c }} aria-label={c} aria-pressed={book.color === c} onClick={() => update({ ...book, color: c })} />
          ))}</div>
        </fieldset>
      </div>
      <div className="flex flex-wrap gap-2 mb-6">
        <button className="btn-primary" onClick={() => setReading(true)}><BookOpen size={18} aria-hidden /> {s('read')}</button>
        <button className="btn-ghost" disabled={busy} onClick={exportPdf}><FileDown size={18} aria-hidden /> {busy ? s('making') : s('pdf')}</button>
      </div>
      <ol className="grid gap-4">
        {book.pages.map((p, i) => (
          <PageEditor key={p.id} p={p} n={i + 1} all={book.pages.length} onChange={setPage}
            onDelete={async () => { await dropBlobs(pageBlobs(p)); update({ ...book, pages: book.pages.filter((x) => x.id !== p.id) }); }} />
        ))}
      </ol>
      <button className="btn-ghost w-full mt-4" onClick={() => update({ ...book, pages: [...book.pages, { id: uid(), prompt: '', text: '' }] })}><Plus size={18} aria-hidden /> {s('addPage')}</button>
      <button className="btn-ghost text-danger mt-8" onClick={() => setDel(true)}><Trash2 size={18} aria-hidden /> {s('deleteBook')}</button>
      <Confirm open={del} danger text={s('deleteQ')} onNo={() => setDel(false)} onYes={async () => {
        await dropBlobs(book.pages.flatMap(pageBlobs));
        chain = chain.then(async () => setSetting(keyOf(childId), (await getSetting<Book[]>(keyOf(childId), [])).filter((x) => x.id !== book.id)));
        await chain; nav('/stories', { replace: true });
      }} />
    </Page>
  );
}

function PageEditor({ p, n, all, onChange, onDelete }: { p: SPage; n: number; all: number; onChange: (p: SPage) => void; onDelete: () => void }) {
  const { t, lang } = useT();
  const childId = useChildId();
  const toast = useToast((x) => x.show);
  const photo = useBlobUrl(p.photo);
  const drawing = useBlobUrl(p.drawing);
  const voice = useBlobUrl(p.voice);
  const [rec, setRec] = useState<Rec | null>(null);
  const [draw, setDraw] = useState(false);
  const [del, setDel] = useState(false);
  const cur = useRef(p); cur.current = p;
  const s = (k: Parameters<typeof st>[1], v?: Record<string, string | number>) => st(lang, k, v);
  const setBlob = async (field: 'photo' | 'drawing' | 'voice', blob: Blob) => {
    const old = cur.current[field];
    const bid = await putBlob(blob, childId, `story-${field}`);
    onChange({ ...cur.current, [field]: bid });
    if (old) await db.blobs.delete(old);
  };
  const clearBlob = async (field: 'photo' | 'drawing' | 'voice') => { const old = p[field]; onChange({ ...p, [field]: undefined }); if (old) await db.blobs.delete(old); };
  const stopRec = async (r = rec) => { if (!r) return; setRec(null); await setBlob('voice', await r.stop()); };
  return (
    <li className="card p-4 grid gap-3">
      <div className="flex items-start justify-between gap-2">
        <div><p className="text-xs text-muted">{s('pageOf', { n, all })}</p>{p.prompt && <p className="font-bold font-read">{p.prompt}</p>}</div>
        <button className="btn-ghost min-w-[48px] min-h-[48px] text-danger" aria-label={s('deletePage')} onClick={() => setDel(true)}><Trash2 size={18} aria-hidden /></button>
      </div>
      <textarea className="input min-h-[110px] font-read text-lg" aria-label={p.prompt || s('writeHere')} placeholder={s('writeHere')} value={p.text} onChange={(e) => onChange({ ...p, text: e.target.value })} />
      {(photo || drawing) && <div className="grid grid-cols-2 gap-2">
        {photo && <figure className="relative"><img src={photo} alt={s('photo')} className="w-full rounded-xl" /><button className="absolute top-1 end-1 bg-white/90 rounded-full w-12 h-12 grid place-items-center" aria-label={`${s('remove')}: ${s('photo')}`} onClick={() => clearBlob('photo')}><X size={18} aria-hidden /></button></figure>}
        {drawing && <figure className="relative"><img src={drawing} alt={s('draw')} className="w-full rounded-xl border" /><button className="absolute top-1 end-1 bg-white/90 rounded-full w-12 h-12 grid place-items-center" aria-label={`${s('remove')}: ${s('draw')}`} onClick={() => clearBlob('drawing')}><X size={18} aria-hidden /></button></figure>}
      </div>}
      {voice && !rec && <div className="flex items-center gap-2"><audio src={voice} controls className="flex-1 min-w-0" /><button className="btn-ghost min-w-[48px]" aria-label={`${s('remove')}: ${s('voice')}`} onClick={() => clearBlob('voice')}><X size={18} aria-hidden /></button></div>}
      <div className="flex flex-wrap gap-2">
        <FileButton accept="image/*" onFile={async (f) => setBlob('photo', await compressImage(f, 1600, 0.85))}><Camera size={18} aria-hidden /> {s('photo')}</FileButton>
        <button className="btn-ghost" onClick={() => setDraw(true)}><Pencil size={18} aria-hidden /> {s('draw')}</button>
        {rec ? <button className="btn-danger" onClick={() => stopRec()}><Square size={18} aria-hidden /> {s('stop')}</button>
          : <button className="btn-ghost" onClick={async () => { try { const r = await startRecording('audio', 3 * 60_000, (b) => { setRec(null); setBlob('voice', b); }); setRec(r); } catch { toast(t('micNotAvailable')); } }}><Mic size={18} aria-hidden /> {s('voice')}</button>}
      </div>
      {draw && <DrawPad onCancel={() => setDraw(false)} onDone={async (b) => { setDraw(false); await setBlob('drawing', b); }} />}
      <Confirm open={del} danger text={s('deletePage') + '?'} onNo={() => setDel(false)} onYes={() => { setDel(false); onDelete(); }} />
    </li>
  );
}

/** A simple drawing board: colours, three brush sizes, undo and clear. Saved as a picture. */
function DrawPad({ onDone, onCancel }: { onDone: (b: Blob) => void; onCancel: () => void }) {
  const { lang } = useT();
  const ref = useRef<HTMLCanvasElement>(null);
  const [ink, setInk] = useState(INKS[0]);
  const [size, setSize] = useState(8);
  const undo = useRef<ImageData[]>([]);
  const last = useRef<{ x: number; y: number } | null>(null);
  const s = (k: Parameters<typeof st>[1]) => st(lang, k);
  const ctx = () => ref.current!.getContext('2d')!;
  const blank = () => { const c = ctx(); c.fillStyle = '#fff'; c.fillRect(0, 0, 800, 800); };
  useEffect(() => { blank(); }, []);
  const at = (e: React.PointerEvent) => { const r = ref.current!.getBoundingClientRect(); return { x: ((e.clientX - r.left) / r.width) * 800, y: ((e.clientY - r.top) / r.height) * 800 }; };
  const line = (a: { x: number; y: number }, b: { x: number; y: number }) => { const c = ctx(); c.strokeStyle = ink; c.lineWidth = size; c.lineCap = 'round'; c.lineJoin = 'round'; c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.stroke(); };
  return (
    <Modal open onClose={onCancel} title={s('draw')} full>
      <canvas ref={ref} width={800} height={800} className="w-full max-w-[560px] mx-auto aspect-square rounded-xl border bg-white touch-none block" role="img" aria-label={s('draw')}
        onPointerDown={(e) => { ref.current!.setPointerCapture(e.pointerId); undo.current = [...undo.current.slice(-14), ctx().getImageData(0, 0, 800, 800)]; const p = at(e); last.current = p; line(p, p); }}
        onPointerMove={(e) => { if (!last.current) return; const p = at(e); line(last.current, p); last.current = p; }}
        onPointerUp={() => { last.current = null; }} onPointerCancel={() => { last.current = null; }} />
      <div className="flex flex-wrap gap-2 justify-center mt-3">
        {INKS.map((c) => <button key={c} className={cx('w-12 h-12 rounded-full border-4', ink === c ? 'border-[var(--p4,#2F6FD6)]' : 'border-white shadow')} style={{ background: c }} aria-label={c} aria-pressed={ink === c} onClick={() => setInk(c)} />)}
      </div>
      <div className="flex flex-wrap gap-2 justify-center mt-3">
        {[4, 8, 18].map((w) => <button key={w} className={cx('btn-ghost min-w-[48px]', size === w && 'ring-2 ring-[var(--p4,#2F6FD6)]')} aria-pressed={size === w} aria-label={`${w}`} onClick={() => setSize(w)}><span className="rounded-full bg-current" style={{ width: w + 4, height: w + 4 }} aria-hidden /></button>)}
        <button className="btn-ghost" onClick={() => { const d = undo.current.pop(); if (d) ctx().putImageData(d, 0, 0); }}><Undo2 size={18} aria-hidden /> {s('undo')}</button>
        <button className="btn-ghost" onClick={() => { undo.current = [...undo.current, ctx().getImageData(0, 0, 800, 800)]; blank(); }}><Eraser size={18} aria-hidden /> {s('clear')}</button>
      </div>
      <div className="flex gap-2 mt-4">
        <button className="btn-ghost flex-1" onClick={onCancel}>{s('cancel')}</button>
        <button className="btn-primary flex-1" onClick={() => ref.current!.toBlob((b) => b && onDone(b), 'image/png')}>{s('save')}</button>
      </div>
    </Modal>
  );
}

function ReadPage({ p }: { p: SPage }) {
  const photo = useBlobUrl(p.photo);
  const drawing = useBlobUrl(p.drawing);
  const voice = useBlobUrl(p.voice);
  return (
    <div className="grid gap-4">
      {p.prompt && <p className="text-muted font-read">{p.prompt}</p>}
      {photo && <img src={photo} alt="" className="w-full max-h-[50vh] object-contain rounded-2xl" />}
      {drawing && <img src={drawing} alt="" className="w-full max-h-[50vh] object-contain rounded-2xl border bg-white" />}
      {p.text && <p className="font-read text-2xl leading-relaxed whitespace-pre-wrap">{p.text}</p>}
      {voice && <audio src={voice} controls className="w-full" />}
    </div>
  );
}

/** Read the book like a picture book: cover, the pages, then "The end". */
function Reader({ book, onClose }: { book: Book; onClose: () => void }) {
  const { lang } = useT();
  const [i, setI] = useState(0);
  const s = (k: Parameters<typeof st>[1], v?: Record<string, string | number>) => st(lang, k, v);
  const last = book.pages.length + 1;
  const prevNext = isRtl(lang) ? [ChevronRight, ChevronLeft] : [ChevronLeft, ChevronRight];
  const [Prev, Next] = prevNext;
  return (
    <Page>
      <PageHeader title={book.title} actions={<button className="btn-ghost" onClick={onClose}><Pencil size={18} aria-hidden /> {s('edit')}</button>} />
      <section className="card p-5 min-h-[60vh] flex flex-col" aria-live="polite">
        {i === 0 ? (
          <div className="flex-1 rounded-2xl text-white grid place-items-center text-center p-8" style={{ background: book.color }}>
            <div><BookHeart size={56} className="mx-auto mb-4" aria-hidden /><h2 className="text-3xl font-extrabold font-read">{book.title}</h2><p className="mt-3 text-lg opacity-90">{book.author}</p></div>
          </div>
        ) : i === last ? (
          <div className="flex-1 grid place-items-center"><p className="text-4xl font-extrabold font-read" style={{ color: book.color }}>{s('theEnd')}</p></div>
        ) : <ReadPage key={book.pages[i - 1].id} p={book.pages[i - 1]} />}
      </section>
      <div className="flex items-center justify-between gap-3 mt-4">
        <button className="btn-ghost min-w-[48px]" disabled={i === 0} aria-label={s('prev')} onClick={() => setI(i - 1)}><Prev size={22} aria-hidden /></button>
        <span className="text-sm text-muted">{i > 0 && i < last ? s('pageOf', { n: i, all: book.pages.length }) : ''}</span>
        {i < last ? <button className="btn-primary min-w-[48px]" aria-label={s('next')} onClick={() => setI(i + 1)}><Next size={22} aria-hidden /></button>
          : <button className="btn-primary" onClick={onClose}>{s('done')}</button>}
      </div>
    </Page>
  );
}

type PrintPage = SPage & { photoUrl?: string; drawUrl?: string };
function PrintBook({ book, pages, lang }: { book: Book; pages: PrintPage[]; lang: Lang }) {
  const dir = isRtl(lang) ? 'rtl' : 'ltr';
  return (
    <>
      <div className="a4" lang={lang} dir={dir} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', background: book.color, color: '#fff' }}>
        <div><p style={{ fontSize: 44, fontWeight: 800, lineHeight: 1.3 }}>{book.title}</p><p style={{ fontSize: 24, marginTop: 24 }}>{book.author}</p></div>
      </div>
      {pages.map((p) => (
        <div key={p.id} className="a4" lang={lang} dir={dir}>
          {p.prompt && <p style={{ fontSize: 16, color: '#666', marginBottom: 16 }}>{p.prompt}</p>}
          {[p.photoUrl, p.drawUrl].filter(Boolean).map((u) => <img key={u} src={u} alt="" style={{ display: 'block', maxWidth: '100%', maxHeight: p.photoUrl && p.drawUrl ? 380 : 620, margin: '0 auto 20px', borderRadius: 12 }} />)}
          {p.text && <p style={{ fontSize: 26, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{p.text}</p>}
        </div>
      ))}
      <div className="a4" lang={lang} dir={dir} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontSize: 48, fontWeight: 800, color: book.color }}>{st(lang, 'theEnd')}</p>
      </div>
    </>
  );
}
