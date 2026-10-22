import { useT } from '../../i18n';
import { Page, PageHeader } from '../../components/ui';
import { meta } from '../../lib/content';

export default function Community() {
  const { t, lang } = useT();
  return (
    <Page>
      <PageHeader title={meta.nav.community[lang]} />
      <div className="card p-6 flex flex-col items-center text-center gap-3">
        <svg viewBox="0 0 200 140" width="220" aria-hidden>
          <path d="M10 120 C 50 120, 50 80, 90 80 S 140 40, 190 40" fill="none" stroke="rgb(var(--border))" strokeWidth="4" strokeDasharray="1 10" strokeLinecap="round" />
          {[[40, 104, 'var(--p1)'], [90, 80, 'var(--p2)'], [140, 54, 'var(--p3)']].map(([x, y, c], i) => (
            <g key={i}><circle cx={x as number} cy={(y as number) - 22} r="9" fill={c as string} /><path d={`M${(x as number) - 13} ${y} q13 -18 26 0`} fill={c as string} /></g>
          ))}
          <path d="M175 30 l6 -12 l6 12 l-6 5 z" fill="var(--pi)" />
        </svg>
        <p className="chip chip-on">{meta.nav.comingSoon[lang]}</p>
        <h2 className="text-xl font-extrabold">{t('communityTitle')}</h2>
        <p className="text-muted max-w-md">{t('communityText')}</p>
      </div>
    </Page>
  );
}
