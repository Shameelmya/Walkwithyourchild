import { db, FAMILY, type ReadingState } from './db';
import { toc } from './content';

export const RS_ID = 'main';
export async function getReading(): Promise<ReadingState> {
  return (await db.readingState.get(RS_ID)) ?? { id: RS_ID, childId: FAMILY, chapter: 'c0', blockIndex: 0, bookmarks: [], progress: {}, updatedAt: 0 };
}
export async function savePosition(chapter: string, blockIndex: number) {
  const r = await getReading();
  const total = toc.toc.find((c) => c.id === chapter)?.blocks ?? 1;
  const seen = Math.max(r.progress[chapter] ?? 0, Math.min(total, blockIndex + 1));
  await db.readingState.put({ ...r, chapter, blockIndex, progress: { ...r.progress, [chapter]: seen }, updatedAt: Date.now() });
}
export async function toggleBookmark(chapter: string, blockIndex: number) {
  const r = await getReading();
  const has = r.bookmarks.some((b) => b.chapter === chapter && b.blockIndex === blockIndex);
  const bookmarks = has ? r.bookmarks.filter((b) => !(b.chapter === chapter && b.blockIndex === blockIndex)) : [...r.bookmarks, { chapter, blockIndex, at: Date.now() }];
  await db.readingState.put({ ...r, bookmarks });
  return !has;
}
export const chapterPct = (r: ReadingState | undefined, id: string) => {
  const c = toc.toc.find((x) => x.id === id);
  return c && r ? Math.min(1, (r.progress[id] ?? 0) / Math.max(1, c.blocks)) : 0;
};
export const journeyPct = (r: ReadingState | undefined) => {
  if (!r) return 0;
  const book = toc.toc.filter((c) => c.id !== 'appendix');
  const total = book.reduce((s, c) => s + c.blocks, 0);
  return book.reduce((s, c) => s + Math.min(c.blocks, r.progress[c.id] ?? 0), 0) / total;
};
