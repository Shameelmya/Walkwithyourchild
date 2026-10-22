let ctx: AudioContext | null = null;
let bus: GainNode | null = null;

/** Shared audio graph: a soft master bus with a gentle echo so tones sound warm, not like beeps. */
export function ac() {
  if (!ctx) {
    ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    bus = ctx.createGain(); bus.gain.value = 0.9;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 5200;
    const delay = ctx.createDelay(1); delay.delayTime.value = 0.23;
    const fb = ctx.createGain(); fb.gain.value = 0.28;
    const wet = ctx.createGain(); wet.gain.value = 0.32;
    bus.connect(lp).connect(ctx.destination);
    lp.connect(delay); delay.connect(fb).connect(delay); delay.connect(wet).connect(ctx.destination);
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}
function out() { ac(); return bus!; }

/** Bell-like tone: a sine with soft overtones and a natural decay. */
export function tone(freq: number, dur = 0.8, vol = 0.5, type: OscillatorType = 'sine', when = 0) {
  const a = ac(); const t = a.currentTime + when;
  const g = a.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol * 0.35), t + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  g.connect(out());
  const partials = type === 'sine' ? [[1, 1], [2, 0.28], [3, 0.08]] : [[1, 1]];
  for (const [m, v] of partials) {
    const o = a.createOscillator(); const og = a.createGain();
    o.type = type; o.frequency.value = freq * m; og.gain.value = v;
    o.connect(og).connect(g); o.start(t); o.stop(t + dur + 0.05);
  }
}
export function chime(vol = 0.5) { tone(784, 0.9, vol); tone(1046.5, 1.1, vol * 0.8, 'sine', 0.09); }
export function alarm() { for (let i = 0; i < 6; i++) { tone(880, 0.3, 1, 'square', i * 0.5); tone(660, 0.3, 1, 'square', i * 0.5 + 0.25); } }
export const PENTA = [261.6, 293.7, 329.6, 392, 440, 523.3, 587.3, 659.3, 784, 880];

export function voicesFor(lang: string): SpeechSynthesisVoice[] {
  if (!('speechSynthesis' in window)) return [];
  return speechSynthesis.getVoices().filter((v) => v.lang.toLowerCase().replace('_', '-').startsWith(lang));
}
/** Pick the most natural voice available: Indian locale first, then neural/Google voices. */
export function bestVoice(lang: string): SpeechSynthesisVoice | undefined {
  const vs = voicesFor(lang);
  const score = (v: SpeechSynthesisVoice) =>
    (v.lang.toLowerCase().includes('in') ? 4 : 0) + (/natural|neural|online|enhanced|premium/i.test(v.name) ? 3 : 0) + (/google/i.test(v.name) ? 2 : 0) + (v.localService ? 1 : 0);
  return vs.sort((a, b) => score(b) - score(a))[0];
}
export function speak(text: string, lang: string, onend?: () => void, opts: { rate?: number; pitch?: number } = {}) {
  if (!('speechSynthesis' in window)) return false;
  const v = bestVoice(lang);
  if (!v && lang !== 'en') return false;
  const u = new SpeechSynthesisUtterance(text);
  if (v) u.voice = v;
  u.lang = v?.lang ?? `${lang}-IN`;
  u.rate = opts.rate ?? 0.92; u.pitch = opts.pitch ?? 1;
  if (onend) u.onend = onend;
  speechSynthesis.speak(u);
  return true;
}
