import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { create } from 'zustand';
import { ArrowLeft, X, User } from 'lucide-react';
import { useT, type TKey } from '../i18n';
import { Illus } from './Illus';
import { useBlobUrl } from '../lib/hooks';
import { cx } from '../lib/util';

export function PageHeader({ title, back = true, actions, sub, color, eyebrow }: { title: ReactNode; back?: boolean | string; actions?: ReactNode; sub?: ReactNode; color?: string; eyebrow?: ReactNode }) {
  const nav = useNavigate();
  const { t } = useT();
  return (
    <header className="pt-2 pb-5">
      <div className="flex items-center gap-3">
        {back && (
          <button className="icon-chip shrink-0" aria-label={t('back')} onClick={() => (typeof back === 'string' ? nav(back) : history.length > 1 ? nav(-1) : nav('/'))}>
            <ArrowLeft size={21} />
          </button>
        )}
        <div className="flex-1 min-w-0">
          {eyebrow && <p className="eyebrow">{eyebrow}</p>}
          <h1 className="text-[1.65rem] font-extrabold leading-tight tracking-tight" style={color ? { color } : undefined}>{title}</h1>
        </div>
        {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      </div>
      {sub && <p className="text-muted mt-2 max-w-2xl">{sub}</p>}
    </header>
  );
}

export function Page({ children, className = '', wide = false }: { children: ReactNode; className?: string; wide?: boolean }) {
  return <main id="main" className={cx('mx-auto w-full px-4 pb-36 lg:pb-12 anim-in', wide ? 'max-w-6xl' : 'max-w-3xl', className)}>{children}</main>;
}

export function Modal({ open, onClose, title, children, full = false }: { open: boolean; onClose: () => void; title?: ReactNode; children: ReactNode; full?: boolean }) {
  const { t } = useT();
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    addEventListener('keydown', k);
    ref.current?.querySelector<HTMLElement>('input,textarea,select,button')?.focus();
    return () => removeEventListener('keydown', k);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40" onClick={onClose}>
      <div ref={ref} role="dialog" aria-modal="true" className={cx('bg-surface text-ink w-full shadow-2xl anim-sheet overflow-y-auto', full ? 'h-full sm:h-auto sm:max-h-[92vh] sm:max-w-2xl sm:rounded-[28px]' : 'max-h-[92vh] sm:max-w-lg rounded-t-[28px] sm:rounded-[28px]')} onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-surface z-10 flex items-center gap-2 px-5 pt-3 pb-3">
          <span className="absolute left-1/2 -translate-x-1/2 top-2 w-10 h-1.5 rounded-full bg-line sm:hidden" aria-hidden />
          <h2 className="flex-1 text-xl font-extrabold pt-2">{title}</h2>
          <button className="icon-btn" onClick={onClose} aria-label={t('close')}><X /></button>
        </div>
        <div className="px-5 pb-8 pt-1">{children}</div>
      </div>
    </div>
  );
}

export function Empty({ kind, title, text, action }: { kind?: Parameters<typeof Illus>[0]['kind']; title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="card flex flex-col items-center text-center py-10 px-6 gap-3">
      <Illus kind={kind} />
      <p className="font-extrabold text-lg">{title}</p>
      {text && <p className="text-muted max-w-sm">{text}</p>}
      {action}
    </div>
  );
}

interface ToastS { msg: string | null; show: (m: string) => void }
export const useToast = create<ToastS>((set) => ({ msg: null, show: (msg) => { set({ msg }); setTimeout(() => set({ msg: null }), 3200); } }));
export function Toaster() {
  const msg = useToast((s) => s.msg);
  return <div aria-live="polite" className="fixed left-1/2 -translate-x-1/2 bottom-32 lg:bottom-8 z-[60] pointer-events-none">{msg && <div className="anim-sheet rounded-2xl bg-ink text-bg px-5 py-3 font-bold shadow-lift max-w-[90vw] text-center">{msg}</div>}</div>;
}

export function Confirm({ open, text, onYes, onNo, danger = false, yes }: { open: boolean; text: string; onYes: () => void; onNo: () => void; danger?: boolean; yes?: string }) {
  const { t } = useT();
  return (
    <Modal open={open} onClose={onNo} title={t('pleaseConfirm')}>
      <p className="mb-6">{text}</p>
      <div className="flex gap-3 justify-end"><button className="btn-ghost" onClick={onNo}>{t('cancel')}</button><button className={danger ? 'btn-danger' : 'btn-primary'} onClick={onYes}>{yes ?? t('yes')}</button></div>
    </Modal>
  );
}

export function Avatar({ blobId, name, size = 48 }: { blobId?: number; name?: string; size?: number }) {
  const url = useBlobUrl(blobId);
  return (
    <span className="inline-flex items-center justify-center rounded-full overflow-hidden grad-a text-white font-extrabold shrink-0 ring-2 ring-surface shadow-card" style={{ width: size, height: size, fontSize: size * 0.42 }}>
      {url ? <img src={url} alt="" className="w-full h-full object-cover" /> : name ? name.trim().charAt(0).toUpperCase() : <User size={size * 0.5} />}
    </span>
  );
}

export function FileButton({ accept, capture, onFile, children, className = 'btn-ghost', multiple = false }: { accept: string; capture?: 'user' | 'environment'; onFile: (f: File) => void; children: ReactNode; className?: string; multiple?: boolean }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <>
      <button type="button" className={className} onClick={() => ref.current?.click()}>{children}</button>
      <input ref={ref} type="file" hidden accept={accept} capture={capture} multiple={multiple} onChange={(e) => { Array.from(e.target.files ?? []).forEach(onFile); e.target.value = ''; }} />
    </>
  );
}

export function Section({ title, children, action, className = '' }: { title?: ReactNode; children: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <section className={cx('mb-7', className)}>
      {(title || action) && <div className="flex items-center justify-between mb-3 gap-2"><h2 className="text-lg font-extrabold tracking-tight">{title}</h2>{action}</div>}
      {children}
    </section>
  );
}

export function Seg<T extends string | number>({ value, options, onChange, label }: { value: T; options: { v: T; l: ReactNode }[]; onChange: (v: T) => void; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button key={String(o.v)} role="radio" aria-checked={value === o.v} className={cx('chip', value === o.v && 'chip-on')} onClick={() => onChange(o.v)}>{o.l}</button>
      ))}
    </div>
  );
}

/* Generic config-driven form for records */
export type FType = 'text' | 'textarea' | 'date' | 'time' | 'number' | 'tel' | 'yesno' | 'select';
export interface FDef { key: string; label: TKey; type: FType; options?: { v: string; l: string }[]; required?: boolean }
export function FormFields({ fields, value, onChange }: { fields: FDef[]; value: Record<string, unknown>; onChange: (v: Record<string, unknown>) => void }) {
  const { t } = useT();
  return (
    <div className="grid gap-4">
      {fields.map((f) => {
        const id = `f-${f.key}`; const v = (value[f.key] ?? '') as string;
        const set = (x: unknown) => onChange({ ...value, [f.key]: x });
        return (
          <div key={f.key}>
            <label className="label" htmlFor={id}>{t(f.label)}{f.required && ' *'}</label>
            {f.type === 'textarea' ? <textarea id={id} className="input min-h-[96px]" value={v} onChange={(e) => set(e.target.value)} />
              : f.type === 'yesno' ? <Seg label={t(f.label)} value={v} onChange={set} options={[{ v: 'yes', l: t('yes') }, { v: 'no', l: t('no') }]} />
              : f.type === 'select' ? <select id={id} className="input" value={v} onChange={(e) => set(e.target.value)}>{f.options!.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}</select>
              : <input id={id} className="input" type={f.type === 'tel' ? 'tel' : f.type} inputMode={f.type === 'number' ? 'decimal' : undefined} value={v} onChange={(e) => set(f.type === 'number' ? (e.target.value === '' ? '' : Number(e.target.value)) : e.target.value)} />}
          </div>
        );
      })}
    </div>
  );
}

export function useWakeLock(on: boolean) {
  useEffect(() => {
    if (!on || !('wakeLock' in navigator)) return;
    let lock: WakeLockSentinel | null = null; let live = true;
    const req = () => navigator.wakeLock.request('screen').then((l) => { if (live) lock = l; else void l.release(); }).catch(() => {});
    void req();
    const vis = () => document.visibilityState === 'visible' && req();
    document.addEventListener('visibilitychange', vis);
    return () => { live = false; document.removeEventListener('visibilitychange', vis); void lock?.release(); };
  }, [on]);
}

export function LongPress({ ms = 2000, onDone, children, label, className = '' }: { ms?: number; onDone: () => void; children: ReactNode; label: string; className?: string }) {
  const [p, setP] = useState(0);
  const timer = useRef<number>();
  const start = () => {
    const t0 = performance.now();
    const tick = () => { const x = Math.min(1, (performance.now() - t0) / ms); setP(x); if (x >= 1) { setP(0); onDone(); } else timer.current = requestAnimationFrame(tick); };
    timer.current = requestAnimationFrame(tick);
  };
  const stop = () => { if (timer.current) cancelAnimationFrame(timer.current); setP(0); };
  return (
    <button aria-label={label} className={cx('relative select-none', className)} onPointerDown={start} onPointerUp={stop} onPointerLeave={stop} onPointerCancel={stop} onContextMenu={(e) => e.preventDefault()}
      onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && !e.repeat) { e.preventDefault(); e.stopPropagation(); start(); } }} onKeyUp={stop}>
      <svg viewBox="0 0 44 44" className="absolute inset-0 w-full h-full -rotate-90" aria-hidden><circle cx="22" cy="22" r="20" fill="none" stroke="currentColor" strokeOpacity=".9" strokeWidth="3" strokeDasharray={`${p * 125.6} 200`} /></svg>
      {children}
    </button>
  );
}
