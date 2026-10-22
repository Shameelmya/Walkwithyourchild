import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { RotateCw, ZoomIn, ZoomOut, X, Check } from 'lucide-react';
import { useT } from '../i18n';
import { useBackToClose } from '../lib/nav';

const OUT = 640; // saved size in pixels (square)

/** Full-screen photo editor: drag to move, pinch or slide to zoom, turn in quarter steps. Saves the part inside the frame as a square JPEG. */
export function PhotoCrop({ file, round = true, onDone, onCancel }: { file: Blob; round?: boolean; onDone: (b: Blob) => void; onCancel: () => void }) {
  const { t } = useT();
  useBackToClose(true, onCancel);
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [url] = useState(() => URL.createObjectURL(file));
  const [zoom, setZoom] = useState(1);
  const [rot, setRot] = useState(0);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [busy, setBusy] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const pts = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<{ d: number; z: number } | null>(null);
  const [frame, setFrame] = useState(300);
  useEffect(() => { const i = new Image(); i.onload = () => setImg(i); i.src = url; return () => URL.revokeObjectURL(url); }, [url]);
  useEffect(() => { const r = () => setFrame(Math.min(innerWidth - 48, innerHeight - 300, 420)); r(); addEventListener('resize', r); return () => removeEventListener('resize', r); }, []);
  // The picture always covers the frame at zoom 1 ("cover").
  const sideways = rot % 180 !== 0;
  const iw = img ? (sideways ? img.height : img.width) : 1, ih = img ? (sideways ? img.width : img.height) : 1;
  const base = frame / Math.min(iw, ih);
  const scale = base * zoom;
  const clampPos = (p: { x: number; y: number }, z = zoom) => {
    const w = iw * base * z, h = ih * base * z;
    const mx = Math.max(0, (w - frame) / 2), my = Math.max(0, (h - frame) / 2);
    return { x: Math.max(-mx, Math.min(mx, p.x)), y: Math.max(-my, Math.min(my, p.y)) };
  };
  const setZ = (z: number) => { const nz = Math.max(1, Math.min(5, z)); setZoom(nz); setPos((p) => clampPos(p, nz)); };
  const down = (e: React.PointerEvent) => { (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); pts.current.set(e.pointerId, { x: e.clientX, y: e.clientY }); if (pts.current.size === 2) { const [a, b] = [...pts.current.values()]; pinch.current = { d: Math.hypot(a.x - b.x, a.y - b.y), z: zoom }; } };
  const move = (e: React.PointerEvent) => {
    const prev = pts.current.get(e.pointerId); if (!prev) return;
    const cur = { x: e.clientX, y: e.clientY }; pts.current.set(e.pointerId, cur);
    if (pts.current.size === 2 && pinch.current) { const [a, b] = [...pts.current.values()]; setZ(pinch.current.z * (Math.hypot(a.x - b.x, a.y - b.y) / pinch.current.d)); return; }
    setPos((p) => clampPos({ x: p.x + cur.x - prev.x, y: p.y + cur.y - prev.y }));
  };
  const up = (e: React.PointerEvent) => { pts.current.delete(e.pointerId); if (pts.current.size < 2) pinch.current = null; };
  const save = async () => {
    if (!img) return;
    setBusy(true);
    const c = document.createElement('canvas'); c.width = OUT; c.height = OUT;
    const x = c.getContext('2d')!;
    const k = OUT / frame;
    x.fillStyle = '#fff'; x.fillRect(0, 0, OUT, OUT);
    x.translate(OUT / 2 + pos.x * k, OUT / 2 + pos.y * k); x.rotate((rot * Math.PI) / 180); x.scale(scale * k, scale * k);
    x.drawImage(img, -img.width / 2, -img.height / 2);
    const b = await new Promise<Blob | null>((r) => c.toBlob(r, 'image/jpeg', 0.88));
    setBusy(false);
    if (b) onDone(b);
  };
  return createPortal(
    <div role="dialog" aria-modal="true" aria-label={t('editPhoto')} className="fixed inset-0 z-[90] bg-black text-white flex flex-col anim-fade select-none">
      <div className="flex items-center justify-between p-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <button className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center" aria-label={t('cancel')} onClick={onCancel}><X /></button>
        <p className="font-bold">{t('editPhoto')}</p>
        <button className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center" aria-label={t('rotate')} onClick={() => { setRot((r) => (r + 90) % 360); setPos({ x: 0, y: 0 }); }}><RotateCw /></button>
      </div>
      <div ref={box} className="flex-1 relative overflow-hidden touch-none" onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}
        onWheel={(e) => setZ(zoom * (e.deltaY < 0 ? 1.08 : 0.93))}>
        {img && <img src={url} alt="" draggable={false} className="absolute left-1/2 top-1/2 max-w-none pointer-events-none"
          style={{ width: img.width, height: img.height, transform: `translate(-50%,-50%) translate(${pos.x}px,${pos.y}px) rotate(${rot}deg) scale(${scale})` }} />}
        {/* Dim everything outside the frame. */}
        <div className="absolute left-1/2 top-1/2 pointer-events-none" style={{ width: frame, height: frame, transform: 'translate(-50%,-50%)', borderRadius: round ? '50%' : 24, boxShadow: '0 0 0 9999px rgb(0 0 0 / .6)', outline: '2px solid rgb(255 255 255 / .9)' }} />
      </div>
      <div className="p-4 pb-[max(1rem,env(safe-area-inset-bottom))] grid gap-4">
        <div className="flex items-center gap-3">
          <button className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center shrink-0" aria-label={t('zoomOut')} onClick={() => setZ(zoom / 1.2)}><ZoomOut size={20} /></button>
          <input type="range" min={1} max={5} step={0.01} value={zoom} onChange={(e) => setZ(+e.target.value)} className="slider flex-1" aria-label={t('zoom')} />
          <button className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center shrink-0" aria-label={t('zoomIn')} onClick={() => setZ(zoom * 1.2)}><ZoomIn size={20} /></button>
        </div>
        <p className="text-center text-sm text-white/70">{t('cropHint')}</p>
        <button className="btn-primary !min-h-[56px] text-lg" disabled={!img || busy} onClick={save}><Check aria-hidden /> {t('usePhoto')}</button>
      </div>
    </div>, document.body,
  );
}
