import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Lang = 'en' | 'ml' | 'kn';
export const LANGS: { v: Lang; native: string; short: string }[] = [
  { v: 'en', native: 'English', short: 'EN' },
  { v: 'ml', native: 'മലയാളം', short: 'മ' },
  { v: 'kn', native: 'ಕನ್ನಡ', short: 'ಕ' },
];
export const indic = (l: Lang) => l !== 'en';
export type Theme = 'white' | 'paper' | 'comfort' | 'night';
export const FONT_STEPS = [0.9, 1, 1.15, 1.3, 1.5] as const;

interface UI {
  lang: Lang;
  theme: Theme;
  fontScale: number;
  activeChildId: number;
  brightness: number;
  setBrightness: (b: number) => void;
  talkGrid: 2 | 3 | 4;
  volume: number;
  setLang: (l: Lang) => void;
  setTheme: (t: Theme) => void;
  setFontScale: (f: number) => void;
  setActiveChild: (id: number) => void;
  setTalkGrid: (g: 2 | 3 | 4) => void;
  setVolume: (v: number) => void;
}

const initialTheme = (): Theme => (typeof matchMedia !== 'undefined' && matchMedia('(prefers-color-scheme: dark)').matches ? 'night' : 'paper');

export const useUI = create<UI>()(
  persist(
    (set) => ({
      lang: 'en',
      theme: initialTheme(),
      fontScale: 1,
      activeChildId: 0,
      brightness: 1,
      setBrightness: (brightness) => set({ brightness }),
      talkGrid: 3,
      volume: 0.6,
      setLang: (lang) => set({ lang }),
      setTheme: (theme) => set({ theme }),
      setFontScale: (fontScale) => set({ fontScale }),
      setActiveChild: (activeChildId) => set({ activeChildId }),
      setTalkGrid: (talkGrid) => set({ talkGrid }),
      setVolume: (volume) => set({ volume }),
    }),
    { name: 'wwyc-ui' },
  ),
);

export function applyUI(s: Pick<UI, 'lang' | 'theme' | 'fontScale'>) {
  const d = document.documentElement;
  d.lang = s.lang;
  d.dataset.theme = s.theme;
  d.style.fontSize = `${16 * s.fontScale * (s.lang !== 'en' ? 1.05 : 1)}px`;
  const bg = getComputedStyle(d).getPropertyValue('--bg').trim().split(/\s+/).map(Number);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta && bg.length === 3) meta.setAttribute('content', `rgb(${bg.join(',')})`);
}
