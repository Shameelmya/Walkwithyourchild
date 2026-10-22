import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { ArrowLeft, ArrowRight, Bookmark, BookmarkCheck, List, Volume2, Square, Sun, SunDim, X, Type, Globe, Info, Clock, PenLine, Maximize, Minimize, Siren } from 'lucide-react';
import { useT } from '../../i18n';
import { loadBook, loc, meta, partColor, toc, type Book } from '../../lib/content';
import { FONT_STEPS, LANGS, useUI, type Theme } from '../../lib/store';
import { getReading, savePosition, toggleBookmark } from '../../lib/reading';
import { BlockView } from '../../components/Blocks';
import { Modal, useToast, Scrim } from '../../components/ui';
import { TocList } from './Contents';
import { speakQueue, stopSpeaking, voicesFor } from '../../lib/audio';
import { cx } from '../../lib/util';
import { usePresence } from '../../lib/hooks';

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

function ReadingPanel({ open, onClose, speaking, onSpeak, hasVoice }: { open: boolean; onClose: () => void; speaking: boolean; onSpeak: () => void; hasVoice: boolean }) {
  const { t, lang } = useT();
  const { theme, setTheme, fontScale, setFontScale, setLang, brightness, setBrightness } = useUI();
  const [fs, setFs] = useState(!!document.fullscreenElement);
  useEffect(() => { const f = () => setFs(!!document.fullscreenElement); document.addEventListener('fullscreenchange', f); return () => document.removeEventListener('fullscreenchange', f); }, []);
  const toggleFs = async () => { try { if (document.fullscreenElement) await document.exitFullscreen(); else await document.documentElement.requestFullscreen(); } catch { /* not supported */ } };
  const idx = Math.max(0, FONT_STEPS.findIndex((f) => f === fontScale));
  const { mounted, closing } = usePresence(open, 200);
  useEffect(() => { if (!open) return; const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose(); addEventListener('keydown', k); return () => removeEventListener('keydown', k); }, [open, onClose]);
  if (!mounted) return null;
  return (
    <div role="dialog" aria-label={t('readingSettings')} style={{ zoom: unscale(fontScale, lang) }} className={cx('fixed z-50 right-4 left-4 sm:left-auto sm:w-[21rem] bottom-[6rem] lg:right-6 glass-panel rounded-[30px] p-5 shadow-2xl border border-line/50 origin-bottom-right [&_svg]:w-[1.1rem] [&_svg]:h-[1.1rem]', closing ? 'anim-zoom-out' : 'anim-zoom')}>
      <div className="grid gap-5">
        <div>
          <p className="label flex items-center gap-1.5"><Sun size={14} aria-hidden /> {t('screenLight')}</p>
          <div className="flex items-center gap-3"><SunDim size={18} className="text-muted shrink-0" aria-hidden />
            <input type="range" className="slider flex-1" min={0.35} max={1} step={0.05} value={brightness} onChange={(e) => setBrightness(+e.target.value)} aria-label={t('screenLight')} />
            <Sun size={22} className="text-muted shrink-0" aria-hidden /></div>
        </div>
        <div>
          <p className="label flex items-center gap-1.5"><Type size={14} aria-hidden /> {meta.reader.fontSize[lang]} · {Math.round(fontScale * 100)}%</p>
          <div className="flex items-center gap-3"><span className="text-sm font-bold text-muted w-4" aria-hidden>A</span>
            <input type="range" className="slider flex-1" min={0} max={FONT_STEPS.length - 1} step={1} value={idx} onChange={(e) => setFontScale(FONT_STEPS[+e.target.value])} aria-label={meta.reader.fontSize[lang]} aria-valuetext={`${Math.round(fontScale * 100)}%`} />
            <span className="text-2xl font-bold text-muted w-5" aria-hidden>A</span></div>
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
        <div>
          <p className="label flex items-center gap-1.5"><Globe size={14} aria-hidden /> {meta.reader.language[lang]}</p>
          <div role="radiogroup" aria-label={meta.reader.language[lang]} className="grid grid-cols-3 gap-2 p-1 rounded-2xl bg-surface2">
            {LANGS.map((l) => <button key={l.v} role="radio" aria-checked={lang === l.v} lang={l.v} onClick={() => setLang(l.v)} className={cx('min-h-[44px] rounded-xl font-bold text-sm transition', lang === l.v ? 'bg-surface shadow-card text-[rgb(var(--accent))]' : 'text-muted')}>{l.native}</button>)}
          </div>
        </div>
        <div className={cx('grid gap-2', hasVoice && 'grid-cols-2')}>
        <button className="btn-outline" onClick={toggleFs}>{fs ? <><Minimize size={18} aria-hidden /> {t('exitFullScreen')}</> : <><Maximize size={18} aria-hidden /> {t('fullScreen')}</>}</button>
        {hasVoice && <button className={speaking ? 'btn-ghost' : 'btn-outline'} onClick={onSpeak}>{speaking ? <><Square size={18} aria-hidden /> {t('stopReading')}</> : <><Volume2 size={18} aria-hidden /> {meta.reader.readAloud[lang]}</>}</button>}
        </div>
      </div>
    </div>
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
    void savePosition(chapter, cur.current);
    return () => { removeEventListener('scroll', onScroll); clearTimeout(h); };
  }, [ch, chapter, ready]);

  useEffect(() => () => { stopSpeaking(); setSpeaking(false); }, [chapter, lang]);

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
          <div className="mx-auto max-w-3xl px-3 h-[64px] flex items-center gap-2">
            <Link to="/book" className="icon-chip" aria-label={meta.reader.contents[lang]}><ArrowLeft size={20} /></Link>
            <p className="flex-1 min-w-0 text-center text-sm font-bold truncate px-1">{ch?.title}</p>
            <button className="icon-chip xl:hidden" onClick={() => setShowToc(true)} aria-label={meta.reader.contents[lang]}><List size={20} /></button>
            <Link to="/sos" className="icon-chip !text-[rgb(var(--danger))]" aria-label={t('sosLong')}><Siren size={20} /></Link>
            <button className="icon-chip" aria-pressed={!!bookmarked} aria-label={meta.reader.bookmark[lang]} onClick={onBookmark}>{bookmarked ? <BookmarkCheck size={20} className="text-[rgb(var(--accent))]" fill="rgb(var(--accent) / 0.15)" /> : <Bookmark size={20} />}</button>
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
                  {marks.has(i) && <span className="absolute -left-4 top-1 w-1.5 h-6 rounded-full bg-[rgb(var(--accent))]" title={meta.reader.bookmark[lang]} aria-label={meta.reader.bookmark[lang]} />}
                  <BlockView b={b} chapter={chapter} index={i} />
                </div>
              ))}
              <nav className="grid sm:grid-cols-2 gap-3 mt-14 font-ui" aria-label={t('chapterNav')}>
                {prev ? <button className="card p-4 text-left flex items-center gap-3 min-w-0" onClick={() => nav(`/book/${prev.id}?b=0`)}><ArrowLeft className="shrink-0 text-muted" aria-hidden /><span className="min-w-0"><span className="eyebrow block">{t('previous')}</span><b className="line-clamp-2">{loc(prev.title, lang)}</b></span></button> : <span />}
                {next ? <button className="tile t-blue !p-4 text-left flex items-center gap-3 min-w-0" onClick={() => nav(`/book/${next.id}?b=0`)}><span className="min-w-0 flex-1 relative z-[1]"><span className="text-[0.78rem] font-bold opacity-90 block">{t('nextChapter')}</span><b className="line-clamp-2">{loc(next.title, lang)}</b></span><ArrowRight className="shrink-0 relative z-[1]" aria-hidden /></button> : <span />}
              </nav>
            </article>
          )}
        </main>
      </div>
      <button onClick={() => setPanel(!panel)} aria-expanded={panel} aria-label={t('readingSettings')}
        style={{ zoom: unscale(fontScale, lang) }} className={cx('fixed z-50 right-4 bottom-6 lg:right-6 w-14 h-14 rounded-full shadow-lift glass-panel border border-line/60 flex items-center justify-center transition duration-300 active:scale-90', panel ? 'text-ink' : 'text-[rgb(var(--accent))]')}>
        <span className="relative w-6 h-6" aria-hidden>
          <PenLine size={24} className={cx('w-6 h-6 absolute inset-0 transition duration-300', panel ? 'opacity-0 rotate-90 scale-50' : 'opacity-100')} />
          <X size={24} className={cx('w-6 h-6 absolute inset-0 transition duration-300', panel ? 'opacity-100' : 'opacity-0 -rotate-90 scale-50')} />
        </span>
      </button>
      <Scrim open={panel} onClose={() => setPanel(false)} />
      <ReadingPanel open={panel} onClose={() => setPanel(false)} speaking={speaking} onSpeak={readAloud} hasVoice={hasVoice} />
      <Modal open={showToc} onClose={() => setShowToc(false)} title={meta.reader.contents[lang]}><TocList current={chapter} onPick={() => setShowToc(false)} /></Modal>
    </div>
  );
}
