import { useCallback, useEffect, useRef } from 'react';
import { useLocation, useNavigate, useNavigationType, type Location } from 'react-router-dom';

/* In-app history, mirrored from the router so "back" can always go to where the user really came from.
   Back buttons never push a new page (that is what caused loops); they pop, or replace when the app was opened directly. */
type Entry = { key: string; path: string };
const KEY = 'wwyc-nav';
let stack: Entry[] = (() => { try { return JSON.parse(sessionStorage.getItem(KEY) || '[]'); } catch { return []; } })();
const persist = () => { try { sessionStorage.setItem(KEY, JSON.stringify(stack.slice(-60))); } catch { /* */ } };
const pathOf = (l: Location) => l.pathname + l.search;

export function useNavTracker() {
  const loc = useLocation();
  const type = useNavigationType();
  useEffect(() => {
    const e = { key: loc.key, path: pathOf(loc) };
    if (type === 'POP') {
      const i = stack.findIndex((x) => x.key === loc.key);
      stack = i >= 0 ? stack.slice(0, i + 1) : [e];
    } else if (type === 'REPLACE') stack = [...stack.slice(0, -1), e];
    else stack = [...stack, e];
    persist();
  }, [loc, type]);
}

/** Path one level up, used when there is no earlier page in the app to return to. */
export function parentOf(path: string) {
  const p = path.split('?')[0];
  const map: Record<string, string> = {
    '/medicines': '/child', '/seizures': '/child', '/visits': '/child', '/records': '/child', '/progress': '/child', '/documents': '/child',
    '/summary': '/child', '/talk': '/child', '/child/profile': '/child', '/me': '/more', '/memory': '/more', '/updates': '/more',
    '/community': '/more', '/settings': '/more', '/about': '/more', '/book/search': '/book', '/book/bookmarks': '/book', '/notebook/notes': '/notebook',
  };
  if (map[p]) return map[p];
  const parts = p.split('/').filter(Boolean);
  return parts.length > 1 ? '/' + parts.slice(0, -1).join('/') : '/';
}

/** Go back like the phone's back button; if the app was opened straight on this page, go up to `fallback` instead. */
export function useBack() {
  const nav = useNavigate();
  const loc = useLocation();
  return useCallback((fallback?: string) => {
    const i = stack.findIndex((x) => x.key === loc.key);
    if (i > 0) nav(-1);
    else nav(fallback ?? parentOf(loc.pathname), { replace: true });
  }, [nav, loc]);
}

/** Sheets, menus and panels: the phone's back button closes them instead of leaving the page. */
export function useBackToClose(open: boolean, onClose: () => void) {
  const nav = useNavigate();
  const loc = useLocation();
  const id = useRef(Math.random().toString(36).slice(2));
  const pushed = useRef(false);
  const seen = useRef(false); // our history entry has actually become the current one
  const close = useRef(onClose); close.current = onClose;
  const ours = () => ((window.history.state?.usr?.sheets as string[] | undefined) ?? []).includes(id.current);
  useEffect(() => {
    if (open && !pushed.current) {
      pushed.current = true; seen.current = false;
      const st = (loc.state as { sheets?: string[] } | null) ?? {};
      nav(loc.pathname + loc.search + loc.hash, { state: { ...st, sheets: [...(st.sheets ?? []), id.current] } });
    } else if (!open && pushed.current) {
      pushed.current = false;
      if (ours()) nav(-1);
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!pushed.current) return;
    const here = ((loc.state as { sheets?: string[] } | null)?.sheets ?? []).includes(id.current);
    if (here) seen.current = true;
    else if (seen.current) { pushed.current = false; seen.current = false; close.current(); } // the phone's back button was pressed
  }, [loc]);
  useEffect(() => () => { if (pushed.current && ours()) window.history.back(); }, []);
}

/** The page the user came from inside the app (undefined if the app was opened on this page). */
export function usePrevPath() {
  const loc = useLocation();
  const i = stack.findIndex((x) => x.key === loc.key);
  return i > 0 ? stack[i - 1].path : undefined;
}
