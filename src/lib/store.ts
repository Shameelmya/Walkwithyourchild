import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/** Every language the app can hold. Only those listed in LANGS are offered to the reader; the rest are added one at a time. */
export type Lang = 'en' | 'ml' | 'kn' | 'hi' | 'ta' | 'te' | 'bn' | 'ur';
export const RTL_LANGS: Lang[] = ['ur'];
export const isRtl = (l: Lang) => RTL_LANGS.includes(l);
export const LANGS: { v: Lang; native: string; short: string }[] = [
  { v: 'en', native: 'English', short: 'EN' },
  { v: 'ml', native: 'മലയാളം', short: 'മ' },
  { v: 'kn', native: 'ಕನ್ನಡ', short: 'ಕ' },
  { v: 'ta', native: 'தமிழ்', short: 'த' },
  { v: 'te', native: 'తెలుగు', short: 'తె' },
  { v: 'bn', native: 'বাংলা', short: 'বা' },
  { v: 'ur', native: 'اردو', short: 'ا' },
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
  gameMuted: boolean;
  voices: Partial<Record<Lang, string>>;
  speechRate: number;
  setVoice: (l: Lang, uri: string) => void;
  setSpeechRate: (r: number) => void;
  setGameMuted: (m: boolean) => void;
  setLang: (l: Lang) => void;
  setTheme: (t: Theme) => void;
  setFontScale: (f: number) => void;
  setActiveChild: (id: number) => void;
  setTalkGrid: (g: 2 | 3 | 4) => void;
  setVolume: (v: number) => void;
}

const initialTheme = (): Theme => (typeof matchMedia !== 'undefined' && matchMedia('(prefers-color-scheme: dark)').matches ? 'night' : 'white');

export const useUI = create<UI>()(
  persist(
    (set) => ({
      lang: 'en',
      theme: initialTheme(),
      fontScale: FONT_STEPS[0],
      activeChildId: 0,
      brightness: 1,
      setBrightness: (brightness) => set({ brightness }),
      talkGrid: 3,
      volume: 0.6,
      gameMuted: false,
      voices: {},
      speechRate: 1,
      setVoice: (l, uri) => set((st) => ({ voices: { ...st.voices, [l]: uri } })),
      setSpeechRate: (speechRate) => set({ speechRate }),
      setGameMuted: (gameMuted) => set({ gameMuted }),
      setLang: (lang) => set({ lang }),
      setTheme: (theme) => set({ theme }),
      setFontScale: (fontScale) => set({ fontScale }),
      setActiveChild: (activeChildId) => set({ activeChildId }),
      setTalkGrid: (talkGrid) => set({ talkGrid }),
      setVolume: (volume) => set({ volume }),
    }),
    {
      name: 'wwyc-ui',
      version: 2,
      // v1: the soft white theme became the default look; move earlier installs off the old default.
      // v2: the smallest text size is the default; move earlier installs off the old default.
      migrate: (state, from) => { const s = state as UI; if (from < 1 && s.theme === 'paper') s.theme = 'white'; if (from < 2 && s.fontScale === 1) s.fontScale = FONT_STEPS[0]; return s; },
    },
  ),
);

export function applyUI(s: Pick<UI, 'lang' | 'theme' | 'fontScale'>) {
  const d = document.documentElement;
  d.lang = s.lang;
  d.dir = isRtl(s.lang) ? 'rtl' : 'ltr';
  d.dataset.theme = s.theme;
  d.style.fontSize = `${16 * s.fontScale * (s.lang !== 'en' ? 1.05 : 1)}px`;
  const bg = getComputedStyle(d).getPropertyValue('--bg').trim().split(/\s+/).map(Number);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta && bg.length === 3) meta.setAttribute('content', `rgb(${bg.join(',')})`);
}
