import { useEffect, useRef, useState, type ComponentType } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ct } from '../../lib/careText';
import { useBack } from '../../lib/nav';
import { ArrowLeft, LogOut, Volume1, Volume2, VolumeX, Music2, Palette, Move, LayoutGrid, GraduationCap, Play as PlayIcon } from 'lucide-react';
import { useT, type TKey } from '../../i18n';
import { setSound, type Inst, type Scale } from '../../lib/audio';
import { LongPress, useWakeLock } from '../../components/ui';
import { useUI } from '../../lib/store';
import { LangButton } from '../../components/LangButton';
import { cx } from '../../lib/util';
import { Music, Drums, Xylophone, Chimes } from './games-sound';
import { Bubbles, Colouring, Paint, Fireworks, Lights } from './games-colour';
import { Peek, Sea, Balloons, Rub, Tilt, StarFollow, Maracas } from './games-move';
import { Eggs, Catch, Target } from './games-tilt';
import { Piano } from './games-music';
import { SongTiles } from './games-songs';
import { Quiz, Memory, Simon, type QuizKind } from './games-learn';
import { Watercolour } from './games-art';
import { Rubik, Slide } from './games-puzzle';
import { askMotion } from './shared';
import { GAME_TEXT, UI_TEXT } from './text';

type Cat = 'sound' | 'colour' | 'move' | 'learn';
type GC = ComponentType<{ vol: number }>;
/** snd: the game's own instrument, scale and root note. Games where sound is the point have no mute. */
interface Game { id: string; e: string; cat: Cat; tile: string; C: GC; snd: [Inst, Scale?, number?]; essential?: boolean; motion?: boolean }
const quiz = (kind: QuizKind): GC => function QuizGame({ vol }) { return <Quiz vol={vol} kind={kind} />; };
const GAMES: Game[] = [
  { id: 'colouring', e: '🖍️', cat: 'colour', tile: 't-coral', C: Colouring, snd: ['glass', 'major', 72] },
  { id: 'watercolour', e: '🖌️', cat: 'colour', tile: 't-blue', C: Watercolour, snd: ['pad'] },
  { id: 'paint', e: '🎨', cat: 'colour', tile: 't-violet', C: Paint, snd: ['flute', 'pentatonic', 60] },
  { id: 'bubbles', e: '🫧', cat: 'colour', tile: 't-blue', C: Bubbles, snd: ['bubble', 'pentatonic', 64] },
  { id: 'fireworks', e: '🎆', cat: 'colour', tile: 't-violet', C: Fireworks, snd: ['glass', 'lydian', 60] },
  { id: 'lights', e: '🌈', cat: 'colour', tile: 't-amber', C: Lights, snd: ['pad', 'major', 55] },
  { id: 'piano', e: '🎹', cat: 'sound', tile: 't-blue', C: Piano, snd: ['piano'], essential: true },
  { id: 'songs', e: '🎵', cat: 'sound', tile: 't-violet', C: SongTiles, snd: ['piano'], essential: true },
  { id: 'music', e: '🎶', cat: 'sound', tile: 't-mint', C: Music, snd: ['marimba', 'hindolam', 60], essential: true },
  { id: 'drums', e: '🥁', cat: 'sound', tile: 't-coral', C: Drums, snd: ['bell'], essential: true },
  { id: 'xylophone', e: '🎼', cat: 'sound', tile: 't-mint', C: Xylophone, snd: ['marimba', 'major', 60], essential: true },
  { id: 'chimes', e: '🎐', cat: 'sound', tile: 't-blue', C: Chimes, snd: ['bell', 'lydian', 72], essential: true },
  { id: 'maracas', e: '🪇', cat: 'sound', tile: 't-amber', C: Maracas, snd: ['pluck', 'suddha', 60], essential: true },
  { id: 'eggs', e: '🥚', cat: 'move', tile: 't-amber', C: Eggs, snd: ['kalimba', 'pentatonic', 64] },
  { id: 'catch', e: '🧺', cat: 'move', tile: 't-green', C: Catch, snd: ['marimba', 'major', 60], motion: true },
  { id: 'target', e: '🎯', cat: 'move', tile: 't-violet', C: Target, snd: ['glass', 'pentatonic', 60], motion: true },
  { id: 'balloons', e: '🎈', cat: 'move', tile: 't-rose', C: Balloons, snd: ['pluck', 'major', 60] },
  { id: 'tilt', e: '🔵', cat: 'move', tile: 't-mint', C: Tilt, snd: ['pluck', 'pentatonic', 48], motion: true },
  { id: 'rub', e: '☁️', cat: 'move', tile: 't-blue', C: Rub, snd: ['flute', 'pentatonic', 60] },
  { id: 'star', e: '⭐', cat: 'move', tile: 't-violet', C: StarFollow, snd: ['glass', 'japanese', 60] },
  { id: 'peek', e: '🐘', cat: 'move', tile: 't-green', C: Peek, snd: ['kalimba', 'pentatonic', 60] },
  { id: 'sea', e: '🐠', cat: 'move', tile: 't-mint', C: Sea, snd: ['pad', 'japanese', 55] },
  { id: 'q-animals', e: '🦁', cat: 'learn', tile: 't-amber', C: quiz('animals'), snd: ['kalimba', 'major', 60] },
  { id: 'q-food', e: '🍎', cat: 'learn', tile: 't-coral', C: quiz('food'), snd: ['kalimba', 'major', 60] },
  { id: 'q-colours', e: '🎨', cat: 'learn', tile: 't-violet', C: quiz('colours'), snd: ['kalimba', 'major', 60] },
  { id: 'q-shapes', e: '🔺', cat: 'learn', tile: 't-blue', C: quiz('shapes'), snd: ['kalimba', 'major', 60] },
  { id: 'q-count', e: '🔢', cat: 'learn', tile: 't-green', C: quiz('count'), snd: ['kalimba', 'major', 60] },
  { id: 'q-abc', e: '🔤', cat: 'learn', tile: 't-mint', C: quiz('abc'), snd: ['kalimba', 'major', 60] },
  { id: 'q-ml', e: 'അ', cat: 'learn', tile: 't-rose', C: quiz('ml'), snd: ['kalimba', 'major', 60] },
  { id: 'q-kn', e: 'ಅ', cat: 'learn', tile: 't-amber', C: quiz('kn'), snd: ['kalimba', 'major', 60] },
  { id: 'rubik', e: '🧊', cat: 'learn', tile: 't-coral', C: Rubik, snd: ['marimba'] },
  { id: 'slide', e: '🧩', cat: 'learn', tile: 't-green', C: Slide, snd: ['kalimba'] },
  { id: 'memory', e: '🃏', cat: 'learn', tile: 't-violet', C: Memory, snd: ['kalimba', 'pentatonic', 60] },
  { id: 'simon', e: '🔁', cat: 'learn', tile: 't-blue', C: Simon, snd: ['kalimba'], essential: true },
];
const CATS: { v: Cat | 'all'; k?: TKey; I: typeof Music2 }[] = [
  { v: 'all', k: 'all', I: LayoutGrid }, { v: 'learn', I: GraduationCap }, { v: 'colour', k: 'catColour', I: Palette }, { v: 'sound', k: 'catSound', I: Music2 }, { v: 'move', k: 'catMove', I: Move },
];

export default function Play() {
  const { t, lang } = useT();
  const nav = useNavigate();
  const { volume, setVolume, gameMuted, setGameMuted } = useUI();
  const tx = UI_TEXT[lang];
  const name = (g: Game) => GAME_TEXT[g.id][lang][0];
  const { game: gid } = useParams();
  const back = useBack();
  const game = GAMES.find((g) => g.id === gid) ?? null;
  const [cat, setCat] = useState<Cat | 'all'>('all');
  // Every game opens with a short "how to play" card; the game starts behind it only after Play.
  const [ready, setReady] = useState<string | null>(null);
  useEffect(() => setReady(null), [gid]);
  const begin = (g: Game) => { if (g.motion) askMotion(); const [i, sc, r] = g.snd; setSound(i, sc, r); setReady(g.id); };
  const ref = useRef<HTMLDivElement>(null);
  useWakeLock(!!game);
  const start = (g: Game) => nav(`/play/${g.id}`);
  const exit = () => back('/play');
  const shown = GAMES.filter((g) => cat === 'all' || g.cat === cat);
  return (
    <div ref={ref} className="min-h-screen bg-bg select-none touch-manipulation">
      {!game ? (
        <main id="main" className="max-w-4xl mx-auto px-4 py-4 pb-16 anim-in">
          <div className="flex items-center gap-3 mb-4"><button className="icon-chip" onClick={() => back('/')} aria-label={t('back')}><ArrowLeft size={20} /></button><h1 className="flex-1 text-[1.65rem] font-extrabold">{t('navPlay')}</h1><LangButton /></div>
          <Link to="/therapy" className="tile t-green !p-4 flex items-center gap-3 mb-4">
            <span className="relative z-[1] w-12 h-12 rounded-2xl bg-white/25 flex items-center justify-center text-2xl shrink-0" aria-hidden>🎯</span>
            <span className="relative z-[1] flex-1 min-w-0"><b className="block">{t('therapyNav')}</b><span className="text-sm opacity-90">{ct(lang, 'therapySub')}</span></span>
          </Link>
          <div role="tablist" aria-label={t('filter')} className="flex gap-2 p-1 rounded-2xl bg-surface2 mb-5 overflow-x-auto no-scrollbar">
            {CATS.map(({ v, k, I }) => (
              <button key={v} role="tab" aria-selected={cat === v} onClick={() => setCat(v)} className={cx('flex-1 min-w-fit inline-flex items-center justify-center gap-1.5 min-h-[44px] px-3 rounded-xl text-sm font-bold transition duration-300', cat === v ? 'bg-surface shadow-card text-[rgb(var(--accent))]' : 'text-muted')}>
                <I size={16} aria-hidden /> {k ? t(k) : tx.catLearn}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
            {shown.map((g) => (
              <button key={g.id} onClick={() => start(g)} className={cx('tile min-h-[150px] flex flex-col items-center justify-center gap-3 anim-in', g.tile)}>
                <span className="relative z-[1] w-20 h-20 rounded-full bg-white/25 flex items-center justify-center text-5xl" aria-hidden>{g.e}</span>
                <span className="relative z-[1] font-extrabold text-center px-2">{name(g)}</span>
              </button>
            ))}
          </div>
          <label className="card p-4 flex items-center gap-3"><Volume1 aria-hidden /><span className="sr-only">{t('volume')}</span>
            <input type="range" min={0} max={1} step={0.05} value={volume} onChange={(e) => setVolume(+e.target.value)} className="slider flex-1" aria-label={t('volume')} /><Volume2 aria-hidden /></label>
          <p className="text-sm text-muted mt-3">{t('playExitHint')}</p>
        </main>
      ) : (
        <div className="fixed inset-0 overflow-hidden">
          {ready === game.id ? <game.C vol={gameMuted && !game.essential ? 0 : volume} /> : (
            <div className="absolute inset-0 bg-bg flex items-end sm:items-center justify-center">
              <div className={cx('absolute inset-0 opacity-60', game.tile)} aria-hidden />
              <div role="dialog" aria-modal="true" aria-labelledby="howto" className="relative w-full sm:max-w-md bg-surface rounded-t-[2rem] sm:rounded-[2rem] p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-lift anim-sheet flex flex-col items-center text-center gap-3">
                <span className={cx('tile w-24 h-24 !rounded-full flex items-center justify-center text-5xl -mt-16 shadow-lift', game.tile)} aria-hidden>{game.e}</span>
                <h2 id="howto" className="text-2xl font-extrabold">{name(game)}</h2>
                <p className="eyebrow">{tx.howToPlay}</p>
                <p className="text-lg leading-relaxed">{GAME_TEXT[game.id][lang][1]}</p>
                {!game.essential && (
                  <button role="switch" aria-checked={!gameMuted} onClick={() => setGameMuted(!gameMuted)} className="chip !min-h-[48px] !px-4 gap-2">
                    {gameMuted ? <VolumeX size={20} aria-hidden /> : <Volume2 size={20} aria-hidden />} {tx.sound}: {gameMuted ? tx.off : tx.on}
                  </button>
                )}
                <button className="btn-primary w-full !min-h-[60px] text-lg mt-2" onClick={() => begin(game)}><PlayIcon size={22} fill="currentColor" aria-hidden /> {tx.letsPlay}</button>
              </div>
            </div>
          )}
          {ready === game.id && !game.essential && (
            <button onClick={() => setGameMuted(!gameMuted)} aria-label={tx.sound} aria-pressed={!gameMuted} className="fixed top-3 right-[4.75rem] z-10 w-14 h-14 rounded-full bg-black/25 text-white flex items-center justify-center">
              {gameMuted ? <VolumeX size={20} aria-hidden /> : <Volume2 size={20} aria-hidden />}
            </button>
          )}
          <LongPress onDone={exit} label={t('holdToExit')} className="fixed top-3 right-3 z-10 w-14 h-14 rounded-full bg-black/25 text-white flex items-center justify-center"><LogOut size={20} aria-hidden /></LongPress>
        </div>
      )}
    </div>
  );
}
