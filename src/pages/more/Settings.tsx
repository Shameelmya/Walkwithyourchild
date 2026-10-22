import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { CloudUpload, CloudDownload, Lock, Trash2, FileDown, Plus, Bell, Info, Phone } from 'lucide-react';
import { useT } from '../../i18n';
import { Page, PageHeader, Section, Modal, Confirm, Avatar, FileButton, useToast } from '../../components/ui';
import { DisplaySettings } from '../../components/ReaderSettings';
import { db, getSetting, setSetting } from '../../lib/db';
import { hashPin, verifyPin, type PinHash } from '../../lib/crypto';
import { createBackup, restoreBackup } from '../../lib/backup';
import { useChildren, useChildId } from '../../lib/hooks';
import { useUI } from '../../lib/store';
import { fmtDate, shareOrDownload, isoDate } from '../../lib/util';
import { meta, workbook, callTel } from '../../lib/content';
import { pdfFromNode } from '../../lib/printing';
import { loadSheetData } from '../../lib/sheets';
import { PrintSheet } from '../../components/sheets/PrintSheet';
import { loadSummary, SummaryDoc } from '../../components/SummaryDoc';

function PinSettings() {
  const { t } = useT();
  const toast = useToast((s) => s.show);
  const pin = useLiveQuery(() => getSetting<PinHash | null>('pin', null), []);
  const [mode, setMode] = useState<'' | 'set' | 'off'>('');
  const [a, setA] = useState(''); const [b, setB] = useState(''); const [old, setOld] = useState(''); const [err, setErr] = useState('');
  const close = () => { setMode(''); setA(''); setB(''); setOld(''); setErr(''); };
  const submit = async () => {
    if (pin && !(await verifyPin(old, pin))) return setErr(t('wrongPin'));
    if (mode === 'off') { await setSetting('pin', null); toast(t('pinRemoved')); return close(); }
    if (a.length !== 4) return setErr(t('pinShort'));
    if (a !== b) return setErr(t('pinMismatch'));
    await setSetting('pin', await hashPin(a)); toast(t('pinSaved')); close();
  };
  const inp = (id: string, v: string, s: (x: string) => void, l: string) => <div><label className="label" htmlFor={id}>{l}</label><input id={id} className="input" type="password" inputMode="numeric" maxLength={4} value={v} onChange={(e) => s(e.target.value.replace(/\D/g, ''))} /></div>;
  return (
    <div className="card p-4">
      <p className="mb-3">{pin ? t('pinIsOn') : t('pinIsOff')}</p>
      <div className="flex flex-wrap gap-2">
        <button className="btn-primary" onClick={() => setMode('set')}><Lock size={18} aria-hidden /> {pin ? t('changePin') : t('setPin')}</button>
        {pin && <button className="btn-ghost" onClick={() => setMode('off')}>{t('turnOffPin')}</button>}
      </div>
      <p className="text-sm text-muted mt-2">{t('autoLockNote')}</p>
      <Modal open={!!mode} onClose={close} title={mode === 'off' ? t('turnOffPin') : pin ? t('changePin') : t('setPin')}>
        <div className="grid gap-3">
          {pin && inp('pin-old', old, setOld, t('currentPin'))}
          {mode === 'set' && <>{inp('pin-a', a, setA, t('newPin'))}{inp('pin-b', b, setB, t('repeatPin'))}</>}
          {err && <p role="alert" className="text-danger font-bold">{err}</p>}
          <button className="btn-primary" onClick={submit}>{t('save')}</button>
        </div>
      </Modal>
    </div>
  );
}

function Backup() {
  const { t, lang } = useT();
  const toast = useToast((s) => s.show);
  const last = useLiveQuery(() => getSetting<number>('lastBackup', 0), []);
  const [mode, setMode] = useState<'' | 'make' | 'restore'>('');
  const [pw, setPw] = useState(''); const [pw2, setPw2] = useState(''); const [videos, setVideos] = useState(true);
  const [file, setFile] = useState<File | null>(null); const [busy, setBusy] = useState(false); const [err, setErr] = useState('');
  const close = () => { setMode(''); setPw(''); setPw2(''); setFile(null); setErr(''); };
  const make = async () => {
    if (pw.length < 6) return setErr(t('passwordShort'));
    if (pw !== pw2) return setErr(t('passwordMismatch'));
    setBusy(true);
    try { const b = await createBackup(pw, videos); await shareOrDownload(b, `walk-with-your-child-${isoDate()}.wwyc`, t('backup')); toast(t('backupDone')); close(); }
    catch (e) { console.warn(e); setErr(t('somethingWrong')); }
    setBusy(false);
  };
  const restore = async () => {
    if (!file) return;
    setBusy(true);
    try { await restoreBackup(file, pw); toast(t('restoreDone')); close(); setTimeout(() => location.reload(), 800); }
    catch { setErr(t('restoreFailed')); }
    setBusy(false);
  };
  return (
    <div className="card p-4" id="backup">
      <p className="mb-1">{t('backupExplain')}</p>
      <p className="text-sm text-muted mb-3">{last ? t('lastBackupOn', { date: fmtDate(last, lang) }) : t('neverBackedUp')}</p>
      <div className="flex flex-wrap gap-2">
        <button className="btn-primary" onClick={() => setMode('make')}><CloudUpload size={18} aria-hidden /> {t('makeBackup')}</button>
        <FileButton accept=".wwyc,application/octet-stream" onFile={(f) => { setFile(f); setMode('restore'); }}><CloudDownload size={18} aria-hidden /> {t('restoreBackup')}</FileButton>
      </div>
      <Modal open={!!mode} onClose={close} title={mode === 'make' ? t('makeBackup') : t('restoreBackup')}>
        <div className="grid gap-3">
          {mode === 'restore' && <p className="p-3 rounded-xl bg-[var(--urt)]">{t('restoreWarning')}</p>}
          <div><label className="label" htmlFor="bk-pw">{t('backupPassword')}</label><input id="bk-pw" className="input" type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="new-password" /></div>
          {mode === 'make' && <>
            <div><label className="label" htmlFor="bk-pw2">{t('repeatPassword')}</label><input id="bk-pw2" className="input" type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} autoComplete="new-password" /></div>
            <label className="flex items-center gap-3 min-h-[48px]"><input type="checkbox" className="w-6 h-6 accent-[rgb(var(--accent))]" checked={videos} onChange={(e) => setVideos(e.target.checked)} />{t('includeVideos')}</label>
            <p className="text-sm text-muted">{t('passwordWarning')}</p>
          </>}
          {err && <p role="alert" className="text-danger font-bold">{err}</p>}
          <button className="btn-primary" disabled={busy || !pw} onClick={mode === 'make' ? make : restore}>{busy ? t('preparing') : mode === 'make' ? t('makeBackup') : t('restoreBackup')}</button>
        </div>
      </Modal>
    </div>
  );
}

export default function Settings() {
  const { t, lang } = useT();
  const nav = useNavigate();
  const toast = useToast((s) => s.show);
  const kids = useChildren();
  const childId = useChildId();
  const setActive = useUI((s) => s.setActiveChild);
  const [rescue, setRescue] = useState(5);
  const reminders = useLiveQuery(() => getSetting('reminders', true), []);
  const [perm, setPerm] = useState(typeof Notification !== 'undefined' ? Notification.permission : 'denied');
  const [del1, setDel1] = useState(false); const [del2, setDel2] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => { getSetting('defaultRescue', 5).then(setRescue); }, []);
  useEffect(() => { if (location.hash === '#backup') setTimeout(() => document.getElementById('backup')?.scrollIntoView({ behavior: 'smooth' }), 200); }, []);
  const exportAll = async () => {
    setBusy(true);
    try {
      const data = await Promise.all(workbook.sheets.map((s) => loadSheetData(s.id, childId, lang)));
      const sum = await loadSummary(childId);
      const b = await pdfFromNode(<><SummaryDoc d={sum} lang={lang} />{workbook.sheets.map((s, i) => <PrintSheet key={s.id} sheet={s} data={data[i]} lang={lang} blank={false} />)}</>);
      await shareOrDownload(b, `walk-with-your-child-${isoDate()}.pdf`, meta.appTitle[lang]);
    } catch (e) { console.warn(e); toast(t('somethingWrong')); }
    setBusy(false);
  };
  return (
    <Page>
      <PageHeader title={t('navSettings')} />
      <Section title={t('display')}><div className="card p-4"><DisplaySettings /></div></Section>
      <Section title={t('childProfiles')}>
        <ul className="card divide-y divide-line/60">
          {kids.map((k) => <li key={k.id}><button className="w-full flex items-center gap-3 p-3 min-h-[56px]" onClick={() => { setActive(k.id!); nav('/child/profile'); }}><Avatar blobId={k.photoBlobId} name={k.name} size={40} /><span className="flex-1 text-left font-bold">{k.name}</span>{k.id === childId && <span className="chip chip-on !min-h-[28px] text-xs">{t('active')}</span>}</button></li>)}
        </ul>
        <button className="btn-ghost mt-2" onClick={() => nav('/child/profile?new=1')}><Plus size={18} aria-hidden /> {t('addChild')}</button>
      </Section>
      <Section title={t('pinLock')}><PinSettings /></Section>
      <Section title={t('seizureSettings')}>
        <div className="card p-4"><label className="label" htmlFor="s-rescue">{t('defaultRescueTime')}</label>
          <div className="flex items-center gap-3"><input id="s-rescue" type="number" min={1} max={30} className="input w-28" value={rescue} onChange={(e) => { const v = Math.max(1, Math.min(30, +e.target.value || 5)); setRescue(v); void setSetting('defaultRescue', v); }} /><span>{t('minutes')}</span></div>
          <p className="text-sm text-muted mt-1">{t('rescueHint')}</p></div>
      </Section>
      <Section title={t('reminders')}>
        <div className="card p-4 grid gap-3">
          <label className="flex items-center gap-3 min-h-[48px]"><input type="checkbox" className="w-6 h-6 accent-[rgb(var(--accent))]" checked={!!reminders} onChange={(e) => setSetting('reminders', e.target.checked)} /><Bell size={18} aria-hidden /> {t('inAppReminders')}</label>
          {perm !== 'granted' && 'Notification' in window && <button className="btn-ghost justify-self-start" onClick={async () => setPerm(await Notification.requestPermission())}>{t('allowNotifications')}</button>}
          {perm === 'denied' && <p className="text-sm text-muted">{t('notificationsBlocked')}</p>}
          <p className="text-sm p-3 rounded-xl bg-soft"><Info size={16} className="inline mr-1" aria-hidden />{t('remindersHonest')}</p>
        </div>
      </Section>
      <Section title={t('backupRestore')}><Backup /></Section>
      <Section title={t('exportData')}>
        <div className="card p-4"><p className="mb-3">{t('exportExplain')}</p><button className="btn-outline" disabled={busy} onClick={exportAll}><FileDown size={18} aria-hidden /> {busy ? t('preparing') : t('exportPdf')}</button></div>
      </Section>
      <Section title={t('about')}>
        <div className="card p-4 grid gap-3">
          <p>{meta.about[lang]}</p>
          <p className="text-sm"><b>{t('disclaimer')}:</b> {meta.disclaimer[lang]}</p>
          <div className="flex flex-wrap gap-2">{meta.numbers.map((n) => <a key={n.number} href={callTel(n.number)} className="chip"><Phone size={16} aria-hidden /> {n.number}</a>)}</div>
          <Link to="/about" className="text-accent font-bold underline min-h-[32px]">{t('moreAbout')}</Link>
        </div>
      </Section>
      <Section title={t('dangerZone')}>
        <div className="card p-4"><p className="mb-3">{t('deleteAllExplain')}</p><button className="btn-danger" onClick={() => setDel1(true)}><Trash2 size={18} aria-hidden /> {t('deleteAll')}</button></div>
      </Section>
      <Confirm open={del1} danger text={t('deleteAllQ1')} yes={t('continue')} onNo={() => setDel1(false)} onYes={() => { setDel1(false); setDel2(true); }} />
      <Confirm open={del2} danger text={t('deleteAllQ2')} yes={t('deleteAll')} onNo={() => setDel2(false)} onYes={async () => { await db.delete(); try { localStorage.clear(); } catch { /* */ } location.href = '/'; }} />
    </Page>
  );
}
