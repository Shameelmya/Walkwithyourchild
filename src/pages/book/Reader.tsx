import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { Bookmark, BookmarkCheck, List, Volume2, Square, Sun, SunDim, Info, Clock, Siren, SlidersHorizontal } from 'lucide-react';
import { ArrowLeft, ArrowRight } from '../../components/icons';
import { useT } from '../../i18n';
import { loadBook, loc, meta, partColor, toc, type Book } from '../../lib/content';
import { useUI, type Theme } from '../../lib/store';
import { LangButton } from '../../components/LangButton';
import { TextSizeButton, ThemeButton } from '../../components/HeaderTools';
import { getReading, savePosition, toggleBookmark } from '../../lib/reading';
import { BlockView } from '../../components/Blocks';
import { Modal, useToast, Scrim } from '../../components/ui';
import { TocList } from './Contents';
import { speakQueue, stopSpeaking, voicesFor } from '../../lib/audio';
import { cx } from '../../lib/util';
import { usePresence } from '../../lib/hooks';
import { useBackToClose } from '../../lib/nav';

function useHasVoice(lang: string) {
  const [has, setHas] = useState(() => voicesFor(lang).length > 0);
  useEffect(() => {
    if (!('speechSynthesis' in window)) return;
    const f = () => setHas(voicesFor(lang).length > 0); f();
    speechSynthesis.addEventListener('voiceschanged', f);
    return () => speechSynthesis.removeEventListener('voiceschanged', f);
  }, [lang]);
  return has;
}

/** The reading menu keeps the same size whatever the text size is set to. */
const unscale = (f: number, lang: string) => 1 / (f * (lang !== 'en' ? 1.05 : 1));

const SW: Record<Theme, string> = { white: '#ffffff', paper: '#F7F2EB', comfort: '#ECE0C9', night: '#121417' };

/** Screen light and the reading look. Text size, dark mode and language stay at the top, as on every other page. */
function ReadingPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t, lang } = useT();
  const { theme, setTheme, fontScale, brightness, setBrightness } = useUI();
  const { mounted, closing } = usePresence(open, 200);
  useEffect(() => { if (!open) return; const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose(); addEventListener('keydown', k); return () => removeEventListener('keydown', k); }, [open, onClose]);
  if (!mounted) return null;
  return (
    <div role="dialog" aria-label={t('readingSettings')} style={{ zoom: unscale(fontScale, lang) }} className={cx('fixed z-50 end-4 start-4 sm:start-auto sm:w-[21rem] bottom-[6.5rem] lg:end-6 glass-panel rounded-[30px] p-5 shadow-2xl border border-line/50 origin-bottom-right [&_svg]:w-[1.1rem] [&_svg]:h-[1.1rem]', closing ? 'anim-zoom-out' : 'anim-zoom')}>
      <div className="grid gap-5">
        <div>
          <p className="label flex items-center gap-1.5"><Sun size={14} aria-hidden /> {t('screenLight')}</p>
          <div className="flex items-center gap-3"><SunDim size={18} className="text-muted shrink-0" aria-hidden />
            <input type="range" className="slider flex-1" min={0.35} max={1} step={0.05} value={brightness} onChange={(e) => setBrightness(+e.target.value)} aria-label={t('screenLight')} />
            <Sun size={22} className="text-muted shrink-0" aria-hidden /></div>
        </div>
        <div>
          <p className="label">{meta.reader.theme[lang]}</p>
          <div role="radiogroup" aria-label={meta.reader.theme[lang]} className="grid grid-cols-4 gap-2">
            {(Object.keys(SW) as Theme[]).map((th) => (
              <button key={th} role="radio" aria-checked={theme === th} onClick={() => setTheme(th)} className="flex flex-col items-center gap-1.5 text-[0.7rem] font-bold">
                <span className={cx('w-12 h-12 rounded-full border-2 flex items-center justify-center font-display text-lg font-bold transition', theme === th ? 'border-[rgb(var(--accent))] ring-4 ring-[rgb(var(--accent)/0.18)]' : 'border-line')} style={{ background: SW[th], color: th === 'night' ? '#D9D4CC' : '#3B3127' }} aria-hidden>Aa</span>
                {meta.reader.themes[th][lang]}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/** One button of the bottom reading bar: icon with a short word under it, like the app's main menu. */
function BarBtn({ label, onClick, active, children, className = '' }: { label: string; onClick: () => void; active?: boolean; children: React.ReactNode; className?: string }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={active} className={cx('flex flex-col items-center justify-center gap-0.5 min-h-[56px] min-w-0 px-1 rounded-2xl transition active:scale-95', active ? 'text-[rgb(var(--accent))]' : 'text-muted', className)}>
      {children}<span className="text-[0.66rem] font-bold leading-tight max-w-full truncate">{label}</span>
    </button>
  );
}

export default function Reader() {
  const { chapter = 'c0' } = useParams();
  const [sp] = useSearchParams();
  const { t, lang } = useT();
  const brightness = useUI((s) => s.brightness);
  const fontScale = useUI((s) => s.fontScale);
  const nav = useNavigate();
  const toast = useToast((s) => s.show);
  const [loaded, setLoaded] = useState<{ l: string; b: Book } | null>(null);
  const book = loaded?.b;
  const inSync = useRef(true);
  const restoring = useRef(false);
  inSync.current = loaded?.l === lang;
  const [showToc, setShowToc] = useState(false);
  const [panel, setPanel] = useState(false);
  useBackToClose(panel, () => setPanel(false));
  const [speaking, setSpeaking] = useState(false);
  const [progress, setProgress] = useState(0);
  const [chrome, setChrome] = useState(true);
  const lastY = useRef(0);
  const cur = useRef(0);
  const restored = useRef<string>('');
  const hasVoice = useHasVoice(lang);
  const reading = useLiveQuery(() => getReading(), []);

  useEffect(() => { let live = true; loadBook(lang).then((b) => live && setLoaded({ l: lang, b })); return () => { live = false; }; }, [lang]);
  const ch = book?.chapters.find((c) => c.id === chapter);
  // An old link or saved place in a chapter the book no longer has opens the contents.
  useEffect(() => { if (book && !ch) nav('/book', { replace: true }); }, [book, ch, nav]);
  const idx = toc.toc.findIndex((c) => c.id === chapter);
  const prev = toc.toc[idx - 1], next = toc.toc[idx + 1];
  const part = ch?.part ?? toc.toc[idx]?.part ?? 0;
  const col = partColor(part);

  const scrollTo = useCallback((i: number) => {
    if (i === 0) { window.scrollTo({ top: 0 }); return; }
    document.querySelector(`[data-b="${i}"]`)?.scrollIntoView({ block: 'start' });
  }, []);

  // Restore position on chapter open, and keep the same block on language switch.
  useLayoutEffect(() => {
    if (!ch || !reading || !loaded) return;
    const key = `${chapter}|${loaded.l}`;
    if (restored.current === key) return;
    const first = !restored.current.startsWith(chapter + '|');
    restored.current = key;
    const q = sp.get('b');
    const target = first ? (q !== null ? +q : reading.chapter === chapter ? reading.blockIndex : 0) : cur.current;
    cur.current = target;
    scrollTo(target);
    restoring.current = true;
    // Fonts for the new language load lazily and reflow the text; scroll again once they are ready.
    const settle = () => requestAnimationFrame(() => { scrollTo(target); restoring.current = false; });
    document.fonts.ready.then(() => setTimeout(settle, 80));
    setTimeout(() => { if (restoring.current) return; scrollTo(target); }, 400);
  }, [ch, reading, chapter, loaded, sp, scrollTo]);

  const ready = !!reading;
  useEffect(() => {
    if (!ch || !ready) return;
    let h: number | undefined;
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - innerHeight;
      setProgress(max > 0 ? Math.min(1, scrollY / max) : 1);
      // Immersive reading: the top bar slides away while reading down and returns when scrolling up.
      const dy = scrollY - lastY.current;
      if (Math.abs(dy) > 8) { if (!restoring.current) setChrome(dy < 0 || scrollY < 80); lastY.current = scrollY; }
      if (!inSync.current || restoring.current) return; // layout is changing during a language switch
      const els = document.querySelectorAll<HTMLElement>('[data-b]');
      let best = 0;
      for (const el of els) { if (el.getBoundingClientRect().top < 100) best = +el.dataset.b!; else break; }
      if (best !== cur.current) { cur.current = best; clearTimeout(h); h = window.setTimeout(() => void savePosition(chapter, best), 500); }
    };
    addEventListener('scroll', onScroll, { passive: true });
    // A chapter only becomes "where I am reading" once it is actually read: scrolled, or open for a few seconds.
    // Just passing through (e.g. going back) does not move the place on the Home card.
    const start = cur.current;
    const dwell = window.setTimeout(() => void savePosition(chapter, cur.current), 4000);
    return () => { removeEventListener('scroll', onScroll); clearTimeout(h); clearTimeout(dwell); if (inSync.current && cur.current !== start) void savePosition(chapter, cur.current); };
  }, [ch, chapter, ready]);

  useEffect(() => () => { stopSpeaking(); setSpeaking(false); }, [chapter, lang]);
  // The reader keeps its own place. Without this, closing a menu (which steps back in history) lets the
  // browser jump to an old scroll position, e.g. the English one after switching language.
  useEffect(() => { const h = history.scrollRestoration; history.scrollRestoration = 'manual'; return () => { history.scrollRestoration = h; }; }, []);

  const readAloud = () => {
    if (speaking) { stopSpeaking(); setSpeaking(false); return; }
    if (!ch) return;
    // Called straight from the tap so Android allows speech; reads from the paragraph at the top of the screen.
    setSpeaking(speakQueue(ch.blocks.slice(cur.current).map((b) => b.text), lang, () => setSpeaking(false)));
  };
  const marks = new Set((reading?.bookmarks ?? []).filter((b) => b.chapter === chapter).map((b) => b.blockIndex));
  const bookmarked = marks.size > 0;
  const onBookmark = async () => {
    // Bookmark the paragraph at the top of the screen; tapping again on the same spot removes it.
    const added = await toggleBookmark(chapter, cur.current);
    toast(added ? t('bookmarkAdded') : t('bookmarkRemoved'), { label: t('bookmarks'), to: '/book/bookmarks' });
  };
  const partTitle = toc.parts.find((p) => p.n === ch?.part);
  const minutes = ch ? Math.max(1, Math.round(ch.blocks.reduce((s, b) => s + b.text.split(/\s+/).length, 0) / 180)) : 0;

  return (
    <div style={{ ['--pc' as string]: col.c, ['--pt' as string]: col.t }} className="lg:flex lg:gap-6 mx-auto max-w-6xl">
      {brightness < 1 && <div aria-hidden className="fixed inset-0 z-[35] pointer-events-none bg-black transition-opacity" style={{ opacity: (1 - brightness) * 0.9 }} />}
      <aside className="hidden xl:block w-80 shrink-0 h-[calc(100vh-1rem)] sticky top-2 overflow-y-auto no-scrollbar p-3"><TocList current={chapter} /></aside>
      <div className="flex-1 min-w-0">
        <div className="fixed top-0 inset-x-0 z-[31] h-[3px] bg-line/40 pointer-events-none"><div className="h-full transition-[width] duration-150" style={{ width: `${progress * 100}%`, background: 'var(--pc)' }} /></div>
        <div className={cx('fixed top-0 inset-x-0 z-30 glass-panel border-b border-line/40 transition-transform duration-500', !chrome && '-translate-y-full')} style={{ transitionTimingFunction: 'var(--ease)' }}>
          <div className="mx-auto max-w-3xl px-3 h-[68px] flex items-center gap-1.5">
            <Link to="/book" className="icon-chip" aria-label={meta.reader.contents[lang]}><ArrowLeft size={20} /></Link>
            <p className="flex-1 min-w-0 text-sm font-bold truncate px-1">{ch?.title}</p>
            <TextSizeButton />
            <ThemeButton />
            <LangButton />
          </div>
        </div>
        <main id="main" className="px-5 pt-16 pb-40 lg:pb-24" onClick={(e) => { if (!(e.target as HTMLElement).closest('a,button,input,label,summary,aside')) setChrome((c) => !c); }}>
          {!ch ? <div className="py-20 text-center text-muted" aria-busy="true">…</div> : (
            <article className="prose-read mx-auto anim-in" key={lang + chapter}>
              <header className="cover rounded-[28px] p-6 mt-5 mb-8 font-ui">
                <div className="relative z-[1]">
                  <p className="text-[0.8rem] font-bold text-[var(--pc)]">{partTitle ? `${meta.partLabel[lang]} ${partTitle.n} · ${loc(partTitle.title, lang)}` : ch.id === 'appendix' ? t('appendix') : t('introduction')}</p>
                  {ch.id !== 'appendix' && ch.n > 0 && <p className="font-display text-6xl font-bold leading-none mt-4 text-[var(--pc)]">{String(ch.n).padStart(2, '0')}</p>}
                  <h1 className="font-display text-[1.8rem] font-bold mt-3 leading-tight">{ch.title}</h1>
                  <p className="text-[0.8rem] font-semibold text-muted mt-4 flex items-center gap-1.5"><Clock size={14} aria-hidden /> {t('minRead', { n: minutes })}</p>
                </div>
              </header>
              {book?.fallback && <p className="card !rounded-2xl p-4 mb-6 text-[0.95rem] font-ui flex gap-3"><Info size={18} className="shrink-0 mt-1 text-[rgb(var(--accent))]" aria-hidden />{t('bookNotTranslated')}</p>}
              {ch.blocks.map((b, i) => (
                <div key={i} data-b={i} className="scroll-mt-[90px] relative">
                  {marks.has(i) && <span className="absolute -start-4 top-1 w-1.5 h-6 rounded-full bg-[rgb(var(--accent))]" title={meta.reader.bookmark[lang]} aria-label={meta.reader.bookmark[lang]} />}
                  <BlockView b={b} chapter={chapter} index={i} />
                </div>
              ))}
              <nav className="grid sm:grid-cols-2 gap-3 mt-14 font-ui" aria-label={t('chapterNav')}>
                {prev ? <button className="card p-4 text-start flex items-center gap-3 min-w-0" onClick={() => nav(`/book/${prev.id}?b=0`, { replace: true })}><ArrowLeft className="shrink-0 text-muted" aria-hidden /><span className="min-w-0"><span className="eyebrow block">{t('previous')}</span><b className="line-clamp-2">{loc(prev.title, lang)}</b></span></button> : <span />}
                {next ? <button className="tile t-blue !p-4 text-start flex items-center gap-3 min-w-0" onClick={() => nav(`/book/${next.id}?b=0`, { replace: true })}><span className="min-w-0 flex-1 relative z-[1]"><span className="text-[0.78rem] font-bold opacity-90 block">{t('nextChapter')}</span><b className="line-clamp-2">{loc(next.title, lang)}</b></span><ArrowRight className="shrink-0 relative z-[1]" aria-hidden /></button> : <span />}
              </nav>
            </article>
          )}
        </main>
      </div>
      <nav aria-label={t('readingSettings')} style={{ zoom: unscale(fontScale, lang), transitionTimingFunction: 'var(--ease)' }}
        className={cx('fixed bottom-0 inset-x-0 z-50 px-3 pb-[max(10px,env(safe-area-inset-bottom))] pointer-events-none transition-transform duration-500', !chrome && !panel && 'translate-y-[140%]')}>
        <div className="relative mx-auto max-w-md glass-panel rounded-[28px] shadow-nav border border-line/60 h-[70px] flex items-center justify-around px-1 pointer-events-auto">
          <BarBtn label={meta.reader.contents[lang]} onClick={() => setShowToc(true)} className="flex-1 xl:hidden"><List size={22} aria-hidden /></BarBtn>
          <BarBtn label={meta.reader.bookmark[lang]} onClick={onBookmark} active={bookmarked} className="flex-1">{bookmarked ? <BookmarkCheck size={22} fill="rgb(var(--accent) / 0.15)" aria-hidden /> : <Bookmark size={22} aria-hidden />}</BarBtn>
          <div className="flex-1 flex justify-center">
            <Link to="/sos" aria-label={t('sosLong')} className="-mt-9 w-[64px] h-[64px] rounded-full t-rose text-white flex flex-col items-center justify-center shadow-lift ring-[6px] ring-bg active:scale-95 transition">
              <Siren size={22} aria-hidden /><span className="text-[0.62rem] font-extrabold leading-none mt-0.5">SOS</span>
            </Link>
          </div>
          {hasVoice && <BarBtn label={speaking ? t('stopReading') : meta.reader.readAloud[lang]} onClick={readAloud} active={speaking} className="flex-1">{speaking ? <Square size={22} aria-hidden /> : <Volume2 size={22} aria-hidden />}</BarBtn>}
          <BarBtn label={t('screen')} onClick={() => setPanel(!panel)} active={panel} className="flex-1"><SlidersHorizontal size={22} aria-hidden /></BarBtn>
        </div>
      </nav>
      <Scrim open={panel} onClose={() => setPanel(false)} />
      <ReadingPanel open={panel} onClose={() => setPanel(false)} />
      <Modal open={showToc} onClose={() => setShowToc(false)} title={meta.reader.contents[lang]}><TocList current={chapter} onPick={() => setShowToc(false)} /></Modal>
    </div>
  );
}
