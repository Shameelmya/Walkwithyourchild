import { useEffect, useMemo, useState } from 'react';
import { ListMusic } from 'lucide-react';
import { play, midi, type Inst } from '../../lib/audio';
import { useUI, type Lang } from '../../lib/store';
import { HUES, useAnyInput } from './shared';
import { Celebrate } from './games-colour';
import { UI_TEXT } from './text';

const WHITE = [0, 2, 4, 5, 7, 9, 11];
const BLACK: Record<number, number> = { 0: 1, 1: 3, 3: 6, 4: 8, 5: 10 }; // white index in octave → black semitone after it
const INSTS: { v: Inst; e: string }[] = [{ v: 'piano', e: '🎹' }, { v: 'flute', e: '🪈' }, { v: 'marimba', e: '🪵' }, { v: 'bell', e: '🔔' }, { v: 'kalimba', e: '🎶' }];

function useWide() {
  const [wide, setWide] = useState(() => innerWidth > innerHeight);
  useEffect(() => { const r = () => setWide(innerWidth > innerHeight); addEventListener('resize', r); return () => removeEventListener('resize', r); }, []);
  return wide;
}

/** A real keyboard: one octave on a phone held upright, two when turned sideways. Pick the instrument at the top. */
export function Piano({ vol }: { vol: number }) {
  const [inst, setInst] = useState<Inst>('piano');
  const [on, setOn] = useState<Set<number>>(new Set());
  const wide = useWide();
  const oct = wide ? 2 : 1;
  const whites = [...Array.from({ length: oct }, (_, o) => WHITE.map((s) => 60 + o * 12 + s)).flat(), 60 + oct * 12];
  const blacks = Array.from({ length: oct }, (_, o) => Object.entries(BLACK).map(([wi, s]) => ({ m: 60 + o * 12 + s, at: o * 7 + +wi + 1 }))).flat();
  const hit = (m: number) => {
    play(midi(m), inst, vol, inst === 'flute' ? 0.9 : 1.4);
    setOn((s) => new Set(s).add(m)); setTimeout(() => setOn((s) => { const n = new Set(s); n.delete(m); return n; }), 220);
  };
  useAnyInput(() => hit(whites[Math.floor(Math.random() * whites.length)]));
  const ww = 100 / whites.length;
  return (
    <div className="absolute inset-0 flex flex-col bg-[#1d2430]">
      <div className="flex gap-2 p-3 pr-36 overflow-x-auto no-scrollbar" role="radiogroup" aria-label="instrument">
        {INSTS.map((i) => (
          <button key={i.v} role="radio" aria-checked={inst === i.v} aria-label={i.v} onClick={() => { setInst(i.v); play(midi(72), i.v, vol * 0.6, 0.6); }}
            className={`shrink-0 w-14 h-14 rounded-2xl text-3xl flex items-center justify-center transition duration-300 ${inst === i.v ? 'bg-white scale-105 shadow-lift' : 'bg-white/15'}`}>{i.e}</button>
        ))}
      </div>
      <div className="relative flex-1 m-3 mt-0 select-none">
        <div className="absolute inset-0 flex gap-1">
          {whites.map((m, i) => (
            <button key={m} aria-label={`key ${m}`} onPointerDown={() => hit(m)}
              className="flex-1 rounded-b-2xl rounded-t-md bg-white flex items-end justify-center pb-4 transition-transform duration-100"
              style={{ transform: on.has(m) ? 'translateY(4px)' : undefined, background: on.has(m) ? '#fff5d6' : undefined, boxShadow: 'inset 0 -10px 0 ' + HUES[i % HUES.length] }} />
          ))}
        </div>
        {blacks.map(({ m, at }) => (
          <button key={m} aria-label={`key ${m}`} onPointerDown={() => hit(m)} className="absolute top-0 rounded-b-xl transition-colors duration-100"
            style={{ left: `calc(${at * ww}% - ${ww * 0.3}%)`, width: `${ww * 0.6}%`, height: '58%', background: on.has(m) ? '#5a6478' : '#232a36', boxShadow: '0 6px 10px -4px rgb(0 0 0 / .5)' }} />
        ))}
      </div>
    </div>
  );
}

/* Songs are public domain melodies. Note names, ' = one octave up. */
const n = (s: string) => s.split(' ').map((t) => { const base = { C: 60, D: 62, E: 64, F: 65, G: 67, A: 69, B: 71 }[t[0] as 'C']; return base + (t.includes("'") ? 12 : 0) + (t.includes(',') ? -12 : 0); });
interface Song { id: string; e: string; name: Record<Lang, string>; notes: number[] }
const SONGS: Song[] = [
  { id: 'twinkle', e: '⭐', name: { en: 'Twinkle Twinkle', ml: 'ട്വിങ്കിൾ ട്വിങ്കിൾ', kn: 'ಟ್ವಿಂಕಲ್ ಟ್ವಿಂಕಲ್' }, notes: n("C C G G A A G F F E E D D C G G F F E E D G G F F E E D C C G G A A G F F E E D D C") },
  { id: 'mary', e: '🐑', name: { en: 'Mary had a little lamb', ml: 'മേരിയുടെ കുഞ്ഞാട്', kn: 'ಮೇರಿಯ ಕುರಿಮರಿ' }, notes: n("E D C D E E E D D D E G G E D C D E E E E D D E D C") },
  { id: 'birthday', e: '🎂', name: { en: 'Happy Birthday', ml: 'ഹാപ്പി ബർത്ത്ഡേ', kn: 'ಹ್ಯಾಪಿ ಬರ್ತ್‌ಡೇ' }, notes: n("G, G, A, G, C B, G, G, A, G, D C G, G, G E C B, A, F F E C D C") },
  { id: 'jingle', e: '🔔', name: { en: 'Jingle Bells', ml: 'ജിംഗിൾ ബെൽസ്', kn: 'ಜಿಂಗಲ್ ಬೆಲ್ಸ್' }, notes: n("E E E E E E E G C D E F F F F F E E E E D D E D G") },
  { id: 'ode', e: '🎻', name: { en: 'Ode to Joy', ml: 'ഓഡ് ടു ജോയ്', kn: 'ಓಡ್ ಟು ಜಾಯ್' }, notes: n("E E F G G F E D C C D E E D D E E F G G F E D C C D E D C C") },
  { id: 'boat', e: '🚣', name: { en: 'Row your boat', ml: 'തോണി തുഴയാം', kn: 'ದೋಣಿ ಹುಟ್ಟು ಹಾಕು' }, notes: n("C C C D E E D E F G C' C' C' G G G E E E C C C G F E D C") },
  { id: 'farm', e: '🐄', name: { en: 'Old MacDonald', ml: 'ഓൾഡ് മക്ഡൊണാൾഡ്', kn: 'ಓಲ್ಡ್ ಮ್ಯಾಕ್‌ಡೊನಾಲ್ಡ್' }, notes: n("G G G D E E D B B A A G D G G G D E E D B B A A G") },
];

/** Tiles drop to the line and wait. Tap the glowing key under a tile and the song plays on, note by note. */
export function SongTiles({ vol }: { vol: number }) {
  const lang = useUI((s) => s.lang);
  const tx = UI_TEXT[lang];
  const [song, setSong] = useState<Song | null>(null);
  const [pos, setPos] = useState(0);
  const [bad, setBad] = useState(-1);
  const [party, setParty] = useState(0);
  const lanes = useMemo(() => (song ? [...new Set(song.notes)].sort((a, b) => a - b) : []), [song]);
  const done = !!song && pos >= song.notes.length;
  const press = (li: number) => {
    if (!song || done) return;
    const m = lanes[li];
    if (m === song.notes[pos]) {
      play(midi(m), 'piano', vol, 1.1);
      const p = pos + 1; setPos(p);
      if (p >= song.notes.length) { setParty((x) => x + 1); [0, 4, 7, 12].forEach((d, i) => play(midi(72 + d), 'bell', vol * 0.6, 1.2, 0.5 + i * 0.12)); }
    } else { play(midi(m), 'piano', vol * 0.35, 0.4); setBad(li); setTimeout(() => setBad(-1), 400); }
  };
  useAnyInput(() => { if (song && !done) press(lanes.indexOf(song.notes[pos])); });
  if (!song) return (
    <div className="absolute inset-0 overflow-y-auto bg-[#1d2430] text-white p-4 pt-20">
      <h2 className="text-2xl font-extrabold mb-4">{tx.chooseSong}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {SONGS.map((s, i) => (
          <button key={s.id} onClick={() => { setSong(s); setPos(0); }} className="min-h-[76px] rounded-3xl flex items-center gap-4 px-5 text-left font-extrabold text-lg text-[#1d2430] active:scale-[.98] transition duration-300" style={{ background: HUES[i % HUES.length] }}>
            <span className="text-4xl" aria-hidden>{s.e}</span>{s.name[lang]}
          </button>
        ))}
      </div>
    </div>
  );
  const TILE = 84; const SHOW = 7;
  return (
    <div className="absolute inset-0 flex flex-col bg-[#161c27] text-white">
      <div className="flex items-center gap-3 p-3 pr-36">
        <button className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center shrink-0" aria-label={tx.chooseSong} onClick={() => setSong(null)}><ListMusic aria-hidden /></button>
        <span className="font-extrabold truncate">{song.e} {song.name[lang]}</span>
      </div>
      <div className="h-1.5 mx-3 rounded-full bg-white/10 overflow-hidden"><div className="h-full bg-[#7FC8C1] transition-all duration-300" style={{ width: `${(pos / song.notes.length) * 100}%` }} /></div>
      <div className="relative flex-1 overflow-hidden mx-3">
        {song.notes.slice(pos, pos + SHOW).map((m, k) => {
          const li = lanes.indexOf(m); const i = pos + k;
          return <div key={i} className="absolute rounded-2xl transition-all duration-300 ease-out" style={{ left: `calc(${(li / lanes.length) * 100}% + 3px)`, width: `calc(${100 / lanes.length}% - 6px)`, height: TILE - 8, bottom: k * TILE + 6, background: HUES[li % HUES.length], opacity: k === 0 ? 1 : Math.max(0.25, 0.9 - k * 0.12), boxShadow: k === 0 ? `0 0 28px ${HUES[li % HUES.length]}` : undefined }} />;
        })}
        <div className="absolute left-0 right-0 bottom-0 h-1 bg-white/40 rounded" />
      </div>
      <div className="flex gap-1.5 p-3 h-32">
        {lanes.map((m, li) => {
          const next = !done && song.notes[pos] === m;
          return <button key={m} aria-label={`key ${li + 1}`} onPointerDown={() => press(li)} className="flex-1 rounded-2xl transition duration-150"
            style={{ background: next ? HUES[li % HUES.length] : 'rgba(255,255,255,0.14)', animation: bad === li ? 'wiggle 0.35s' : next ? 'beat 1.2s ease-in-out infinite' : undefined, border: `3px solid ${HUES[li % HUES.length]}` }} />;
        })}
      </div>
      {done && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 bg-black/40 backdrop-blur-sm anim-fade">
          {party > 0 && <Celebrate key={party} />}
          <p className="text-3xl font-extrabold">{song.e} {song.name[lang]}</p>
          <div className="flex gap-3">
            <button className="btn bg-white text-[#1d2430] !min-h-[60px] !rounded-2xl" onClick={() => setPos(0)}>{tx.again}</button>
            <button className="btn bg-white/20 text-white !min-h-[60px] !rounded-2xl" onClick={() => setSong(null)}><ListMusic aria-hidden /> {tx.chooseSong}</button>
          </div>
        </div>
      )}
    </div>
  );
}
