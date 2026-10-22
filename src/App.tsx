import { lazy, Suspense, useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, getSetting } from './lib/db';
import { applyUI, useUI } from './lib/store';
import { Layout } from './components/Layout';
import { Toaster } from './components/ui';
import { LockScreen, useAutoLock } from './components/Lock';
import { Reminders } from './components/Reminders';
import { UpdatePrompt } from './components/UpdatePrompt';
import Home from './pages/Home';

const L = (f: () => Promise<{ default: React.ComponentType }>) => lazy(f);
const Onboarding = L(() => import('./pages/Onboarding'));
const Contents = L(() => import('./pages/book/Contents'));
const Reader = L(() => import('./pages/book/Reader'));
const Search = L(() => import('./pages/book/Search'));
const Bookmarks = L(() => import('./pages/book/Bookmarks'));
const Notebook = L(() => import('./pages/notebook/Notebook'));
const SheetPage = L(() => import('./pages/notebook/SheetPage'));
const Notes = L(() => import('./pages/notebook/Notes'));
const ChildHub = L(() => import('./pages/child/ChildHub'));
const Medicines = L(() => import('./pages/child/Medicines'));
const SeizureTimer = L(() => import('./pages/child/SeizureTimer'));
const Seizures = L(() => import('./pages/child/Seizures'));
const SOS = L(() => import('./pages/SOS'));
const Visits = L(() => import('./pages/child/Visits'));
const Records = L(() => import('./pages/child/Records'));
const ProgressPage = L(() => import('./pages/child/Progress'));
const Summary = L(() => import('./pages/child/Summary'));
const Documents = L(() => import('./pages/child/Documents'));
const Talk = L(() => import('./pages/child/Talk'));
const Play = L(() => import('./pages/play/Play'));
const ForMe = L(() => import('./pages/more/ForMe'));
const Memory = L(() => import('./pages/more/Memory'));
const Updates = L(() => import('./pages/more/Updates'));
const Community = L(() => import('./pages/more/Community'));
const More = L(() => import('./pages/more/More'));
const Settings = L(() => import('./pages/more/Settings'));
const About = L(() => import('./pages/more/About'));
const Profile = L(() => import('./pages/child/Profile'));

function Spinner() { return <div className="flex justify-center py-24" aria-busy="true"><div className="w-10 h-10 rounded-full border-4 border-line border-t-accent animate-spin" /></div>; }

function Gate() {
  const loc = useLocation();
  const onboarded = useLiveQuery(() => getSetting('onboarded', false), []);
  const pin = useLiveQuery(() => getSetting<unknown>('pin', null), []);
  const children = useLiveQuery(() => db.children.count(), []);
  const { activeChildId, setActiveChild } = useUI();
  const [locked, setLocked] = useState<boolean | null>(null);
  useEffect(() => { if (pin !== undefined && locked === null) setLocked(!!pin); }, [pin, locked]);
  useAutoLock(!!pin, () => setLocked(true));
  useEffect(() => {
    if (children && !activeChildId) db.children.toCollection().first().then((c) => c?.id && setActiveChild(c.id));
  }, [children, activeChildId, setActiveChild]);
  if (onboarded === undefined || pin === undefined || locked === null) return <Spinner />;
  if (!onboarded && !loc.pathname.startsWith('/onboarding')) return <Navigate to="/onboarding" replace />;
  if (onboarded && locked && pin) return <LockScreen onUnlock={() => setLocked(false)} />;
  const bare = /^\/(onboarding|seizure$|sos|play)/.test(loc.pathname);
  const routes = (
    <Suspense fallback={<Spinner />}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/book" element={<Contents />} />
        <Route path="/book/search" element={<Search />} />
        <Route path="/book/bookmarks" element={<Bookmarks />} />
        <Route path="/book/:chapter" element={<Reader />} />
        <Route path="/notebook" element={<Notebook />} />
        <Route path="/notebook/notes" element={<Notes />} />
        <Route path="/notebook/:sheetId" element={<SheetPage />} />
        <Route path="/child" element={<ChildHub />} />
        <Route path="/child/profile" element={<Profile />} />
        <Route path="/medicines" element={<Medicines />} />
        <Route path="/seizure" element={<SeizureTimer />} />
        <Route path="/seizures" element={<Seizures />} />
        <Route path="/sos" element={<SOS />} />
        <Route path="/visits" element={<Visits />} />
        <Route path="/records" element={<Records />} />
        <Route path="/records/:kind" element={<Records />} />
        <Route path="/progress" element={<ProgressPage />} />
        <Route path="/summary" element={<Summary />} />
        <Route path="/documents" element={<Documents />} />
        <Route path="/talk" element={<Talk />} />
        <Route path="/play" element={<Play />} />
        <Route path="/me" element={<ForMe />} />
        <Route path="/memory" element={<Memory />} />
        <Route path="/updates" element={<Updates />} />
        <Route path="/updates/:id" element={<Updates />} />
        <Route path="/community" element={<Community />} />
        <Route path="/more" element={<More />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/about" element={<About />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
  return bare ? routes : <Layout>{routes}<Reminders /></Layout>;
}

export default function App() {
  const lang = useUI((s) => s.lang), theme = useUI((s) => s.theme), fontScale = useUI((s) => s.fontScale);
  useEffect(() => applyUI({ lang, theme, fontScale }), [lang, theme, fontScale]);
  return (
    <BrowserRouter>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[70] btn-primary">Skip to content</a>
      <Gate />
      <Toaster />
      <UpdatePrompt />
    </BrowserRouter>
  );
}
