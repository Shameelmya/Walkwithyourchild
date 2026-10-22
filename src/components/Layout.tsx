import { useEffect, useState, type ReactNode } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Home, BookOpen, NotebookPen, Baby, Menu, Siren, Pill, Activity, Stethoscope, FolderHeart, MessageSquareHeart, HeartHandshake, Settings, Newspaper, Users, FileText, LineChart, Gamepad2, ClipboardList, Archive, Info, X } from 'lucide-react';
import { useT, type TKey } from '../i18n';
import { cx } from '../lib/util';
import { ChildSwitcher } from './ChildSwitcher';
import { LangButton } from './LangButton';
import { meta } from '../lib/content';
import { PathMotif } from './Path';

type Item = { to: string; k: TKey; I: typeof Home; c: string };
const MAIN: Item[] = [
  { to: '/', k: 'navHome', I: Home, c: 'var(--tb2)' },
  { to: '/book', k: 'navBook', I: BookOpen, c: 'var(--tm2)' },
  { to: '/notebook', k: 'navNotebook', I: NotebookPen, c: 'var(--ta2)' },
  { to: '/child', k: 'navChild', I: Baby, c: 'var(--tc2)' },
];
const CARE: Item[] = [
  { to: '/medicines', k: 'navMedicines', I: Pill, c: 'var(--tm2)' },
  { to: '/seizures', k: 'navSeizures', I: Activity, c: 'var(--tr2)' },
  { to: '/visits', k: 'navVisits', I: Stethoscope, c: 'var(--tb2)' },
  { to: '/records', k: 'navRecords', I: ClipboardList, c: 'var(--tb2)' },
  { to: '/progress', k: 'navProgress', I: LineChart, c: 'var(--tg2)' },
  { to: '/documents', k: 'navDocuments', I: FolderHeart, c: 'var(--ta2)' },
  { to: '/summary', k: 'navSummary', I: FileText, c: 'var(--tc2)' },
];
const CHILD: Item[] = [
  { to: '/talk', k: 'navTalk', I: MessageSquareHeart, c: 'var(--tv2)' },
  { to: '/play', k: 'navPlay', I: Gamepad2, c: 'var(--tg2)' },
];
const YOU: Item[] = [
  { to: '/me', k: 'navForMe', I: HeartHandshake, c: 'var(--tc2)' },
  { to: '/memory', k: 'navMemory', I: Archive, c: 'var(--tv2)' },
  { to: '/updates', k: 'navUpdates', I: Newspaper, c: 'var(--tb2)' },
  { to: '/community', k: 'navCommunity', I: Users, c: 'var(--tm2)' },
  { to: '/settings', k: 'navSettings', I: Settings, c: 'var(--ta2)' },
  { to: '/about', k: 'about', I: Info, c: 'var(--ta2)' },
];
const GROUPS: { k: TKey; items: Item[] }[] = [{ k: 'groupMain', items: MAIN }, { k: 'groupCare', items: CARE }, { k: 'groupChild', items: CHILD }, { k: 'groupYou', items: YOU }];

function NavList({ onPick }: { onPick?: () => void }) {
  const { t } = useT();
  return (
    <nav aria-label={t('mainNav')} className="grid gap-4">
      {GROUPS.map((g) => (
        <div key={g.k}>
          <p className="eyebrow px-3 mb-1">{t(g.k)}</p>
          {g.items.map(({ to, k, I, c }) => (
            <NavLink key={to} to={to} end={to === '/'} onClick={onPick} className={({ isActive }) => cx('flex items-center gap-3 px-2 min-h-[48px] rounded-2xl font-semibold transition', isActive ? 'bg-soft text-ink' : 'hover:bg-surface2 text-ink/90')}>
              <span className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0" style={{ background: c }}><I size={18} aria-hidden /></span>{t(k)}
            </NavLink>
          ))}
        </div>
      ))}
    </nav>
  );
}

export function Layout({ children }: { children: ReactNode }) {
  const { t, lang } = useT();
  const nav = useNavigate();
  const loc = useLocation();
  const [drawer, setDrawer] = useState(false);
  useEffect(() => setDrawer(false), [loc.pathname]);
  const reader = /^\/book\/(?!search|bookmarks)/.test(loc.pathname);
  return (
    <div className="min-h-screen lg:flex">
      <aside className="hidden lg:flex lg:flex-col w-72 shrink-0 h-screen sticky top-0 bg-surface border-r border-line/60">
        <div className="px-5 pt-5 pb-3">
          <p className="font-display text-xl font-bold leading-tight">{meta.appTitle[lang]}</p>
          <PathMotif height={34} filled={1} />
        </div>
        <div className="flex-1 overflow-y-auto no-scrollbar px-3 pb-4"><NavList /></div>
        <div className="p-4 border-t border-line/60"><button className="btn-danger w-full" onClick={() => nav('/sos')}><Siren aria-hidden /> {t('sosLong')}</button></div>
      </aside>
      <div className="flex-1 min-w-0">
        {!reader && (
          <header className="sticky top-0 z-30 bg-bg/85 backdrop-blur-md">
            <div className="mx-auto max-w-6xl px-4 h-[68px] flex items-center gap-2">
              <button className="icon-chip lg:hidden" onClick={() => setDrawer(true)} aria-label={t('openMenu')}><Menu size={21} /></button>
              <div className="flex-1 min-w-0"><ChildSwitcher /></div>
              <LangButton />
            </div>
          </header>
        )}
        {children}
      </div>

      {drawer && (
        <div className="fixed inset-0 z-[60] lg:hidden" role="dialog" aria-modal="true" aria-label={t('openMenu')}>
          <div className="absolute inset-0 bg-black/40" onClick={() => setDrawer(false)} />
          <div className="absolute inset-y-0 left-0 w-[86%] max-w-sm bg-surface shadow-2xl flex flex-col anim-in">
            <div className="flex items-center gap-2 px-4 pt-4 pb-2">
              <p className="flex-1 font-display text-lg font-bold leading-tight">{meta.appTitle[lang]}</p>
              <button className="icon-btn" onClick={() => setDrawer(false)} aria-label={t('close')}><X /></button>
            </div>
            <div className="flex-1 overflow-y-auto px-3 pb-6"><NavList onPick={() => setDrawer(false)} /></div>
          </div>
        </div>
      )}

      <nav aria-label={t('mainNav')} className="lg:hidden fixed bottom-0 inset-x-0 z-40 px-3 pb-[max(10px,env(safe-area-inset-bottom))] pointer-events-none">
        <div className="relative mx-auto max-w-md bg-surface rounded-[28px] shadow-nav border border-line/60 h-[70px] grid grid-cols-5 items-center pointer-events-auto">
          {MAIN.slice(0, 2).map((it) => <Tab key={it.to} {...it} />)}
          <div className="flex justify-center">
            <button onClick={() => nav('/sos')} aria-label={t('sosLong')} className="-mt-9 w-[68px] h-[68px] rounded-full t-rose text-white flex flex-col items-center justify-center shadow-lift ring-[6px] ring-bg active:scale-95 transition">
              <Siren size={24} aria-hidden /><span className="text-[0.66rem] font-extrabold leading-none mt-0.5">SOS</span>
            </button>
          </div>
          {MAIN.slice(2).map((it) => <Tab key={it.to} {...it} />)}
        </div>
      </nav>
    </div>
  );
}

function Tab({ to, k, I }: Item) {
  const { t } = useT();
  return (
    <NavLink to={to} end={to === '/'} className={({ isActive }) => cx('flex flex-col items-center justify-center gap-1 h-full text-[0.68rem] font-bold leading-tight text-center px-0.5', isActive ? 'text-[rgb(var(--accent))]' : 'text-muted')}>
      {({ isActive }) => (<><span className={cx('w-12 h-8 rounded-full flex items-center justify-center transition', isActive && 'bg-soft')}><I size={21} aria-hidden strokeWidth={isActive ? 2.4 : 2} /></span><span className="block w-full truncate px-0.5">{t(k)}</span></>)}
    </NavLink>
  );
}
