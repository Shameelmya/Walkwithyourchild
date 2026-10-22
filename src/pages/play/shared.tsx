import { useEffect, useRef } from 'react';

export const HUES = ['#7FC8C1', '#A7CF8A', '#F2A98C', '#C7A9DB', '#9FB0E3', '#F3D08A', '#F59AB5', '#8FD3F0'];
export const PAINT = ['#E5534B', '#F08A3C', '#F4C430', '#6CC48F', '#2BA89C', '#4F8FEA', '#7556D2', '#E86BA8', '#8B5E3C', '#2A2F3A', '#FFFFFF'];
let uid = 0;
export const nextId = () => ++uid;
export const rand = (a: number, b: number) => a + Math.random() * (b - a);

/** Any key press also plays: random position on screen. */
export function useAnyInput(fn: (x: number, y: number) => void) {
  const ref = useRef(fn); ref.current = fn;
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.repeat) return; ref.current(Math.random() * innerWidth, Math.random() * innerHeight * 0.8 + 40); };
    addEventListener('keydown', k); return () => removeEventListener('keydown', k);
  }, []);
}

/** Full-screen canvas sized for the device pixel ratio, with an optional animation loop. */
export function useCanvas(frame?: (ctx: CanvasRenderingContext2D, w: number, h: number, t: number) => void) {
  const ref = useRef<HTMLCanvasElement>(null);
  const fr = useRef(frame); fr.current = frame;
  useEffect(() => {
    const c = ref.current!; const ctx = c.getContext('2d')!;
    const size = () => { const d = Math.min(2, devicePixelRatio || 1); c.width = innerWidth * d; c.height = innerHeight * d; ctx.setTransform(d, 0, 0, d, 0, 0); };
    size(); addEventListener('resize', size);
    let raf = 0;
    const loop = (t: number) => { fr.current?.(ctx, innerWidth, innerHeight, t); raf = requestAnimationFrame(loop); };
    if (fr.current) raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); removeEventListener('resize', size); };
  }, []);
  return ref;
}
