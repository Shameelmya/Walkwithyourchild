import { Link } from 'react-router-dom';
import { Pill, Activity, Stethoscope, ClipboardList, LineChart, FolderHeart, FileText, MessageSquareHeart, Gamepad2, Baby, Pencil } from 'lucide-react';
import { useT, type TKey } from '../../i18n';
import { Avatar, Page } from '../../components/ui';
import { useChild } from '../../lib/hooks';
import { ageFrom } from '../../lib/util';

const TILES: { to: string; k: TKey; I: typeof Pill; c: string }[] = [
  { to: '/medicines', k: 'navMedicines', I: Pill, c: 'var(--p1)' },
  { to: '/seizures', k: 'navSeizures', I: Activity, c: 'var(--ur)' },
  { to: '/visits', k: 'navVisits', I: Stethoscope, c: 'var(--p5)' },
  { to: '/records', k: 'navRecords', I: ClipboardList, c: 'var(--pp)' },
  { to: '/progress', k: 'navProgress', I: LineChart, c: 'var(--p2)' },
  { to: '/documents', k: 'navDocuments', I: FolderHeart, c: 'var(--pi)' },
  { to: '/summary', k: 'navSummary', I: FileText, c: 'var(--p3)' },
  { to: '/talk', k: 'navTalk', I: MessageSquareHeart, c: 'var(--p4)' },
  { to: '/play', k: 'navPlay', I: Gamepad2, c: 'var(--p2)' },
  { to: '/notebook/my-child', k: 'myChildPage', I: Baby, c: 'var(--pi)' },
];

export default function ChildHub() {
  const { t } = useT();
  const child = useChild();
  const age = ageFrom(child?.dob);
  return (
    <Page wide>
      <section className="card p-4 mt-4 mb-5 flex items-center gap-4">
        <Avatar blobId={child?.photoBlobId} name={child?.name} size={72} />
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-extrabold truncate">{child?.name}</h1>
          {age && <p className="text-muted">{t('ageYm', { y: age.y, m: age.m })}</p>}
        </div>
        <Link to="/child/profile" className="icon-btn" aria-label={t('editProfile')}><Pencil /></Link>
      </section>
      <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {TILES.map(({ to, k, I, c }) => (
          <li key={to}><Link to={to} className="card p-4 flex flex-col gap-3 min-h-[112px] hover:bg-surface2">
            <span className="w-11 h-11 rounded-2xl flex items-center justify-center text-white" style={{ background: c }}><I size={22} aria-hidden /></span>
            <span className="font-extrabold leading-tight">{t(k)}</span>
          </Link></li>
        ))}
      </ul>
    </Page>
  );
}
