import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { Camera, Pencil, Mic, Square, Trash2, Plus, BookOpen, FileDown, Undo2, Eraser, X, Volume2, ImagePlus } from 'lucide-react';
import { useT } from '../../i18n';
import { Page, PageHeader, Empty, FileButton, Modal, Confirm, useToast } from '../../components/ui';
import { db, getSetting, setSetting, putBlob } from '../../lib/db';
import { useBlobUrl, useChild, useChildId } from '../../lib/hooks';
import { compressImage, startRecording, type Rec } from '../../lib/media';
import { pdfFromNode } from '../../lib/printing';
import { isRtl } from '../../lib/store';
import { st, storyKinds, type StoryKey } from '../../lib/storyText';
import { cx, shareOrDownload } from '../../lib/util';
import { Scene, THEMES, type ThemeId } from './story/art';
import { CoverView, EndView, LAYOUTS, PageView, type Book, type SPage } from './story/pages';
import { FlipBook } from './story/FlipBook';

const INKS = ['#222222', '#D9534F', '#E08A1E', '#F2C230', '#2E9E6B', '#2F6FD6', '#8A5CC2', '#8B5A2B'];
const KIND_THEME: Record<string, ThemeId> = { me: 'sky', family: 'garden', love: 'meadow', day: 'sea', friends: 'forest', thennow: 'night', letter: 'garden', free: 'space' };
const uid = () => Math.random().toString(36).slice(2, 10);
const keyOf = (childId: number) => `books:${childId}`;
/** Books made before covers had themes get one from their kind. */
const norm = (b: Book): Book => ({ ...b, theme: b.theme ?? KIND_THEME[b.kind] ?? 'meadow', layout: b.layout ?? 'classic' });

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
  return useLiveQuery(() => getSetting<Book[]>(keyOf(childId), []).then((l) => l.map(norm)), [childId]);
}
function useS() {
  const { lang } = useT();
  return { lang, s: (k: StoryKey, v?: Record<string, string | number>) => st(lang, k, v) };
}

export default function Stories() {
  const { id } = useParams();
  return id ? <Workshop id={id} /> : <Shelf />;
}

function LiveCover({ book }: { book: Book }) {
  return <CoverView book={book} photoUrl={useBlobUrl(book.coverPhoto)} />;
}
function LivePage({ book, i, overlay }: { book: Book; i: number; overlay?: ReactNode }) {
  const p = book.pages[i];
  return <PageView page={p} n={i + 1} theme={book.theme} photoUrl={useBlobUrl(p.photo)} drawUrl={useBlobUrl(p.drawing)} overlay={overlay} />;
}

/** The child's books, standing on a shelf. */
function Shelf() {
  const { s, lang } = useS();
  const childId = useChildId();
  const child = useChild();
  const nav = useNavigate();
  const books = useBooks(childId);
  const [pick, setPick] = useState(false);
  const start = async (kind: string) => {
    const k = storyKinds(lang).find((x) => x.id === kind)!;
    const b: Book = { id: uid(), kind, title: k.name, author: child?.name ?? '', theme: KIND_THEME[kind] ?? 'meadow', layout: 'classic', pages: k.prompts.map((prompt) => ({ id: uid(), prompt, text: '' })), createdAt: Date.now(), updatedAt: Date.now() };
    await saveBook(childId, b);
    setPick(false);
    nav(`/stories/${b.id}`);
  };
  if (!books) return null;
  return (
    <Page wide>
      <PageHeader title={s('title')} help={<><p>{s('intro')}</p><p>{s('tipChild')}</p><p>{s('tipCare')}</p></>} />
      <button className="btn-primary mb-7" onClick={() => setPick(true)}><Plus size={18} aria-hidden /> {s('newBook')}</button>
      {!books.length ? <Empty kind="box" title={s('empty')} text={s('emptyText')} /> : (
        <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-x-5 gap-y-8 pb-2 border-b-[10px] border-[#C9A57A]/60 rounded-b">
          {books.slice().sort((a, b) => b.updatedAt - a.updatedAt).map((b) => (
            <li key={b.id}>
              <Link to={`/stories/${b.id}`} className="block transition active:scale-[.97]" aria-label={b.title}>
                <div className="rounded-[0.6rem] shadow-[0_14px_28px_-12px_rgba(0,0,0,.45)]"><LiveCover book={b} /></div>
                <p className="text-xs text-muted mt-2 text-center">{s('pages', { n: b.pages.length })}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <Modal open={pick} onClose={() => setPick(false)} title={s('chooseKind')}>
        <ul className="grid grid-cols-2 gap-3">
          {storyKinds(lang).map((k) => (
            <li key={k.id}><button className="w-full rounded-2xl overflow-hidden border border-line/60 bg-surface text-start active:scale-[.97] transition" onClick={() => start(k.id)}>
              <div className="h-20 relative"><Scene theme={KIND_THEME[k.id]} /><span className="absolute bottom-1.5 start-2 text-2xl" aria-hidden>{k.e}</span></div>
              <b className="block text-sm p-3 leading-snug">{k.name}</b>
            </button></li>
          ))}
        </ul>
      </Modal>
    </Page>
  );
}

function Thumb({ on, label, onClick, children }: { on: boolean; label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" onClick={onClick} aria-label={label} aria-current={on || undefined} className="shrink-0 w-[78px] text-center">
      <div className={cx('rounded-[0.5rem] transition', on ? 'ring-[3px] ring-[rgb(var(--accent))] ring-offset-2 ring-offset-bg' : 'opacity-90 shadow-card')}>{children}</div>
    </button>
  );
}

/** Where a book is made: pages along the top, the chosen page large, and what can be changed beside it. */
function Workshop({ id }: { id: string }) {
  const { s, lang } = useS();
  const { t } = useT();
  const childId = useChildId();
  const nav = useNavigate();
  const toast = useToast((x) => x.show);
  const books = useBooks(childId);
  const [book, setBook] = useState<Book | null>(null);
  const [sel, setSel] = useState(0);
  const [del, setDel] = useState(false);
  const [busy, setBusy] = useState(false);
  const [sp] = useSearchParams();
  const reading = sp.get('read') === '1';
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
      const cover = await url(book.coverPhoto);
      const pages = await Promise.all(book.pages.map(async (p) => ({ p, photo: await url(p.photo), draw: await url(p.drawing) })));
      const a4 = { padding: 0, minHeight: 0 };
      const blob = await pdfFromNode(<>
        <div className="a4" style={a4}><CoverView book={book} photoUrl={cover} /></div>
        {pages.map((x, i) => <div key={x.p.id} className="a4" style={a4} lang={lang} dir={isRtl(lang) ? 'rtl' : 'ltr'}><PageView page={x.p} n={i + 1} theme={book.theme} photoUrl={x.photo} drawUrl={x.draw} /></div>)}
        <div className="a4" style={a4}><EndView theme={book.theme} text={s('theEnd')} /></div>
      </>);
      await shareOrDownload(blob, `${book.title.replace(/[^\p{L}\p{N}]+/gu, '-').slice(0, 40) || 'story'}.pdf`, book.title);
    } catch { toast(t('somethingWrong')); } finally { urls.forEach((u) => URL.revokeObjectURL(u)); setBusy(false); }
  };
  if (reading) return <ReadBook book={book} />;
  const help = <><p>{s('tipChild')}</p><p>{s('tipCare')}</p></>;
  return (
    <Page wide>
      <PageHeader title={book.title || s('title')} help={help} />
      <div className="flex flex-wrap gap-2 mb-3">
        <button className="btn-primary" onClick={() => nav('?read=1')}><BookOpen size={18} aria-hidden /> {s('read')}</button>
        <button className="btn-outline" disabled={busy} onClick={exportPdf}><FileDown size={18} aria-hidden /> {busy ? s('making') : s('pdf')}</button>
      </div>
      <div className="flex gap-3 overflow-x-auto no-scrollbar py-2 px-1 -mx-1 mb-4">
        <Thumb on={sel === 0} label={s('cover')} onClick={() => setSel(0)}><LiveCover book={book} /></Thumb>
        {book.pages.map((p, i) => <Thumb key={p.id} on={sel === i + 1} label={s('pageOf', { n: i + 1, all: book.pages.length })} onClick={() => setSel(i + 1)}><LivePage book={book} i={i} /></Thumb>)}
        <button type="button" className="shrink-0 w-[78px] aspect-[1/1.414] rounded-[0.5rem] border-2 border-dashed border-line text-muted grid place-items-center" aria-label={s('addPage')}
          onClick={() => { update({ ...book, pages: [...book.pages, { id: uid(), prompt: '', text: '' }] }); setSel(book.pages.length + 1); }}><Plus size={24} aria-hidden /></button>
      </div>
      <div className="grid md:grid-cols-[minmax(0,340px)_1fr] gap-6 items-start">
        <div className="mx-auto w-full max-w-[290px] md:max-w-none md:sticky md:top-24 rounded-[1rem] shadow-[0_22px_44px_-18px_rgba(0,0,0,.45)]">
          {sel === 0 ? <LiveCover book={book} /> : <LivePage book={book} i={sel - 1} />}
        </div>
        <div className="card p-4 sm:p-5">
          {sel === 0 ? <CoverPanel book={book} update={update} onDelete={() => setDel(true)} />
            : <PageEditor key={book.pages[sel - 1].id} p={book.pages[sel - 1]} onChange={setPage}
              onDelete={async () => { const p = book.pages[sel - 1]; await dropBlobs(pageBlobs(p)); update({ ...book, pages: book.pages.filter((x) => x.id !== p.id) }); setSel(Math.min(sel, book.pages.length - 1)); }} />}
        </div>
      </div>
      <Confirm open={del} danger text={s('deleteQ')} onNo={() => setDel(false)} onYes={async () => {
        await dropBlobs([book.coverPhoto, ...book.pages.flatMap(pageBlobs)]);
        chain = chain.then(async () => setSetting(keyOf(childId), (await getSetting<Book[]>(keyOf(childId), [])).filter((x) => x.id !== book.id)));
        await chain; nav('/stories', { replace: true });
      }} />
    </Page>
  );
}

function CoverPanel({ book, update, onDelete }: { book: Book; update: (b: Book) => void; onDelete: () => void }) {
  const { s } = useS();
  const childId = useChildId();
  const photo = useBlobUrl(book.coverPhoto);
  const setPhoto = async (b?: Blob) => {
    const old = book.coverPhoto;
    update({ ...book, coverPhoto: b ? await putBlob(b, childId, 'story-cover') : undefined });
    if (old) await db.blobs.delete(old);
  };
  return (
    <div className="grid gap-5">
      <label className="grid gap-1 text-sm font-bold">{s('bookTitle')}<input className="input font-normal" value={book.title} onChange={(e) => update({ ...book, title: e.target.value })} /></label>
      <label className="grid gap-1 text-sm font-bold">{s('author')}<input className="input font-normal" value={book.author} onChange={(e) => update({ ...book, author: e.target.value })} /></label>
      <fieldset><legend className="text-sm font-bold mb-2">{s('picture')}</legend>
        <div className="grid grid-cols-4 gap-3">{THEMES.map((th) => (
          <button key={th} type="button" aria-pressed={book.theme === th} onClick={() => update({ ...book, theme: th })} className="grid justify-items-center gap-1 text-[0.7rem] font-semibold">
            <span className={cx('w-14 h-14 rounded-full overflow-hidden border-[3px] transition', book.theme === th ? 'border-[rgb(var(--accent))] scale-105' : 'border-transparent')}><Scene theme={th} /></span>
            <span className="leading-tight text-center">{s(`t_${th}` as StoryKey)}</span>
          </button>
        ))}</div>
      </fieldset>
      <fieldset><legend className="text-sm font-bold mb-2">{s('layout')}</legend>
        <div className="flex gap-3 flex-wrap">{LAYOUTS.map((l, i) => (
          <button key={l} type="button" aria-pressed={book.layout === l} aria-label={`${s('layout')} ${i + 1}`} onClick={() => update({ ...book, layout: l })}
            className={cx('w-[62px] rounded-[0.4rem] transition', book.layout === l ? 'ring-[3px] ring-[rgb(var(--accent))] ring-offset-2 ring-offset-surface' : 'opacity-80')}>
            <CoverView book={{ ...book, layout: l }} photoUrl={photo} />
          </button>
        ))}</div>
      </fieldset>
      <div className="flex flex-wrap gap-2">
        <FileButton accept="image/*" onFile={async (f) => setPhoto(await compressImage(f, 1600, 0.85))}><ImagePlus size={18} aria-hidden /> {s('coverPhoto')}</FileButton>
        {book.coverPhoto && <button className="btn-ghost" onClick={() => setPhoto()}><X size={18} aria-hidden /> {s('remove')}</button>}
      </div>
      <button className="btn-ghost text-danger justify-self-start" onClick={onDelete}><Trash2 size={18} aria-hidden /> {s('deleteBook')}</button>
    </div>
  );
}

function PageEditor({ p, onChange, onDelete }: { p: SPage; onChange: (p: SPage) => void; onDelete: () => void }) {
  const { s } = useS();
  const { t } = useT();
  const childId = useChildId();
  const toast = useToast((x) => x.show);
  const voice = useBlobUrl(p.voice);
  const [rec, setRec] = useState<Rec | null>(null);
  const [draw, setDraw] = useState(false);
  const [del, setDel] = useState(false);
  const cur = useRef(p); cur.current = p;
  const setBlob = async (field: 'photo' | 'drawing' | 'voice', blob: Blob) => {
    const old = cur.current[field];
    const bid = await putBlob(blob, childId, `story-${field}`);
    onChange({ ...cur.current, [field]: bid });
    if (old) await db.blobs.delete(old);
  };
  const clearBlob = async (field: 'photo' | 'drawing' | 'voice') => { const old = p[field]; onChange({ ...p, [field]: undefined }); if (old) await db.blobs.delete(old); };
  return (
    <div className="grid gap-4">
      <label className="grid gap-1 text-sm font-bold">{s('question')}<input className="input font-normal" value={p.prompt} onChange={(e) => onChange({ ...p, prompt: e.target.value })} /></label>
      <textarea className="input min-h-[130px] font-read text-lg" aria-label={p.prompt || s('writeHere')} placeholder={s('writeHere')} value={p.text} onChange={(e) => onChange({ ...p, text: e.target.value })} />
      <div className="flex flex-wrap gap-2">
        {p.photo ? <button className="chip chip-on" onClick={() => clearBlob('photo')} aria-label={`${s('remove')}: ${s('photo')}`}><Camera size={16} aria-hidden /> {s('photo')} <X size={14} aria-hidden /></button>
          : <FileButton accept="image/*" onFile={async (f) => setBlob('photo', await compressImage(f, 1600, 0.85))}><Camera size={18} aria-hidden /> {s('photo')}</FileButton>}
        {p.drawing ? <button className="chip chip-on" onClick={() => clearBlob('drawing')} aria-label={`${s('remove')}: ${s('draw')}`}><Pencil size={16} aria-hidden /> {s('draw')} <X size={14} aria-hidden /></button>
          : <button className="btn-ghost" onClick={() => setDraw(true)}><Pencil size={18} aria-hidden /> {s('draw')}</button>}
        {rec ? <button className="btn-danger" onClick={async () => { const r = rec; setRec(null); await setBlob('voice', await r.stop()); }}><Square size={18} aria-hidden /> {s('stop')}</button>
          : !p.voice && <button className="btn-ghost" onClick={async () => { try { setRec(await startRecording('audio', 3 * 60_000, (b) => { setRec(null); setBlob('voice', b); })); } catch { toast(t('micNotAvailable')); } }}><Mic size={18} aria-hidden /> {s('voice')}</button>}
      </div>
      {voice && !rec && <div className="flex items-center gap-2"><audio src={voice} controls className="flex-1 min-w-0" /><button className="btn-ghost min-w-[48px]" aria-label={`${s('remove')}: ${s('voice')}`} onClick={() => clearBlob('voice')}><X size={18} aria-hidden /></button></div>}
      <button className="btn-ghost text-danger justify-self-start" onClick={() => setDel(true)}><Trash2 size={18} aria-hidden /> {s('deletePage')}</button>
      {draw && <DrawPad onCancel={() => setDraw(false)} onDone={async (b) => { setDraw(false); await setBlob('drawing', b); }} />}
      <Confirm open={del} danger text={`${s('deletePage')}?`} onNo={() => setDel(false)} onYes={() => { setDel(false); onDelete(); }} />
    </div>
  );
}

function VoiceButton({ id, label }: { id: number; label: string }) {
  const url = useBlobUrl(id);
  const a = useRef<HTMLAudioElement | null>(null);
  const [on, setOn] = useState(false);
  useEffect(() => () => a.current?.pause(), []);
  if (!url) return null;
  return (
    <button type="button" aria-label={label} aria-pressed={on} onClick={() => {
      if (on) { a.current?.pause(); setOn(false); return; }
      a.current = new Audio(url); a.current.onended = () => setOn(false); void a.current.play(); setOn(true);
    }} style={{ position: 'absolute', bottom: '4cqw', insetInlineEnd: '5cqw', width: '13cqw', height: '13cqw', minWidth: 48, minHeight: 48, borderRadius: '50%', display: 'grid', placeItems: 'center', background: '#fff', boxShadow: '0 1cqw 3cqw rgba(0,0,0,.2)', color: '#2F6FD6' }}>
      {on ? <Square size={20} aria-hidden /> : <Volume2 size={22} aria-hidden />}
    </button>
  );
}

/** Reading the finished book, page by page, with the page turning like paper. */
function ReadBook({ book }: { book: Book }) {
  const { s, lang } = useS();
  const pages = [
    <LiveCover key="c" book={book} />,
    ...book.pages.map((p, i) => <LivePage key={p.id} book={book} i={i} overlay={p.voice ? <VoiceButton id={p.voice} label={s('listen')} /> : undefined} />),
    <EndView key="e" theme={book.theme} text={s('theEnd')} />,
  ];
  return (
    <Page wide>
      <PageHeader title={book.title} />
      <FlipBook pages={pages} rtl={isRtl(lang)} labels={{ prev: s('prev'), next: s('next') }} />
    </Page>
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
  const s = (k: StoryKey) => st(lang, k);
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
