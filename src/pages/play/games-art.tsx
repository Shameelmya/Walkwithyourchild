import { useEffect, useRef, useState } from 'react';
import { Trash2, Droplet } from 'lucide-react';
import { hiss } from '../../lib/audio';
import { rand } from './shared';

const PIGMENTS = ['#D9483B', '#F08A24', '#F2C230', '#7BB342', '#1F8F7A', '#2F7BD1', '#24408E', '#7B4FB8', '#D2549A', '#8A5A3B', '#3A3A3A'];
interface Bloom { x: number; y: number; r: number; c: string; life: number; seed: number }

/** Watercolour: soft see-through colour that spreads a little after it touches the paper, and mixes where it overlaps. The water brush lifts colour. */
export function Watercolour({ vol }: { vol: number }) {
  const paper = useRef<HTMLCanvasElement>(null);
  const paint = useRef<HTMLCanvasElement>(null);
  const [col, setCol] = useState(5);
  const [size, setSize] = useState(1);
  const [water, setWater] = useState(false);
  const blooms = useRef<Bloom[]>([]);
  const last = useRef<{ x: number; y: number } | null>(null);
  const opts = useRef({ col, size, water }); opts.current = { col, size, water };
  useEffect(() => {
    const d = Math.min(2, devicePixelRatio || 1);
    const setup = (c: HTMLCanvasElement) => { c.width = innerWidth * d; c.height = innerHeight * d; const x = c.getContext('2d')!; x.setTransform(d, 0, 0, d, 0, 0); return x; };
    const p = setup(paper.current!);
    // Paper: warm white with a soft grain.
    p.fillStyle = '#fbf8f1'; p.fillRect(0, 0, innerWidth, innerHeight);
    for (let i = 0; i < innerWidth * innerHeight / 60; i++) { p.fillStyle = `rgba(120,100,70,${rand(0.015, 0.05)})`; p.fillRect(rand(0, innerWidth), rand(0, innerHeight), rand(0.5, 1.6), rand(0.5, 1.6)); }
    const ctx = setup(paint.current!);
    let raf = 0;
    const blob = (b: Bloom, grow: number, alpha: number) => {
      ctx.beginPath();
      const pts = 14; const r = b.r * grow;
      for (let i = 0; i <= pts; i++) {
        const a = (i / pts) * Math.PI * 2; const wob = 0.82 + 0.3 * Math.abs(Math.sin(b.seed + i * 1.7)) + rand(-0.04, 0.04);
        const x = b.x + Math.cos(a) * r * wob; const y = b.y + Math.sin(a) * r * wob;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.globalAlpha = alpha; ctx.fill();
      // Pigment gathers at the edge as it dries.
      ctx.globalAlpha = alpha * 0.9; ctx.lineWidth = 1.2; ctx.stroke();
    };
    const loop = () => {
      blooms.current = blooms.current.filter((b) => {
        b.life -= 0.035;
        if (b.c === 'water') { ctx.globalCompositeOperation = 'destination-out'; ctx.fillStyle = '#000'; ctx.strokeStyle = 'rgba(0,0,0,0)'; blob(b, 1 + (1 - b.life) * 0.3, 0.05); }
        else { ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = b.c; ctx.strokeStyle = b.c; blob(b, 1 + (1 - b.life) * 0.55, 0.035); }
        return b.life > 0;
      });
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);
  const dab = (x: number, y: number) => {
    const o = opts.current; const r = [14, 26, 44][o.size];
    const prev = last.current; last.current = { x, y };
    const steps = prev ? Math.max(1, Math.floor(Math.hypot(x - prev.x, y - prev.y) / (r * 0.45))) : 1;
    for (let i = 1; i <= steps; i++) {
      const px = prev ? prev.x + ((x - prev.x) * i) / steps : x; const py = prev ? prev.y + ((y - prev.y) * i) / steps : y;
      blooms.current.push({ x: px + rand(-2, 2), y: py + rand(-2, 2), r: r * rand(0.8, 1.15), c: o.water ? 'water' : PIGMENTS[o.col], life: 1, seed: rand(0, 10) });
    }
    if (Math.random() < 0.12) hiss(vol * 0.08, 0.25, 700, 'lowpass');
  };
  return (
    <div className="absolute inset-0 touch-none select-none">
      <canvas ref={paper} className="absolute inset-0 w-full h-full" />
      <canvas ref={paint} className="absolute inset-0 w-full h-full" style={{ mixBlendMode: 'multiply' }}
        onPointerDown={(e) => { (e.target as HTMLElement).setPointerCapture(e.pointerId); last.current = null; dab(e.clientX, e.clientY); }}
        onPointerMove={(e) => { if (e.buttons) dab(e.clientX, e.clientY); }} onPointerUp={() => { last.current = null; }} />
      <div className="absolute bottom-0 inset-x-0 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] flex flex-col gap-2 items-center pointer-events-none">
        <div className="flex gap-2 items-center bg-white/85 backdrop-blur rounded-full p-1.5 shadow-card pointer-events-auto">
          {[0, 1, 2].map((s) => <button key={s} aria-label={`brush ${s + 1}`} aria-pressed={size === s} onClick={() => setSize(s)} className={`w-11 h-11 rounded-full flex items-center justify-center ${size === s ? 'bg-[#e8eefc]' : ''}`}><span className="rounded-full bg-[#2a2f3a]" style={{ width: 6 + s * 7, height: 6 + s * 7 }} /></button>)}
          <button aria-label="water" aria-pressed={water} onClick={() => setWater(!water)} className={`w-11 h-11 rounded-full flex items-center justify-center text-[#2F7BD1] ${water ? 'bg-[#e8eefc]' : ''}`}><Droplet size={22} fill={water ? 'currentColor' : 'none'} /></button>
          <button aria-label="clear" onClick={() => { const c = paint.current!; c.getContext('2d')!.clearRect(0, 0, c.width, c.height); blooms.current = []; }} className="w-11 h-11 rounded-full flex items-center justify-center text-[#6b7385]"><Trash2 size={20} /></button>
        </div>
        <div className="flex flex-wrap justify-center gap-2 max-w-md bg-white/85 backdrop-blur rounded-3xl p-2 shadow-card pointer-events-auto">
          {PIGMENTS.map((c, i) => (
            <button key={c} aria-label={c} onClick={() => { setCol(i); setWater(false); }} className="w-10 h-10 rounded-full transition-transform duration-300"
              style={{ background: `radial-gradient(circle at 35% 35%, ${c}aa, ${c})`, transform: col === i && !water ? 'scale(1.18)' : undefined, outline: col === i && !water ? '3px solid #2a2f3a' : 'none', outlineOffset: 2 }} />
          ))}
        </div>
      </div>
    </div>
  );
}
