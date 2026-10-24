import CREDITS from '../play/animal-credits.json';
import { Phone } from 'lucide-react';
import { useT } from '../../i18n';
import { Page, PageHeader, Section } from '../../components/ui';
import { meta, callTel } from '../../lib/content';
import { PathMotif } from '../../components/Path';

export default function About() {
  const { t, lang } = useT();
  return (
    <Page>
      <PageHeader title={t('about')} />
      <div className="card p-5 mb-6 text-center">
        <PathMotif height={80} filled={1} />
        <h2 className="text-2xl font-extrabold mt-2">{meta.appTitle[lang]}</h2>
        <p className="text-muted">{meta.subtitle[lang]}</p>
      </div>
      <Section title={t('aboutBook')}><p className="card p-4">{meta.about[lang]}</p></Section>
      <Section title={t('privacyTitle')}><p className="card p-4">{meta.privacy[lang]}</p></Section>
      <Section title={t('disclaimer')}><p className="card p-4">{meta.disclaimer[lang]}</p></Section>
      <Section title={t('helplines')}>
        <ul className="grid gap-2">{meta.numbers.map((n) => (
          <li key={n.number}><a href={callTel(n.number)} className="card p-4 flex items-center gap-3"><span className="w-12 h-12 rounded-full bg-danger text-ondanger flex items-center justify-center shrink-0"><Phone aria-hidden /></span>
            <span><b className="text-xl">{n.number}</b>{n.alt && <span className="text-muted"> · {n.alt}</span>}<br /><span className="text-sm">{n.label[lang]}</span></span></a></li>
        ))}</ul>
      </Section>
      <p className="text-center text-muted italic">{meta.storiesNote[lang]}</p>
      <p className="text-center text-muted mt-4">{meta.backPage[lang]}</p>
      <details className="card p-4 mt-6 text-sm">
        <summary className="font-bold cursor-pointer min-h-[40px]">🔊 Animal sound recordings</summary>
        <p className="text-muted mt-2">From freesound.org, via the ESC-50 dataset (K. J. Piczak). Used under each recording's licence.</p>
        <ul className="mt-2 grid gap-1">{CREDITS.map((c) => <li key={c.id}><b className="capitalize">{c.id}</b>: <a className="underline" href={c.url} target="_blank" rel="noopener noreferrer">{c.title}</a> by {c.author} ({c.license})</li>)}</ul>
      </details>
    </Page>
  );
}
