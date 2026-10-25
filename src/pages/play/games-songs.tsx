import { useEffect, useMemo, useRef, useState } from 'react';
import { ListMusic, Plus, Minus, Circle, Square, Trash2, Play as PlayIcon } from 'lucide-react';
import { hold, midi, tone } from '../../lib/audio';
import { useUI, type Lang } from '../../lib/store';
import { getSetting, setSetting } from '../../lib/db';
import { HUES, useAnyInput } from './shared';
import { Celebrate } from './games-colour';
import { songText } from './text';

/* Note name, ' = octave up, , = octave down, /n = length in beats (default 1). */
const parse = (s: string) => s.trim().split(/\s+/).map((tok) => {
  const [n, d] = tok.split('/');
  const base = { C: 60, D: 62, E: 64, F: 65, G: 67, A: 69, B: 71 }[n[0] as 'C'];
  return { m: base + (n.includes('#') ? 1 : 0) + (n.includes("'") ? 12 : 0) - (n.includes(',') ? 12 : 0), d: d ? +d : 1 };
});
type Note = { m: number; d: number };
export interface Song { id: string; e: string; name: ({ en: string } & Partial<Record<Lang, string>>) | string; notes: Note[]; bar: number; mine?: boolean }
/** Public domain melodies only. */
const SONGS: Song[] = [
  { id: 'twinkle', e: '⭐', bar: 4, name: { en: 'Twinkle Twinkle', ml: 'ട്വിങ്കിൾ ട്വിങ്കിൾ', kn: 'ಟ್ವಿಂಕಲ್ ಟ್ವಿಂಕಲ್' }, notes: parse("C C G G A A G/2 F F E E D D C/2 G G F F E E D/2 G G F F E E D/2 C C G G A A G/2 F F E E D D C/2") },
  { id: 'sarali', e: '🎼', bar: 4, name: { en: 'Sa Re Ga Ma (first lesson)', ml: 'സ രി ഗ മ (ആദ്യ പാഠം)', kn: 'ಸ ರಿ ಗ ಮ (ಮೊದಲ ಪಾಠ)' }, notes: parse("C D E F G A B C'/2 C' B A G F E D C/2 C D E F G/2 G/2 G F E D C/4") },
  { id: 'mary', e: '🐑', bar: 4, name: { en: 'Mary had a little lamb', ml: 'മേരിയുടെ കുഞ്ഞാട്', kn: 'ಮೇರಿಯ ಕುರಿಮರಿ' }, notes: parse("E D C D E E E/2 D D D/2 E G G/2 E D C D E E E E D D E D C/4") },
  { id: 'birthday', e: '🎂', bar: 3, name: { en: 'Happy Birthday', ml: 'ഹാപ്പി ബർത്ത്ഡേ', kn: 'ಹ್ಯಾಪಿ ಬರ್ತ್‌ಡೇ' }, notes: parse("G,/.75 G,/.25 A, G, C B,/2 G,/.75 G,/.25 A, G, D C/2 G,/.75 G,/.25 G E C B, A,/2 F/.75 F/.25 E C D C/2") },
  { id: 'jingle', e: '🔔', bar: 4, name: { en: 'Jingle Bells', ml: 'ജിംഗിൾ ബെൽസ്', kn: 'ಜಿಂಗಲ್ ಬೆಲ್ಸ್' }, notes: parse("E E E/2 E E E/2 E G C/1.5 D/.5 E/4 F F F/1.5 F/.5 F E E E/.5 E/.5 E D D E D/2 G/2") },
  { id: 'ode', e: '🎻', bar: 4, name: { en: 'Ode to Joy', ml: 'ഓഡ് ടു ജോയ്', kn: 'ಓಡ್ ಟು ಜಾಯ್' }, notes: parse("E E F G G F E D C C D E E/1.5 D/.5 D/2 E E F G G F E D C C D E D/1.5 C/.5 C/2") },
  { id: 'boat', e: '🚣', bar: 3, name: { en: 'Row your boat', ml: 'തോണി തുഴയാം', kn: 'ದೋಣಿ ಹುಟ್ಟು ಹಾಕು' }, notes: parse("C/1.5 C/1.5 C D/.5 E/1.5 E D/.5 E F/.5 G/3 C'/.5 C'/.5 C'/.5 G/.5 G/.5 G/.5 E/.5 E/.5 E/.5 C/.5 C/.5 C/.5 G F/.5 E D/.5 C/3") },
  { id: 'farm', e: '🐄', bar: 4, name: { en: 'Old MacDonald', ml: 'ഓൾഡ് മക്ഡൊണാൾഡ്', kn: 'ಓಲ್ಡ್ ಮ್ಯಾಕ್‌ಡೊನಾಲ್ಡ್' }, notes: parse("G G G D E E D/2 B B A A G/2 D G G G D E E D/2 B B A A G/2") },
  { id: 'london', e: '🌉', bar: 4, name: { en: 'London Bridge', ml: 'ലണ്ടൻ ബ്രിഡ്ജ്', kn: 'ಲಂಡನ್ ಬ್ರಿಡ್ಜ್' }, notes: parse("G/1.5 A/.5 G F E F G/2 D E F/2 E F G/2 G/1.5 A/.5 G F E F G/2 D/2 G/2 E C/3") },
  { id: 'frere', e: '🔔', bar: 4, name: { en: 'Are you sleeping', ml: 'ഉറങ്ങുകയാണോ', kn: 'ನಿದ್ದೆ ಮಾಡುತ್ತಿದ್ದೀಯಾ' }, notes: parse("C D E C C D E C E F G/2 E F G/2 G/.5 A/.5 G/.5 F/.5 E C G/.5 A/.5 G/.5 F/.5 E C C G, C/2 C G, C/2") },
];
const SARGAM = ['Sa', 're', 'Re', 'ga', 'Ga', 'Ma', 'Má', 'Pa', 'dha', 'Dha', 'ni', 'Ni'];
const LETTER = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const SPEEDS = [{ e: '🐢', bpm: 50 }, { e: '🐇', bpm: 72 }, { e: '🚀', bpm: 100 }];
const PPB = 110; // pixels per beat
const EARLY = 0.5; // a key may be hit up to half a beat before its tile reaches the line
const nameOf = (s: Song, l: Lang) => (typeof s.name === 'string' ? s.name : (s.name[l] ?? s.name.en));
const click = (accent: boolean, vol: number) => { tone(accent ? 1760 : 1175, 0.045, vol * (accent ? 0.55 : 0.35), 'triangle'); };

/** Tiles fall in time with the song while a soft metronome keeps the beat. Tap the glowing key as a tile meets the line;
 *  if the child is not ready, the song and the metronome wait. */
export function SongTiles({ vol }: { vol: number }) {
  const lang = useUI((s) => s.lang);
  const tx = songText(lang);
  const [mine, setMine] = useState<Song[]>([]);
  const [song, setSong] = useState<Song | null>(null);
  const [making, setMaking] = useState(false);
  const [speed, setSpeed] = useState(0);
  const [metro, setMetro] = useState(true);
  const [next, setNext] = useState(0);
  const [bad, setBad] = useState(-1);
  const [say, setSay] = useState<{ k: number; t: string } | null>(null);
  const [party, setParty] = useState(0);
  const [stars, setStars] = useState(0);
  const track = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  const count = useRef<HTMLParagraphElement>(null);
  const dot = useRef<HTMLSpanElement>(null);
  const tiles = useRef<(HTMLDivElement | null)[]>([]);
  const st = useRef({ t: -4, next: 0, last: 0, waiting: false, waitAt: 0, beat: -5 });
  const opt = useRef({ vol, metro }); opt.current = { vol, metro };
  useEffect(() => { getSetting<Song[]>('mySongs', []).then(setMine); }, []);
  const times = useMemo(() => { let acc = 0; return (song?.notes ?? []).map((n) => { const s = acc; acc += n.d; return s; }); }, [song]);
  const lanes = useMemo(() => (song ? [...new Set(song.notes.map((n) => n.m))].sort((a, b) => a - b) : []), [song]);
  const total = times.length ? times[times.length - 1] + song!.notes[song!.notes.length - 1].d : 1;
  const done = !!song && next >= song.notes.length;
  const bpm = SPEEDS[speed].bpm;
  const begin = (s: Song) => { st.current = { t: -(s.bar), next: 0, last: 0, waiting: false, waitAt: 0, beat: -(s.bar) - 1 }; tiles.current = []; setNext(0); setStars(0); setSay(null); setSong(s); };
  // One loop moves the whole track with a single transform, so the tiles glide smoothly even on slow phones.
  useEffect(() => {
    if (!song || done) return;
    let raf = 0;
    const loop = (now: number) => {
      const s = st.current;
      const dt = s.last ? Math.min(0.1, (now - s.last) / 1000) * (bpm / 60) : 0; s.last = now;
      if (s.next < song.notes.length) {
        const due = times[s.next];
        if (s.t + dt >= due) { if (!s.waiting) s.waitAt = now; s.t = due; s.waiting = true; } else { s.t += dt; s.waiting = false; }
      }
      const b = Math.floor(s.t + 1e-6);
      if (b > s.beat) {
        s.beat = b;
        const accent = ((b % song.bar) + song.bar) % song.bar === 0;
        if (opt.current.metro || s.t < 0) click(accent, opt.current.vol);
        if (dot.current) { dot.current.style.transform = 'scale(1.6)'; dot.current.style.background = accent ? '#F4C430' : '#ffffff'; setTimeout(() => { if (dot.current) dot.current.style.transform = 'scale(1)'; }, 110); }
      }
      if (track.current) track.current.style.transform = `translate3d(0, ${s.t * PPB}px, 0)`;
      if (bar.current) bar.current.style.width = `${Math.max(0, s.t / total) * 100}%`;
      if (count.current) count.current.textContent = s.t < 0 ? String(Math.ceil(-s.t)) : '';
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop); return () => cancelAnimationFrame(raf);
  }, [song, times, bpm, done, total]);
  const press = (li: number) => {
    if (!song) return;
    const s = st.current; if (s.next >= song.notes.length) return;
    const n = song.notes[s.next];
    const early = times[s.next] - s.t;
    if (lanes[li] === n.m && early <= EARLY) {
      const stop = hold(midi(n.m), 'piano', vol); setTimeout(stop, Math.max(220, (n.d * 60_000) / bpm - 40));
      const el = tiles.current[s.next]; if (el) el.dataset.hit = '1';
      // On time: within a sixth of a beat either side, or the child kept it waiting only a moment.
      const onTime = early < 0.17 && (!s.waiting || performance.now() - s.waitAt < 250);
      s.next++; s.waiting = false; setNext(s.next);
      if (onTime) setStars((x) => x + 1);
      setSay({ k: s.next, t: onTime ? tx.perfect : tx.good });
      if (s.next >= song.notes.length) { setParty((x) => x + 1); [0, 4, 7, 12].forEach((d, i) => setTimeout(() => { const o = hold(midi(72 + d), 'bell', vol * 0.6); setTimeout(o, 900); }, 500 + i * 130)); }
    } else { setBad(li); setTimeout(() => setBad(-1), 350); }
  };
  useAnyInput(() => { if (song && !done) press(lanes.indexOf(song.notes[st.current.next].m)); });
  const saveMine = async (s: Song) => { const l = [...mine.filter((x) => x.id !== s.id), s]; setMine(l); await setSetting('mySongs', l); };
  if (making) return <Recorder vol={vol} onCancel={() => setMaking(false)} onSave={async (s) => { await saveMine(s); setMaking(false); }} />;
  if (!song) return (
    <div className="absolute inset-0 overflow-y-auto bg-[#1d2430] text-white p-4 pt-20">
      <h2 className="text-2xl font-extrabold mb-4">{tx.chooseSong}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button onClick={() => setMaking(true)} className="min-h-[76px] rounded-3xl flex items-center gap-4 px-5 text-start font-extrabold text-lg border-2 border-dashed border-white/40 active:scale-[.98] transition">
          <span className="w-11 h-11 rounded-full bg-white/15 flex items-center justify-center" aria-hidden><Plus /></span>{tx.makeSong}
        </button>
        {mine.map((s) => (
          <div key={s.id} className="min-h-[76px] rounded-3xl flex items-center bg-white/10">
            <button onClick={() => begin(s)} className="flex-1 min-h-[76px] flex items-center gap-4 px-5 text-start font-extrabold text-lg"><span className="text-4xl" aria-hidden>{s.e}</span>{nameOf(s, lang)}</button>
            <button aria-label={`${tx.deleteSong} ${nameOf(s, lang)}`} className="w-14 h-14 me-2 rounded-2xl flex items-center justify-center text-white/70" onClick={async () => { const l = mine.filter((x) => x.id !== s.id); setMine(l); await setSetting('mySongs', l); }}><Trash2 size={20} /></button>
          </div>
        ))}
        {SONGS.map((s, i) => (
          <button key={s.id} onClick={() => begin(s)} className="min-h-[76px] rounded-3xl flex items-center gap-4 px-5 text-start font-extrabold text-lg text-[#1d2430] active:scale-[.98] transition duration-300" style={{ background: HUES[i % HUES.length] }}>
            <span className="text-4xl" aria-hidden>{s.e}</span>{nameOf(s, lang)}
          </button>
        ))}
      </div>
    </div>
  );
  const nextLane = done ? -1 : lanes.indexOf(song.notes[next].m);
  return (
    <div className="absolute inset-0 flex flex-col bg-[#141a24] text-white select-none touch-none">
      <div className="flex items-center gap-2 p-3 pe-24">
        <button className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center shrink-0" aria-label={tx.chooseSong} onClick={() => setSong(null)}><ListMusic aria-hidden /></button>
        <span ref={dot} className="w-3 h-3 rounded-full bg-white shrink-0 transition-transform duration-100" aria-hidden />
        <span className="font-extrabold truncate flex-1 min-w-0">{nameOf(song, lang)}</span>
      </div>
      <div className="flex items-center gap-2 px-3 pb-2">
        <div className="flex bg-white/10 rounded-2xl p-1" role="radiogroup" aria-label="speed">
          {SPEEDS.map((v, i) => <button key={i} role="radio" aria-checked={speed === i} aria-label={`${v.bpm}`} onClick={() => setSpeed(i)} className={`w-11 h-10 rounded-xl text-xl ${speed === i ? 'bg-white/90' : ''}`}>{v.e}</button>)}
        </div>
        <button role="switch" aria-checked={metro} aria-label={tx.metronome} onClick={() => setMetro(!metro)} className={`h-12 px-3 rounded-2xl text-sm font-bold flex items-center gap-1.5 ${metro ? 'bg-white text-[#141a24]' : 'bg-white/10'}`}><span aria-hidden className="text-lg">🥁</span>{tx.metronome}</button>
        <span className="ms-auto font-extrabold tabular-nums" aria-label="stars">⭐ {stars}</span>
      </div>
      <div className="h-1.5 mx-3 rounded-full bg-white/10 overflow-hidden"><div ref={bar} className="h-full bg-[#7FC8C1]" style={{ width: 0 }} /></div>
      <div className="relative flex-1 overflow-hidden mx-3">
        {/* Faint lane guides and beat lines move with the music. */}
        <div className="absolute inset-0 flex">{lanes.map((m) => <div key={m} className="flex-1 border-x border-white/[0.04]" />)}</div>
        <div ref={track} className="absolute start-0 end-0 bottom-0 h-0 will-change-transform">
          {Array.from({ length: Math.ceil(total) + 1 }, (_, b) => <div key={'b' + b} className="absolute start-0 end-0 h-px" style={{ bottom: b * PPB, background: b % song.bar === 0 ? 'rgba(255,255,255,.18)' : 'rgba(255,255,255,.06)' }} />)}
          {song.notes.map((n, i) => {
            const li = lanes.indexOf(n.m); const c = HUES[li % HUES.length];
            return <div key={i} ref={(el) => { tiles.current[i] = el; }} className="song-tile absolute rounded-2xl flex items-end justify-center pb-1 text-[11px] font-extrabold text-[#141a24]/70"
              style={{ left: `calc(${(li / lanes.length) * 100}% + 3px)`, width: `calc(${100 / lanes.length}% - 6px)`, bottom: times[i] * PPB + 3, height: n.d * PPB - 6, background: c, boxShadow: i === next ? `0 0 26px ${c}` : undefined, opacity: i === next ? 1 : 0.8 }}>
              {SARGAM[n.m % 12]}
            </div>;
          })}
        </div>
        <div className="absolute start-0 end-0 bottom-0 h-1 bg-white/60 rounded" />
        <p ref={count} className="absolute inset-x-0 top-1/3 text-center text-7xl font-extrabold opacity-80" aria-hidden />
        {say && <p key={say.k} className="absolute inset-x-0 bottom-8 text-center text-2xl font-extrabold pointer-events-none" style={{ color: say.t === tx.perfect ? '#F4C430' : '#9FB0E3', animation: 'sayUp 0.8s ease-out forwards' }} aria-hidden>{say.t}</p>}
      </div>
      <div className="flex gap-1.5 p-3 h-32">
        {lanes.map((m, li) => {
          const c = HUES[li % HUES.length]; const isNext = li === nextLane;
          return <button key={m} aria-label={`key ${li + 1}`} onPointerDown={() => press(li)} className="flex-1 rounded-2xl flex flex-col items-center justify-end pb-2 transition-colors duration-150"
            style={{ background: isNext ? c : 'rgba(255,255,255,0.08)', color: isNext ? '#141a24' : c, animation: bad === li ? 'wiggle 0.35s' : isNext ? 'beat 0.9s ease-in-out infinite' : undefined, border: `3px solid ${c}` }}>
            <span className="text-base font-extrabold leading-none">{SARGAM[m % 12]}</span><span className="text-[10px] font-bold opacity-70">{LETTER[m % 12]}</span>
          </button>;
        })}
      </div>
      {done && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-5 bg-black/45 backdrop-blur-sm anim-fade">
          {party > 0 && <Celebrate key={party} star={false} />}
          <span className="text-[7rem] leading-none drop-shadow-xl" style={{ animation: 'zoomIn .6s var(--ease) both, beat 1.6s ease-in-out .6s infinite' }} role="img" aria-label="★">🌟</span>
          <p className="text-3xl font-extrabold text-center px-4">{nameOf(song, lang)}</p>
          <p className="text-lg font-bold">⭐ {stars} / {song.notes.length}</p>
          <div className="flex gap-3">
            <button className="btn bg-white text-[#1d2430] !min-h-[60px] !rounded-2xl" onClick={() => begin(song)}>{tx.again}</button>
            <button className="btn bg-white/20 text-white !min-h-[60px] !rounded-2xl" onClick={() => setSong(null)}><ListMusic aria-hidden /> {tx.chooseSong}</button>
          </div>
        </div>
      )}
    </div>
  );
}

const WHITE = [0, 2, 4, 5, 7, 9, 11];
const BLACK: Record<number, number> = { 0: 1, 1: 3, 3: 6, 4: 8, 5: 10 };
const EMOJI = ['🎵', '🎶', '🎤', '🎧', '💃', '🌸', '🌙', '🌴'];
/** Play any tune on the keys; the timing is kept, so it becomes a song with falling tiles. */
function Recorder({ vol, onSave, onCancel }: { vol: number; onSave: (s: Song) => void; onCancel: () => void }) {
  const lang = useUI((s) => s.lang);
  const tx = songText(lang);
  const [base, setBase] = useState(60);
  const [rec, setRec] = useState(false);
  const [taken, setTaken] = useState<{ m: number; at: number }[]>([]);
  const [name, setName] = useState('');
  const [on, setOn] = useState(-1);
  const recRef = useRef(false); recRef.current = rec;
  const stops = useRef(new Map<number, () => void>());
  const whites = [...WHITE.map((s) => base + s), base + 12, base + 14, base + 16];
  const blacks = [...Object.entries(BLACK).map(([wi, s]) => ({ m: base + s, at: +wi + 1 })), { m: base + 13, at: 8 }, { m: base + 15, at: 9 }];
  const down = (id: number, m: number) => {
    stops.current.get(id)?.(); stops.current.set(id, hold(midi(m), 'piano', vol)); setOn(m);
    if (recRef.current) setTaken((t) => [...t, { m, at: performance.now() }]);
  };
  const up = (id: number) => { stops.current.get(id)?.(); stops.current.delete(id); setOn(-1); };
  const notes = useMemo<Note[]>(() => {
    if (taken.length < 2) return taken.map((x) => ({ m: x.m, d: 1 }));
    const gaps = taken.slice(1).map((x, i) => x.at - taken[i].at).filter((g) => g > 90);
    const beat = [...gaps].sort((a, b) => a - b)[Math.floor(gaps.length / 2)] || 500;
    return taken.map((x, i) => ({ m: x.m, d: i < taken.length - 1 ? Math.min(4, Math.max(0.5, Math.round(((taken[i + 1].at - x.at) / beat) * 2) / 2)) : 2 }));
  }, [taken]);
  const preview = () => { let at = 0; notes.forEach((n) => { const m = n.m; setTimeout(() => { const s = hold(midi(m), 'piano', vol); setTimeout(s, n.d * 450); }, at); at += n.d * 600; }); };
  const ww = 100 / whites.length;
  return (
    <div className="absolute inset-0 flex flex-col bg-[#1d2430] text-white p-3 pt-4 gap-3 select-none">
      <div className="pe-24 flex items-center gap-2">
        <button className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center shrink-0" aria-label={tx.chooseSong} onClick={onCancel}><ListMusic aria-hidden /></button>
        <h2 className="text-xl font-extrabold">{tx.makeSong}</h2>
      </div>
      <p className="text-sm text-white/75">{tx.makeHint}</p>
      <label className="block"><span className="sr-only">{tx.songName}</span><input className="input !bg-white/10 !text-white !border-white/20 w-full" placeholder={tx.songName} value={name} onChange={(e) => setName(e.target.value)} /></label>
      <div className="flex items-center gap-2 flex-wrap">
        {rec
          ? <button className="btn-danger !min-h-[52px]" onClick={() => setRec(false)}><Square size={18} aria-hidden fill="currentColor" /> {tx.stopRec}</button>
          : <button className="btn bg-white text-[#1d2430] !min-h-[52px] !rounded-2xl" onClick={() => { setTaken([]); setRec(true); }}><Circle size={18} aria-hidden fill="#e5534b" stroke="none" /> {taken.length ? tx.recAgain : tx.startRec}</button>}
        {!rec && taken.length > 1 && <button className="btn bg-white/15 text-white !min-h-[52px] !rounded-2xl" onClick={preview}><PlayIcon size={18} aria-hidden /> {tx.listen}</button>}
        <span className="text-sm font-bold text-white/70 tabular-nums" aria-live="polite">{taken.length} ♪</span>
        <span className="flex-1" />
        <button className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center" aria-label="lower" onClick={() => setBase(Math.max(48, base - 12))}><Minus size={18} /></button>
        <button className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center" aria-label="higher" onClick={() => setBase(Math.min(72, base + 12))}><Plus size={18} /></button>
      </div>
      <div className="relative flex-1 min-h-[180px] touch-none" onContextMenu={(e) => e.preventDefault()}>
        <div className="absolute inset-0 flex gap-[3px]">
          {whites.map((m, i) => <div key={m} role="button" aria-label={`key ${m}`} onPointerDown={(e) => down(e.pointerId, m)} onPointerUp={(e) => up(e.pointerId)} onPointerLeave={(e) => up(e.pointerId)} onPointerCancel={(e) => up(e.pointerId)}
            className="flex-1 rounded-b-xl flex items-end justify-center pb-2 text-xs font-extrabold text-[#1d2430]/60" style={{ background: on === m ? '#fff3cf' : '#fff', boxShadow: `inset 0 -8px 0 ${HUES[i % HUES.length]}` }}>{SARGAM[m % 12]}</div>)}
        </div>
        {blacks.map(({ m, at }) => <div key={m} role="button" aria-label={`key ${m}`} onPointerDown={(e) => { e.stopPropagation(); down(e.pointerId, m); }} onPointerUp={(e) => up(e.pointerId)} onPointerLeave={(e) => up(e.pointerId)} onPointerCancel={(e) => up(e.pointerId)}
          className="absolute top-0 rounded-b-lg" style={{ left: `calc(${at * ww}% - ${ww * 0.31}%)`, width: `${ww * 0.62}%`, height: '58%', background: on === m ? '#5a6478' : '#232a36' }} />)}
      </div>
      <button className="btn-primary !min-h-[56px]" disabled={rec || notes.length < 2} onClick={() => onSave({ id: 'my-' + Date.now(), e: EMOJI[Math.floor(Math.random() * EMOJI.length)], bar: 4, name: name.trim() || tx.mySong, notes, mine: true })}>{tx.saveSong}</button>
    </div>
  );
}
