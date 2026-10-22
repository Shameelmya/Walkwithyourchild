import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, getSheet, saveSheet } from './db';
import { useUI } from './store';

export function useChildId() { return useUI((s) => s.activeChildId); }
export function useChild() {
  const id = useChildId();
  return useLiveQuery(() => (id ? db.children.get(id) : undefined), [id]);
}
export function useChildren() { return useLiveQuery(() => db.children.toArray(), []) ?? []; }

export function useBlobUrl(id?: number) {
  const [url, setUrl] = useState<string>();
  useEffect(() => {
    let u: string | undefined; let live = true;
    if (!id) { setUrl(undefined); return; }
    db.blobs.get(id).then((b) => { if (b && live) { u = URL.createObjectURL(b.blob); setUrl(u); } });
    return () => { live = false; if (u) URL.revokeObjectURL(u); };
  }, [id]);
  return url;
}

/** Notebook sheet data with debounced autosave. */
export function useSheet(sheetId: string, childOverride?: number) {
  const active = useChildId();
  const childId = childOverride ?? active;
  const key = `${childId}:${sheetId}`;
  const [st, setSt] = useState<{ key: string; data: Record<string, unknown>; dirty: boolean } | null>(null);
  useEffect(() => { let live = true; getSheet(childId, sheetId).then((d) => live && setSt({ key, data: d, dirty: false })); return () => { live = false; }; }, [childId, sheetId, key]);
  useEffect(() => {
    if (!st || st.key !== key || !st.dirty) return;
    const h = setTimeout(() => void saveSheet(childId, sheetId, st.data), 400);
    return () => clearTimeout(h);
  }, [st, key, childId, sheetId]);
  const data = st && st.key === key ? st.data : null;
  const setData = (d: Record<string, unknown>) => setSt({ key, data: d, dirty: true });
  return [data, setData] as const;
}

export function useOnline() {
  const [on, setOn] = useState(navigator.onLine);
  useEffect(() => { const a = () => setOn(true), b = () => setOn(false); addEventListener('online', a); addEventListener('offline', b); return () => { removeEventListener('online', a); removeEventListener('offline', b); }; }, []);
  return on;
}

export function useWakeLockSafe() {
  useEffect(() => {
    if (!('wakeLock' in navigator)) return;
    let l: WakeLockSentinel | undefined;
    navigator.wakeLock.request('screen').then((x) => (l = x)).catch(() => {});
    return () => { void l?.release(); };
  }, []);
}
