import { db, type DoseLog, type DoseStatus, type Medicine } from './db';
import { isoDate } from './util';

export const isActive = (m: Medicine, day = isoDate()) => (!m.start || m.start <= day) && (!m.stop || m.stop >= day);
export interface Slot { med: Medicine; time: string; log?: DoseLog }

export async function todaySlots(childId: number, day = isoDate()): Promise<Slot[]> {
  const meds = (await db.medicines.where('childId').equals(childId).toArray()).filter((m) => isActive(m, day));
  const logs = await db.doseLogs.where('date').equals(day).toArray();
  const out: Slot[] = [];
  for (const m of meds) for (const time of [...m.times].sort()) out.push({ med: m, time, log: logs.find((l) => l.medicineId === m.id && l.time === time) });
  return out.sort((a, b) => a.time.localeCompare(b.time));
}

export async function logDose(childId: number, medicineId: number, time: string, status: DoseStatus, day = isoDate()) {
  const ex = await db.doseLogs.where('[medicineId+date+time]').equals([medicineId, day, time]).first();
  if (ex?.id) await db.doseLogs.update(ex.id, { status, at: Date.now() });
  else await db.doseLogs.add({ childId, medicineId, date: day, time, status, at: Date.now() });
}
export async function undoDose(medicineId: number, time: string, day = isoDate()) {
  await db.doseLogs.where('[medicineId+date+time]').equals([medicineId, day, time]).delete();
}
