import { useLiveQuery } from 'dexie-react-hooks';
import { Check, Phone } from 'lucide-react';
import { db, FAMILY } from '../../lib/db';
import { sheetById, loc, type L10n } from '../../lib/content';
import { addDays, fmtDate, isoDate, parseISO, weekStart, cx } from '../../lib/util';
import { useT } from '../../i18n';

export function useSelfCare() {
  return useLiveQuery(async () => {
    const all = await db.selfCare.where('childId').equals(FAMILY).toArray();
    const ws = weekStart();
    return [3, 2, 1, 0].map((k) => { const w = isoDate(addDays(parseISO(ws), -7 * k)); return all.find((x) => x.week === w) ?? { childId: FAMILY, week: w, values: {} }; });
  }, []);
}
/** Rule from workbook: mood <= 2 for 2 consecutive weeks. */
export function lowMoodTwoWeeks(weeks: { values: Record<string, unknown> }[] | undefined) {
  if (!weeks) return false;
  for (let i = 1; i < weeks.length; i++) {
    const a = weeks[i - 1].values.mood as number | undefined, b = weeks[i].values.mood as number | undefined;
    if (a !== undefined && b !== undefined && a <= 2 && b <= 2) return true;
  }
  return false;
}

export function SelfCareCard() {
  const { t, lang } = useT();
  return (
    <div role="alert" className="rounded-2xl p-4 bg-[var(--urt)] border-2 border-[var(--ur)] my-4">
      <p className="font-extrabold mb-1">{t('lowMoodTitle')}</p>
      <p className="mb-3">{t('lowMoodText')}</p>
      <a href="tel:14416" className="btn-danger"><Phone size={18} aria-hidden /> {t('callTeleManas')}</a>
      <p className="text-sm mt-3">{loc(sheetById('selfcare')!.warning, lang)}</p>
    </div>
  );
}

export function WeeklyEditor({ currentOnly = false }: { currentOnly?: boolean }) {
  const { t, lang } = useT();
  const sheet = sheetById('selfcare')!;
  const rows = sheet.rows as { id: string; label: L10n; input: string }[];
  const weeks = useSelfCare();
  if (!weeks) return null;
  const set = async (week: string, id: string, v: boolean | number | undefined) => {
    const ex = await db.selfCare.where('week').equals(week).first();
    if (ex?.id) await db.selfCare.update(ex.id, { values: { ...ex.values, [id]: v } });
    else await db.selfCare.add({ childId: FAMILY, week, values: { [id]: v } });
  };
  const shown = currentOnly ? weeks.slice(-1) : weeks;
  return (
    <div>
      {lowMoodTwoWeeks(weeks) && <SelfCareCard />}
      <div className="grid gap-4" style={{ gridTemplateColumns: currentOnly ? '1fr' : undefined }}>
        {shown.map((w, wi) => (
          <section key={w.week} className="card p-4">
            <h3 className="font-extrabold mb-3">{wi === shown.length - 1 ? loc(sheet.rowHeader, lang) : `${loc(sheet.weekLabel, lang)} ${wi + 1}`} <span className="text-muted font-semibold text-sm">· {fmtDate(w.week, lang, { day: 'numeric', month: 'short' })}</span></h3>
            <ul className="grid gap-2">
              {rows.map((r) => {
                const v = w.values[r.id];
                if (r.input === 'scale1to5') return (
                  <li key={r.id}><p className="font-semibold mb-1">{loc(r.label, lang)}</p>
                    <div role="radiogroup" aria-label={loc(r.label, lang)} className="flex gap-2">{[1, 2, 3, 4, 5].map((n) => <button key={n} role="radio" aria-checked={v === n} onClick={() => set(w.week, r.id, v === n ? undefined : n)} className={cx('w-12 h-12 rounded-full border-2 font-extrabold', v === n ? 'bg-accent text-onaccent border-accent' : 'border-line')}>{n}</button>)}</div></li>
                );
                return (
                  <li key={r.id}><button role="checkbox" aria-checked={!!v} onClick={() => set(w.week, r.id, !v)} className={cx('w-full flex items-center gap-3 p-2 rounded-xl text-left min-h-[48px] border-2', v ? 'border-accent bg-soft' : 'border-line')}>
                    <span className={cx('w-7 h-7 rounded-lg border-2 flex items-center justify-center shrink-0', v ? 'bg-accent border-accent text-onaccent' : 'border-muted/60')}>{!!v && <Check size={18} />}</span>{loc(r.label, lang)}</button></li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
      <p className="text-sm text-muted mt-4">{t('selfCareNote')}</p>
    </div>
  );
}
