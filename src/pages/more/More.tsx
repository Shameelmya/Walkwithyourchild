import { Link } from 'react-router-dom';
import { HeartHandshake, Archive, Newspaper, Users, Settings, Info, Gamepad2, MessageSquareHeart } from 'lucide-react';
import { useT, type TKey } from '../../i18n';
import { Page, PageHeader } from '../../components/ui';
import { cx } from '../../lib/util';

const ITEMS: { to: string; k: TKey; I: typeof Info; g: string }[] = [
  { to: '/me', k: 'navForMe', I: HeartHandshake, g: 'grad-3' },
  { to: '/talk', k: 'navTalk', I: MessageSquareHeart, g: 'grad-4' },
  { to: '/play', k: 'navPlay', I: Gamepad2, g: 'grad-2' },
  { to: '/memory', k: 'navMemory', I: Archive, g: 'grad-4' },
  { to: '/updates', k: 'navUpdates', I: Newspaper, g: 'grad-5' },
  { to: '/community', k: 'navCommunity', I: Users, g: 'grad-1' },
  { to: '/settings', k: 'navSettings', I: Settings, g: 'grad-i' },
  { to: '/about', k: 'about', I: Info, g: 'grad-a' },
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
