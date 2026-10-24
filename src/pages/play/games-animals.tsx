import { useEffect, useState } from 'react';
import { animal, preloadAnimals } from '../../lib/audio';
import { useUI } from '../../lib/store';
import { cx } from '../../lib/util';
import { ANIMALS, GROUPS, type Group } from './animals';
import { HUES, useAnyInput } from './shared';

/** Tap an animal and it calls out: the cat meows, the lion roars. Its name and sound appear big. */
export function AnimalSounds({ vol }: { vol: number }) {
  const lang = useUI((s) => s.lang);
  const [g, setG] = useState<Group>('farm');
  useEffect(() => { preloadAnimals(); }, []);
  const [on, setOn] = useState<{ id: string; k: number } | null>(null);
  const list = ANIMALS.filter((a) => a.g === g);
  const call = (id: string) => { animal(id, vol); setOn({ id, k: Date.now() }); try { navigator.vibrate?.(30); } catch { /* */ } };
  useAnyInput(() => call(list[Math.floor(Math.random() * list.length)].id));
  const a = on && ANIMALS.find((x) => x.id === on.id);
  const bg = { farm: 'linear-gradient(#dff2ff,#f3fbe6)', wild: 'linear-gradient(#e2f5df,#f6efd8)', birds: 'linear-gradient(#e7f0ff,#fdf3ff)', water: 'linear-gradient(#d8f0ff,#c4e4f7)' }[g];
  return (
    <div className="absolute inset-0 flex flex-col overflow-hidden" style={{ background: bg }}>
      <div className="flex gap-2 p-3 pr-36 overflow-x-auto no-scrollbar" role="tablist">
        {GROUPS.map((x) => (
          <button key={x.g} role="tab" aria-selected={g === x.g} onClick={() => setG(x.g)}
            className={cx('shrink-0 h-12 px-4 rounded-2xl font-extrabold text-sm flex items-center gap-1.5 transition', g === x.g ? 'bg-white shadow-card text-[#1d2430]' : 'bg-white/50 text-[#1d2430]/70')}>
            <span className="text-xl" aria-hidden>{x.e}</span>{x.name[lang]}
          </button>
        ))}
      </div>
      <div className="h-24 flex items-center justify-center px-4" aria-live="polite">
        {a && <p key={on!.k} className="anim-zoom text-center"><span className="block text-3xl font-extrabold text-[#1d2430]">{a.says[lang]}</span><span className="block text-sm font-bold text-[#1d2430]/70 capitalize">{a.name[lang]}</span></p>}
      </div>
      <div className="flex-1 overflow-y-auto px-3 pb-6">
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {list.map((x, i) => (
            <button key={x.id} aria-label={x.name[lang]} onClick={() => call(x.id)}
              className="aspect-square rounded-3xl bg-white/80 shadow-card flex flex-col items-center justify-center gap-1 active:scale-95 transition"
              style={{ boxShadow: on?.id === x.id ? `0 0 0 4px ${HUES[i % HUES.length]}` : undefined }}>
              <span key={on?.id === x.id ? on.k : 0} className="text-[3.4rem] leading-none" style={{ animation: on?.id === x.id ? 'wiggle .5s' : undefined }} aria-hidden>{x.e}</span>
              <span className="text-xs font-bold text-[#1d2430]/70 capitalize">{x.name[lang]}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
