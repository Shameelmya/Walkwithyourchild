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

/** Phone tilt, -1..1 on each axis. Starts at 0 when there is no motion sensor. */
export function useTilt() {
  const r = useRef({ ax: 0, ay: 0 });
  useEffect(() => {
    const o = (e: DeviceOrientationEvent) => { r.current.ax = Math.max(-1, Math.min(1, (e.gamma ?? 0) / 45)); r.current.ay = Math.max(-1, Math.min(1, (e.beta ?? 0) / 45)); };
    addEventListener('deviceorientation', o); return () => removeEventListener('deviceorientation', o);
  }, []);
  return r;
}
/** iPhone asks before sharing motion; this must run inside a tap. */
export function askMotion() {
  const req = (globalThis.DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> } | undefined)?.requestPermission;
  if (req) req().catch(() => {});
}
export const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
export const shuffle = <T,>(a: T[]) => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
