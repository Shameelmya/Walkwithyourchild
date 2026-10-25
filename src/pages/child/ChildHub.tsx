import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { Pill, Activity, Stethoscope, ClipboardList, LineChart, FolderHeart, FileText, MessageSquareHeart, Gamepad2, Baby, Pencil, Siren, HeartPulse } from 'lucide-react';
import { ChevronRight } from '../../components/icons';
import { useT, type TKey } from '../../i18n';
import { Avatar, Page } from '../../components/ui';
import { useChild, useChildId } from '../../lib/hooks';
import { ageFrom, cx } from '../../lib/util';
import { db } from '../../lib/db';

const TILES: { to: string; k: TKey; s: TKey; I: typeof Pill; g: string }[] = [
  { to: '/notebook/emergency', k: 'emergencyCard', s: 'medsSub', I: Siren, g: 't-rose' },
  { to: '/care', k: 'careGuide', s: 'careSub', I: HeartPulse, g: 't-coral' },
  { to: '/medicines', k: 'navMedicines', s: 'medsSub', I: Pill, g: 't-mint' },
  { to: '/seizures', k: 'navSeizures', s: 'seizuresSub', I: Activity, g: 't-rose' },
  { to: '/visits', k: 'navVisits', s: 'visitsSub', I: Stethoscope, g: 't-blue' },
  { to: '/records', k: 'navRecords', s: 'recordsSub', I: ClipboardList, g: 't-blue' },
  { to: '/progress', k: 'navProgress', s: 'progressShort', I: LineChart, g: 't-green' },
  { to: '/documents', k: 'navDocuments', s: 'documentsShort', I: FolderHeart, g: 't-amber' },
  { to: '/summary', k: 'navSummary', s: 'summaryShort', I: FileText, g: 't-coral' },
  { to: '/talk', k: 'navTalk', s: 'talkSub', I: MessageSquareHeart, g: 't-violet' },
  { to: '/play', k: 'navPlay', s: 'playSub', I: Gamepad2, g: 't-green' },
];

export default function ChildHub() {
  const { t } = useT();
  const child = useChild();
  const childId = useChildId();
  const age = ageFrom(child?.dob);
  const stats = useLiveQuery(async () => ({
    meds: (await db.medicines.where('childId').equals(childId).count()),
    sz: (await db.seizures.where('childId').equals(childId).filter((s) => s.start > Date.now() - 30 * 86400_000).count()),
    docs: (await db.documents.where('childId').equals(childId).count()),
  }), [childId]);
  return (
    <Page wide>
      <section className="tile t-blue !p-5 sm:!p-6 mb-6">
        <div className="relative z-[1] flex items-center gap-4">
          <Avatar blobId={child?.photoBlobId} name={child?.name} size={76} />
          <div className="flex-1 min-w-0">
            <h1 className="font-display text-[1.8rem] font-bold leading-tight truncate">{child?.name}</h1>
            {age && <p className="opacity-90 font-semibold">{t('ageYm', { y: age.y, m: age.m })}</p>}
          </div>
          <Link to="/child/profile" className="glass !w-12 !h-12" aria-label={t('editProfile')}><Pencil size={20} /></Link>
        </div>
        <div className="relative z-[1] grid grid-cols-3 gap-2 mt-5">
          {[[stats?.meds ?? 0, t('statMeds')], [stats?.sz ?? 0, t('statSeizures')], [stats?.docs ?? 0, t('statDocs')]].map(([n, l]) => (
            <div key={String(l)} className="rounded-2xl bg-white/15 px-3 py-2.5"><p className="text-2xl font-extrabold leading-none">{n}</p><p className="text-[0.72rem] font-semibold opacity-90 mt-1 line-clamp-1">{l}</p></div>
          ))}
        </div>
      </section>
      <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-5">
        {TILES.map(({ to, k, I, g }) => (
          <li key={to}><Link to={to} className={cx('tile min-h-[118px] flex flex-col justify-between h-full', g)}>
            <span className="glass relative z-[1]"><I size={21} aria-hidden /></span>
            <span className="relative z-[1]"><span className="block font-extrabold leading-tight">{t(k)}</span></span>
          </Link></li>
        ))}
      </ul>
      <Link to="/notebook/my-child" className="card p-4 flex items-center gap-4">
        <span className="w-12 h-12 rounded-2xl bg-[var(--pit)] text-[var(--pi)] flex items-center justify-center shrink-0"><Baby aria-hidden /></span>
        <span className="flex-1"><b className="block">{t('myChildPage')}</b></span>
        <ChevronRight className="text-muted" aria-hidden />
      </Link>
    </Page>
  );
}
