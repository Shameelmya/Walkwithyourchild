import type { ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Home, BookOpen, NotebookPen, Baby, Menu, Siren, Pill, Activity, Stethoscope, FolderHeart, MessageSquareHeart, HeartHandshake, Settings, Newspaper, Users, FileText, LineChart, Gamepad2, ClipboardList } from 'lucide-react';
import { useT, type TKey } from '../i18n';
import { cx } from '../lib/util';
import { ChildSwitcher } from './ChildSwitcher';

const MAIN: { to: string; k: TKey; I: typeof Home }[] = [
  { to: '/', k: 'navHome', I: Home },
  { to: '/book', k: 'navBook', I: BookOpen },
  { to: '/notebook', k: 'navNotebook', I: NotebookPen },
  { to: '/child', k: 'navChild', I: Baby },
  { to: '/more', k: 'navMore', I: Menu },
];
const SIDE: { to: string; k: TKey; I: typeof Home }[] = [
  { to: '/medicines', k: 'navMedicines', I: Pill },
  { to: '/seizures', k: 'navSeizures', I: Activity },
  { to: '/visits', k: 'navVisits', I: Stethoscope },
  { to: '/records', k: 'navRecords', I: ClipboardList },
  { to: '/progress', k: 'navProgress', I: LineChart },
  { to: '/documents', k: 'navDocuments', I: FolderHeart },
  { to: '/summary', k: 'navSummary', I: FileText },
  { to: '/talk', k: 'navTalk', I: MessageSquareHeart },
  { to: '/play', k: 'navPlay', I: Gamepad2 },
  { to: '/me', k: 'navForMe', I: HeartHandshake },
  { to: '/updates', k: 'navUpdates', I: Newspaper },
  { to: '/community', k: 'navCommunity', I: Users },
  { to: '/settings', k: 'navSettings', I: Settings },
];

export function Layout({ children }: { children: ReactNode }) {
  const { t } = useT();
  const nav = useNavigate();
  return (
    <div className="min-h-screen lg:flex">
      <aside className="hidden lg:flex lg:flex-col w-64 shrink-0 h-screen sticky top-0 border-r border-line/70 bg-surface">
        <div className="px-4 pt-5 pb-3"><ChildSwitcher /></div>
        <nav aria-label={t('mainNav')} className="px-2 flex flex-col gap-0.5 flex-1 overflow-y-auto no-scrollbar">
          {[...MAIN, ...SIDE].map(({ to, k, I }) => (
            <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => cx('flex items-center gap-3 px-3 min-h-[44px] rounded-xl font-semibold', isActive ? 'bg-soft text-accent' : 'hover:bg-surface2')}>
              <I size={20} aria-hidden /> {t(k)}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-line/60"><button className="btn-danger w-full" onClick={() => nav('/sos')}><Siren aria-hidden /> {t('sos')}</button></div>
      </aside>
      <div className="flex-1 min-w-0">
        <div className="lg:hidden sticky top-0 z-30 bg-bg/95 backdrop-blur border-b border-line/40 px-4 py-2 flex items-center justify-between"><ChildSwitcher compact /></div>
        {children}
      </div>
      <button onClick={() => nav('/sos')} className="lg:hidden fixed right-4 bottom-[88px] z-40 btn-danger shadow-lg px-4" aria-label={t('sosLong')}>
        <Siren aria-hidden size={22} /> {t('sos')}
      </button>
      <nav aria-label={t('mainNav')} className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-surface border-t border-line/70 safe-b">
        <ul className="grid grid-cols-5">
          {MAIN.map(({ to, k, I }) => (
            <li key={to}>
              <NavLink to={to} end={to === '/'} className={({ isActive }) => cx('flex flex-col items-center justify-center min-h-[64px] gap-0.5 text-[0.72rem] font-bold leading-tight text-center px-1', isActive ? 'text-accent' : 'text-muted')}>
                {({ isActive }) => (<><span className={cx('rounded-full px-4 py-1 transition', isActive && 'bg-soft')}><I size={22} aria-hidden /></span>{t(k)}</>)}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
