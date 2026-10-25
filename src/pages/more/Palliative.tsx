import { useEffect, useMemo, useState } from 'react';
import { Phone, Search, MapPin } from 'lucide-react';
import { useT } from '../../i18n';
import { Page, PageHeader } from '../../components/ui';
import { ct } from '../../lib/careText';
import { Link } from 'react-router-dom';
import DATA from '../../data/palliative.json';
import { useChild } from '../../lib/hooks';
import { distance, type Centre } from '../../lib/nearby';
const ALL = DATA as Centre[];
const STATES = [...new Set(ALL.map((x) => x.s))].sort();
const KEY = 'wwyc-pc-state';

/** Palliative care centres across India (Indian Association of Palliative Care directory): pick a state, a district, or search. */
export default function Palliative() {
  const { lang } = useT();
  const L = (k: Parameters<typeof ct>[1], v?: Record<string, string | number>) => ct(lang, k, v);
  const [st, setSt] = useState(() => { try { return localStorage.getItem(KEY) || 'Kerala'; } catch { return 'Kerala'; } });
  const [d, setDraw] = useState(() => { try { return localStorage.getItem(KEY + '-d') || ''; } catch { return ''; } });
  const setD = (v: string) => { setDraw(v); try { localStorage.setItem(KEY + '-d', v); } catch { /* */ } };
  const [q, setQ] = useState('');
  const place = useChild()?.place;
  // The family's own place (from the profile) decides where the list opens.
  useEffect(() => { if (place?.state) { setSt(place.state); setDraw(place.district ?? ''); } }, [place?.state, place?.district]);
  const near = place?.state === st;
  const inState = useMemo(() => ALL.filter((x) => x.s === st), [st]);
  const districts = useMemo(() => [...new Set(inState.map((x) => x.d).filter(Boolean))].sort(), [inState]);
  const shown = useMemo(() => {
    const w = q.trim().toLowerCase();
    const list = inState.filter((x) => (!d || x.d === d || (near && distance(x, place) < 4)) && (!w || `${x.n} ${x.a} ${x.c}`.toLowerCase().includes(w)));
    return near ? list.map((x) => ({ x, k: distance(x, place) })).sort((a, b) => a.k - b.k).map((y) => y.x) : list;
  }, [inState, d, q, near, place]);
  const isNear = (x: Centre, i: number) => near && i < 3 && distance(x, place) < 5;
  return (
    <Page>
      <PageHeader title={L('findCentre')} />
      <p className="text-sm rounded-2xl bg-soft p-3 mb-4">{L('iapcNote')}</p>
      {!place?.state && <Link to="/child/profile" className="block text-sm font-bold text-accent underline mb-4 min-h-[32px]">{L('setPlace')}</Link>}
      <div className="grid gap-2.5 mb-4">
        <label><span className="label">{L('state')}</span>
          <select className="input" value={st} onChange={(e) => { setSt(e.target.value); setD(''); try { localStorage.setItem(KEY, e.target.value); } catch { /* */ } }}>{STATES.map((s) => <option key={s}>{s}</option>)}</select></label>
        {districts.length > 0 && <label><span className="label">{L('district')}</span>
          <select className="input" value={d} onChange={(e) => setD(e.target.value)}><option value="">{L('allDistricts')}</option>{districts.map((x) => <option key={x}>{x}</option>)}</select></label>}
        <label className="relative"><span className="sr-only">{L('searchCentres')}</span><Search size={18} className="absolute start-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden />
          <input className="input !ps-10" type="search" placeholder={L('searchCentres')} value={q} onChange={(e) => setQ(e.target.value)} /></label>
      </div>
      <p className="text-sm font-bold text-muted mb-2" aria-live="polite">{L('nCentres', { n: shown.length })}</p>
      <ul className="grid gap-2.5 mb-6">
        {shown.slice(0, 200).map((x, i) => (
          <li key={i} className={`card p-4${isNear(x, i) ? ' ring-2 ring-[rgb(var(--accent))]' : ''}`}>
            {isNear(x, i) && <span className="chip chip-on !min-h-[26px] text-xs mb-2">📍 {L('nearYou')}</span>}
            <b className="block leading-snug">{x.n}</b>
            <p className="text-sm text-muted mt-1 flex gap-1.5"><MapPin size={15} className="shrink-0 mt-0.5" aria-hidden />{x.d ? `${x.d} · ` : ''}{x.a}</p>
            {x.c && <p className="text-sm mt-1.5 break-words">{x.c}</p>}
            {x.t && <a href={`tel:${x.t}`} className="btn-primary !min-h-[48px] mt-3 w-full"><Phone size={18} aria-hidden /> {L('call')} {x.t.replace('+91', '+91 ')}</a>}
          </li>
        ))}
      </ul>
      {shown.length > 200 && <p className="text-sm text-muted mb-6">{L('narrowDown')}</p>}
      <p className="text-xs text-muted">Source: Indian Association of Palliative Care, palliativecare.in (checked {new Date(2026, 9).toLocaleDateString(lang === 'en' ? 'en-IN' : `${lang}-IN`, { month: 'long', year: 'numeric' })}).</p>
    </Page>
  );
}
