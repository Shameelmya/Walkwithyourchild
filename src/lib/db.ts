import Dexie, { type Table } from 'dexie';

export interface Child { id?: number; name: string; dob?: string; photoBlobId?: number; rescueMinutes?: number; createdAt: number }
export interface Setting { key: string; value: unknown; childId?: number }
export interface Bookmark { chapter: string; blockIndex: number; at: number }
export interface ReadingState { id: string; childId: number; chapter: string; blockIndex: number; bookmarks: Bookmark[]; progress: Record<string, number>; updatedAt: number }
export interface ChecklistItem { id: string; childId: number; chapter: string; blockIndex: number; item: number; checked: boolean }
export interface NotebookSheet { id?: number; childId: number; sheetId: string; data: Record<string, unknown>; updatedAt: number }
export interface Note { id?: number; childId: number; title: string; body: string; updatedAt: number }
export interface Medicine { id?: number; childId: number; name: string; purpose: string; dose: string; times: string[]; start?: string; stop?: string; notes: string; createdAt: number }
export type DoseStatus = 'given' | 'skipped' | 'late';
export interface DoseLog { id?: number; childId: number; medicineId: number; date: string; time: string; status: DoseStatus; at: number }
export interface Seizure { id?: number; childId: number; start: number; end: number; durationSec: number; looked?: string; helped?: string; rescue?: 'yes' | 'no' | ''; notes?: string; videoBlobId?: number }
export interface BlobRec { id?: number; childId: number; blob: Blob; type: string; name: string; createdAt: number }
export interface Visit { id?: number; childId: number; date: string; time?: string; doctor: string; hospital: string; purpose: string; done?: boolean; notifiedAt?: number }
export interface GenericRecord { id?: number; childId: number; date: string; [k: string]: unknown }
export interface Progress { id?: number; childId: number; date: string; scores: Record<string, number | undefined>; weight?: number; notes?: string; photoBlobId?: number }
export interface DocumentRec { id?: number; childId: number; category: number; title: string; blobId: number; type: string; createdAt: number }
export interface TalkCard { id?: number; childId: number; builtin?: number; label: string; phrase?: string; emoji?: string; photoBlobId?: number; voiceBlobId?: number; hidden?: boolean; order: number }
export interface Memory { id?: number; childId: number; kind: 'photo' | 'voice' | 'video' | 'note' | 'handprint'; date: string; title: string; text?: string; blobId?: number; createdAt: number }
export interface SelfCare { id?: number; childId: number; week: string; values: Record<string, boolean | number | undefined> }

export class WDB extends Dexie {
  children!: Table<Child, number>;
  settings!: Table<Setting, string>;
  readingState!: Table<ReadingState, string>;
  checklists!: Table<ChecklistItem, string>;
  notebook!: Table<NotebookSheet, number>;
  notes!: Table<Note, number>;
  medicines!: Table<Medicine, number>;
  doseLogs!: Table<DoseLog, number>;
  seizures!: Table<Seizure, number>;
  blobs!: Table<BlobRec, number>;
  visits!: Table<Visit, number>;
  consultations!: Table<GenericRecord, number>;
  diagnoses!: Table<GenericRecord, number>;
  reports!: Table<GenericRecord, number>;
  admissions!: Table<GenericRecord, number>;
  treatments!: Table<GenericRecord, number>;
  progress!: Table<Progress, number>;
  documents!: Table<DocumentRec, number>;
  talkCards!: Table<TalkCard, number>;
  memories!: Table<Memory, number>;
  selfCare!: Table<SelfCare, number>;

  constructor() {
    super('wwyc');
    this.version(1).stores({
      children: '++id',
      settings: 'key',
      readingState: 'id, childId',
      checklists: 'id, childId, chapter',
      notebook: '++id, &[childId+sheetId], childId',
      notes: '++id, childId, updatedAt',
      medicines: '++id, childId',
      doseLogs: '++id, childId, medicineId, date',
      seizures: '++id, childId, start',
      blobs: '++id, childId',
      visits: '++id, childId, date',
      consultations: '++id, childId, date',
      diagnoses: '++id, childId, date',
      reports: '++id, childId, date',
      admissions: '++id, childId, date',
      treatments: '++id, childId, date',
      progress: '++id, childId, date',
      documents: '++id, childId, category',
      talkCards: '++id, childId, order',
      memories: '++id, childId, date',
      selfCare: '++id, childId, week',
    });
    // v2: medicine times are always arrays; records get a sortable date.
    this.version(2)
      .stores({ doseLogs: '++id, childId, medicineId, date, [medicineId+date+time]' })
      .upgrade(async (tx) => {
        await tx.table('medicines').toCollection().modify((m: Medicine) => {
          if (!Array.isArray(m.times)) m.times = String(m.times ?? '').split(/[,\s]+/).filter(Boolean);
        });
        for (const t of ['diagnoses', 'reports', 'admissions', 'treatments', 'consultations']) {
          await tx.table(t).toCollection().modify((r: GenericRecord) => { if (!r.date) r.date = new Date().toISOString().slice(0, 10); });
        }
      });
  }
}

export const db = new WDB();
export const FAMILY = 0; // childId for family-wide records (reading, checklists, self-care)
export const DATA_TABLES = db.tables.map((t) => t.name);

export async function getSetting<T>(key: string, fallback: T): Promise<T> {
  const s = await db.settings.get(key);
  return (s?.value as T) ?? fallback;
}
export const setSetting = (key: string, value: unknown) => db.settings.put({ key, value, childId: FAMILY });

export async function putBlob(blob: Blob, childId: number, name = ''): Promise<number> {
  return db.blobs.add({ blob, type: blob.type, name, childId, createdAt: Date.now() });
}

export async function getSheet(childId: number, sheetId: string): Promise<Record<string, unknown>> {
  const s = await db.notebook.where('[childId+sheetId]').equals([childId, sheetId]).first();
  return s?.data ?? {};
}
export async function saveSheet(childId: number, sheetId: string, data: Record<string, unknown>) {
  const s = await db.notebook.where('[childId+sheetId]').equals([childId, sheetId]).first();
  if (s?.id) await db.notebook.update(s.id, { data, updatedAt: Date.now() });
  else await db.notebook.add({ childId, sheetId, data, updatedAt: Date.now() });
}
