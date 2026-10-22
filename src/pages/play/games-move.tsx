import { useCallback, useEffect, useRef, useState } from 'react';
import { PENTA, tone, pop, shaker, hiss } from '../../lib/audio';
import { HUES, nextId, rand, useAnyInput, useCanvas } from './shared';

const PEEK = ['🐘', '🐱', '🐶', '🦜', '🐢', '🐰', '🐟', '⭐', '🌙', '🌼'];
export function Peek({ vol }: { vol: number }) {
  const [i, setI] = useState(0);
  const [shown, setShown] = useState(false);
  const tap = useCallback(() => {
    if (shown) { setShown(false); setI((x) => (x + 1) % PEEK.length); tone(PENTA[2], 0.5, vol * 0.7); }
    else { setShown(true); tone(PENTA[5], 0.4, vol); tone(PENTA[7], 0.6, vol, 'sine', 0.15); }
  }, [shown, vol]);
  useAnyInput(tap);
  return (
    <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'linear-gradient(#cfe8f5,#f6efe2)' }} onPointerDown={tap}>
      <span className="transition-all duration-500" style={{ fontSize: 'min(55vw, 55vh)', transform: shown ? 'scale(1)' : 'scale(0.3)', opacity: shown ? 1 : 0 }} aria-hidden>{PEEK[i]}</span>
      <span className="absolute transition-all duration-500" style={{ fontSize: 'min(60vw, 60vh)', opacity: shown ? 0 : 1, transform: shown ? 'translateY(-40vh)' : 'none' }} aria-hidden>☁️</span>
    </div>
  );
}


const FISH = ['🐠', '🐟', '🐡', '🐠', '🐟'];
export function Sea({ vol }: { vol: number }) {
  const [rip, setRip] = useState<{ id: number; x: number; y: number }[]>([]);
  const add = useCallback((x: number, y: number) => { const r = { id: nextId(), x, y }; setRip((a) => [...a.slice(-10), r]); tone(PENTA[3 + Math.floor(Math.random() * 5)], 1.5, vol * 0.6); setTimeout(() => setRip((a) => a.filter((z) => z !== r)), 1500); }, [vol]);
  useAnyInput(add);
  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: 'linear-gradient(#0f3b57,#13597a 60%,#1b6f86)' }} onPointerDown={(e) => add(e.clientX, e.clientY)}>
      {Array.from({ length: 14 }, (_, i) => <span key={'l' + i} className="absolute rounded-full" style={{ left: `${(i * 37) % 100}%`, top: `${(i * 53) % 100}%`, width: 10 + (i % 4) * 6, height: 10 + (i % 4) * 6, background: '#fff6c8', filter: 'blur(2px)', animation: `glow ${4 + (i % 5)}s ease-in-out ${i * 0.4}s infinite` }} />)}
      {FISH.map((f, i) => <span key={i} className="absolute" style={{ top: `${15 + i * 16}%`, fontSize: 56 + (i % 3) * 18, animation: `swim ${18 + i * 5}s linear ${-i * 4}s infinite`, transform: 'scaleX(-1)' }} aria-hidden>{f}</span>)}
      {rip.map((r) => <span key={r.id} className="absolute rounded-full border-4 border-white/70 pointer-events-none" style={{ left: r.x, top: r.y, width: 120, height: 120, animation: 'burst 1.5s ease-out forwards' }} />)}
    </div>
  );
}


interface Balloon { id: number; x: number; c: string; d: number; s: number }
/** Balloons float up slowly. Tap one and it pops into confetti. */
export function Balloons({ vol }: { vol: number }) {
  const [list, setList] = useState<Balloon[]>([]);
  const [bursts, setBursts] = useState<{ id: number; x: number; y: number; c: string }[]>([]);
  useEffect(() => {
    const add = () => setList((l) => [...l.slice(-10), { id: nextId(), x: rand(5, 80), c: HUES[nextId() % HUES.length], d: rand(9, 14), s: rand(90, 130) }]);
    add(); const h = setInterval(add, 1400); return () => clearInterval(h);
  }, []);
  const burst = (b: Balloon, x: number, y: number) => {
    setList((l) => l.filter((z) => z.id !== b.id)); pop(vol); tone(PENTA[Math.floor(rand(3, 9))], 0.8, vol * 0.5, 'sine', 0.05);
    const o = { id: nextId(), x, y, c: b.c }; setBursts((a) => [...a.slice(-5), o]); setTimeout(() => setBursts((a) => a.filter((z) => z !== o)), 900);
  };
  useAnyInput(() => { const b = list[0]; if (b) burst(b, innerWidth * (b.x / 100) + 50, innerHeight / 2); });
  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: 'linear-gradient(#a9d8ff,#e9f6ff)' }}>
      {list.map((b) => (
        <button key={b.id} aria-label="balloon" onPointerDown={(e) => burst(b, e.clientX, e.clientY)} className="absolute bottom-0 flex flex-col items-center"
          style={{ left: `${b.x}%`, animation: `floaty ${b.d}s linear forwards`, width: b.s }}>
          <span className="block w-full rounded-[50%_50%_48%_48%] shadow-lg" style={{ height: b.s * 1.2, background: `radial-gradient(circle at 32% 28%, #ffffffaa, ${b.c} 40%)` }} />
          <span className="block w-0.5 h-16 bg-black/25" />
        </button>
      ))}
      {bursts.map((o) => Array.from({ length: 10 }, (_, i) => (
        <span key={`${o.id}-${i}`} className="absolute w-3 h-3 rounded-sm pointer-events-none" style={{ left: o.x, top: o.y, background: HUES[(i + o.id) % HUES.length], animation: 'burst 0.9s ease-out forwards', transform: `rotate(${i * 36}deg) translate(${30 + i * 4}px)` }} />
      )))}
    </div>
  );
}

const SCENES = ['🐘', '🦋', '🐠', '🌈', '🐢', '🌻', '🐰', '🚂'];
/** Rub away the clouds to find the picture underneath. */
export function Rub({ vol }: { vol: number }) {
  const ref = useCanvas();
  const [scene, setScene] = useState(0);
  const [done, setDone] = useState(false);
  const rubs = useRef(0);
  const cover = useCallback(() => {
    const c = ref.current; if (!c) return;
    const ctx = c.getContext('2d')!;
    ctx.globalCompositeOperation = 'source-over';
    const g = ctx.createLinearGradient(0, 0, innerWidth, innerHeight); g.addColorStop(0, '#dfe7f5'); g.addColorStop(1, '#c9d4ea');
    ctx.fillStyle = g; ctx.fillRect(0, 0, innerWidth, innerHeight);
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    for (let i = 0; i < 18; i++) { ctx.beginPath(); ctx.arc(rand(0, innerWidth), rand(0, innerHeight), rand(40, 110), 0, 7); ctx.fill(); }
    rubs.current = 0; setDone(false);
  }, [ref]);
  useEffect(() => { const h = setTimeout(cover, 30); return () => clearTimeout(h); }, [cover, scene]);
  const rub = (x: number, y: number) => {
    const ctx = ref.current!.getContext('2d')!;
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath(); ctx.arc(x, y, 55, 0, 7); ctx.fill();
    rubs.current++;
    if (rubs.current % 6 === 0) hiss(vol * 0.25, 0.18, 900, 'lowpass');
    if (rubs.current === 140 && !done) { setDone(true); tone(PENTA[5], 1, vol); tone(PENTA[7], 1.2, vol, 'sine', 0.15); tone(PENTA[9], 1.4, vol, 'sine', 0.3); setTimeout(() => setScene((s) => (s + 1) % SCENES.length), 3500); }
  };
  useAnyInput((x, y) => { for (let i = 0; i < 8; i++) rub(x + rand(-60, 60), y + rand(-60, 60)); });
  return (
    <div className="absolute inset-0" style={{ background: 'linear-gradient(160deg,#fff1c9,#ffd6e0 50%,#cfe8ff)' }}>
      <span className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transition-transform duration-700 ${done ? 'scale-110' : ''}`} style={{ fontSize: 'min(60vw, 52vh)' }} aria-hidden>{SCENES[scene]}</span>
      <canvas ref={ref} className="absolute inset-0 w-full h-full touch-none" onPointerDown={(e) => { (e.target as HTMLElement).setPointerCapture(e.pointerId); rub(e.clientX, e.clientY); }} onPointerMove={(e) => e.buttons && rub(e.clientX, e.clientY)} />
    </div>
  );
}

/** Tilt the phone and a ball rolls around, ringing softly on the walls. Without a motion sensor, the ball follows a finger. */
export function Tilt({ vol }: { vol: number }) {
  const s = useRef({ x: innerWidth / 2, y: innerHeight / 2, vx: 0, vy: 0, ax: 0, ay: 0, tx: -1, ty: -1, trail: [] as { x: number; y: number }[] });
  const volRef = useRef(vol); volRef.current = vol;
  useEffect(() => {
    const o = (e: DeviceOrientationEvent) => { s.current.ax = (e.gamma ?? 0) / 90; s.current.ay = (e.beta ?? 0) / 90; };
    const req = (DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> }).requestPermission;
    if (req) req().catch(() => {});
    addEventListener('deviceorientation', o); return () => removeEventListener('deviceorientation', o);
  }, []);
  const R = 46;
  const ref = useCanvas((ctx, w, h) => {
    const b = s.current;
    if (b.tx >= 0) { b.vx += (b.tx - b.x) * 0.012; b.vy += (b.ty - b.y) * 0.012; }
    b.vx += b.ax * 0.9; b.vy += b.ay * 0.9; b.vx *= 0.96; b.vy *= 0.96; b.x += b.vx; b.y += b.vy;
    const bounce = (v: number) => { if (Math.abs(v) > 2) tone(PENTA[Math.min(9, Math.floor(Math.abs(v)))], 0.5, volRef.current * 0.6); };
    if (b.x < R) { b.x = R; bounce(b.vx); b.vx *= -0.7; } if (b.x > w - R) { b.x = w - R; bounce(b.vx); b.vx *= -0.7; }
    if (b.y < R) { b.y = R; bounce(b.vy); b.vy *= -0.7; } if (b.y > h - R) { b.y = h - R; bounce(b.vy); b.vy *= -0.7; }
    b.trail.push({ x: b.x, y: b.y }); if (b.trail.length > 26) b.trail.shift();
    const g = ctx.createLinearGradient(0, 0, w, h); g.addColorStop(0, '#e9f2ff'); g.addColorStop(1, '#f3e8ff'); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    b.trail.forEach((p, i) => { ctx.globalAlpha = i / b.trail.length * 0.35; ctx.fillStyle = HUES[i % HUES.length]; ctx.beginPath(); ctx.arc(p.x, p.y, R * (i / b.trail.length), 0, 7); ctx.fill(); });
    ctx.globalAlpha = 1;
    const rg = ctx.createRadialGradient(b.x - 14, b.y - 14, 6, b.x, b.y, R); rg.addColorStop(0, '#ffffff'); rg.addColorStop(0.35, '#7FA8F0'); rg.addColorStop(1, '#3570D4');
    ctx.fillStyle = rg; ctx.beginPath(); ctx.arc(b.x, b.y, R, 0, 7); ctx.fill();
  });
  useAnyInput(() => { s.current.vx += rand(-14, 14); s.current.vy += rand(-14, 14); });
  return <canvas ref={ref} className="absolute inset-0 w-full h-full touch-none"
    onPointerDown={(e) => { s.current.tx = e.clientX; s.current.ty = e.clientY; }} onPointerMove={(e) => { if (e.buttons) { s.current.tx = e.clientX; s.current.ty = e.clientY; } }}
    onPointerUp={() => { s.current.tx = -1; }} />;
}

/** A star drifts slowly; touching it (or anywhere) leaves a trail of sparkles. */
export function StarFollow({ vol }: { vol: number }) {
  const sp = useRef<{ x: number; y: number; life: number; c: string }[]>([]);
  const star = useRef({ x: 0, y: 0 });
  const lastNote = useRef(0);
  const volRef = useRef(vol); volRef.current = vol;
  const ref = useCanvas((ctx, w, h, t) => {
    const k = t / 1000;
    star.current = { x: w / 2 + Math.sin(k * 0.35) * w * 0.32, y: h / 2 + Math.sin(k * 0.5 + 1) * h * 0.28 };
    ctx.fillStyle = 'rgba(16,20,44,0.25)'; ctx.fillRect(0, 0, w, h);
    for (const p of sp.current) { p.life -= 0.02; p.y -= 0.4; ctx.globalAlpha = Math.max(0, p.life); ctx.fillStyle = p.c; ctx.beginPath(); ctx.arc(p.x, p.y, 5 * p.life + 1, 0, 7); ctx.fill(); }
    ctx.globalAlpha = 1; sp.current = sp.current.filter((p) => p.life > 0);
    const { x, y } = star.current;
    ctx.save(); ctx.translate(x, y); ctx.rotate(k * 0.4); ctx.fillStyle = '#ffd95e'; ctx.shadowColor = '#ffd95e'; ctx.shadowBlur = 40; ctx.beginPath();
    for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, r = i % 2 ? 22 : 52; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
    ctx.closePath(); ctx.fill(); ctx.restore();
  });
  const touch = (x: number, y: number) => {
    for (let i = 0; i < 4; i++) sp.current.push({ x: x + rand(-14, 14), y: y + rand(-14, 14), life: 1, c: HUES[nextId() % HUES.length] });
    const near = Math.hypot(x - star.current.x, y - star.current.y) < 90;
    const now = performance.now();
    if (now - lastNote.current > (near ? 120 : 260)) { lastNote.current = now; tone(PENTA[Math.floor((1 - y / innerHeight) * 9)] * (near ? 2 : 1), near ? 1.2 : 0.6, volRef.current * (near ? 0.7 : 0.35)); }
  };
  useAnyInput(() => touch(star.current.x, star.current.y));
  return <canvas ref={ref} className="absolute inset-0 w-full h-full touch-none bg-[#10142c]" onPointerDown={(e) => touch(e.clientX, e.clientY)} onPointerMove={(e) => e.buttons && touch(e.clientX, e.clientY)} />;
}

/** Shake the phone (or tap) to play the maracas. */
export function Maracas({ vol }: { vol: number }) {
  const [shake, setShake] = useState(0);
  const last = useRef(0);
  const volRef = useRef(vol); volRef.current = vol;
  const play = useCallback(() => {
    const now = performance.now(); if (now - last.current < 110) return; last.current = now;
    shaker(volRef.current); setShake((s) => s + 1);
  }, []);
  useEffect(() => {
    const m = (e: DeviceMotionEvent) => { const a = e.acceleration ?? e.accelerationIncludingGravity; if (!a) return; const mag = Math.hypot(a.x ?? 0, a.y ?? 0, a.z ?? 0); if (mag > (e.acceleration ? 12 : 22)) play(); };
    addEventListener('devicemotion', m); return () => removeEventListener('devicemotion', m);
  }, [play]);
  useAnyInput(play);
  return (
    <div className="absolute inset-0 flex items-center justify-center gap-[8vw]" style={{ background: 'linear-gradient(160deg,#ffe7b3,#ffc7a8)' }} onPointerDown={play}>
      {['#E5534B', '#4F8FEA'].map((c, i) => (
        <span key={i} className="flex flex-col items-center" style={{ transform: `rotate(${(shake % 2 ? 1 : -1) * (i ? -16 : 16)}deg)`, transition: 'transform 0.12s cubic-bezier(0.32,0.72,0,1)' }} aria-hidden>
          <span className="block rounded-full" style={{ width: '28vw', maxWidth: 170, aspectRatio: '1 / 1.15', background: `radial-gradient(circle at 35% 30%, #fff9, ${c} 45%)`, boxShadow: '0 20px 40px -18px rgb(0 0 0 / .4)' }} />
          <span className="block w-6 h-[18vh] rounded-b-full bg-[#8b5e3c] -mt-2" />
        </span>
      ))}
    </div>
  );
}
