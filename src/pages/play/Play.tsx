import { useRef, useState, type ComponentType } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, LogOut, Volume1, Volume2, Music2, Palette, Move, LayoutGrid } from 'lucide-react';
import { useT, type TKey } from '../../i18n';
import { LongPress, useWakeLock } from '../../components/ui';
import { useUI } from '../../lib/store';
import { LangButton } from '../../components/LangButton';
import { cx } from '../../lib/util';
import { Music, Drums, Xylophone, Chimes } from './games-sound';
import { Bubbles, Colouring, Paint, Fireworks, Lights } from './games-colour';
import { Peek, Sea, Balloons, Rub, Tilt, StarFollow, Maracas } from './games-move';

type Cat = 'sound' | 'colour' | 'move';
interface Game { id: string; e: string; k: TKey; cat: Cat; tile: string; C: ComponentType<{ vol: number }> }
const GAMES: Game[] = [
  { id: 'colouring', e: '🖍️', k: 'gameColouring', cat: 'colour', tile: 't-coral', C: Colouring },
  { id: 'paint', e: '🎨', k: 'gamePaint', cat: 'colour', tile: 't-violet', C: Paint },
  { id: 'bubbles', e: '🫧', k: 'gameBubbles', cat: 'colour', tile: 't-blue', C: Bubbles },
  { id: 'fireworks', e: '🎆', k: 'gameFireworks', cat: 'colour', tile: 't-violet', C: Fireworks },
  { id: 'lights', e: '🌈', k: 'gameLights', cat: 'colour', tile: 't-amber', C: Lights },
  { id: 'music', e: '🎹', k: 'gameMusic', cat: 'sound', tile: 't-violet', C: Music },
  { id: 'drums', e: '🥁', k: 'gameDrums', cat: 'sound', tile: 't-coral', C: Drums },
  { id: 'xylophone', e: '🎼', k: 'gameXylophone', cat: 'sound', tile: 't-mint', C: Xylophone },
  { id: 'chimes', e: '🎐', k: 'gameChimes', cat: 'sound', tile: 't-blue', C: Chimes },
  { id: 'maracas', e: '🪇', k: 'gameMaracas', cat: 'move', tile: 't-amber', C: Maracas },
  { id: 'balloons', e: '🎈', k: 'gameBalloons', cat: 'move', tile: 't-rose', C: Balloons },
  { id: 'rub', e: '☁️', k: 'gameRub', cat: 'move', tile: 't-blue', C: Rub },
  { id: 'tilt', e: '🔵', k: 'gameTilt', cat: 'move', tile: 't-mint', C: Tilt },
  { id: 'star', e: '⭐', k: 'gameStar', cat: 'move', tile: 't-violet', C: StarFollow },
  { id: 'peek', e: '🐘', k: 'gamePeek', cat: 'move', tile: 't-green', C: Peek },
  { id: 'sea', e: '🐠', k: 'gameSea', cat: 'move', tile: 't-mint', C: Sea },
];
const CATS: { v: Cat | 'all'; k: TKey; I: typeof Music2 }[] = [
  { v: 'all', k: 'all', I: LayoutGrid }, { v: 'colour', k: 'catColour', I: Palette }, { v: 'sound', k: 'catSound', I: Music2 }, { v: 'move', k: 'catMove', I: Move },
];

export default function Play() {
  const { t } = useT();
  const nav = useNavigate();
  const { volume, setVolume } = useUI();
  const [game, setGame] = useState<Game | null>(null);
  const [cat, setCat] = useState<Cat | 'all'>('all');
  const ref = useRef<HTMLDivElement>(null);
  useWakeLock(!!game);
  const start = async (g: Game) => { setGame(g); try { await ref.current?.requestFullscreen?.(); } catch { /* */ } };
  const exit = async () => { setGame(null); try { if (document.fullscreenElement) await document.exitFullscreen(); } catch { /* */ } };
  const shown = GAMES.filter((g) => cat === 'all' || g.cat === cat);
  return (
    <div ref={ref} className="min-h-screen bg-bg select-none touch-manipulation">
      {!game ? (
        <main id="main" className="max-w-4xl mx-auto px-4 py-4 pb-16 anim-in">
          <div className="flex items-center gap-3 mb-4"><button className="icon-chip" onClick={() => nav(-1)} aria-label={t('back')}><ArrowLeft size={20} /></button><h1 className="flex-1 text-[1.65rem] font-extrabold">{t('navPlay')}</h1><LangButton /></div>
          <div role="tablist" aria-label={t('filter')} className="flex gap-2 p-1 rounded-2xl bg-surface2 mb-5 overflow-x-auto no-scrollbar">
            {CATS.map(({ v, k, I }) => (
              <button key={v} role="tab" aria-selected={cat === v} onClick={() => setCat(v)} className={cx('flex-1 min-w-fit inline-flex items-center justify-center gap-1.5 min-h-[44px] px-3 rounded-xl text-sm font-bold transition duration-300', cat === v ? 'bg-surface shadow-card text-[rgb(var(--accent))]' : 'text-muted')}>
                <I size={16} aria-hidden /> {t(k)}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
            {shown.map((g) => (
              <button key={g.id} onClick={() => start(g)} className={cx('tile min-h-[150px] flex flex-col items-center justify-center gap-3 anim-in', g.tile)}>
                <span className="relative z-[1] w-20 h-20 rounded-full bg-white/25 flex items-center justify-center text-5xl" aria-hidden>{g.e}</span>
                <span className="relative z-[1] font-extrabold">{t(g.k)}</span>
              </button>
            ))}
          </div>
          <label className="card p-4 flex items-center gap-3"><Volume1 aria-hidden /><span className="sr-only">{t('volume')}</span>
            <input type="range" min={0} max={1} step={0.05} value={volume} onChange={(e) => setVolume(+e.target.value)} className="slider flex-1" aria-label={t('volume')} /><Volume2 aria-hidden /></label>
          <p className="text-sm text-muted mt-3">{t('playExitHint')}</p>
        </main>
      ) : (
        <div className="fixed inset-0 overflow-hidden">
          <game.C vol={volume} />
          <LongPress onDone={exit} label={t('holdToExit')} className="fixed top-3 right-3 z-10 w-14 h-14 rounded-full bg-black/25 text-white flex items-center justify-center"><LogOut size={20} aria-hidden /></LongPress>
        </div>
      )}
    </div>
  );
}
