import { useEffect, useRef, useState } from 'react';
import { PENTA, tone, hiss, play } from '../../lib/audio';
import { HUES, nextId, rand, clamp, useAnyInput, useCanvas, useTilt } from './shared';
import { Celebrate } from './games-colour';

const HATCH = ['🐣', '🐥', '🐢', '🦕', '🦆', '🐊'];
interface Egg { id: number; x: number; d: number; s: number }
/** Eggs drift down slowly. Tap one: it cracks and a little animal hops out. */
export function Eggs({ vol }: { vol: number }) {
  const [eggs, setEggs] = useState<Egg[]>([]);
  const [born, setBorn] = useState<{ id: number; x: number; y: number; e: string }[]>([]);
  const [count, setCount] = useState(0);
  useEffect(() => {
    const add = () => setEggs((l) => [...l.slice(-7), { id: nextId(), x: rand(6, 78), d: rand(7, 11), s: rand(78, 104) }]);
    add(); const h = setInterval(add, 1500); return () => clearInterval(h);
  }, []);
  const crack = (g: Egg, el: HTMLElement) => {
    const r = el.getBoundingClientRect();
    setEggs((l) => l.filter((z) => z.id !== g.id));
    hiss(vol * 0.6, 0.06, 4200, 'highpass'); hiss(vol * 0.5, 0.05, 2600, 'bandpass', 0.05);
    tone(PENTA[4 + (count % 5)], 0.6, vol * 0.7, 'sine', 0.08); tone(PENTA[6 + (count % 4)], 0.7, vol * 0.5, 'sine', 0.2);
    const b = { id: nextId(), x: r.left + r.width / 2, y: r.top + r.height / 2, e: HATCH[count % HATCH.length] };
    setCount((c) => c + 1);
    setBorn((a) => [...a.slice(-6), b]); setTimeout(() => setBorn((a) => a.filter((z) => z !== b)), 1600);
  };
  useAnyInput(() => { const g = eggs[0]; const el = g && document.querySelector<HTMLElement>(`[data-egg="${g.id}"]`); if (g && el) crack(g, el); });
  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: 'linear-gradient(#bfe6ff,#fff4d6 70%,#cdeaa8)' }}>
      <Score e="🐣" n={count} />
      {eggs.map((g) => (
        <button key={g.id} data-egg={g.id} aria-label="egg" className="absolute top-0 leading-none"
          style={{ left: `${g.x}%`, fontSize: g.s, animation: `fall ${g.d}s linear forwards` }}
          onAnimationEnd={() => setEggs((l) => l.filter((z) => z.id !== g.id))}
          onPointerDown={(e) => crack(g, e.currentTarget)}>🥚</button>
      ))}
      {born.map((b) => <span key={b.id} className="absolute pointer-events-none text-[96px] leading-none" style={{ left: b.x, top: b.y, animation: 'hop 1.6s ease-out forwards' }} aria-hidden>{b.e}</span>)}
    </div>
  );
}
export function Score({ e, n }: { e: string; n: number }) {
  return <p className="absolute top-4 start-4 z-10 px-4 h-12 rounded-full bg-white/80 shadow-card flex items-center gap-2 text-xl font-extrabold text-[#2a2f3a] tabular-nums" aria-live="polite"><span aria-hidden>{e}</span>{n}</p>;
}

const FRUIT = ['🍎', '🍌', '🍇', '🍓', '🍊', '🥭', '🍉', '🍍', '🍒'];
/** Tilt the phone (or drag) to slide the basket under the falling fruit. */
export function Catch({ vol }: { vol: number }) {
  const tilt = useTilt();
  const volRef = useRef(vol); volRef.current = vol;
  const [score, setScore] = useState(0);
  const s = useRef({ bx: innerWidth / 2, drag: -1, last: 0, n: 0, items: [] as { x: number; y: number; v: number; e: string; r: number }[], fx: [] as { x: number; y: number; life: number; c: string }[] });
  const ref = useCanvas((ctx, w, h, t) => {
    const st = s.current;
    if (st.drag >= 0) st.bx += (st.drag - st.bx) * 0.35; else st.bx += tilt.current.ax * 16;
    st.bx = clamp(st.bx, 55, w - 55);
    // Fruit comes a little faster as more is caught, but never hurries.
    if (t - st.last > Math.max(900, 1600 - st.n * 25)) { st.last = t; st.items.push({ x: rand(40, w - 40), y: -40, v: rand(1.5, 2.3) + Math.min(1.5, st.n * 0.04), e: FRUIT[Math.floor(rand(0, FRUIT.length))], r: rand(-1, 1) }); }
    const g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#ffe9c7'); g.addColorStop(1, '#d9f2d0'); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const by = h - 90;
    st.items = st.items.filter((it) => {
      it.y += it.v; it.r += 0.01;
      if (it.y > by - 40 && it.y < by + 10 && Math.abs(it.x - st.bx) < 72) {
        st.n++; setScore(st.n);
        play(PENTA[st.n % 10], 'marimba', volRef.current * 0.8, 0.6);
        for (let i = 0; i < 10; i++) st.fx.push({ x: st.bx + rand(-40, 40), y: by - 20 + rand(-20, 10), life: 1, c: HUES[i % HUES.length] });
        return false;
      }
      if (it.y > h + 40) return false;
      ctx.save(); ctx.translate(it.x, it.y); ctx.rotate(it.r); ctx.font = '60px serif'; ctx.fillText(it.e, 0, 0); ctx.restore();
      return true;
    });
    st.fx = st.fx.filter((p) => { p.life -= 0.03; p.y -= 2; ctx.globalAlpha = Math.max(0, p.life); ctx.fillStyle = p.c; ctx.beginPath(); ctx.arc(p.x, p.y, 6, 0, 7); ctx.fill(); return p.life > 0; });
    ctx.globalAlpha = 1; ctx.font = '104px serif'; ctx.fillText('🧺', st.bx, by);
  });
  useAnyInput(() => { s.current.bx = rand(60, innerWidth - 60); });
  const pt = (e: React.PointerEvent) => { if (e.buttons || e.type === 'pointerdown') s.current.drag = e.clientX; };
  return (
    <>
      <canvas ref={ref} className="absolute inset-0 w-full h-full touch-none" onPointerDown={pt} onPointerMove={pt} onPointerUp={() => { s.current.drag = -1; }} onPointerCancel={() => { s.current.drag = -1; }} />
      <Score e="🧺" n={score} />
    </>
  );
}

/** Tilt the phone (or drag) to roll the ball onto the star. Each hit moves the star somewhere new. */
export function Target({ vol }: { vol: number }) {
  const tilt = useTilt();
  const volRef = useRef(vol); volRef.current = vol;
  const [score, setScore] = useState(0);
  const [party, setParty] = useState(0);
  const R = 34;
  const s = useRef({ x: innerWidth / 2, y: innerHeight * 0.7, vx: 0, vy: 0, tx: -1, ty: -1, gx: innerWidth / 2, gy: innerHeight * 0.3, n: 0, hold: 0 });
  const ref = useCanvas((ctx, w, h, t) => {
    const b = s.current;
    if (b.tx >= 0) { b.vx += (b.tx - b.x) * 0.01; b.vy += (b.ty - b.y) * 0.01; }
    b.vx += tilt.current.ax * 0.7; b.vy += tilt.current.ay * 0.7; b.vx *= 0.95; b.vy *= 0.95; b.x += b.vx; b.y += b.vy;
    if (b.x < R) { b.x = R; b.vx *= -0.6; } if (b.x > w - R) { b.x = w - R; b.vx *= -0.6; }
    if (b.y < R + 70) { b.y = R + 70; b.vy *= -0.6; } if (b.y > h - R) { b.y = h - R; b.vy *= -0.6; }
    const g = ctx.createLinearGradient(0, 0, w, h); g.addColorStop(0, '#1f2a4a'); g.addColorStop(1, '#3a2f5c'); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    const pulse = 1 + Math.sin(t / 300) * 0.08;
    const near = Math.hypot(b.x - b.gx, b.y - b.gy) < 46;
    ctx.strokeStyle = near ? '#ffe28a' : 'rgba(255,255,255,0.5)'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(b.gx, b.gy, 58 * pulse, 0, 7); ctx.stroke();
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = '64px serif'; ctx.fillText('⭐', b.gx, b.gy);
    const rg = ctx.createRadialGradient(b.x - 10, b.y - 10, 4, b.x, b.y, R); rg.addColorStop(0, '#ffffff'); rg.addColorStop(0.4, '#ff9ab8'); rg.addColorStop(1, '#e0507e');
    ctx.fillStyle = rg; ctx.beginPath(); ctx.arc(b.x, b.y, R, 0, 7); ctx.fill();
    // Rest on the star for a moment to score, so a fast roll-through doesn't count.
    b.hold = near ? b.hold + 1 : 0;
    if (b.hold === 12) {
      b.n++; setScore(b.n);
      const v = volRef.current; tone(PENTA[5], 0.9, v); tone(PENTA[7], 1, v, 'sine', 0.12); tone(PENTA[9], 1.3, v, 'sine', 0.24);
      if (b.n % 5 === 0) setParty((p) => p + 1);
      b.gx = rand(70, w - 70); b.gy = rand(150, h - 80);
    }
  });
  useAnyInput(() => { s.current.vx += rand(-12, 12); s.current.vy += rand(-12, 12); });
  return (
    <>
      <canvas ref={ref} className="absolute inset-0 w-full h-full touch-none"
        onPointerDown={(e) => { s.current.tx = e.clientX; s.current.ty = e.clientY; }} onPointerMove={(e) => { if (e.buttons) { s.current.tx = e.clientX; s.current.ty = e.clientY; } }}
        onPointerUp={() => { s.current.tx = -1; }} onPointerCancel={() => { s.current.tx = -1; }} />
      <Score e="⭐" n={score} />
      {party > 0 && <Celebrate key={party} />}
    </>
  );
}
