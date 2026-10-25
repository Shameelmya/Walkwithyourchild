import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Moon, Sun, Check } from 'lucide-react';
import { useUI, FONT_STEPS, type Theme } from '../lib/store';
import { useT } from '../i18n';
import { cx } from '../lib/util';
import { usePresence } from '../lib/hooks';
import { useBackToClose } from '../lib/nav';
import { Scrim } from './ui';

const chip = 'relative inline-flex items-center justify-center w-[44px] h-[44px] shrink-0 rounded-2xl bg-surface border border-line/60 shadow-card text-ink hover:bg-surface2 transition active:scale-95';
let lastLight: Theme = 'white';

/** One tap between light and dark; comes back to the light look you had. */
export function ThemeButton() {
  const { t } = useT();
  const { theme, setTheme } = useUI();
  const dark = theme === 'night';
  return (
    <button type="button" className={chip} aria-label={t('darkMode')} aria-pressed={dark} onClick={() => { if (dark) setTheme(lastLight); else { lastLight = theme; setTheme('night'); } }}>
      {dark ? <Sun size={20} aria-hidden /> : <Moon size={20} aria-hidden />}
    </button>
  );
}

/** "Aa" opens a small row of sizes. */
export function TextSizeButton() {
  const { t } = useT();
  const { fontScale, setFontScale } = useUI();
  const [open, setOpen] = useState(false);
  const { mounted, closing } = usePresence(open, 200);
  useBackToClose(open, () => setOpen(false));
  const btn = useRef<HTMLButtonElement>(null);
  const [pos, setPos] = useState({ top: 0, right: 12 });
  useEffect(() => { if (!open) return; const k = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false); addEventListener('keydown', k); return () => removeEventListener('keydown', k); }, [open]);
  return (
    <>
      <button ref={btn} type="button" className={chip} aria-label={t('textSize')} aria-haspopup="dialog" aria-expanded={open}
        onClick={() => { const r = btn.current!.getBoundingClientRect(); setPos({ top: r.bottom + 8, right: 12 }); setOpen(!open); }}>
        <span className="font-extrabold leading-none" aria-hidden><span style={{ fontSize: 13 }}>A</span><span style={{ fontSize: 19 }}>A</span></span>
      </button>
      <Scrim open={open} onClose={() => setOpen(false)} z="z-[65]" />
      {mounted && createPortal(
        <div role="dialog" aria-label={t('textSize')} style={{ top: pos.top, right: pos.right }} className={cx('fixed z-[70] glass-panel rounded-3xl shadow-2xl border border-line/60 p-1.5 flex gap-1 origin-top-right', closing ? 'anim-zoom-out' : 'anim-zoom')}>
          {FONT_STEPS.map((f, i) => (
            <button key={f} role="radio" aria-checked={fontScale === f} aria-label={`${Math.round(f * 100)}%`} onClick={() => setFontScale(f)}
              className={cx('w-[48px] h-[48px] rounded-2xl flex items-center justify-center font-extrabold text-ink relative', fontScale === f ? 'bg-soft text-[rgb(var(--accent))]' : 'hover:bg-surface2')}>
              <span style={{ fontSize: 13 + i * 4 }} className="leading-none">A</span>
              {fontScale === f && <Check size={12} className="absolute bottom-1 end-1" aria-hidden />}
            </button>
          ))}
        </div>, document.body,
      )}
    </>
  );
}
