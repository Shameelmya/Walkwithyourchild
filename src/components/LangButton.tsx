import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Scrim } from './ui';
import { Globe, Check } from 'lucide-react';
import { LANGS, useUI } from '../lib/store';
import { useT } from '../i18n';
import { cx } from '../lib/util';
import { usePresence } from '../lib/hooks';
import { useBackToClose } from '../lib/nav';

/** Small language icon. Tap to open the three choices; switching is instant everywhere. */
export function LangButton({ className = '', up = false, light = false }: { className?: string; up?: boolean; light?: boolean }) {
  const { t, lang } = useT();
  const setLang = useUI((s) => s.setLang);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { mounted, closing } = usePresence(open, 200);
  useBackToClose(open, () => setOpen(false));
  const [pos, setPos] = useState({ top: 0, right: 0, bottom: 0 });
  const btn = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const f = (e: Event) => { if (!ref.current?.contains(e.target as Node) && !menu.current?.contains(e.target as Node)) setOpen(false); };
    const k = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('pointerdown', f); addEventListener('keydown', k);
    return () => { document.removeEventListener('pointerdown', f); removeEventListener('keydown', k); };
  }, [open]);
  return (
    <div ref={ref} className={cx('relative', className)}>
      <button ref={btn} type="button" aria-haspopup="menu" aria-expanded={open} aria-label={t('switchLanguage')} onClick={() => { const r = btn.current!.getBoundingClientRect(); setPos({ top: r.bottom + 8, right: innerWidth - r.right, bottom: innerHeight - r.top + 8 }); setOpen(!open); }}
        className={cx('relative inline-flex items-center justify-center w-[46px] h-[46px] shrink-0 rounded-2xl transition', light ? 'bg-white/20 text-white hover:bg-white/30' : 'bg-surface border border-line/60 shadow-card text-ink hover:bg-surface2')}>
        <Globe size={21} aria-hidden />
        <span className={cx('absolute -bottom-1 -right-1 min-w-[22px] h-[22px] px-1 rounded-full text-[0.7rem] font-extrabold flex items-center justify-center', light ? 'bg-white text-[rgb(var(--accent))]' : 'bg-accent text-onaccent')}>{LANGS.find((l) => l.v === lang)!.short}</span>
      </button>
      <Scrim open={open} onClose={() => setOpen(false)} z="z-[65]" />
      {mounted && createPortal(
        <div ref={menu} role="menu" style={up ? { bottom: pos.bottom, right: pos.right } : { top: pos.top, right: pos.right }} className={cx('fixed z-[70] w-52 glass-panel rounded-3xl shadow-2xl border border-line/60 p-1.5', closing ? 'anim-zoom-out' : 'anim-zoom', up ? 'origin-bottom-right' : 'origin-top-right')}>
          {LANGS.map((l) => (
            <button key={l.v} role="menuitemradio" aria-checked={lang === l.v} lang={l.v} onClick={() => { setLang(l.v); setOpen(false); }}
              className={cx('w-full flex items-center gap-3 px-3 min-h-[48px] rounded-xl text-left font-bold text-ink', lang === l.v ? 'bg-soft' : 'hover:bg-surface2')}>
              <span className="w-8 h-8 rounded-full bg-surface2 flex items-center justify-center text-sm">{l.short}</span>
              <span className="flex-1">{l.native}</span>{lang === l.v && <Check size={18} className="text-[rgb(var(--accent))]" aria-hidden />}
            </button>
          ))}
        </div>, document.body,
      )}
    </div>
  );
}
