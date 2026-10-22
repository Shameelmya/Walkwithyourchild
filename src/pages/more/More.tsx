import { Link } from 'react-router-dom';
import { HeartHandshake, Archive, Newspaper, Users, Settings, Info, ChevronRight, Gamepad2, MessageSquareHeart } from 'lucide-react';
import { useT, type TKey } from '../../i18n';
import { Page, PageHeader } from '../../components/ui';

const ITEMS: { to: string; k: TKey; I: typeof Info; c: string }[] = [
  { to: '/me', k: 'navForMe', I: HeartHandshake, c: 'var(--p3)' },
  { to: '/talk', k: 'navTalk', I: MessageSquareHeart, c: 'var(--p4)' },
  { to: '/play', k: 'navPlay', I: Gamepad2, c: 'var(--p2)' },
  { to: '/memory', k: 'navMemory', I: Archive, c: 'var(--p4)' },
  { to: '/updates', k: 'navUpdates', I: Newspaper, c: 'var(--p5)' },
  { to: '/community', k: 'navCommunity', I: Users, c: 'var(--p1)' },
  { to: '/settings', k: 'navSettings', I: Settings, c: 'var(--pp)' },
  { to: '/about', k: 'about', I: Info, c: 'var(--pi)' },
];
export default function More() {
  const { t } = useT();
  return (
    <Page>
      <PageHeader back={false} title={t('navMore')} />
      <ul className="grid gap-2">
        {ITEMS.map(({ to, k, I, c }) => (
          <li key={to}><Link to={to} className="card flex items-center gap-3 p-3 min-h-[64px] hover:bg-surface2">
            <span className="w-11 h-11 rounded-2xl flex items-center justify-center text-white shrink-0" style={{ background: c }}><I size={22} aria-hidden /></span>
            <span className="flex-1 font-bold">{t(k)}</span><ChevronRight aria-hidden className="text-muted" />
          </Link></li>
        ))}
      </ul>
    </Page>
  );
}
