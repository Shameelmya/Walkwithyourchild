import { Link, useParams } from 'react-router-dom';
import updates from '../../generated/updates.json';
import { useT } from '../../i18n';
import { Page, PageHeader, Empty } from '../../components/ui';
import { fmtDate } from '../../lib/util';

type U = { id: string; date: string; title: string; html: string };
export default function Updates() {
  const { id } = useParams();
  const { t, lang } = useT();
  const list = ((updates as Record<string, U[]>)[lang] ?? []) as U[];
  const u = id ? list.find((x) => x.id === id) : undefined;
  if (u) return (
    <Page>
      <PageHeader title={u.title} sub={fmtDate(u.date, lang)} back="/updates" />
      <article className="prose-read card p-5" dangerouslySetInnerHTML={{ __html: u.html }} />
    </Page>
  );
  return (
    <Page>
      <PageHeader title={t('navUpdates')} />
      {!list.length ? <Empty kind="leaf" title={t('noUpdates')} /> : (
        <ul className="grid gap-3">{list.map((x) => (
          <li key={x.id}><Link to={`/updates/${x.id}`} className="card block p-4 hover:bg-surface2">
            <p className="text-sm text-muted font-bold">{fmtDate(x.date, lang)}</p><p className="text-lg font-extrabold">{x.title}</p>
            <p className="text-muted line-clamp-2">{x.html.replace(/<[^>]+>/g, '')}</p>
          </Link></li>
        ))}</ul>
      )}
    </Page>
  );
}
