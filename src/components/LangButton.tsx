import { useEffect, useRef, useState } from 'react';
import { Languages, Check } from 'lucide-react';
import { LANGS, useUI } from '../lib/store';
import { useT } from '../i18n';
import { cx } from '../lib/util';

/** Small language icon. Tap to open the three choices; switching is instant everywhere. */
export function LangButton({ className = '', up = false, light = false }: { className?: string; up?: boolean; light?: boolean }) {
  const { t, lang } = useT();
  const setLang = useUI((s) => s.setLang);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const f = (e: Event) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const k = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('pointerdown', f); addEventListener('keydown', k);
    return () => { document.removeEventListener('pointerdown', f); removeEventListener('keydown', k); };
  }, [open]);
  return (
    <div ref={ref} className={cx('relative', className)}>
      <button type="button" aria-haspopup="menu" aria-expanded={open} aria-label={t('switchLanguage')} onClick={() => setOpen(!open)}
        className={cx('relative inline-flex items-center justify-center w-12 h-12 rounded-2xl transition', light ? 'bg-white/20 text-white hover:bg-white/30' : 'bg-surface border border-line/60 shadow-card text-ink hover:bg-surface2')}>
        <Languages size={21} aria-hidden />
        <span className={cx('absolute -bottom-1 -right-1 min-w-[22px] h-[22px] px-1 rounded-full text-[0.7rem] font-extrabold flex items-center justify-center', light ? 'bg-white text-[rgb(var(--accent))]' : 'bg-accent text-onaccent')}>{LANGS.find((l) => l.v === lang)!.short}</span>
      </button>
      {open && (
        <div role="menu" className={cx('absolute right-0 z-[70] w-48 card p-1.5 anim-sheet', up ? 'bottom-14' : 'top-14')}>
          {LANGS.map((l) => (
            <button key={l.v} role="menuitemradio" aria-checked={lang === l.v} lang={l.v} onClick={() => { setLang(l.v); setOpen(false); }}
              className={cx('w-full flex items-center gap-3 px-3 min-h-[48px] rounded-xl text-left font-bold text-ink', lang === l.v ? 'bg-soft' : 'hover:bg-surface2')}>
              <span className="w-8 h-8 rounded-full bg-surface2 flex items-center justify-center text-sm">{l.short}</span>
              <span className="flex-1">{l.native}</span>{lang === l.v && <Check size={18} className="text-[rgb(var(--accent))]" aria-hidden />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
