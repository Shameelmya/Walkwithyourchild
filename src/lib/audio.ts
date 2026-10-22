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
// Android Chrome drops utterances that are garbage-collected, started after a cancel, or queued while paused; keep references and resume first.
const live: SpeechSynthesisUtterance[] = [];
if (typeof window !== 'undefined' && 'speechSynthesis' in window) { speechSynthesis.getVoices(); speechSynthesis.addEventListener?.('voiceschanged', () => speechSynthesis.getVoices()); }
export function speak(text: string, lang: string, onend?: () => void, opts: { rate?: number; pitch?: number; force?: boolean; fallback?: string } = {}) {
  if (!('speechSynthesis' in window)) return false;
  const ss = speechSynthesis;
  const v = bestVoice(lang);
  if (!v && lang !== 'en' && !opts.force) return false;
  if (ss.speaking || ss.pending) ss.cancel();
  ss.resume();
  const u = new SpeechSynthesisUtterance(text);
  if (v) u.voice = v;
  u.lang = v?.lang ?? `${lang}-IN`;
  u.rate = opts.rate ?? 0.92; u.pitch = opts.pitch ?? 1; u.volume = 1;
  const done = () => { const i = live.indexOf(u); if (i >= 0) live.splice(i, 1); };
  u.onend = () => { done(); onend?.(); };
  u.onerror = (e) => {
    done();
    // No engine for this language: say it in English so the child is still heard.
    if (opts.fallback && lang !== 'en' && e.error !== 'interrupted' && e.error !== 'canceled') speak(opts.fallback, 'en', onend, { rate: opts.rate, pitch: opts.pitch });
  };
  live.push(u);
  ss.speak(u);
  return true;
}

let noiseBuf: AudioBuffer | null = null;
function noise() {
  const a = ac();
  if (!noiseBuf) {
    noiseBuf = a.createBuffer(1, a.sampleRate, a.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  return noiseBuf;
}
/** Short filtered noise: the base of drums, shakers and pops. */
export function hiss(vol = 0.5, dur = 0.15, freq = 3000, type: BiquadFilterType = 'bandpass', when = 0) {
  const a = ac(); const t = a.currentTime + when;
  const src = a.createBufferSource(); src.buffer = noise();
  const f = a.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = 0.8;
  const g = a.createGain();
  g.gain.setValueAtTime(vol * 0.6, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f).connect(g).connect(out()); src.start(t); src.stop(t + dur + 0.02);
}
function thump(f0: number, f1: number, vol: number, dur: number) {
  const a = ac(); const t = a.currentTime;
  const o = a.createOscillator(); const g = a.createGain();
  o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur);
  g.gain.setValueAtTime(vol * 0.8, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(out()); o.start(t); o.stop(t + dur + 0.02);
}
export type Drum = 'kick' | 'snare' | 'hat' | 'tomHi' | 'tomLo' | 'clap';
export function drum(kind: Drum, vol = 0.6) {
  switch (kind) {
    case 'kick': return thump(150, 45, vol, 0.45);
    case 'snare': thump(220, 120, vol * 0.5, 0.12); return hiss(vol, 0.2, 2500);
    case 'hat': return hiss(vol * 0.6, 0.06, 9000, 'highpass');
    case 'tomHi': return thump(260, 160, vol, 0.3);
    case 'tomLo': return thump(150, 90, vol, 0.4);
    case 'clap': for (let i = 0; i < 3; i++) hiss(vol * 0.8, 0.09, 1500, 'bandpass', i * 0.018); return;
  }
}
export function pop(vol = 0.5) { hiss(vol, 0.07, 1800); tone(700 + Math.random() * 500, 0.25, vol * 0.6); }
export function shaker(vol = 0.5) { hiss(vol * 0.7, 0.12, 6000, 'highpass'); }

/** Read a list of paragraphs aloud. Everything is queued at once: chaining from onend breaks on Android Chrome.
 *  Long paragraphs are split into sentences because some engines stop after ~15 seconds of one utterance. */
export function speakQueue(texts: string[], lang: string, onDone: () => void) {
  if (!('speechSynthesis' in window)) return false;
  const ss = speechSynthesis;
  const v = bestVoice(lang);
  if (!v && lang !== 'en') return false;
  ss.cancel(); ss.resume();
  const parts = texts.flatMap((t) => t.match(/[^.!?।]+[.!?।]?\s*/g) ?? [t]).map((s) => s.trim()).filter(Boolean);
  if (!parts.length) return false;
  parts.forEach((p, i) => {
    const u = new SpeechSynthesisUtterance(p);
    if (v) u.voice = v;
    u.lang = v?.lang ?? `${lang}-IN`; u.rate = 0.95;
    live.push(u);
    u.onend = () => { const k = live.indexOf(u); if (k >= 0) live.splice(k, 1); if (i === parts.length - 1) onDone(); };
    u.onerror = (e) => { const k = live.indexOf(u); if (k >= 0) live.splice(k, 1); if (e.error !== 'interrupted' && e.error !== 'canceled' && i === parts.length - 1) onDone(); };
    ss.speak(u);
  });
  return true;
}
export function stopSpeaking() { if ('speechSynthesis' in window) speechSynthesis.cancel(); live.length = 0; }
