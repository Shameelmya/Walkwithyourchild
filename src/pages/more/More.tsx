import { Link } from 'react-router-dom';
import { HeartHandshake, Archive, Newspaper, Users, Settings, Info, Gamepad2, MessageSquareHeart, BookHeart } from 'lucide-react';
import { useT, type TKey } from '../../i18n';
import { Page, PageHeader } from '../../components/ui';
import { cx } from '../../lib/util';

const ITEMS: { to: string; k: TKey; I: typeof Info; g: string }[] = [
  { to: '/me', k: 'navForMe', I: HeartHandshake, g: 't-coral' },
  { to: '/talk', k: 'navTalk', I: MessageSquareHeart, g: 't-violet' },
  { to: '/play', k: 'navPlay', I: Gamepad2, g: 't-green' },
  { to: '/memory', k: 'navMemory', I: Archive, g: 't-violet' },
  { to: '/stories', k: 'navStories', I: BookHeart, g: 't-coral' },
  { to: '/updates', k: 'navUpdates', I: Newspaper, g: 't-blue' },
  { to: '/community', k: 'navCommunity', I: Users, g: 't-mint' },
  { to: '/settings', k: 'navSettings', I: Settings, g: 't-amber' },
  { to: '/about', k: 'about', I: Info, g: 't-blue' },
];
export default function More() {
  const { t } = useT();
  return (
    <Page wide>
      <PageHeader back={false} title={t('navMore')} />
      <ul className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {ITEMS.map(({ to, k, I, g }) => (
          <li key={to}><Link to={to} className={cx('tile min-h-[120px] flex flex-col justify-between h-full', g)}>
            <span className="glass relative z-[1]"><I size={21} aria-hidden /></span><span className="relative z-[1] font-extrabold">{t(k)}</span>
          </Link></li>
        ))}
      </ul>
    </Page>
  );
}
