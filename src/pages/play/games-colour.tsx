import { createElement, useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import { PENTA, tone, hiss, pop } from '../../lib/audio';
import { HUES, PAINT, nextId, rand, useAnyInput, useCanvas } from './shared';
import { PICTURES } from './pictures';

export function Bubbles({ vol }: { vol: number }) {
  const [items, setItems] = useState<{ id: number; x: number; y: number; c: string; s: number; burst: boolean }[]>([]);
  const add = useCallback((x: number, y: number) => {
    const n = 5;
    const fresh = Array.from({ length: n }, (_, i) => ({ id: nextId(), x: x + (Math.random() - 0.5) * 120, y: y + (Math.random() - 0.5) * 60, c: HUES[(nextId() + i) % HUES.length], s: 40 + Math.random() * 70, burst: i === 0 }));
    setItems((it) => [...it.slice(-40), ...fresh]);
    tone(PENTA[Math.floor(Math.random() * PENTA.length)], 0.9, vol);
    setTimeout(() => setItems((it) => it.filter((b) => !fresh.includes(b))), 6000);
  }, [vol]);
  useAnyInput(add);
  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: 'linear-gradient(#20324a,#3b5876)' }} onPointerDown={(e) => add(e.clientX, e.clientY)}>
      {items.map((b) => b.burst
        ? <span key={b.id} className="absolute rounded-full pointer-events-none" style={{ left: b.x, top: b.y, width: 160, height: 160, background: `radial-gradient(circle, ${b.c}cc, transparent 70%)`, animation: 'burst 1.4s ease-out forwards' }} />
        : <span key={b.id} className="absolute rounded-full pointer-events-none border-2 border-white/60" style={{ left: b.x, top: b.y, width: b.s, height: b.s, background: `radial-gradient(circle at 30% 30%, #fff9, ${b.c}88)`, animation: `floaty ${5 + Math.random() * 3}s linear forwards` }} />)}
    </div>
  );
}



const LS = 'wwyc-colouring';
/** Colouring book: pick a colour, tap a part of the picture to fill it. Pictures stay coloured. */
export function Colouring({ vol }: { vol: number }) {
  const [pic, setPic] = useState(0);
  const [col, setCol] = useState(5);
  const [fills, setFills] = useState<Record<string, string[]>>(() => { try { return JSON.parse(localStorage.getItem(LS) || '{}'); } catch { return {}; } });
  const [flash, setFlash] = useState(-1);
  const [party, setParty] = useState(0);
  const celebrated = useRef<Record<string, boolean>>({});
  useEffect(() => { try { localStorage.setItem(LS, JSON.stringify(fills)); } catch { /* */ } }, [fills]);
  const p = PICTURES[pic];
  const f = fills[p.id] ?? [];
  // Every part of the picture (the background is optional) has a colour: celebrate once.
  const complete = p.regions.every((_, i) => i === 0 || !!f[i]);
  useEffect(() => {
    if (!complete) { celebrated.current[p.id] = false; return; }
    if (celebrated.current[p.id]) return;
    celebrated.current[p.id] = true;
    setParty((x) => x + 1);
    [0, 2, 4, 5, 7].forEach((n, i) => tone(PENTA[n] * 2, 1.2, vol * 0.7, 'sine', 0.12 * i));
    try { navigator.vibrate?.([40, 60, 40]); } catch { /* */ }
  }, [complete, p.id, vol]);
  // Pictures already finished before this visit don't celebrate again.
  useEffect(() => { PICTURES.forEach((x) => { const ff = fills[x.id] ?? []; if (x.regions.every((_, i) => i === 0 || !!ff[i])) celebrated.current[x.id] = true; }); }, []); // eslint-disable-line
  const fill = useCallback((i: number, c = PAINT[col]) => {
    setFills((all) => { const cur = [...(all[p.id] ?? [])]; cur[i] = c; return { ...all, [p.id]: cur }; });
    setFlash(i); setTimeout(() => setFlash(-1), 350);
    tone(PENTA[(PAINT.indexOf(c) + 2) % PENTA.length] * 1.5, 0.9, vol * 0.8);
  }, [col, p.id, vol]);
  useAnyInput(() => fill(1 + Math.floor(Math.random() * (p.regions.length - 1)), PAINT[Math.floor(Math.random() * 9)]));
  const go = (d: number) => { setPic((x) => (x + d + PICTURES.length) % PICTURES.length); tone(PENTA[d > 0 ? 6 : 3], 0.4, vol * 0.5); };
  return (
    <div className="absolute inset-0 flex flex-col items-center bg-[#f4f6fb] pt-20 pb-4 px-3 gap-3">
      <div className="flex-1 w-full flex items-center justify-center min-h-0">
        <svg viewBox="0 0 300 300" className="w-full h-full max-w-[min(100%,72vh)] drop-shadow-md touch-manipulation">
          {p.regions.map(([tag, attrs], i) => createElement(tag, {
            key: i, ...attrs, fill: f[i] ?? '#ffffff', stroke: '#2a2f3a', strokeWidth: 3.5, strokeLinejoin: 'round',
            style: { cursor: 'pointer', transition: 'fill 0.35s cubic-bezier(0.32,0.72,0,1), opacity 0.2s', opacity: flash === i ? 0.75 : 1 },
            onPointerDown: (e: React.PointerEvent) => { e.stopPropagation(); fill(i); },
          }))}
          {p.lines?.map((d, i) => <path key={'l' + i} d={d} fill="none" stroke="#2a2f3a" strokeWidth={3.5} strokeLinecap="round" pointerEvents="none" />)}
        </svg>
      </div>
      {party > 0 && <Celebrate key={party} />}
      <div className="flex items-center gap-6">
        <button aria-label="previous" onClick={() => go(-1)} className="w-14 h-14 rounded-full bg-white shadow-card flex items-center justify-center text-[#2a2f3a] active:scale-90 transition duration-300"><ChevronLeft size={30} /></button>
        <span className="text-sm font-bold text-[#6b7385] tabular-nums" aria-hidden>{pic + 1} / {PICTURES.length}</span>
        <button aria-label="next" onClick={() => go(1)} className="w-14 h-14 rounded-full bg-white shadow-card flex items-center justify-center text-[#2a2f3a] active:scale-90 transition duration-300"><ChevronRight size={30} /></button>
      </div>
      <div className="flex flex-wrap justify-center gap-2.5 max-w-xl">
        {PAINT.map((c, i) => (
          <button key={c} aria-label={c} onClick={() => { setCol(i); tone(PENTA[(i + 2) % PENTA.length], 0.3, vol * 0.4); }}
            className="w-12 h-12 rounded-full border-4 transition-transform duration-300" style={{ background: c, borderColor: col === i ? '#2a2f3a' : '#ffffff', transform: col === i ? 'scale(1.15)' : undefined, boxShadow: '0 4px 12px -4px rgb(0 0 0 / .3)' }} />
        ))}
      </div>
    </div>
  );
}

/** A short, joyful burst over the picture: big star, confetti, no words needed. */
export function Celebrate({ star = true }: { star?: boolean }) {
  const [on, setOn] = useState(true);
  useEffect(() => { const h = setTimeout(() => setOn(false), 2600); return () => clearTimeout(h); }, []);
  if (!on) return null;
  return (
    <div className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center" aria-live="polite">
      {Array.from({ length: 28 }, (_, i) => (
        <span key={i} className="absolute w-3 h-4 rounded-sm" style={{ left: '50%', top: '45%', background: PAINT[i % 9], transform: `rotate(${i * 13}deg) translate(${60 + (i % 7) * 22}px)`, animation: `burst ${1.2 + (i % 5) * 0.2}s ease-out forwards` }} />
      ))}
      {star && <span className="anim-zoom text-[9rem] drop-shadow-xl" role="img" aria-label="★">🌟</span>}
    </div>
  );
}

/** Finger painting with soft, wide strokes. The rainbow brush changes colour as it moves. */
export function Paint({ vol }: { vol: number }) {
  const ref = useCanvas();
  const [col, setCol] = useState(-1); // -1 = rainbow
  const last = useRef<{ x: number; y: number } | null>(null);
  const hue = useRef(0);
  const colour = () => (col < 0 ? `hsl(${(hue.current += 4) % 360} 85% 60%)` : PAINT[col]);
  const draw = (x: number, y: number) => {
    const ctx = ref.current!.getContext('2d')!;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.lineWidth = 26; ctx.strokeStyle = colour();
    ctx.beginPath(); const l = last.current ?? { x, y }; ctx.moveTo(l.x, l.y); ctx.lineTo(x + 0.01, y); ctx.stroke();
    last.current = { x, y };
  };
  useAnyInput((x, y) => { last.current = null; for (let i = 0; i < 12; i++) draw(x + Math.sin(i / 2) * 60, y + i * 6); last.current = null; tone(PENTA[Math.floor(Math.random() * 10)], 0.6, vol * 0.6); });
  const clear = () => { const c = ref.current!; c.getContext('2d')!.clearRect(0, 0, c.width, c.height); hiss(vol * 0.5, 0.4, 1200, 'lowpass'); };
  return (
    <div className="absolute inset-0 bg-white">
      <canvas ref={ref} className="absolute inset-0 w-full h-full touch-none"
        onPointerDown={(e) => { (e.target as HTMLElement).setPointerCapture(e.pointerId); last.current = null; draw(e.clientX, e.clientY); tone(PENTA[Math.floor((1 - e.clientY / innerHeight) * 9)], 0.7, vol * 0.5); }}
        onPointerMove={(e) => e.buttons && draw(e.clientX, e.clientY)} onPointerUp={() => { last.current = null; }} />
      <button aria-label="clear" onClick={clear} className="absolute top-3 left-3 w-14 h-14 rounded-full bg-black/10 flex items-center justify-center text-[#2a2f3a]"><Trash2 size={22} /></button>
      <div className="absolute bottom-4 inset-x-0 flex flex-wrap justify-center gap-2.5 px-3">
        <button aria-label="rainbow" onClick={() => setCol(-1)} className="w-12 h-12 rounded-full border-4 transition-transform duration-300" style={{ background: 'conic-gradient(#E5534B,#F4C430,#6CC48F,#4F8FEA,#7556D2,#E5534B)', borderColor: col < 0 ? '#2a2f3a' : '#fff', transform: col < 0 ? 'scale(1.15)' : undefined }} />
        {PAINT.slice(0, 10).map((c, i) => <button key={c} aria-label={c} onClick={() => setCol(i)} className="w-12 h-12 rounded-full border-4 transition-transform duration-300" style={{ background: c, borderColor: col === i ? '#2a2f3a' : '#fff', transform: col === i ? 'scale(1.15)' : undefined, boxShadow: '0 4px 12px -4px rgb(0 0 0 / .3)' }} />)}
      </div>
    </div>
  );
}

interface Spark { x: number; y: number; vx: number; vy: number; c: string; life: number }
interface Rocket { x: number; y: number; tx: number; ty: number; c: string }
/** Fireworks: tap the sky; a rocket rises and opens into colours. */
export function Fireworks({ vol }: { vol: number }) {
  const sparks = useRef<Spark[]>([]);
  const rockets = useRef<Rocket[]>([]);
  const ref = useCanvas((ctx, w, h) => {
    ctx.fillStyle = 'rgba(12,16,34,0.22)'; ctx.fillRect(0, 0, w, h);
    for (const r of rockets.current) {
      r.y += (r.ty - r.y) * 0.09; r.x += (r.tx - r.x) * 0.09;
      ctx.fillStyle = '#fff6d0'; ctx.beginPath(); ctx.arc(r.x, r.y, 3, 0, 7); ctx.fill();
      if (Math.abs(r.y - r.ty) < 4) {
        for (let i = 0; i < 46; i++) { const a = (i / 46) * Math.PI * 2, s = rand(1.5, 4.5); sparks.current.push({ x: r.x, y: r.y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, c: r.c, life: 1 }); }
        pop(vol * 0.7); tone(PENTA[Math.floor(rand(4, 10))], 1.4, vol * 0.5);
        r.ty = -999;
      }
    }
    rockets.current = rockets.current.filter((r) => r.ty !== -999);
    for (const s of sparks.current) {
      s.x += s.vx; s.y += s.vy; s.vy += 0.045; s.vx *= 0.985; s.life -= 0.012;
      ctx.globalAlpha = Math.max(0, s.life); ctx.fillStyle = s.c; ctx.beginPath(); ctx.arc(s.x, s.y, 2.6, 0, 7); ctx.fill();
    }
    ctx.globalAlpha = 1;
    sparks.current = sparks.current.filter((s) => s.life > 0);
  });
  const launch = (x: number, y: number) => { if (rockets.current.length > 6) return; rockets.current.push({ x, y: innerHeight, tx: x, ty: y, c: HUES[nextId() % HUES.length] }); hiss(vol * 0.35, 0.5, 2500, 'highpass'); };
  useAnyInput(launch);
  return <canvas ref={ref} className="absolute inset-0 w-full h-full touch-none bg-[#0c1022]" onPointerDown={(e) => launch(e.clientX, e.clientY)} />;
}

const LIGHTS = [['#ffd6e0', '#c7a9db'], ['#cfe8ff', '#9fb0e3'], ['#d6f5e3', '#7fc8c1'], ['#fff1c9', '#f3d08a'], ['#ffe0d1', '#f2a98c'], ['#e6dcff', '#a98be8']];
/** Colour lights: the whole screen glows into a new colour with a soft chord. */
export function Lights({ vol }: { vol: number }) {
  const [i, setI] = useState(0);
  const [rings, setRings] = useState<{ id: number; x: number; y: number }[]>([]);
  const next = useCallback((x: number, y: number) => {
    setI((v) => (v + 1) % LIGHTS.length);
    const r = { id: nextId(), x, y }; setRings((a) => [...a.slice(-6), r]); setTimeout(() => setRings((a) => a.filter((z) => z !== r)), 1400);
    const b = Math.floor(Math.random() * 5); tone(PENTA[b], 1.8, vol * 0.5); tone(PENTA[b + 2], 1.8, vol * 0.4, 'sine', 0.06); tone(PENTA[b + 4], 1.8, vol * 0.35, 'sine', 0.12);
  }, [vol]);
  useAnyInput(next);
  const [a, b] = LIGHTS[i];
  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: `radial-gradient(circle at 50% 40%, ${a}, ${b})`, transition: 'background 1.2s cubic-bezier(0.32,0.72,0,1)' }} onPointerDown={(e) => next(e.clientX, e.clientY)}>
      {rings.map((r) => <span key={r.id} className="absolute rounded-full border-[6px] border-white/80 pointer-events-none" style={{ left: r.x, top: r.y, width: 160, height: 160, animation: 'burst 1.4s ease-out forwards' }} />)}
      <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full bg-white/50 blur-2xl" style={{ animation: 'glow 3s ease-in-out infinite' }} />
    </div>
  );
}

