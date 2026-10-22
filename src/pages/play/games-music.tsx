import { useEffect, useMemo, useRef, useState } from 'react';
import { ListMusic, Minus, Plus } from 'lucide-react';
import { hold, midi, type HoldInst } from '../../lib/audio';
import { useUI, type Lang } from '../../lib/store';
import { HUES, useAnyInput } from './shared';
import { Celebrate } from './games-colour';
import { UI_TEXT } from './text';

const WHITE = [0, 2, 4, 5, 7, 9, 11];
const BLACK: Record<number, number> = { 0: 1, 1: 3, 3: 6, 4: 8, 5: 10 }; // white index in octave → black semitone after it
const INSTS: { v: HoldInst; e: string; n: Record<Lang, string> }[] = [
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
              <span className="text-2xl" aria-hidden>{i.e}</span>{i.n[lang]}
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

/* Public domain melodies. Note name, ' = octave up, , = octave down, /n = length in beats (default 1). */
const parse = (s: string) => s.split(/\s+/).map((tok) => {
  const [n, d] = tok.split('/');
  const base = { C: 60, D: 62, E: 64, F: 65, G: 67, A: 69, B: 71 }[n[0] as 'C'];
  return { m: base + (n.includes("'") ? 12 : 0) - (n.includes(',') ? 12 : 0), d: d ? +d : 1 };
});
interface Song { id: string; e: string; name: Record<Lang, string>; notes: { m: number; d: number }[] }
const SONGS: Song[] = [
  { id: 'twinkle', e: '⭐', name: { en: 'Twinkle Twinkle', ml: 'ട്വിങ്കിൾ ട്വിങ്കിൾ', kn: 'ಟ್ವಿಂಕಲ್ ಟ್ವಿಂಕಲ್' }, notes: parse("C C G G A A G/2 F F E E D D C/2 G G F F E E D/2 G G F F E E D/2 C C G G A A G/2 F F E E D D C/2") },
  { id: 'mary', e: '🐑', name: { en: 'Mary had a little lamb', ml: 'മേരിയുടെ കുഞ്ഞാട്', kn: 'ಮೇರಿಯ ಕುರಿಮರಿ' }, notes: parse("E D C D E E E/2 D D D/2 E G G/2 E D C D E E E E D D E D C/4") },
  { id: 'birthday', e: '🎂', name: { en: 'Happy Birthday', ml: 'ഹാപ്പി ബർത്ത്ഡേ', kn: 'ಹ್ಯಾಪಿ ಬರ್ತ್‌ಡೇ' }, notes: parse("G,/.75 G,/.25 A, G, C B,/2 G,/.75 G,/.25 A, G, D C/2 G,/.75 G,/.25 G E C B, A,/2 F/.75 F/.25 E C D C/2") },
  { id: 'jingle', e: '🔔', name: { en: 'Jingle Bells', ml: 'ജിംഗിൾ ബെൽസ്', kn: 'ಜಿಂಗಲ್ ಬೆಲ್ಸ್' }, notes: parse("E E E/2 E E E/2 E G C/1.5 D/.5 E/4 F F F/1.5 F/.5 F E E E/.5 E/.5 E D D E D/2 G/2") },
  { id: 'ode', e: '🎻', name: { en: 'Ode to Joy', ml: 'ഓഡ് ടു ജോയ്', kn: 'ಓಡ್ ಟು ಜಾಯ್' }, notes: parse("E E F G G F E D C C D E E/1.5 D/.5 D/2 E E F G G F E D C C D E D/1.5 C/.5 C/2") },
  { id: 'boat', e: '🚣', name: { en: 'Row your boat', ml: 'തോണി തുഴയാം', kn: 'ದೋಣಿ ಹುಟ್ಟು ಹಾಕು' }, notes: parse("C/1.5 C/1.5 C D/.5 E/1.5 E D/.5 E F/.5 G/3 C'/.5 C'/.5 C'/.5 G/.5 G/.5 G/.5 E/.5 E/.5 E/.5 C/.5 C/.5 C/.5 G F/.5 E D/.5 C/3") },
  { id: 'farm', e: '🐄', name: { en: 'Old MacDonald', ml: 'ഓൾഡ് മക്ഡൊണാൾഡ്', kn: 'ಓಲ್ಡ್ ಮ್ಯಾಕ್‌ಡೊನಾಲ್ಡ್' }, notes: parse("G G G D E E D/2 B B A A G/2 D G G G D E E D/2 B B A A G/2") },
];
const SPEEDS = [{ e: '🐢', bpm: 55 }, { e: '🐇', bpm: 80 }, { e: '🚀', bpm: 110 }];
const PPB = 120; // pixels per beat
const WINDOW = 0.6; // how early (in beats) a key may be hit

/** Tiles fall in time with the song. Tap the glowing key as a tile reaches the line; if you wait, the song waits for you. */
export function SongTiles({ vol }: { vol: number }) {
  const lang = useUI((s) => s.lang);
  const tx = UI_TEXT[lang];
  const [song, setSong] = useState<Song | null>(null);
  const [speed, setSpeed] = useState(0);
  const [, frame] = useState(0);
  const [bad, setBad] = useState(-1);
  const [party, setParty] = useState(0);
  const st = useRef({ t: -3, next: 0, last: 0, waiting: false, glow: new Map<number, number>() });
  const times = useMemo(() => { let acc = 0; return (song?.notes ?? []).map((n) => { const s = acc; acc += n.d; return s; }); }, [song]);
  const lanes = useMemo(() => (song ? [...new Set(song.notes.map((n) => n.m))].sort((a, b) => a - b) : []), [song]);
  const done = !!song && st.current.next >= song.notes.length;
  const bpm = SPEEDS[speed].bpm;
  const begin = (s: Song) => { st.current = { t: -3, next: 0, last: 0, waiting: false, glow: new Map() }; setSong(s); };
  useEffect(() => {
    if (!song) return;
    let raf = 0;
    const loop = (now: number) => {
      const s = st.current; const dt = s.last ? Math.min(0.1, (now - s.last) / 1000) * (bpm / 60) : 0; s.last = now;
      if (s.next < song.notes.length) {
        const due = times[s.next];
        if (s.t + dt >= due) { s.t = due; s.waiting = true; } else { s.t += dt; s.waiting = false; }
      }
      frame((f) => f + 1); raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop); return () => cancelAnimationFrame(raf);
  }, [song, times, bpm]);
  const press = (li: number) => {
    if (!song) return;
    const s = st.current; if (s.next >= song.notes.length) return;
    const n = song.notes[s.next];
    if (lanes[li] === n.m && times[s.next] - s.t <= WINDOW) {
      const stop = hold(midi(n.m), 'piano', vol); setTimeout(stop, Math.max(250, (n.d * 60_000) / bpm));
      s.glow.set(s.next, performance.now()); s.next++; s.waiting = false;
      if (s.next >= song.notes.length) { setParty((x) => x + 1); [0, 4, 7, 12].forEach((d, i) => setTimeout(() => { const o = hold(midi(72 + d), 'bell', vol * 0.6); setTimeout(o, 900); }, 600 + i * 130)); }
    } else { setBad(li); setTimeout(() => setBad(-1), 350); }
  };
  useAnyInput(() => { if (song && !done) press(lanes.indexOf(song.notes[st.current.next].m)); });
  if (!song) return (
    <div className="absolute inset-0 overflow-y-auto bg-[#1d2430] text-white p-4 pt-20">
      <h2 className="text-2xl font-extrabold mb-4">{tx.chooseSong}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {SONGS.map((s, i) => (
          <button key={s.id} onClick={() => begin(s)} className="min-h-[76px] rounded-3xl flex items-center gap-4 px-5 text-left font-extrabold text-lg text-[#1d2430] active:scale-[.98] transition duration-300" style={{ background: HUES[i % HUES.length] }}>
            <span className="text-4xl" aria-hidden>{s.e}</span>{s.name[lang]}
          </button>
        ))}
      </div>
    </div>
  );
  const s = st.current;
  const total = times.length ? times[times.length - 1] + song.notes[song.notes.length - 1].d : 1;
  const nextReady = !done && times[s.next] - s.t <= WINDOW;
  return (
    <div className="absolute inset-0 flex flex-col bg-[#161c27] text-white select-none touch-none">
      <div className="flex items-center gap-2 p-3 pr-24">
        <button className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center shrink-0" aria-label={tx.chooseSong} onClick={() => setSong(null)}><ListMusic aria-hidden /></button>
        <span className="font-extrabold truncate flex-1">{song.e} {song.name[lang]}</span>
        <div className="flex bg-white/10 rounded-2xl p-1 shrink-0" role="radiogroup" aria-label="speed">
          {SPEEDS.map((v, i) => <button key={i} role="radio" aria-checked={speed === i} aria-label={`${v.bpm}`} onClick={() => setSpeed(i)} className={`w-10 h-10 rounded-xl text-xl ${speed === i ? 'bg-white/90' : ''}`}>{v.e}</button>)}
        </div>
      </div>
      <div className="h-1.5 mx-3 rounded-full bg-white/10 overflow-hidden"><div className="h-full bg-[#7FC8C1]" style={{ width: `${Math.max(0, s.t / total) * 100}%` }} /></div>
      <div className="relative flex-1 overflow-hidden mx-3">
        {song.notes.map((n, i) => {
          const y = (times[i] - s.t) * PPB; const h = n.d * PPB - 6;
          const hitAt = s.glow.get(i); const age = hitAt ? (performance.now() - hitAt) / 400 : 0;
          if (y > 1400 || y + h < -10 || age > 1) return null;
          const li = lanes.indexOf(n.m); const c = HUES[li % HUES.length]; const isNext = i === s.next;
          return <div key={i} className="absolute rounded-2xl" style={{ left: `calc(${(li / lanes.length) * 100}% + 3px)`, width: `calc(${100 / lanes.length}% - 6px)`, height: h, bottom: y + 4, background: c,
            opacity: hitAt ? 1 - age : isNext ? 1 : 0.75, transform: hitAt ? `scale(${1 + age * 0.15})` : undefined, boxShadow: isNext && nextReady ? `0 0 30px ${c}` : undefined }} />;
        })}
        <div className="absolute left-0 right-0 bottom-0 h-1 bg-white/50 rounded" />
        {s.t < 0 && <p className="absolute inset-x-0 top-1/3 text-center text-7xl font-extrabold opacity-80" aria-hidden>{Math.ceil(-s.t)}</p>}
      </div>
      <div className="flex gap-1.5 p-3 h-32">
        {lanes.map((m, li) => {
          const next = !done && song.notes[s.next].m === m;
          const c = HUES[li % HUES.length];
          return <button key={m} aria-label={`key ${li + 1}`} onPointerDown={() => press(li)} className="flex-1 rounded-2xl transition-colors duration-150"
            style={{ background: next && nextReady ? c : next ? `${c}55` : 'rgba(255,255,255,0.10)', animation: bad === li ? 'wiggle 0.35s' : next && s.waiting ? 'beat 0.9s ease-in-out infinite' : undefined, border: `3px solid ${c}` }} />;
        })}
      </div>
      {done && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-5 bg-black/45 backdrop-blur-sm anim-fade">
          {party > 0 && <Celebrate key={party} star={false} />}
          <span className="text-[7rem] leading-none drop-shadow-xl" style={{ animation: 'zoomIn .6s var(--ease) both, beat 1.6s ease-in-out .6s infinite' }} role="img" aria-label="★">🌟</span>
          <p className="text-3xl font-extrabold text-center px-4">{song.e} {song.name[lang]}</p>
          <div className="flex gap-3">
            <button className="btn bg-white text-[#1d2430] !min-h-[60px] !rounded-2xl" onClick={() => begin(song)}>{tx.again}</button>
            <button className="btn bg-white/20 text-white !min-h-[60px] !rounded-2xl" onClick={() => setSong(null)}><ListMusic aria-hidden /> {tx.chooseSong}</button>
          </div>
        </div>
      )}
    </div>
  );
}
