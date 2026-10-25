import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Volume2 } from 'lucide-react';
import { PENTA, tone, play, midi, speak, animal, preloadAnimals } from '../../lib/audio';
import { useUI, type Lang } from '../../lib/store';
import { HUES, shuffle } from './shared';
import { Celebrate } from './games-colour';
import { Score } from './games-tilt';
import { UI_TEXT, uiText } from './text';
import { ANIMALS as ANIMAL_LIST } from './animals';

type Name = { en: string } & Partial<Record<Lang, string>>;
const w = (en: string, ml: string, kn: string): Name => ({ en, ml, kn });
const ANIMALS: [string, Name][] = ANIMAL_LIST.map((x) => [x.e, x.name]);
const FOOD: [string, Name][] = [
  ['🍎', w('apple', 'ആപ്പിൾ', 'ಸೇಬು')], ['🍌', w('banana', 'പഴം', 'ಬಾಳೆಹಣ್ಣು')], ['🥭', w('mango', 'മാങ്ങ', 'ಮಾವಿನಹಣ್ಣು')], ['🍇', w('grapes', 'മുന്തിരി', 'ದ್ರಾಕ್ಷಿ')],
  ['🍉', w('watermelon', 'തണ്ണിമത്തൻ', 'ಕಲ್ಲಂಗಡಿ')], ['🍊', w('orange', 'ഓറഞ്ച്', 'ಕಿತ್ತಳೆ')], ['🥥', w('coconut', 'തേങ്ങ', 'ತೆಂಗಿನಕಾಯಿ')], ['🥛', w('milk', 'പാൽ', 'ಹಾಲು')],
  ['🍚', w('rice', 'ചോറ്', 'ಅನ್ನ')], ['🥚', w('egg', 'മുട്ട', 'ಮೊಟ್ಟೆ')], ['🥕', w('carrot', 'കാരറ്റ്', 'ಕ್ಯಾರೆಟ್')], ['🍍', w('pineapple', 'കൈതച്ചക്ക', 'ಅನಾನಸ್')],
  ['🍓', w('strawberry', 'സ്ട്രോബെറി', 'ಸ್ಟ್ರಾಬೆರಿ')], ['🍞', w('bread', 'റൊട്ടി', 'ಬ್ರೆಡ್')],
];
const COLOURS: [string, Name][] = [
  ['#E5534B', w('red', 'ചുവപ്പ്', 'ಕೆಂಪು')], ['#3B7BE0', w('blue', 'നീല', 'ನೀಲಿ')], ['#3FA65B', w('green', 'പച്ച', 'ಹಸಿರು')], ['#F4C430', w('yellow', 'മഞ്ഞ', 'ಹಳದಿ')],
  ['#F08A3C', w('orange', 'ഓറഞ്ച്', 'ಕಿತ್ತಳೆ')], ['#7556D2', w('purple', 'വയലറ്റ്', 'ನೇರಳೆ')], ['#E86BA8', w('pink', 'പിങ്ക്', 'ಗುಲಾಬಿ')], ['#2A2F3A', w('black', 'കറുപ്പ്', 'ಕಪ್ಪು')],
  ['#FFFFFF', w('white', 'വെളുപ്പ്', 'ಬಿಳಿ')], ['#8B5E3C', w('brown', 'തവിട്ട്', 'ಕಂದು')],
];
const SHAPE_PATHS: Record<string, string> = {
  circle: 'M50 8a42 42 0 1 0 0.01 0Z', square: 'M12 12h76v76H12Z', triangle: 'M50 8 92 88H8Z', rectangle: 'M4 26h92v48H4Z',
  star: 'M50 6l12 30 32 2-25 20 9 32-28-18-28 18 9-32L6 38l32-2Z', heart: 'M50 88C20 66 6 50 6 32 6 18 17 8 30 8c9 0 16 5 20 12 4-7 11-12 20-12 13 0 24 10 24 24 0 18-14 34-44 56Z',
  moon: 'M62 6A44 44 0 1 0 94 70 36 36 0 1 1 62 6Z', diamond: 'M50 4 90 50 50 96 10 50Z',
};
const SHAPES: [string, Name][] = [
  ['circle', w('circle', 'വൃത്തം', 'ವೃತ್ತ')], ['square', w('square', 'സമചതുരം', 'ಚೌಕ')], ['triangle', w('triangle', 'ത്രികോണം', 'ತ್ರಿಕೋನ')], ['rectangle', w('rectangle', 'ദീർഘചതുരം', 'ಆಯತ')],
  ['star', w('star', 'നക്ഷത്രം', 'ನಕ್ಷತ್ರ')], ['heart', w('heart', 'ഹൃദയം', 'ಹೃದಯ')], ['moon', w('moon', 'ചന്ദ്രക്കല', 'ಅರ್ಧಚಂದ್ರ')], ['diamond', w('diamond', 'ഡയമണ്ട്', 'ವಜ್ರಾಕಾರ')],
];
const ABC = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const ML = 'അ ആ ഇ ഈ ഉ ഊ ഋ എ ഏ ഐ ഒ ഓ ഔ ക ഖ ഗ ഘ ങ ച ഛ ജ ഝ ഞ ട ഠ ഡ ഢ ണ ത ഥ ദ ധ ന പ ഫ ബ ഭ മ യ ര ല വ ശ ഷ സ ഹ ള ഴ റ'.split(' ');
const KN = 'ಅ ಆ ಇ ಈ ಉ ಊ ಋ ಎ ಏ ಐ ಒ ಓ ಔ ಕ ಖ ಗ ಘ ಙ ಚ ಛ ಜ ಝ ಞ ಟ ಠ ಡ ಢ ಣ ತ ಥ ದ ಧ ನ ಪ ಫ ಬ ಭ ಮ ಯ ರ ಲ ವ ಶ ಷ ಸ ಹ ಳ'.split(' ');
const COUNT_E = ['🍎', '⭐', '🐟', '🌼', '🎈', '🐤', '🍌', '🚗'];

export type QuizKind = 'animals' | 'food' | 'colours' | 'shapes' | 'count' | 'abc' | 'ml' | 'kn';
interface Opt { key: string; node: ReactNode; label: string }
interface Round { prompt: string; show?: ReactNode; say: [string, Lang, string?]; options: Opt[]; answer: string; praise: [string, Lang] }

const shape = (k: string, c = '#4F8FEA') => <svg viewBox="0 0 100 100" className="w-[70%] h-[70%]" aria-hidden><path d={SHAPE_PATHS[k]} fill={c} /></svg>;
const big = (s: string, font?: string) => <span className="leading-none" style={{ fontSize: 'min(20vw, 13vh)', fontFamily: font }}>{s}</span>;

function makeRound(kind: QuizKind, n: number, lang: Lang, last: string): Round {
  const tx = uiText(lang);
  const pick = <T,>(list: T[], key: (x: T) => string) => { const pool = shuffle(list.filter((x) => key(x) !== last)); const target = pool[0]; return { target, opts: shuffle([target, ...shuffle(list.filter((x) => key(x) !== key(target))).slice(0, n - 1)]) }; };
  const named = (list: [string, Name][], render: (k: string, i: number) => ReactNode): Round => {
    const { target, opts } = pick(list, (x) => x[0]);
    const nm = target[1];
    return { prompt: tx.findThe.replace('{x}', (nm[lang] ?? nm.en)), say: [tx.findThe.replace('{x}', (nm[lang] ?? nm.en)), lang, UI_TEXT.en.findThe.replace('{x}', nm.en)], answer: target[0],
      options: opts.map(([k, nn], i) => ({ key: k, node: render(k, i), label: (nn[lang] ?? nn.en) })), praise: [(nm[lang] ?? nm.en), lang] };
  };
  switch (kind) {
    case 'animals': return named(ANIMALS, (k) => big(k));
    case 'food': return named(FOOD, (k) => big(k));
    case 'colours': return named(COLOURS, (k) => <span className="w-[70%] aspect-square rounded-full border-4 border-black/10" style={{ background: k }} />);
    case 'shapes': return named(SHAPES, (k, i) => shape(k, ['#4F8FEA', '#E5534B', '#2BA89C', '#7556D2', '#F08A3C', '#E86BA8'][i % 6]));
    case 'count': {
      const max = n <= 2 ? 5 : 10;
      const nums = Array.from({ length: max }, (_, i) => String(i + 1));
      const { target, opts } = pick(nums, (x) => x);
      const e = COUNT_E[Math.floor(Math.random() * COUNT_E.length)];
      return { prompt: tx.howMany, show: <div className="flex flex-wrap justify-center gap-1.5 text-[40px] leading-none max-w-xs" aria-hidden>{Array.from({ length: +target }, (_, i) => <span key={i}>{e}</span>)}</div>,
        say: [tx.howMany, lang, UI_TEXT.en.howMany], answer: target, options: opts.map((k) => ({ key: k, node: big(k), label: k })), praise: [target, lang] };
    }
    default: {
      const [list, l]: [string[], Lang] = kind === 'abc' ? [ABC, 'en'] : kind === 'ml' ? [ML, 'ml'] : [KN, 'kn'];
      const { target, opts } = pick(list, (x) => x);
      const font = l === 'kn' ? "'Noto Sans Kannada', sans-serif" : undefined;
      return { prompt: tx.findLetter.replace('{x}', target), say: [target, l], answer: target, options: opts.map((k) => ({ key: k, node: big(k, font), label: k })), praise: [target, l] };
    }
  }
}

/** Find the one that is asked for. Gentle: a wrong tap just wiggles; nothing is lost. More choices for older children. */
export function Quiz({ vol, kind }: { vol: number; kind: QuizKind }) {
  const lang = useUI((s) => s.lang);
  const [n, setN] = useState(4);
  useEffect(() => { if (kind === 'animals') preloadAnimals(); }, [kind]);
  const [round, setRound] = useState<Round>(() => makeRound(kind, 4, lang, ''));
  const [wrong, setWrong] = useState<string[]>([]);
  const [right, setRight] = useState(false);
  const [stars, setStars] = useState(0);
  const [party, setParty] = useState(0);
  const say = useCallback((r: Round) => { const [t, l, f] = r.say; speak(t, l, undefined, { force: true, fallback: f, rate: 0.85 }); }, []);
  const cur = useRef(round); cur.current = round;
  const next = (count = n) => { const nr = makeRound(kind, count, lang, cur.current.answer); setRound(nr); setWrong([]); setRight(false); setTimeout(() => say(nr), 350); };
  const first = useRef(true);
  // A new question when the language changes; the first one is asked once the game opens.
  useEffect(() => { if (first.current) { first.current = false; const h = setTimeout(() => say(cur.current), 400); return () => clearTimeout(h); } next(); }, [lang]); // eslint-disable-line react-hooks/exhaustive-deps
  const choose = (o: Opt) => {
    if (right) return;
    // Animals call out when tapped, right or wrong, so the child learns the sounds too.
    if (kind === 'animals') { const an = ANIMAL_LIST.find((x) => x.e === o.key); if (an) animal(an.id, vol); }
    if (o.key === round.answer) {
      setRight(true); const s = stars + 1; setStars(s);
      if (kind !== 'animals') { tone(PENTA[5], 0.6, vol); tone(PENTA[7], 0.7, vol, 'sine', 0.12); tone(PENTA[9], 1, vol, 'sine', 0.24); }
      if (s % 5 === 0) setParty((p) => p + 1);
      setTimeout(() => speak(round.praise[0], round.praise[1], undefined, { force: true }), 350);
      setTimeout(() => next(), 1700);
    } else { setWrong((w) => [...w, o.key]); play(midi(55), 'pad', vol * 0.35, 0.5); }
  };
  const cols = n === 2 ? 'grid-cols-2' : n === 4 ? 'grid-cols-2' : 'grid-cols-3';
  return (
    <div className="absolute inset-0 flex flex-col bg-gradient-to-b from-[#eef4ff] to-[#fdf3e6] text-[#2a2f3a] overflow-y-auto">
      <div className="min-h-[76px]"><Score e="⭐" n={stars} /></div>
      <div className="mx-4 rounded-3xl bg-white shadow-card p-4 flex flex-col items-center gap-3">
        {round.show}
        <div className="flex items-center gap-3">
          <p className="text-2xl font-extrabold text-center" aria-live="polite">{round.prompt}</p>
          <button className="w-12 h-12 rounded-full bg-[#eef4ff] flex items-center justify-center shrink-0" aria-label="repeat" onClick={() => say(round)}><Volume2 aria-hidden /></button>
        </div>
      </div>
      <div className={`grid ${cols} gap-3 p-4 flex-1 content-start`}>
        {round.options.map((o) => {
          const isRight = right && o.key === round.answer; const isWrong = wrong.includes(o.key);
          return (
            <button key={round.answer + o.key} aria-label={o.label} onClick={() => choose(o)}
              className="aspect-square rounded-3xl bg-white shadow-card flex items-center justify-center transition duration-300 active:scale-95"
              style={{ outline: isRight ? '6px solid #3FA65B' : undefined, opacity: isWrong ? 0.35 : right && !isRight ? 0.5 : 1, animation: isWrong ? 'wiggle 0.4s' : isRight ? 'pop 0.5s' : undefined, transform: isRight ? 'scale(1.05)' : undefined }}>
              {o.node}
            </button>
          );
        })}
      </div>
      <div className="sticky bottom-0 flex justify-center pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="flex gap-1.5 bg-white/90 shadow-card rounded-2xl p-1" role="radiogroup" aria-label="choices">
          {[2, 4, 6].map((v) => <button key={v} role="radio" aria-checked={n === v} aria-label={`${v}`} onClick={() => { setN(v); next(v); }} className={`w-12 h-12 rounded-xl font-extrabold text-lg ${n === v ? 'bg-[#3B7BE0] text-white' : ''}`}>{v}</button>)}
        </div>
      </div>
      {party > 0 && <Celebrate key={party} />}
    </div>
  );
}

const SYMS = ['🐘', '🦋', '🐠', '🌻', '🐢', '🍎', '⭐', '🚂', '🐰', '🌈', '🎈', '🐱'];
/** Classic memory: turn two cards; a match stays open. */
export function Memory({ vol }: { vol: number }) {
  const [pairs, setPairs] = useState(3);
  const deal = (p: number) => shuffle(shuffle(SYMS).slice(0, p).flatMap((e) => [e, e])).map((e, i) => ({ id: i, e, open: false, done: false }));
  const [cards, setCards] = useState(() => deal(3));
  const [party, setParty] = useState(0);
  const busy = useRef(false);
  const start = (p: number) => { setPairs(p); setCards(deal(p)); };
  const flip = (id: number) => {
    if (busy.current) return;
    const c = cards.find((x) => x.id === id)!; if (c.open || c.done) return;
    const open = cards.filter((x) => x.open && !x.done);
    const nc = cards.map((x) => (x.id === id ? { ...x, open: true } : x));
    play(PENTA[3 + open.length * 2], 'kalimba', vol * 0.6, 0.4);
    if (open.length === 1) {
      if (open[0].e === c.e) {
        const fin = nc.map((x) => (x.e === c.e ? { ...x, done: true } : x));
        setCards(fin); tone(PENTA[7], 0.7, vol, 'sine', 0.1); tone(PENTA[9], 0.9, vol, 'sine', 0.22);
        if (fin.every((x) => x.done)) { setParty((p) => p + 1); setTimeout(() => setCards(deal(pairs)), 3000); }
      } else { setCards(nc); busy.current = true; setTimeout(() => { setCards((cs) => cs.map((x) => (x.done ? x : { ...x, open: false }))); busy.current = false; }, 900); }
    } else setCards(nc);
  };
  const cols = pairs === 3 ? 'grid-cols-3' : pairs === 6 ? 'grid-cols-3 sm:grid-cols-4' : 'grid-cols-4';
  return (
    <div className="absolute inset-0 flex flex-col bg-gradient-to-b from-[#f3ecff] to-[#e9f7f1] overflow-y-auto">
      <div className="flex gap-1.5 p-3 pe-36">
        <div className="flex gap-1.5 bg-white/70 rounded-2xl p-1" role="radiogroup" aria-label="pairs">
          {[3, 6, 8].map((v) => <button key={v} role="radio" aria-checked={pairs === v} aria-label={`${v}`} onClick={() => start(v)} className={`w-12 h-12 rounded-xl font-extrabold text-lg text-[#2a2f3a] ${pairs === v ? '!bg-[#7556D2] !text-white' : ''}`}>{v}</button>)}
        </div>
      </div>
      <div className={`grid ${cols} gap-3 p-4 max-w-xl w-full mx-auto`}>
        {cards.map((c, i) => (
          <button key={c.id + '-' + pairs} aria-label={c.open || c.done ? c.e : 'card'} onClick={() => flip(c.id)}
            className="aspect-[3/4] rounded-2xl flex items-center justify-center text-5xl shadow-card transition-all duration-300"
            style={{ background: c.open || c.done ? '#fff' : HUES[i % HUES.length], transform: c.open || c.done ? 'rotateY(0)' : 'rotateY(180deg)', opacity: c.done ? 0.75 : 1 }}>
            <span style={{ opacity: c.open || c.done ? 1 : 0, transition: 'opacity .2s' }} aria-hidden>{c.e}</span>
          </button>
        ))}
      </div>
      {party > 0 && <Celebrate key={party} />}
    </div>
  );
}

const PADS = [{ c: '#E5534B', m: 60 }, { c: '#3B7BE0', m: 64 }, { c: '#F4C430', m: 67 }, { c: '#3FA65B', m: 72 }];
/** Watch and listen, then repeat the tune. It grows by one note each time. A mistake just plays it again. */
export function Simon({ vol }: { vol: number }) {
  const [seq, setSeq] = useState<number[]>([]);
  const [lit, setLit] = useState(-1);
  const [step, setStep] = useState(0);
  const [watching, setWatching] = useState(true);
  const [party, setParty] = useState(0);
  const timers = useRef<number[]>([]);
  const volRef = useRef(vol); volRef.current = vol;
  const flash = (i: number, at: number) => { timers.current.push(window.setTimeout(() => { setLit(i); play(midi(PADS[i].m), 'kalimba', volRef.current, 0.6); }, at), window.setTimeout(() => setLit(-1), at + 420)); };
  const show = useCallback((s: number[]) => {
    setWatching(true); setStep(0);
    s.forEach((p, k) => flash(p, 700 + k * 650));
    timers.current.push(window.setTimeout(() => setWatching(false), 700 + s.length * 650));
  }, []);
  useEffect(() => { const s = [Math.floor(Math.random() * 4)]; setSeq(s); show(s); return () => timers.current.forEach(clearTimeout); }, [show]);
  const tap = (i: number) => {
    if (watching) return;
    setLit(i); play(midi(PADS[i].m), 'kalimba', vol, 0.6); setTimeout(() => setLit(-1), 250);
    if (seq[step] !== i) { play(midi(48), 'pad', vol * 0.3, 0.6); show(seq); return; }
    if (step + 1 < seq.length) { setStep(step + 1); return; }
    const s = [...seq, Math.floor(Math.random() * 4)];
    if (seq.length % 4 === 0) setParty((p) => p + 1);
    setSeq(s); setWatching(true); timers.current.push(window.setTimeout(() => show(s), 700));
  };
  return (
    <div className="absolute inset-0 flex flex-col bg-[#1b2233]">
      <div className="p-3 pe-36 min-h-[76px]"><Score e="🎵" n={Math.max(0, seq.length - 1)} /></div>
      <div className="grid grid-cols-2 gap-3 p-4 flex-1">
        {PADS.map((p, i) => (
          <button key={i} aria-label={`pad ${i + 1}`} onPointerDown={() => tap(i)} className="rounded-[2rem] transition duration-150"
            style={{ background: p.c, opacity: lit === i ? 1 : watching ? 0.35 : 0.7, transform: lit === i ? 'scale(0.96)' : undefined, boxShadow: lit === i ? `0 0 60px ${p.c}` : undefined }} />
        ))}
      </div>
      {party > 0 && <Celebrate key={party} />}
    </div>
  );
}
