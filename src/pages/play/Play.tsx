import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, LogOut, Volume1, Volume2 } from 'lucide-react';
import { useT } from '../../i18n';
import { LongPress, useWakeLock } from '../../components/ui';
import { useUI } from '../../lib/store';
import { PENTA, tone } from '../../lib/audio';

type Game = 'bubbles' | 'music' | 'peek' | 'sea';
const HUES = ['#7FC8C1', '#A7CF8A', '#F2A98C', '#C7A9DB', '#9FB0E3', '#F3D08A'];
let uid = 0;

function useAnyInput(fn: (x: number, y: number) => void) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.repeat) return; fn(Math.random() * innerWidth, Math.random() * innerHeight * 0.8 + 40); };
    addEventListener('keydown', k); return () => removeEventListener('keydown', k);
  }, [fn]);
}

function Bubbles({ vol }: { vol: number }) {
  const [items, setItems] = useState<{ id: number; x: number; y: number; c: string; s: number; burst: boolean }[]>([]);
  const add = useCallback((x: number, y: number) => {
    const n = 5;
    const fresh = Array.from({ length: n }, (_, i) => ({ id: ++uid, x: x + (Math.random() - 0.5) * 120, y: y + (Math.random() - 0.5) * 60, c: HUES[(uid + i) % HUES.length], s: 40 + Math.random() * 70, burst: i === 0 }));
    setItems((it) => [...it.slice(-40), ...fresh]);
    tone(PENTA[Math.floor(Math.random() * PENTA.length)], 0.9, vol);
    setTimeout(() => setItems((it) => it.filter((b) => !fresh.includes(b))), 6000);
  }, [vol]);
  useAnyInput(add);
  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: 'linear-gradient(#20324a,#3b5876)' }} onPointerDown={(e) => add(e.clientX, e.clientY)}>
      {items.map((b) => b.burst
        ? <span key={b.id} className="absolute rounded-full pointer-events-none" style={{ left: b.x, top: b.y, width: 160, height: 160, background: `radial-gradient(circle, ${b.c}cc, transparent 70%)`, animation: 'burst 1.4s ease-out forwards' }} />
        : <span key={b.id} className="absolute rounded-full pointer-events-none border-2 border-white/60" style={{ left: b.x, top: b.y, width: b.s, height: b.s, background: `radial-gradient(circle at 30% 30%, #fff9, ${b.c}88)`, animation: `floaty ${5 + Math.random() * 3}s linear forwards` }} />)}
    </div>
  );
}

function Music({ vol }: { vol: number }) {
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

const PEEK = ['🐘', '🐱', '🐶', '🦜', '🐢', '🐰', '🐟', '⭐', '🌙', '🌼'];
function Peek({ vol }: { vol: number }) {
  const [i, setI] = useState(0);
  const [shown, setShown] = useState(false);
  const tap = useCallback(() => {
    if (shown) { setShown(false); setI((x) => (x + 1) % PEEK.length); tone(PENTA[2], 0.5, vol * 0.7); }
    else { setShown(true); tone(PENTA[5], 0.4, vol); tone(PENTA[7], 0.6, vol, 'sine', 0.15); }
  }, [shown, vol]);
  useAnyInput(tap);
  return (
    <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'linear-gradient(#cfe8f5,#f6efe2)' }} onPointerDown={tap}>
      <span className="transition-all duration-500" style={{ fontSize: 'min(55vw, 55vh)', transform: shown ? 'scale(1)' : 'scale(0.3)', opacity: shown ? 1 : 0 }} aria-hidden>{PEEK[i]}</span>
      <span className="absolute transition-all duration-500" style={{ fontSize: 'min(60vw, 60vh)', opacity: shown ? 0 : 1, transform: shown ? 'translateY(-40vh)' : 'none' }} aria-hidden>☁️</span>
    </div>
  );
}

const FISH = ['🐠', '🐟', '🐡', '🐠', '🐟'];
function Sea({ vol }: { vol: number }) {
  const [rip, setRip] = useState<{ id: number; x: number; y: number }[]>([]);
  const add = useCallback((x: number, y: number) => { const r = { id: ++uid, x, y }; setRip((a) => [...a.slice(-10), r]); tone(PENTA[3 + Math.floor(Math.random() * 5)], 1.5, vol * 0.6); setTimeout(() => setRip((a) => a.filter((z) => z !== r)), 1500); }, [vol]);
  useAnyInput(add);
  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: 'linear-gradient(#0f3b57,#13597a 60%,#1b6f86)' }} onPointerDown={(e) => add(e.clientX, e.clientY)}>
      {Array.from({ length: 14 }, (_, i) => <span key={'l' + i} className="absolute rounded-full" style={{ left: `${(i * 37) % 100}%`, top: `${(i * 53) % 100}%`, width: 10 + (i % 4) * 6, height: 10 + (i % 4) * 6, background: '#fff6c8', filter: 'blur(2px)', animation: `glow ${4 + (i % 5)}s ease-in-out ${i * 0.4}s infinite` }} />)}
      {FISH.map((f, i) => <span key={i} className="absolute" style={{ top: `${15 + i * 16}%`, fontSize: 56 + (i % 3) * 18, animation: `swim ${18 + i * 5}s linear ${-i * 4}s infinite`, transform: 'scaleX(-1)' }} aria-hidden>{f}</span>)}
      {rip.map((r) => <span key={r.id} className="absolute rounded-full border-4 border-white/70 pointer-events-none" style={{ left: r.x, top: r.y, width: 120, height: 120, animation: 'burst 1.5s ease-out forwards' }} />)}
    </div>
  );
}

export default function Play() {
  const { t } = useT();
  const nav = useNavigate();
  const { volume, setVolume } = useUI();
  const [game, setGame] = useState<Game | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  useWakeLock(!!game);
  const start = async (g: Game) => { setGame(g); try { await ref.current?.requestFullscreen?.(); } catch { /* */ } };
  const exit = async () => { setGame(null); try { if (document.fullscreenElement) await document.exitFullscreen(); } catch { /* */ } };
  const games: { g: Game; e: string; l: string; bg: string }[] = [
    { g: 'bubbles', e: '🫧', l: t('gameBubbles'), bg: '#3b5876' }, { g: 'music', e: '🎵', l: t('gameMusic'), bg: '#74548A' },
    { g: 'peek', e: '🐘', l: t('gamePeek'), bg: '#1E6B66' }, { g: 'sea', e: '🐠', l: t('gameSea'), bg: '#13597a' },
  ];
  return (
    <div ref={ref} className="min-h-screen bg-bg select-none touch-manipulation">
      {!game ? (
        <main id="main" className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center gap-2 mb-2"><button className="icon-btn" onClick={() => nav(-1)} aria-label={t('back')}><ArrowLeft /></button><h1 className="text-2xl font-extrabold">{t('navPlay')}</h1></div>
          <p className="text-muted mb-4">{t('playIntro')}</p>
          <div className="grid grid-cols-2 gap-3 mb-6">
            {games.map(({ g, e, l, bg }) => <button key={g} onClick={() => start(g)} className="rounded-3xl min-h-[160px] text-white flex flex-col items-center justify-center gap-2 shadow-card" style={{ background: bg }}><span className="text-6xl" aria-hidden>{e}</span><span className="font-extrabold text-lg">{l}</span></button>)}
          </div>
          <label className="card p-4 flex items-center gap-3"><Volume1 aria-hidden /><span className="sr-only">{t('volume')}</span>
            <input type="range" min={0} max={1} step={0.05} value={volume} onChange={(e) => setVolume(+e.target.value)} className="flex-1 accent-[rgb(var(--accent))] h-12" aria-label={t('volume')} /><Volume2 aria-hidden /></label>
          <p className="text-sm text-muted mt-3">{t('playExitHint')}</p>
        </main>
      ) : (
        <div className="fixed inset-0">
          {game === 'bubbles' && <Bubbles vol={volume} />}
          {game === 'music' && <Music vol={volume} />}
          {game === 'peek' && <Peek vol={volume} />}
          {game === 'sea' && <Sea vol={volume} />}
          <LongPress onDone={exit} label={t('holdToExit')} className="fixed top-3 right-3 z-10 w-14 h-14 rounded-full bg-black/25 text-white flex items-center justify-center"><LogOut size={20} aria-hidden /></LongPress>
        </div>
      )}
    </div>
  );
}
