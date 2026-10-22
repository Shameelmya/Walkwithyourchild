import { db, FAMILY, getSheet } from './db';
import { sheetById, workbook } from './content';
import { addDays, fmtDur, hhmm, isoDate, parseISO, weekStart } from './util';
import type { Lang } from './store';

export type Row = Record<string, string>;
export interface SheetData { values: Record<string, string>; rows: Row[]; checked: number[]; auto: number[]; weeks: { week: string; values: Record<string, boolean | number | undefined> }[] }

export const LINKED: Record<string, string> = { medicines: '/medicines', seizures: '/seizures', emergency: '/sos', treatments: '/records/treatments', documents: '/documents' };

export async function loadSheetData(sheetId: string, childId: number, lang: Lang): Promise<SheetData> {
  const out: SheetData = { values: {}, rows: [], checked: [], auto: [], weeks: [] };
  const d = await getSheet(childId, sheetId);
  out.values = (d.values as Record<string, string>) ?? {};
  out.rows = (d.rows as Row[]) ?? [];
  out.checked = (d.checked as number[]) ?? [];
  if (sheetId === 'medicines') {
    out.rows = (await db.medicines.where('childId').equals(childId).toArray()).filter((m) => !m.stop || m.stop >= isoDate())
      .map((m) => ({ medicine: m.name, for: m.purpose, dose: m.dose, times: m.times.join(', '), started: m.start ?? '', notes: m.notes }));
  } else if (sheetId === 'seizures') {
    out.rows = (await db.seizures.where('childId').equals(childId).reverse().sortBy('start')).map((s) => ({
      date: isoDate(new Date(s.start)), time: hhmm(new Date(s.start)), duration: fmtDur(s.durationSec), looked: s.looked ?? '', helped: s.helped ?? '', rescue: s.rescue ?? '',
    }));
  } else if (sheetId === 'treatments') {
    out.rows = (await db.treatments.where('childId').equals(childId).sortBy('date')).map((r) => ({ treatment: String(r.treatment ?? ''), where: String(r.where ?? ''), cost: String(r.cost ?? ''), changed: String(r.changed ?? '') }));
  } else if (sheetId === 'documents') {
    out.auto = [...new Set((await db.documents.where('childId').equals(childId).toArray()).map((x) => x.category))];
  } else if (sheetId === 'selfcare') {
    const all = await db.selfCare.where('childId').equals(FAMILY).toArray();
    const ws = weekStart();
    out.weeks = [3, 2, 1, 0].map((k) => { const w = isoDate(addDays(parseISO(ws), -7 * k)); return { week: w, values: all.find((x) => x.week === w)?.values ?? {} }; });
  } else if (sheetId === 'support') {
    const pre = sheetById('support')!.prefilled ?? [];
    const n = Math.max(pre.length, out.rows.length);
    out.rows = Array.from({ length: n }, (_, i) => ({ ...(out.rows[i] ?? {}), need: out.rows[i]?.need || (pre[i]?.[lang] ?? '') }));
  }
  return out;
}

export const allSheets = () => workbook.sheets;
