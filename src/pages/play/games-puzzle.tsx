import { useEffect, useMemo, useRef, useState } from 'react';
import { RotateCcw, RotateCw, Shuffle } from 'lucide-react';
import { play, midi } from '../../lib/audio';
import { HUES, shuffle } from './shared';
import { Celebrate } from './games-colour';
import { Score } from './games-tilt';

type V = [number, number, number];
type M = number[][];
const I: M = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
const mul = (a: M, b: M): M => a.map((r) => [0, 1, 2].map((j) => r[0] * b[0][j] + r[1] * b[1][j] + r[2] * b[2][j]));
const mv = (a: M, v: V): V => [0, 1, 2].map((i) => a[i][0] * v[0] + a[i][1] * v[1] + a[i][2] * v[2]) as V;
/** 90° turn about an axis, matching CSS rotateX/Y/Z (y points down on screen). */
const rot = (axis: number, s: number): M => axis === 0 ? [[1, 0, 0], [0, 0, -s], [0, s, 0]] : axis === 1 ? [[0, 0, s], [0, 1, 0], [-s, 0, 0]] : [[0, -s, 0], [s, 0, 0], [0, 0, 1]];
// Face normals and the colour each face starts with: right, left, down, up, front, back.
const NORMALS: V[] = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
const COLORS = ['#E5404A', '#F58A2E', '#F7D33C', '#F7F7F2', '#3BAA5C', '#2F6FD6'];
const FACE_T = ['rotateY(90deg)', 'rotateY(-90deg)', 'rotateX(-90deg)', 'rotateX(90deg)', '', 'rotateY(180deg)'];
interface Cubie { id: number; pos: V; R: M; stickers: (string | null)[] }
const solvedCube = (): Cubie[] => {
  const out: Cubie[] = []; let id = 0;
  for (const x of [-1, 0, 1]) for (const y of [-1, 0, 1]) for (const z of [-1, 0, 1]) {
    if (!x && !y && !z) continue;
    const p: V = [x, y, z];
    out.push({ id: id++, pos: p, R: I, stickers: NORMALS.map((n, k) => (p[0] * n[0] + p[1] * n[1] + p[2] * n[2] === 1 ? COLORS[k] : null)) });
  }
  return out;
};
// Buttons: the face you see in that colour turns. axis, layer.
const MOVES: { c: string; axis: number; layer: number }[] = [
  { c: COLORS[4], axis: 2, layer: 1 }, { c: COLORS[5], axis: 2, layer: -1 }, { c: COLORS[0], axis: 0, layer: 1 },
  { c: COLORS[1], axis: 0, layer: -1 }, { c: COLORS[3], axis: 1, layer: -1 }, { c: COLORS[2], axis: 1, layer: 1 },
];
const isSolved = (cs: Cubie[]) => NORMALS.every((d) => {
  const seen = new Set<string>();
  for (const c of cs) {
    if (c.pos[0] * d[0] + c.pos[1] * d[1] + c.pos[2] * d[2] !== 1) continue;
    c.stickers.forEach((col, k) => { if (!col) return; const n = mv(c.R, NORMALS[k]); if (n[0] === d[0] && n[1] === d[1] && n[2] === d[2]) seen.add(col); });
  }
  return seen.size === 1;
});

/** A real 3×3 cube. Drag to look around; tap a colour to turn that face. Mix it up, then solve it. */
export function Rubik({ vol }: { vol: number }) {
  const [cubes, setCubes] = useState(solvedCube);
  const [view, setView] = useState({ x: -28, y: -38 });
  const [anim, setAnim] = useState<{ axis: number; layer: number; s: number; a: number } | null>(null);
  const [dir, setDir] = useState(1);
  const [moves, setMoves] = useState(0);
  const [mixed, setMixed] = useState(false);
  const [party, setParty] = useState(0);
  const queue = useRef<{ axis: number; layer: number; s: number; quick?: boolean }[]>([]);
  const busy = useRef(false);
  const drag = useRef<{ x: number; y: number } | null>(null);
  const S = Math.min(innerWidth * 0.2, 86);
  const run = () => {
    if (busy.current) return;
    const m = queue.current.shift(); if (!m) return;
    busy.current = true;
    const dur = m.quick ? 90 : 260; const t0 = performance.now();
    if (!m.quick) play(midi(64 + m.axis * 3 + m.layer), 'marimba', vol * 0.5, 0.3);
    const step = (now: number) => {
      const k = Math.min(1, (now - t0) / dur); const e = 1 - Math.pow(1 - k, 3);
      setAnim({ ...m, a: e * 90 * m.s });
      if (k < 1) { requestAnimationFrame(step); return; }
      const r = rot(m.axis, m.s);
      setCubes((cs) => cs.map((c) => (c.pos[m.axis] === m.layer ? { ...c, pos: mv(r, c.pos), R: mul(r, c.R) } : c)));
      setAnim(null); busy.current = false; run();
    };
    requestAnimationFrame(step);
  };
  const turn = (axis: number, layer: number) => { queue.current.push({ axis, layer, s: dir * (layer === 0 ? 1 : layer) }); setMoves((n) => n + 1); run(); };
  const mix = () => { for (let i = 0; i < 20; i++) { const mvv = MOVES[Math.floor(Math.random() * 6)]; queue.current.push({ axis: mvv.axis, layer: mvv.layer, s: Math.random() < 0.5 ? 1 : -1, quick: true }); } setMoves(0); setMixed(true); run(); };
  useEffect(() => {
    if (!mixed || anim || queue.current.length || !isSolved(cubes)) return;
    setMixed(false); setParty((p) => p + 1);
    [0, 4, 7, 12].forEach((d, i) => play(midi(67 + d), 'bell', vol * 0.6, 1.2, i * 0.12));
  }, [cubes, anim, mixed, vol]);
  const tf = (c: Cubie) => {
    const R = c.R;
    const m3 = `matrix3d(${R[0][0]},${R[1][0]},${R[2][0]},0,${R[0][1]},${R[1][1]},${R[2][1]},0,${R[0][2]},${R[1][2]},${R[2][2]},0,0,0,0,1)`;
    const a = anim && c.pos[anim.axis] === anim.layer ? `rotate${'XYZ'[anim.axis]}(${anim.a}deg) ` : '';
    return `${a}translate3d(${c.pos[0] * S}px,${c.pos[1] * S}px,${c.pos[2] * S}px) ${m3}`;
  };
  return (
    <div className="absolute inset-0 flex flex-col bg-gradient-to-b from-[#20283a] to-[#2d2440] text-white select-none">
      <div className="min-h-[76px]"><Score e="🔄" n={moves} /></div>
      <div className="flex-1 flex items-center justify-center touch-none" style={{ perspective: 900 }}
        onPointerDown={(e) => { drag.current = { x: e.clientX, y: e.clientY }; (e.target as HTMLElement).setPointerCapture(e.pointerId); }}
        onPointerMove={(e) => { const d = drag.current; if (!d) return; setView((v) => ({ x: Math.max(-80, Math.min(80, v.x - (e.clientY - d.y) * 0.4)), y: v.y + (e.clientX - d.x) * 0.4 })); drag.current = { x: e.clientX, y: e.clientY }; }}
        onPointerUp={() => { drag.current = null; }}>
        <div style={{ transformStyle: 'preserve-3d', transform: `rotateX(${view.x}deg) rotateY(${view.y}deg)`, width: 0, height: 0, position: 'relative' }} aria-label="cube" role="img">
          {cubes.map((c) => (
            <div key={c.id} style={{ position: 'absolute', transformStyle: 'preserve-3d', transform: tf(c) }}>
              {c.stickers.map((col, k) => (
                <div key={k} style={{ position: 'absolute', left: -S / 2, top: -S / 2, width: S, height: S, background: '#14161c', transform: `${FACE_T[k]} translateZ(${S / 2}px)`, backfaceVisibility: 'hidden', borderRadius: 6, padding: 4 }}>
                  {col && <div style={{ width: '100%', height: '100%', background: col, borderRadius: 8, boxShadow: 'inset 0 -4px 0 rgb(0 0 0 / .15)' }} />}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="p-4 pb-[max(1rem,env(safe-area-inset-bottom))] flex flex-col items-center gap-3">
        <div className="flex gap-2.5 flex-wrap justify-center">
          {MOVES.map((m, i) => (
            <button key={i} aria-label={`turn ${i + 1}`} onClick={() => turn(m.axis, m.layer)} className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lift active:scale-90 transition" style={{ background: m.c, color: m.c === COLORS[3] || m.c === COLORS[2] ? '#2a2f3a' : '#fff' }}>
              {dir > 0 ? <RotateCw size={24} /> : <RotateCcw size={24} />}
            </button>
          ))}
        </div>
        <div className="flex gap-2.5">
          <button className="btn bg-white/15 text-white !min-h-[52px] !rounded-2xl" aria-pressed={dir < 0} onClick={() => setDir(-dir)}>{dir > 0 ? <RotateCcw size={20} aria-hidden /> : <RotateCw size={20} aria-hidden />} ⇄</button>
          <button className="btn bg-white text-[#20283a] !min-h-[52px] !rounded-2xl" onClick={mix} aria-label="mix"><Shuffle size={20} aria-hidden /> 🎲</button>
          <button className="btn bg-white/15 text-white !min-h-[52px] !rounded-2xl" aria-label="reset" onClick={() => { queue.current = []; setCubes(solvedCube()); setMoves(0); setMixed(false); }}>↺</button>
        </div>
      </div>
      {party > 0 && <Celebrate key={party} />}
    </div>
  );
}

/** Slide the tiles back into order. Picture tiles for little ones, numbers for older children. */
export function Slide({ vol }: { vol: number }) {
  const [n, setN] = useState(3);
  const [pics, setPics] = useState(true);
  const solved = useMemo(() => [...Array.from({ length: n * n - 1 }, (_, i) => i + 1), 0], [n]);
  const mixUp = (size: number) => {
    let b = [...Array.from({ length: size * size - 1 }, (_, i) => i + 1), 0]; let blank = b.length - 1; let prev = -1;
    for (let k = 0; k < size * size * 25; k++) {
      const r = Math.floor(blank / size), c = blank % size;
      const opts = [[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]].filter(([y, x]) => y >= 0 && y < size && x >= 0 && x < size).map(([y, x]) => y * size + x).filter((p) => p !== prev);
      const p = opts[Math.floor(Math.random() * opts.length)]; [b[blank], b[p]] = [b[p], b[blank]]; prev = blank; blank = p;
    }
    if (b.every((v, i) => v === [...Array.from({ length: size * size - 1 }, (_, j) => j + 1), 0][i])) b = shuffle(b);
    return b;
  };
  const [board, setBoard] = useState(() => mixUp(3));
  const [moves, setMoves] = useState(0);
  const [party, setParty] = useState(0);
  const EM = ['🐘', '🦋', '🐠', '🌻', '🐢', '🍎', '⭐', '🚂', '🐰', '🌈', '🎈', '🐱', '🦁', '🍌', '🚗'];
  const start = (size: number, p = pics) => { setN(size); setPics(p); setBoard(mixUp(size)); setMoves(0); };
  const tap = (i: number) => {
    const z = board.indexOf(0); const r = Math.floor(i / n), c = i % n, zr = Math.floor(z / n), zc = z % n;
    if (Math.abs(r - zr) + Math.abs(c - zc) !== 1) return;
    const b = [...board]; [b[i], b[z]] = [b[z], b[i]]; setBoard(b); setMoves((m) => m + 1);
    play(midi(60 + (board[i] % 12)), 'kalimba', vol * 0.5, 0.3);
    if (b.every((v, k) => v === solved[k])) { setParty((p) => p + 1); [0, 4, 7, 12].forEach((d, k) => play(midi(67 + d), 'bell', vol * 0.6, 1.2, k * 0.12)); }
  };
  return (
    <div className="absolute inset-0 flex flex-col bg-gradient-to-b from-[#eaf3ff] to-[#f6eefc] text-[#2a2f3a] overflow-y-auto">
      <div className="min-h-[76px]"><Score e="👆" n={moves} /></div>
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="grid gap-2 w-full max-w-md aspect-square p-2 rounded-3xl bg-white/60 shadow-card" style={{ gridTemplateColumns: `repeat(${n}, 1fr)` }}>
          {board.map((v, i) => v === 0 ? <span key="z" /> : (
            <button key={v} onClick={() => tap(i)} aria-label={`${v}`} className="rounded-2xl flex items-center justify-center font-extrabold shadow-card active:scale-95 transition"
              style={{ background: HUES[(v - 1) % HUES.length], fontSize: pics ? `min(${26 / n}vw, ${100 / n}px)` : `min(${22 / n}vw, ${80 / n}px)`, color: '#1d2430' }}>
              {pics ? <span aria-hidden>{EM[(v - 1) % EM.length]}</span> : v}
            </button>
          ))}
        </div>
      </div>
      {pics && <p className="text-center text-sm font-bold mb-2" aria-hidden>{solved.slice(0, -1).map((v) => EM[(v - 1) % EM.length]).join(' ')}</p>}
      <div className="sticky bottom-0 flex justify-center gap-2 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="flex gap-1.5 bg-white/90 shadow-card rounded-2xl p-1" role="radiogroup" aria-label="size">
          {[3, 4].map((v) => <button key={v} role="radio" aria-checked={n === v} onClick={() => start(v)} className={`h-12 px-4 rounded-xl font-extrabold ${n === v ? 'bg-[#3B7BE0] text-white' : ''}`}>{v}×{v}</button>)}
          <button aria-pressed={!pics} onClick={() => start(n, !pics)} className="h-12 px-4 rounded-xl font-extrabold">{pics ? '123' : '🐘'}</button>
          <button aria-label="mix" onClick={() => start(n)} className="h-12 px-3 rounded-xl"><Shuffle size={20} /></button>
        </div>
      </div>
      {party > 0 && <Celebrate key={party} />}
    </div>
  );
}
