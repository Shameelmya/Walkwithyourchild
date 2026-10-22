import { useCallback, useRef, useState } from 'react';
import { PENTA, drum, tone, type Drum } from '../../lib/audio';
import { HUES, nextId, useAnyInput } from './shared';

export function Music({ vol }: { vol: number }) {
  const [on, setOn] = useState<number>(-1);
  const hit = useCallback((i: number) => { setOn(i); tone(PENTA[i], 1.2, vol, 'triangle'); setTimeout(() => setOn((o) => (o === i ? -1 : o)), 300); }, [vol]);
  useAnyInput(useCallback(() => hit(Math.floor(Math.random() * 9)), [hit]));
  return (
    <div className="absolute inset-0 grid grid-cols-3 gap-3 p-3 pt-20 bg-[#1d2430]">
      {Array.from({ length: 9 }, (_, i) => (
        <button key={i} aria-label={`note ${i + 1}`} onPointerDown={() => hit(i)} className="rounded-3xl transition-transform" style={{ background: HUES[i % HUES.length], transform: on === i ? 'scale(0.94)' : undefined, boxShadow: on === i ? `0 0 60px ${HUES[i % HUES.length]}` : undefined, opacity: on === i ? 1 : 0.85 }} />
      ))}
    </div>
  );
}



const DRUMS: { k: Drum; e: string; c: string }[] = [
  { k: 'kick', e: '🥁', c: '#E5534B' }, { k: 'snare', e: '🪘', c: '#F08A3C' }, { k: 'hat', e: '✨', c: '#F4C430' },
  { k: 'tomHi', e: '🔵', c: '#4F8FEA' }, { k: 'tomLo', e: '🟣', c: '#7556D2' }, { k: 'clap', e: '👏', c: '#2BA89C' },
];
export function Drums({ vol }: { vol: number }) {
  const [on, setOn] = useState(-1);
  const hit = useCallback((i: number) => { setOn(i); drum(DRUMS[i].k, vol); setTimeout(() => setOn((o) => (o === i ? -1 : o)), 160); }, [vol]);
  useAnyInput(() => hit(Math.floor(Math.random() * DRUMS.length)));
  return (
    <div className="absolute inset-0 grid grid-cols-2 gap-3 p-3 pt-20 bg-[#1b2233]">
      {DRUMS.map((d, i) => (
        <button key={d.k} aria-label={d.k} onPointerDown={() => hit(i)} className="rounded-full m-auto aspect-square w-full max-w-[44vh] flex items-center justify-center transition-transform duration-150"
          style={{ background: `radial-gradient(circle at 35% 30%, #fff8, ${d.c} 45%, ${d.c})`, transform: on === i ? 'scale(0.9)' : undefined, boxShadow: on === i ? `0 0 70px ${d.c}` : `0 10px 30px -10px ${d.c}` }}>
          <span className="text-6xl" aria-hidden>{d.e}</span>
        </button>
      ))}
    </div>
  );
}

const BARS = ['#E5534B', '#F08A3C', '#F4C430', '#6CC48F', '#2BA89C', '#4F8FEA', '#7556D2', '#E86BA8'];
/** Xylophone: tap or slide a finger across the bars. */
export function Xylophone({ vol }: { vol: number }) {
  const [on, setOn] = useState(-1);
  const down = useRef(false);
  const last = useRef(-1);
  const hit = useCallback((i: number) => { if (i === last.current && down.current) return; last.current = i; setOn(i); tone(PENTA[i + 1] * 1.5, 1.4, vol); setTimeout(() => setOn((o) => (o === i ? -1 : o)), 220); }, [vol]);
  useAnyInput(() => { last.current = -1; hit(Math.floor(Math.random() * BARS.length)); });
  const at = (x: number) => Math.min(BARS.length - 1, Math.max(0, Math.floor((x / innerWidth) * BARS.length)));
  return (
    <div className="absolute inset-0 flex items-center justify-center gap-[2vw] px-3 bg-[#20283a] touch-none"
      onPointerDown={(e) => { down.current = true; last.current = -1; hit(at(e.clientX)); }} onPointerMove={(e) => down.current && hit(at(e.clientX))}
      onPointerUp={() => { down.current = false; }} onPointerLeave={() => { down.current = false; }}>
      {BARS.map((c, i) => (
        <span key={i} className="flex-1 rounded-2xl transition-transform duration-150" style={{ background: c, height: `${82 - i * 6}%`, transform: on === i ? 'scaleY(0.95)' : undefined, boxShadow: on === i ? `0 0 50px ${c}` : undefined }} />
      ))}
    </div>
  );
}

/** Wind chimes: move a finger across the hanging chimes. */
export function Chimes({ vol }: { vol: number }) {
  const N = 9;
  const [swing, setSwing] = useState<Record<number, number>>({});
  const last = useRef(-1);
  const ring = useCallback((i: number) => {
    const id = nextId();
    setSwing((s) => ({ ...s, [i]: id }));
    tone(PENTA[i % PENTA.length] * 2, 2.2, vol * 0.7);
    setTimeout(() => setSwing((s) => (s[i] === id ? { ...s, [i]: 0 } : s)), 900);
  }, [vol]);
  const at = (x: number) => Math.min(N - 1, Math.max(0, Math.floor((x / innerWidth) * N)));
  useAnyInput(() => ring(Math.floor(Math.random() * N)));
  return (
    <div className="absolute inset-0 touch-none" style={{ background: 'linear-gradient(#bfe1f2,#f3ead8)' }}
      onPointerDown={(e) => { last.current = at(e.clientX); ring(last.current); }}
      onPointerMove={(e) => { const i = at(e.clientX); if (e.buttons && i !== last.current) { last.current = i; ring(i); } }}>
      <div className="absolute top-16 left-[6%] right-[6%] h-3 rounded-full bg-[#8b5e3c]" />
      {Array.from({ length: N }, (_, i) => (
        <span key={i} className="absolute top-[4.6rem] origin-top transition-transform duration-700" style={{ left: `${8 + (i * 84) / (N - 1)}%`, transform: `rotate(${swing[i] ? (i % 2 ? 14 : -14) : 0}deg)` }}>
          <span className="block w-px h-6 bg-[#8b5e3c] mx-auto" />
          <span className="block w-4 rounded-full" style={{ height: `${28 + (i % 4) * 9}vh`, background: `linear-gradient(90deg, #c9ced6, #f6f7f9, #aeb4be)` }} />
        </span>
      ))}
      <span className="absolute bottom-24 left-1/2 -translate-x-1/2 text-6xl opacity-80" aria-hidden>🍃</span>
    </div>
  );
}
