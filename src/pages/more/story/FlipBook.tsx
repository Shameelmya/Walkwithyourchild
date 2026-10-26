import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cx } from '../../../lib/util';

const MS = 700;
const still = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Pages that turn like a real book: swipe, tap the edge, or use the arrows. */
export function FlipBook({ pages, rtl, labels, onPage }: { pages: ReactNode[]; rtl: boolean; labels: { prev: string; next: string }; onPage?: (i: number) => void }) {
  const [i, setI] = useState(0);
  const [turn, setTurn] = useState<{ from: number; to: number } | null>(null);
  const x0 = useRef<number | null>(null);
  const go = useCallback((to: number) => {
    if (turn || to < 0 || to >= pages.length || to === i) return;
    onPage?.(to);
    if (still()) { setI(to); return; }
    setTurn({ from: i, to });
    window.setTimeout(() => { setI(to); setTurn(null); }, MS);
  }, [turn, pages.length, i, onPage]);
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === 'ArrowRight') go(rtl ? i - 1 : i + 1); if (e.key === 'ArrowLeft') go(rtl ? i + 1 : i - 1); };
    addEventListener('keydown', k); return () => removeEventListener('keydown', k);
  }, [go, i, rtl]);
  const fwd = turn ? turn.to > turn.from : true;
  const under = turn ? (fwd ? turn.to : turn.from) : i;
  const moving = turn ? (fwd ? turn.from : turn.to) : null;
  const [Prev, Next] = rtl ? [ChevronRight, ChevronLeft] : [ChevronLeft, ChevronRight];
  return (
    <div className="grid gap-4 justify-items-center select-none">
      <div className="relative w-full" style={{ maxWidth: 'min(100%, calc((100dvh - 260px) * 0.707))', perspective: '2400px' }}
        onPointerDown={(e) => { x0.current = e.clientX; }}
        onPointerUp={(e) => {
          if (x0.current === null) return;
          const dx = e.clientX - x0.current; x0.current = null;
          if ((e.target as HTMLElement).closest('button,audio,a')) return;
          const r = e.currentTarget.getBoundingClientRect();
          const forward = Math.abs(dx) > 40 ? dx < 0 : e.clientX > r.left + r.width / 2;
          go(i + ((forward !== rtl) ? 1 : -1));
        }}>
        <div className="relative rounded-[1.4rem]" style={{ boxShadow: '4px 4px 0 #e9e2d6, 8px 8px 0 #ddd3c3, 0 26px 50px -18px rgba(0,0,0,.45)' }}>
          {pages[under]}
          {moving !== null && (
            <div className={cx('absolute inset-0', fwd ? 'flip-away' : 'flip-back')} style={{ transformOrigin: rtl ? 'right center' : 'left center', ['--flip' as string]: rtl ? '1' : '-1' }}>
              {pages[moving]}<div aria-hidden className="absolute inset-0 rounded-[inherit] flip-shade" />
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-4">
        <button className="icon-chip" disabled={i === 0 || !!turn} aria-label={labels.prev} onClick={() => go(i - 1)}><Prev size={22} aria-hidden /></button>
        <div className="flex gap-1.5" aria-hidden>{pages.map((_, k) => <span key={k} className={cx('h-2 rounded-full transition-all', k === i ? 'w-6 bg-[rgb(var(--accent))]' : 'w-2 bg-line')} />)}</div>
        <button className="icon-chip" disabled={i === pages.length - 1 || !!turn} aria-label={labels.next} onClick={() => go(i + 1)}><Next size={22} aria-hidden /></button>
      </div>
    </div>
  );
}
