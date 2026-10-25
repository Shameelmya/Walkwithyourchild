import { useEffect, useRef, useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import { hold, midi, type HoldInst } from '../../lib/audio';
import { useUI, type Lang } from '../../lib/store';
import { pick } from '../../lib/util';
import { HUES, useAnyInput } from './shared';

const WHITE = [0, 2, 4, 5, 7, 9, 11];
const BLACK: Record<number, number> = { 0: 1, 1: 3, 3: 6, 4: 8, 5: 10 }; // white index in octave → black semitone after it
const INSTS: { v: HoldInst; e: string; n: { en: string } & Partial<Record<Lang, string>> }[] = [
  { v: 'piano', e: '🎹', n: { en: 'Piano', ml: 'പിയാനോ', kn: 'ಪಿಯಾನೋ' } },
  { v: 'violin', e: '🎻', n: { en: 'Violin', ml: 'വയലിൻ', kn: 'ಪಿಟೀಲು' } },
  { v: 'guitar', e: '🎸', n: { en: 'Guitar', ml: 'ഗിറ്റാർ', kn: 'ಗಿಟಾರ್' } },
  { v: 'flute', e: '🪈', n: { en: 'Flute', ml: 'ഓടക്കുഴൽ', kn: 'ಕೊಳಲು' } },
  { v: 'harmonium', e: '🪗', n: { en: 'Harmonium', ml: 'ഹാർമോണിയം', kn: 'ಹಾರ್ಮೋನಿಯಂ' } },
  { v: 'organ', e: '⛪', n: { en: 'Organ', ml: 'ഓർഗൻ', kn: 'ಆರ್ಗನ್' } },
  { v: 'marimba', e: '🪵', n: { en: 'Marimba', ml: 'മരിംബ', kn: 'ಮರಿಂಬಾ' } },
  { v: 'bell', e: '🔔', n: { en: 'Bells', ml: 'മണികൾ', kn: 'ಗಂಟೆಗಳು' } },
];

/** Portrait phones get the game turned sideways, like a real keyboard. */
function usePortrait() {
  const [p, setP] = useState(() => innerHeight > innerWidth);
  useEffect(() => { const r = () => setP(innerHeight > innerWidth); addEventListener('resize', r); return () => removeEventListener('resize', r); }, []);
  return p;
}
/** Stop pinch and double-tap zoom while a keyboard game is open. */
function useNoZoom() {
  useEffect(() => {
    const m = document.querySelector<HTMLMetaElement>('meta[name="viewport"]'); if (!m) return;
    const before = m.content; m.content = 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover';
    const stop = (e: Event) => e.preventDefault();
    document.addEventListener('gesturestart', stop);
    return () => { m.content = before; document.removeEventListener('gesturestart', stop); };
  }, []);
}
export function Sideways({ children }: { children: React.ReactNode }) {
  const portrait = usePortrait();
  return (
    <div className="absolute top-0 left-0 overflow-hidden touch-none select-none" onContextMenu={(e) => e.preventDefault()}
      style={portrait ? { width: '100vh', height: '100vw', transform: 'rotate(90deg) translateY(-100%)', transformOrigin: 'top left', WebkitTouchCallout: 'none' } : { width: '100vw', height: '100vh', WebkitTouchCallout: 'none' }}>
      {/* The leave button sits in the phone's top-right corner: the top-left here when turned. */}
      <div className="w-full h-full flex flex-col" data-portrait={portrait || undefined}>{children}</div>
    </div>
  );
}

/** Two octaves of real keys. Hold a key and violin, flute, harmonium and organ keep sounding; slide across keys to glide. */
export function Piano({ vol }: { vol: number }) {
  useNoZoom();
  const lang = useUI((s) => s.lang);
  const portrait = usePortrait();
  const [inst, setInst] = useState<HoldInst>('piano');
  const [base, setBase] = useState(60);
  const [on, setOn] = useState<Set<number>>(new Set());
  const held = useRef(new Map<number, { m: number; stop: () => void }>());
  const instRef = useRef(inst); instRef.current = inst;
  const volRef = useRef(vol); volRef.current = vol;
  const whites = [...Array.from({ length: 2 }, (_, o) => WHITE.map((s) => base + o * 12 + s)).flat(), base + 24];
  const blacks = Array.from({ length: 2 }, (_, o) => Object.entries(BLACK).map(([wi, s]) => ({ m: base + o * 12 + s, at: o * 7 + +wi + 1 }))).flat();
  const sync = () => setOn(new Set([...held.current.values()].map((h) => h.m)));
  const keyAt = (x: number, y: number) => { const el = document.elementFromPoint(x, y)?.closest<HTMLElement>('[data-m]'); return el ? +el.dataset.m! : null; };
  const start = (id: number, m: number) => { held.current.get(id)?.stop(); held.current.set(id, { m, stop: hold(midi(m), instRef.current, volRef.current) }); sync(); };
  const end = (id: number) => { const h = held.current.get(id); if (h) { h.stop(); held.current.delete(id); sync(); } };
  useEffect(() => () => held.current.forEach((h) => h.stop()), []);
  useAnyInput(() => { const m = whites[Math.floor(Math.random() * whites.length)]; const s = hold(midi(m), inst, vol); setTimeout(s, 400); });
  const ww = 100 / whites.length;
  return (
    <Sideways>
      <div className={`flex items-center gap-2 p-2 bg-[#1d2430] ${portrait ? 'pl-24' : 'pr-24'}`}>
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar flex-1" role="radiogroup" aria-label="instrument">
          {INSTS.map((i) => (
            <button key={i.v} role="radio" aria-checked={inst === i.v} onClick={() => { setInst(i.v); const s = hold(midi(base + 12), i.v, vol * 0.7); setTimeout(s, 500); }}
              className={`shrink-0 h-12 px-3 rounded-2xl flex items-center gap-1.5 text-sm font-bold transition duration-300 ${inst === i.v ? 'bg-white text-[#1d2430] shadow-lift' : 'bg-white/10 text-white'}`}>
              <span className="text-2xl" aria-hidden>{i.e}</span>{pick(i.n, lang)}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1 shrink-0 text-white">
          <button className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center disabled:opacity-30" aria-label="lower" disabled={base <= 36} onClick={() => setBase(base - 12)}><Minus size={18} /></button>
          <span className="w-8 text-center text-sm font-bold tabular-nums" aria-hidden>C{base / 12 - 1}</span>
          <button className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center disabled:opacity-30" aria-label="higher" disabled={base >= 72} onClick={() => setBase(base + 12)}><Plus size={18} /></button>
        </div>
      </div>
      <div className="relative flex-1 bg-[#1d2430] p-2 pt-0"
        onPointerDown={(e) => { (e.target as HTMLElement).releasePointerCapture?.(e.pointerId); const m = keyAt(e.clientX, e.clientY); if (m !== null) start(e.pointerId, m); }}
        onPointerMove={(e) => { if (!held.current.has(e.pointerId)) return; const m = keyAt(e.clientX, e.clientY); if (m !== null && m !== held.current.get(e.pointerId)!.m) start(e.pointerId, m); }}
        onPointerUp={(e) => end(e.pointerId)} onPointerCancel={(e) => end(e.pointerId)} onPointerLeave={(e) => end(e.pointerId)}>
        <div className="relative w-full h-full">
          <div className="absolute inset-0 flex gap-[3px]">
            {whites.map((m, i) => (
              <div key={m} data-m={m} role="button" aria-label={`key ${m}`} className="flex-1 rounded-b-xl rounded-t-sm transition-[transform,background] duration-75"
                style={{ background: on.has(m) ? '#fff3cf' : 'linear-gradient(#ffffff 75%, #eef0f4)', transform: on.has(m) ? 'translateY(3px)' : undefined, boxShadow: `inset 0 -8px 0 ${HUES[i % HUES.length]}` }} />
            ))}
          </div>
          {blacks.map(({ m, at }) => (
            <div key={m} data-m={m} role="button" aria-label={`key ${m}`} className="absolute top-0 rounded-b-lg transition-colors duration-75"
              style={{ left: `calc(${at * ww}% - ${ww * 0.31}%)`, width: `${ww * 0.62}%`, height: '60%', background: on.has(m) ? '#5a6478' : 'linear-gradient(#3a4252, #1b2029)', boxShadow: '0 6px 10px -4px rgb(0 0 0 / .6)' }} />
          ))}
        </div>
      </div>
    </Sideways>
  );
}

