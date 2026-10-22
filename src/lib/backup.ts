import JSZip from 'jszip';
import { db, setSetting } from './db';
import { decryptBytes, encryptBytes } from './crypto';

export async function createBackup(password: string, includeVideos: boolean): Promise<Blob> {
  const zip = new JSZip();
  const data: Record<string, unknown[]> = {};
  for (const t of db.tables) {
    if (t.name === 'blobs') continue;
    data[t.name] = await t.toArray();
  }
  const blobs = await db.blobs.toArray();
  const blobMeta: unknown[] = [];
  for (const b of blobs) {
    if (!includeVideos && b.type.startsWith('video/')) continue;
    zip.file(`blobs/${b.id}`, b.blob);
    blobMeta.push({ id: b.id, type: b.type, name: b.name, childId: b.childId, createdAt: b.createdAt });
  }
  data.blobs = blobMeta;
  zip.file('data.json', JSON.stringify({ version: db.verno, created: Date.now(), data }));
  const bytes = await zip.generateAsync({ type: 'uint8array', compression: 'DEFLATE', compressionOptions: { level: 6 } });
  const out = await encryptBytes(bytes, password);
  await setSetting('lastBackup', Date.now());
  return out;
}

export async function restoreBackup(file: Blob, password: string) {
  const bytes = await decryptBytes(await file.arrayBuffer(), password);
  const zip = await JSZip.loadAsync(bytes);
  const { data } = JSON.parse(await zip.file('data.json')!.async('string')) as { data: Record<string, Record<string, unknown>[]> };
  await db.transaction('rw', db.tables, async () => {
    for (const t of db.tables) await t.clear();
    for (const t of db.tables) {
      const rows = data[t.name];
      if (!rows || t.name === 'blobs') continue;
      await t.bulkPut(rows);
    }
  });
  for (const m of data.blobs ?? []) {
    const f = zip.file(`blobs/${m.id}`);
    if (!f) continue;
    const blob = new Blob([await f.async('uint8array') as BlobPart], { type: String(m.type) });
    await db.blobs.put({ ...(m as object), blob } as never);
  }
  await setSetting('lastBackup', Date.now());
}
