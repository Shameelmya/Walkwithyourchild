import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Maximize2, Minimize2, Pencil, Plus, Mic, Square, Play, Camera, ChevronLeft, ChevronRight, EyeOff, Trash2 } from 'lucide-react';
import { useT } from '../../i18n';
import { Page, PageHeader, Modal, FileButton, Seg, useToast } from '../../components/ui';
import { db, putBlob, type TalkCard } from '../../lib/db';
import { useBlobUrl, useChildId } from '../../lib/hooks';
import { meta } from '../../lib/content';
import { useUI } from '../../lib/store';
import { speak } from '../../lib/audio';
import { compressImage, startRecording, type Rec } from '../../lib/media';
import { cx } from '../../lib/util';

const EMOJI = ['🍚', '💧', '🤕', '🚽', '👩', '👨', '🎵', '😴', '👍', '👎', '➕', '✋', '🔥', '❄️', '🤗', '🌳'];
const COLORS = ['var(--p1t)', 'var(--p2t)', 'var(--p3t)', 'var(--p4t)', 'var(--p5t)', 'var(--pit)'];

interface Card { key: string; rec?: TalkCard; builtin?: number; label: string; emoji?: string; photo?: number; voice?: number }

function CardFace({ c, big }: { c: Card; big: boolean }) {
  const url = useBlobUrl(c.photo);
  return (
    <>
      {url ? <img src={url} alt="" className="w-full flex-1 min-h-0 object-cover rounded-xl" /> : <span aria-hidden className="flex-1 flex items-center justify-center leading-none" style={{ fontSize: big ? '4.5rem' : '3rem' }}>{c.emoji ?? '💬'}</span>}
      <span className={cx('font-extrabold text-center leading-tight', big ? 'text-2xl' : 'text-lg')}>{c.label}</span>
    </>
  );
}

export default function Talk() {
  const { t, lang } = useT();
  const childId = useChildId();
  const toast = useToast((s) => s.show);
  const { talkGrid: n, setTalkGrid } = useUI();
  const recs = useLiveQuery(() => db.talkCards.where('childId').equals(childId).sortBy('order'), [childId]) ?? [];
  const [page, setPage] = useState(0);
  const [focus, setFocus] = useState(-1);
  const [full, setFull] = useState(false);
  const [active, setActive] = useState<string>();
  const [editing, setEditing] = useState<Card | null>(null);
  const [editMode, setEditMode] = useState(false);
  const audio = useRef<HTMLAudioElement | null>(null);

  const cards: Card[] = useMemo(() => {
    const out: Card[] = meta.talkBoardCards.map((c, i) => {
      const r = recs.find((x) => x.builtin === i);
      return { key: `b${i}`, rec: r, builtin: i, label: r?.label || c[lang], emoji: EMOJI[i], photo: r?.photoBlobId, voice: r?.voiceBlobId };
    }).filter((c) => !c.rec?.hidden);
    for (const r of recs.filter((x) => x.builtin === undefined)) out.push({ key: `c${r.id}`, rec: r, label: r.label, emoji: r.emoji, photo: r.photoBlobId, voice: r.voiceBlobId });
    return out;
  }, [recs, lang]);
  const per = n * n;
  const pages = Math.max(1, Math.ceil(cards.length / per));
  const shown = cards.slice(page * per, page * per + per);
  useEffect(() => { if (page >= pages) setPage(0); }, [pages, page]);

  const say = useCallback(async (c: Card) => {
    setActive(c.key); setTimeout(() => setActive(undefined), 1200);
    if (c.voice) {
      const b = await db.blobs.get(c.voice);
      if (b) { audio.current?.pause(); const a = new Audio(URL.createObjectURL(b.blob)); audio.current = a; a.volume = 1; void a.play(); return; }
    }
    if ('speechSynthesis' in window) speechSynthesis.cancel();
    speak(c.label, lang);
  }, [lang]);

  // Single-switch: Space moves, Enter selects.
  useEffect(() => {
    if (editing) return;
    const k = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest('input,textarea,select')) return;
      if (e.key === ' ') { e.preventDefault(); setFocus((f) => (f + 1) % (shown.length + (pages > 1 ? 1 : 0))); }
      if (e.key === 'Enter' && focus >= 0) { e.preventDefault(); if (focus === shown.length) setPage((p) => (p + 1) % pages); else if (shown[focus]) void say(shown[focus]); }
    };
    addEventListener('keydown', k); return () => removeEventListener('keydown', k);
  }, [shown, focus, say, pages, editing]);

  const toggleFull = async () => {
    try { if (!document.fullscreenElement) await document.documentElement.requestFullscreen?.(); else await document.exitFullscreen?.(); } catch { /* */ }
    setFull((f) => !f);
  };
  useEffect(() => { const f = () => !document.fullscreenElement && setFull(false); document.addEventListener('fullscreenchange', f); return () => document.removeEventListener('fullscreenchange', f); }, []);

  const grid = (
    <div className="grid gap-3 flex-1" style={{ gridTemplateColumns: `repeat(${n}, minmax(0,1fr))`, gridAutoRows: full ? `calc((100vh - 90px - ${n - 1} * 0.75rem) / ${n})` : 'minmax(130px, auto)' }}>
      {shown.map((c, i) => (
        <button key={c.key} onClick={() => (editMode ? setEditing(c) : say(c))} aria-label={c.label}
          className={cx('relative rounded-3xl p-3 flex flex-col items-stretch gap-2 border-4 transition shadow-card', focus === i ? 'border-accent ring-4 ring-accent/40' : 'border-transparent', active === c.key && 'scale-[1.04] ring-4 ring-[var(--p2)]')}
          style={{ background: COLORS[(page * per + i) % COLORS.length] }}>
          <CardFace c={c} big={n <= 3} />
          {editMode && <span className="absolute top-2 right-2 bg-surface rounded-full p-1.5"><Pencil size={16} aria-hidden /></span>}
        </button>
      ))}
    </div>
  );
  const pager = pages > 1 && (
    <div className="flex items-center justify-center gap-3 mt-3">
      <button className="icon-btn bg-surface2" aria-label={t('previous')} onClick={() => setPage((p) => (p - 1 + pages) % pages)}><ChevronLeft /></button>
      <span className={cx('font-bold px-3 py-2 rounded-full', focus === shown.length && 'ring-4 ring-accent')}>{page + 1} / {pages}</span>
      <button className="icon-btn bg-surface2" aria-label={t('next')} onClick={() => setPage((p) => (p + 1) % pages)}><ChevronRight /></button>
    </div>
  );
  if (full) return (
    <div className="fixed inset-0 z-50 bg-bg p-3 flex flex-col">
      <div className="flex justify-end mb-2"><button className="icon-btn bg-surface2" onClick={toggleFull} aria-label={t('exitFullScreen')}><Minimize2 /></button></div>
      {grid}{pager}
    </div>
  );
  return (
    <Page wide>
      <PageHeader title={t('navTalk')} sub={t('talkIntro')} actions={<button className="icon-btn" onClick={toggleFull} aria-label={t('fullScreen')}><Maximize2 /></button>} />
      <div className="flex flex-wrap gap-3 items-center mb-4">
        <Seg label={t('gridSize')} value={n} onChange={(v) => { setTalkGrid(v); setPage(0); }} options={[{ v: 2, l: '2×2' }, { v: 3, l: '3×3' }, { v: 4, l: '4×4' }]} />
        <button className={cx('chip', editMode && 'chip-on')} aria-pressed={editMode} onClick={() => setEditMode(!editMode)}><Pencil size={16} aria-hidden /> {t('editCards')}</button>
        {editMode && <button className="chip" onClick={() => setEditing({ key: 'new', label: '', emoji: '⭐' })}><Plus size={16} aria-hidden /> {t('newCard')}</button>}
      </div>
      <p className="text-sm text-muted mb-3">{editMode ? t('editCardsHint') : t('switchHint')}</p>
      {grid}{pager}
      <CardEditor card={editing} onClose={() => setEditing(null)} childId={childId} count={recs.length} onSaved={() => toast(t('saved'))} />
    </Page>
  );
}

function CardEditor({ card, onClose, childId, count, onSaved }: { card: Card | null; onClose: () => void; childId: number; count: number; onSaved: () => void }) {
  const { t } = useT();
  const [label, setLabel] = useState('');
  const [emoji, setEmoji] = useState('');
  const [photo, setPhoto] = useState<number>();
  const [voice, setVoice] = useState<number>();
  const [rec, setRec] = useState<Rec | null>(null);
  const voiceUrl = useBlobUrl(voice);
  useEffect(() => { if (card) { setLabel(card.label); setEmoji(card.emoji ?? ''); setPhoto(card.photo); setVoice(card.voice); } }, [card]);
  if (!card) return null;
  const save = async (hidden = false) => {
    const data: TalkCard = { childId, builtin: card.builtin, label: label.trim(), emoji, photoBlobId: photo, voiceBlobId: voice, hidden, order: card.rec?.order ?? count };
    if (card.rec?.id) await db.talkCards.update(card.rec.id, data as never); else await db.talkCards.add(data);
    onSaved(); onClose();
  };
  return (
    <Modal open onClose={onClose} title={card.key === 'new' ? t('newCard') : t('editCard')}>
      <div className="grid gap-4">
        <div><label className="label" htmlFor="tc-l">{t('cardWord')}</label><input id="tc-l" className="input" value={label} onChange={(e) => setLabel(e.target.value)} /></div>
        {card.builtin === undefined && <div><label className="label" htmlFor="tc-e">{t('emojiOptional')}</label><input id="tc-e" className="input w-24 text-2xl" value={emoji} onChange={(e) => setEmoji(e.target.value)} /></div>}
        <div className="flex flex-wrap gap-2 items-center">
          <FileButton accept="image/*" onFile={async (f) => setPhoto(await putBlob(await compressImage(f, 800), childId, 'talk'))}><Camera size={18} aria-hidden /> {photo ? t('changePhoto') : t('addPhoto')}</FileButton>
          {photo && <button className="chip" onClick={() => setPhoto(undefined)}>{t('removePhoto')}</button>}
        </div>
        <div>
          <p className="label">{t('voiceRecording')}</p>
          <div className="flex flex-wrap gap-2 items-center">
            {rec ? <button className="btn-danger" onClick={async () => { const b = await rec.stop(); setRec(null); setVoice(await putBlob(b, childId, 'voice')); }}><Square size={18} aria-hidden /> {t('stopRecording')}</button>
              : <button className="btn-ghost" onClick={async () => { try { setRec(await startRecording('audio', 15000, async (b) => { setRec(null); setVoice(await putBlob(b, childId, 'voice')); })); } catch { alert(t('micNotAvailable')); } }}><Mic size={18} aria-hidden /> {voice ? t('recordAgain') : t('recordYourVoice')}</button>}
            {voiceUrl && !rec && <button className="chip" onClick={() => void new Audio(voiceUrl).play()}><Play size={16} aria-hidden /> {t('play')}</button>}
          </div>
          <p className="text-sm text-muted mt-1">{t('voiceHint')}</p>
        </div>
        <div className="flex flex-wrap gap-2 justify-between">
          {card.builtin !== undefined ? <button className="btn-ghost" onClick={() => save(true)}><EyeOff size={18} aria-hidden /> {t('hideCard')}</button>
            : card.rec?.id ? <button className="btn-ghost text-danger" onClick={async () => { await db.talkCards.delete(card.rec!.id!); onClose(); }}><Trash2 size={18} aria-hidden /> {t('delete')}</button> : <span />}
          <button className="btn-primary" disabled={!label.trim()} onClick={() => save(false)}>{t('save')}</button>
        </div>
      </div>
    </Modal>
  );
}
