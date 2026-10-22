import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { ArrowLeft, ArrowRight, Bookmark, BookmarkCheck, List, Settings2, Volume2, Square, Languages } from 'lucide-react';
import { useT } from '../../i18n';
import { loadBook, loc, meta, partColor, toc, type Book } from '../../lib/content';
import { useUI } from '../../lib/store';
import { getReading, savePosition, toggleBookmark } from '../../lib/reading';
import { BlockView } from '../../components/Blocks';
import { Modal, useToast } from '../../components/ui';
import { DisplaySettings } from '../../components/ReaderSettings';
import { TocList } from './Contents';
import { speak, voicesFor } from '../../lib/audio';


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

export default function Reader() {
  const { chapter = 'c0' } = useParams();
  const [sp] = useSearchParams();
  const { t, lang } = useT();
  const setLang = useUI((s) => s.setLang);
  const nav = useNavigate();
  const toast = useToast((s) => s.show);
  const [loaded, setLoaded] = useState<{ l: string; b: Book } | null>(null);
  const book = loaded?.b;
  const inSync = useRef(true);
  const restoring = useRef(false);
  inSync.current = loaded?.l === lang;
  const [showToc, setShowToc] = useState(false);
  const [showSet, setShowSet] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const cur = useRef(0);
  const restored = useRef<string>('');
  const hasVoice = useHasVoice(lang);
  const reading = useLiveQuery(() => getReading(), []);

  useEffect(() => { let live = true; loadBook(lang).then((b) => live && setLoaded({ l: lang, b })); return () => { live = false; }; }, [lang]);
  const ch = book?.chapters.find((c) => c.id === chapter);
  const idx = toc.toc.findIndex((c) => c.id === chapter);
  const prev = toc.toc[idx - 1], next = toc.toc[idx + 1];
  const col = partColor(ch?.part ?? toc.toc[idx]?.part ?? 0);

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

  // Track the block at the top of the viewport.
  const ready = !!reading;
  useEffect(() => {
    if (!ch || !ready) return;
    let h: number | undefined;
    const onScroll = () => {
      if (!inSync.current || restoring.current) return; // layout is changing during a language switch
      const els = document.querySelectorAll<HTMLElement>('[data-b]');
      let best = 0;
      for (const el of els) { if (el.getBoundingClientRect().top < 140) best = +el.dataset.b!; else break; }
      if (best !== cur.current) { cur.current = best; clearTimeout(h); h = window.setTimeout(() => void savePosition(chapter, best), 500); }
    };
    addEventListener('scroll', onScroll, { passive: true });
    void savePosition(chapter, cur.current);
    return () => { removeEventListener('scroll', onScroll); clearTimeout(h); };
  }, [ch, chapter, ready]);

  useEffect(() => () => { if ('speechSynthesis' in window) speechSynthesis.cancel(); }, [chapter, lang]);

  const readAloud = () => {
    if (speaking) { speechSynthesis.cancel(); setSpeaking(false); return; }
    if (!ch) return;
    setSpeaking(true);
    const blocks = ch.blocks.slice(cur.current);
    let i = 0;
    const go = () => { if (i >= blocks.length) { setSpeaking(false); return; } const b = blocks[i++]; if (!speak(b.text, lang, go)) setSpeaking(false); };
    go();
  };
  const bookmarked = reading?.bookmarks.some((b) => b.chapter === chapter && b.blockIndex === cur.current);
  const partTitle = toc.parts.find((p) => p.n === ch?.part);

  return (
    <div style={{ ['--pc' as string]: col.c, ['--pt' as string]: col.t }} className="lg:flex lg:gap-6 mx-auto max-w-6xl">
      <aside className="hidden xl:block w-80 shrink-0 h-[calc(100vh-1rem)] sticky top-2 overflow-y-auto no-scrollbar p-3"><TocList current={chapter} /></aside>
      <div className="flex-1 min-w-0">
        <div className="sticky top-[57px] lg:top-0 z-20 bg-bg/95 backdrop-blur border-b border-line/40 px-2 py-1 flex items-center gap-1">
          <Link to="/book" className="icon-btn" aria-label={meta.reader.contents[lang]}><ArrowLeft /></Link>
          <button className="icon-btn xl:hidden" onClick={() => setShowToc(true)} aria-label={meta.reader.contents[lang]}><List /></button>
          <span className="flex-1" />
          <button className="chip" onClick={() => setLang(lang === 'en' ? 'ml' : 'en')} aria-label={t('switchLanguage')}><Languages size={18} aria-hidden /> <span lang={lang === 'en' ? 'ml' : 'en'}>{lang === 'en' ? 'മലയാളം' : 'English'}</span></button>
          {hasVoice && <button className="icon-btn" onClick={readAloud} aria-pressed={speaking} aria-label={meta.reader.readAloud[lang]}>{speaking ? <Square /> : <Volume2 />}</button>}
          <button className="icon-btn" aria-pressed={!!bookmarked} aria-label={meta.reader.bookmark[lang]} onClick={async () => toast((await toggleBookmark(chapter, cur.current)) ? t('bookmarkAdded') : t('bookmarkRemoved'))}>{bookmarked ? <BookmarkCheck className="text-accent" /> : <Bookmark />}</button>
          <button className="icon-btn" onClick={() => setShowSet(true)} aria-label={t('display')}><Settings2 /></button>
        </div>
        <main id="main" className="px-5 pb-32 lg:pb-16">
          {!ch ? <div className="py-20 text-center text-muted" aria-busy="true">…</div> : (
            <article className="prose-read mx-auto anim-in" key={lang + chapter}>
              <header className="pt-8 pb-6 font-ui">
                {partTitle && <p className="font-extrabold text-[var(--pc)] text-sm">{meta.partLabel[lang]} {partTitle.n} · {loc(partTitle.title, lang)}</p>}
                {ch.id !== 'appendix' && ch.n > 0 && <p className="text-6xl font-extrabold text-[var(--pc)] opacity-90 leading-none mt-3 font-head">{ch.n}</p>}
                <h1 className="text-3xl font-extrabold mt-2 leading-tight font-head">{ch.title}</h1>
                <div className="h-1 w-16 rounded-full bg-[var(--pc)] mt-4" />
              </header>
              {ch.blocks.map((b, i) => <div key={i} data-b={i} className="scroll-mt-[130px] lg:scroll-mt-[72px]"><BlockView b={b} chapter={chapter} index={i} /></div>)}
              <nav className="flex flex-col-reverse sm:flex-row gap-3 justify-between mt-12 font-ui" aria-label={t('chapterNav')}>
                {prev ? <button className="btn-ghost flex-1 min-w-0 justify-start text-left py-2" onClick={() => nav(`/book/${prev.id}?b=0`)}><ArrowLeft className="shrink-0" aria-hidden /> <span className="line-clamp-2">{loc(prev.title, lang)}</span></button> : <span className="flex-1" />}
                {next ? <button className="btn-primary flex-1 min-w-0 justify-end text-right py-2" onClick={() => nav(`/book/${next.id}?b=0`)}><span className="line-clamp-2">{loc(next.title, lang)}</span> <ArrowRight className="shrink-0" aria-hidden /></button> : <span className="flex-1" />}
              </nav>
            </article>
          )}
        </main>
      </div>
      <Modal open={showToc} onClose={() => setShowToc(false)} title={meta.reader.contents[lang]}><TocList current={chapter} onPick={() => setShowToc(false)} /></Modal>
      <Modal open={showSet} onClose={() => setShowSet(false)} title={t('display')}><DisplaySettings /></Modal>
    </div>
  );
}

