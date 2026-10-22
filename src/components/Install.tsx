import { useEffect, useState } from 'react';

type BIP = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };
let deferred: BIP | null = null;
addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferred = e as BIP; });

export function useInstall() {
  const [can, setCan] = useState(!!deferred);
  useEffect(() => { const f = () => setCan(true); addEventListener('beforeinstallprompt', f); return () => removeEventListener('beforeinstallprompt', f); }, []);
  const standalone = matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
  return { can, standalone, ios, install: async () => { if (!deferred) return; await deferred.prompt(); deferred = null; setCan(false); } };
}
