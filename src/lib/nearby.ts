import { useEffect, useState } from 'react';
import type { Place } from './db';

export interface Centre { s: string; d: string; n: string; a: string; c: string; t: string }

let cache: Promise<Centre[]> | null = null;
/** The IAPC list is large, so it is only loaded when needed. */
export const loadCentres = () => (cache ??= import('../data/palliative.json').then((m) => m.default as Centre[]));

export const pinOf = (a: string) => { const m = [...a.matchAll(/\b(\d{3})\s?(\d{3})\b/g)].pop(); return m ? m[1] + m[2] : ''; };

/** Lower is nearer. Without maps or internet, nearness comes from the PIN code, the town name and the district. */
export function distance(x: Centre, p: Place): number {
  if (x.s !== p.state) return 99;
  const pin = (p.pin ?? '').replace(/\D/g, ''); const xp = pinOf(x.a);
  const town = (p.town ?? '').trim().toLowerCase();
  const gap = pin.length === 6 && xp ? Math.abs(+pin - +xp) : 0;
  if (pin.length === 6 && xp === pin) return 0;
  if (town.length > 2 && new RegExp(`(^|[^a-z])${town.replace(/[^a-z ]/g, '')}([^a-z]|$)`).test(`${x.n} ${x.a}`.toLowerCase())) return 1 + gap / 1e6;
  if (pin.length === 6 && xp.slice(0, 4) === pin.slice(0, 4)) return 2 + gap / 100;
  if (pin.length === 6 && xp.slice(0, 3) === pin.slice(0, 3)) return 3 + gap / 1000;
  if (p.district && x.d === p.district) return 4;
  if (gap) return 5 + gap / 1e6;
  return 9;
}

export const byNearest = (list: Centre[], p: Place) => list.map((x) => ({ x, k: distance(x, p) })).sort((a, b) => a.k - b.k);

/** The nearest centre that has a phone number, once the family has added their place. */
export function useNearest(p?: Place): Centre | undefined {
  const [c, setC] = useState<Centre>();
  const key = p ? `${p.state}|${p.district}|${p.town}|${p.pin}` : '';
  useEffect(() => {
    if (!p?.state) { setC(undefined); return; }
    let live = true;
    void loadCentres().then((all) => { const best = byNearest(all.filter((x) => x.t), p)[0]; if (live) setC(best && best.k < 9 ? best.x : undefined); });
    return () => { live = false; };
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps
  return c;
}
