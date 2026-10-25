import { useEffect, useState } from 'react';
import { useT } from '../i18n';
import { ct } from '../lib/careText';
import { loadCentres, type Centre } from '../lib/nearby';
import type { Place } from '../lib/db';

/** State, district, town and PIN code. All optional; kept on this phone only. */
export function PlaceFields({ value, onChange }: { value?: Place; onChange: (p?: Place) => void }) {
  const { lang } = useT();
  const L = (k: Parameters<typeof ct>[1]) => ct(lang, k);
  const [all, setAll] = useState<Centre[]>([]);
  useEffect(() => { void loadCentres().then(setAll); }, []);
  const states = [...new Set(all.map((x) => x.s))].sort();
  const districts = [...new Set(all.filter((x) => x.s === value?.state).map((x) => x.d).filter(Boolean))].sort();
  const set = (p: Partial<Place>) => { const v = { state: '', ...value, ...p }; onChange(v.state ? v : undefined); };
  return (
    <fieldset className="grid gap-3">
      <legend className="label">{L('whereLive')}</legend>
      <select className="input" aria-label={L('state')} value={value?.state ?? ''} onChange={(e) => set({ state: e.target.value, district: '' })}>
        <option value="">{L('state')}</option>{states.map((s) => <option key={s}>{s}</option>)}
      </select>
      {districts.length > 0 && <select className="input" aria-label={L('district')} value={value?.district ?? ''} onChange={(e) => set({ district: e.target.value })}>
        <option value="">{L('district')}</option>{districts.map((d) => <option key={d}>{d}</option>)}
      </select>}
      {value?.state && <div className="grid grid-cols-[1fr_8rem] gap-2">
        <input className="input" aria-label={L('town')} placeholder={L('town')} value={value.town ?? ''} onChange={(e) => set({ town: e.target.value })} />
        <input className="input tabular-nums" aria-label={L('pinCode')} placeholder={L('pinCode')} inputMode="numeric" maxLength={6} value={value.pin ?? ''} onChange={(e) => set({ pin: e.target.value.replace(/\D/g, '').slice(0, 6) })} />
      </div>}
      <p className="text-sm text-muted">{L('placeHint')}</p>
    </fieldset>
  );
}
