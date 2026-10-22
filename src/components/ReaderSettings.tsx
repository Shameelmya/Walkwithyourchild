import { useT } from '../i18n';
import { useUI, FONT_STEPS, type Theme } from '../lib/store';
import { meta } from '../lib/content';
import { Seg } from './ui';

export function DisplaySettings() {
  const { t, lang } = useT();
  const { theme, setTheme, fontScale, setFontScale, setLang } = useUI();
  const themes: Theme[] = ['white', 'paper', 'comfort', 'night'];
  const sw: Record<Theme, string> = { white: '#ffffff', paper: '#F6EFE2', comfort: '#EDE1CA', night: '#121417' };
  return (
    <div className="grid gap-5">
      <div><p className="label">{meta.reader.language[lang]}</p>
        <Seg label={meta.reader.language[lang]} value={lang} onChange={setLang} options={[{ v: 'en', l: 'English' }, { v: 'ml', l: <span lang="ml">മലയാളം</span> }]} /></div>
      <div><p className="label">{meta.reader.fontSize[lang]}</p>
        <div role="radiogroup" aria-label={meta.reader.fontSize[lang]} className="flex gap-2">
          {FONT_STEPS.map((f) => (
            <button key={f} role="radio" aria-checked={fontScale === f} aria-label={`${Math.round(f * 100)}%`} onClick={() => setFontScale(f)}
              className={`chip !px-0 w-12 justify-center ${fontScale === f ? 'chip-on' : ''}`} style={{ fontSize: `${0.7 + (f - 0.9) * 1.1}rem` }}>A</button>
          ))}
        </div></div>
      <div><p className="label">{meta.reader.theme[lang]}</p>
        <div role="radiogroup" aria-label={meta.reader.theme[lang]} className="grid grid-cols-4 gap-2">
          {themes.map((th) => (
            <button key={th} role="radio" aria-checked={theme === th} onClick={() => setTheme(th)} className={`rounded-xl border-2 p-2 flex flex-col items-center gap-1 min-h-[72px] text-xs font-bold ${theme === th ? 'border-accent' : 'border-line'}`}>
              <span className="w-8 h-8 rounded-full border border-line" style={{ background: sw[th] }} aria-hidden />{meta.reader.themes[th][lang]}
            </button>
          ))}
        </div></div>
      <p className="text-xs text-muted">{t('displayAppWide')}</p>
    </div>
  );
}
