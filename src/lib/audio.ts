import { useUI } from './store';
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

/** One note. `type` other than 'sine' asks for a raw waveform (alarms); otherwise the current game's instrument plays. */
export function tone(freq: number, dur = 0.8, vol = 0.5, type: OscillatorType = 'sine', when = 0) {
  if (vol <= 0) return;
  if (type !== 'sine') return raw(freq, dur, vol, type, when);
  play(freq, currentInst, vol, dur, when);
}
function raw(freq: number, dur: number, vol: number, type: OscillatorType, when: number) {
  const a = ac(); const t = a.currentTime + when;
  const o = a.createOscillator(); const g = a.createGain();
  o.type = type; o.frequency.value = freq;
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol * 0.3, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(out()); o.start(t); o.stop(t + dur + 0.05);
}
export function play(freq: number, inst: Inst, vol = 0.5, dur = 0.8, when = 0) {
  if (vol <= 0) return;
  const a = ac(); const t = a.currentTime + when;
  const env = (g: GainNode, attack: number, len: number, peak: number) => { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + attack); g.gain.exponentialRampToValueAtTime(0.0001, t + len); };
  const osc = (type: OscillatorType, f: number, g: AudioNode, detune = 0, len = dur) => { const o = a.createOscillator(); o.type = type; o.frequency.value = f; o.detune.value = detune; o.connect(g); o.start(t); o.stop(t + len + 0.1); return o; };
  const g = a.createGain(); g.connect(out());
  switch (inst) {
    case 'marimba': { env(g, 0.005, Math.min(dur, 0.7), vol * 0.45); osc('sine', freq, g); const g2 = a.createGain(); g2.gain.value = 0.25; g2.connect(g); osc('sine', freq * 4, g2, 0, 0.12); break; }
    case 'pluck': { const f = a.createBiquadFilter(); f.type = 'lowpass'; f.frequency.setValueAtTime(freq * 8, t); f.frequency.exponentialRampToValueAtTime(freq * 1.2, t + 0.4); f.connect(g); env(g, 0.004, Math.min(dur, 0.9), vol * 0.35); osc('sawtooth', freq, f); break; }
    case 'flute': { env(g, 0.08, dur, vol * 0.3); const o = osc('sine', freq, g); const lfo = a.createOscillator(); const lg = a.createGain(); lfo.frequency.value = 5.2; lg.gain.value = freq * 0.006; lfo.connect(lg).connect(o.frequency); lfo.start(t); lfo.stop(t + dur + 0.1); const n = a.createGain(); n.gain.value = 0.12; n.connect(g); osc('triangle', freq * 2, n); break; }
    case 'pad': { const f = a.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 1400; f.connect(g); env(g, 0.35, Math.max(dur, 1.6), vol * 0.22); osc('sawtooth', freq, f, -7, Math.max(dur, 1.6)); osc('sawtooth', freq, f, 7, Math.max(dur, 1.6)); break; }
    case 'piano': { const f = a.createBiquadFilter(); f.type = 'lowpass'; f.frequency.setValueAtTime(freq * 10, t); f.frequency.exponentialRampToValueAtTime(freq * 2.5, t + 0.6); f.connect(g); env(g, 0.004, Math.max(dur, 1.2), vol * 0.4); osc('triangle', freq, f); const h = a.createGain(); h.gain.value = 0.35; h.connect(f); osc('sine', freq * 2, h, 3); break; }
    case 'kalimba': { env(g, 0.003, Math.min(dur, 1.1), vol * 0.45); osc('sine', freq, g); const h = a.createGain(); h.gain.setValueAtTime(0.4, t); h.gain.exponentialRampToValueAtTime(0.001, t + 0.15); h.connect(g); osc('sine', freq * 5.4, h, 0, 0.2); break; }
    case 'bubble': { env(g, 0.01, 0.35, vol * 0.5); const o = osc('sine', freq * 0.6, g, 0, 0.35); o.frequency.setValueAtTime(freq * 0.6, t); o.frequency.exponentialRampToValueAtTime(freq * 1.6, t + 0.25); break; }
    case 'glass': { env(g, 0.01, Math.max(dur, 1.4), vol * 0.3); osc('sine', freq * 2, g); const h = a.createGain(); h.gain.value = 0.3; h.connect(g); osc('sine', freq * 2 * 2.76, h, 0, 0.8); break; }
    default: { // bell
      env(g, 0.012, dur, vol * 0.35);
      for (const [m, v] of [[1, 1], [2, 0.28], [3, 0.08]]) { const pg = a.createGain(); pg.gain.value = v; pg.connect(g); osc('sine', freq * m, pg); }
    }
  }
}
export function chime(vol = 0.5) { play(784, 'bell', vol, 0.9); play(1046.5, 'bell', vol * 0.8, 1.1, 0.09); }
export function alarm() { for (let i = 0; i < 6; i++) { tone(880, 0.3, 1, 'square', i * 0.5); tone(660, 0.3, 1, 'square', i * 0.5 + 0.25); } }
export const PENTA: number[] = [261.6, 293.7, 329.6, 392, 440, 523.3, 587.3, 659.3, 784, 880];

/* Each game gets its own instrument and scale so they don't all sound alike. */
export type Inst = 'bell' | 'marimba' | 'pluck' | 'flute' | 'pad' | 'piano' | 'kalimba' | 'bubble' | 'glass';
let currentInst: Inst = 'bell';
export type Scale = 'pentatonic' | 'hindolam' | 'japanese' | 'major' | 'lydian' | 'suddha';
const SCALES: Record<Scale, number[]> = {
  pentatonic: [0, 2, 4, 7, 9],       // Mohanam
  hindolam: [0, 3, 5, 8, 10],        // soft minor pentatonic
  japanese: [0, 1, 5, 7, 8],         // In scale, calm and mysterious
  major: [0, 2, 4, 5, 7, 9, 11],
  lydian: [0, 2, 4, 6, 7, 9, 11],    // bright, dreamy
  suddha: [0, 2, 5, 7, 9],           // Suddha Saveri
};
export const midi = (m: number) => 440 * Math.pow(2, (m - 69) / 12);
export function setSound(inst: Inst, scale: Scale = 'pentatonic', root = 60) {
  currentInst = inst;
  const st = SCALES[scale];
  for (let i = 0; i < 10; i++) PENTA[i] = midi(root + st[i % st.length] + 12 * Math.floor(i / st.length));
}

export function voicesFor(lang: string): SpeechSynthesisVoice[] {
  if (!('speechSynthesis' in window)) return [];
  return speechSynthesis.getVoices().filter((v) => v.lang.toLowerCase().replace('_', '-').startsWith(lang));
}
/** Pick the most natural voice available: Indian locale first, then neural/Google voices. */
export function bestVoice(lang: string): SpeechSynthesisVoice | undefined {
  const vs = voicesFor(lang);
  const chosen = (useUI.getState().voices as Record<string, string | undefined>)[lang];
  const pick = chosen && vs.find((v) => v.voiceURI === chosen);
  if (pick) return pick;
  const score = (v: SpeechSynthesisVoice) =>
    (v.lang.toLowerCase().includes('in') ? 4 : 0) + (/natural|neural|online|enhanced|premium/i.test(v.name) ? 3 : 0) + (/google/i.test(v.name) ? 2 : 0) + (v.localService ? 1 : 0);
  return vs.sort((a, b) => score(b) - score(a))[0];
}
// Android Chrome drops utterances that are garbage-collected, started after a cancel, or queued while paused; keep references and resume first.
const live: SpeechSynthesisUtterance[] = [];
if (typeof window !== 'undefined' && 'speechSynthesis' in window) { speechSynthesis.getVoices(); speechSynthesis.addEventListener?.('voiceschanged', () => speechSynthesis.getVoices()); }
/** True once the phone has told us which voices it has (Android loads the list a moment after start). */
export const voicesKnown = () => 'speechSynthesis' in window && speechSynthesis.getVoices().length > 0;
/** Why speech did not happen: no voice for the language, an engine error code, or no start at all. */
export type NoVoice = 'missing' | 'timeout' | `error:${string}`;
type SpeakOpts = { rate?: number; pitch?: number; force?: boolean; fallback?: string; onNoVoice?: (why: NoVoice) => void };
/** Samsung Internet lists the phone's voices but often never speaks them. */
export const isSamsungBrowser = () => /SamsungBrowser/i.test(navigator.userAgent);
/* Some phones refuse an utterance with a named voice ("synthesis-failed") but speak it with just a language,
   or only with the engine's default voice. Remember what worked on this phone. */
let mode = 0; // 0: named voice, 1: language only, 2: engine default
const MODES = 3;
function utter(text: string, lang: string, v: SpeechSynthesisVoice | undefined, m: number) {
  const u = new SpeechSynthesisUtterance(text);
  if (m === 0 && v) try { u.voice = v; } catch { /* */ }
  if (m < 2) u.lang = v?.lang ?? `${lang}-IN`;
  return u;
}
export function speak(text: string, lang: string, onend?: () => void, opts: SpeakOpts = {}, attempt = mode): boolean {
  if (!('speechSynthesis' in window)) { opts.onNoVoice?.('error:unsupported'); return false; }
  const ss = speechSynthesis;
  const v = bestVoice(lang);
  // The phone has no voice for this language: say it in English rather than stay silent.
  if (!v && lang !== 'en' && voicesKnown() && opts.fallback) { opts.onNoVoice?.('missing'); return speak(opts.fallback, 'en', onend, { rate: opts.rate, pitch: opts.pitch }); }
  if (!v && lang !== 'en' && !opts.force) return false;
  const busy = ss.speaking || ss.pending;
  if (busy) ss.cancel();
  if (ss.paused) ss.resume();
  const u = utter(text, lang, v, attempt);
  u.rate = (opts.rate ?? 0.92) * useUI.getState().speechRate; u.pitch = opts.pitch ?? 1; u.volume = 1;
  let started = false;
  const done = () => { const i = live.indexOf(u); if (i >= 0) live.splice(i, 1); };
  u.onstart = () => { started = true; mode = attempt; };
  u.onend = () => { started = true; mode = attempt; done(); onend?.(); };
  u.onerror = (e) => {
    const was = live.includes(u); done();
    if (!was || e.error === 'interrupted' || e.error === 'canceled') return;
    // Try the simpler ways before giving up.
    if (!started && attempt + 1 < MODES) { setTimeout(() => speak(text, lang, onend, opts, attempt + 1), 60); return; }
    opts.onNoVoice?.(`error:${e.error}`);
    // The engine could not say it in this language: say it in English so the child is still heard.
    if (opts.fallback && lang !== 'en') speak(opts.fallback, 'en', onend, { rate: opts.rate, pitch: opts.pitch });
  };
  live.push(u);
  // Android Chrome drops an utterance spoken in the same moment as a cancel; give it a breath.
  if (busy) setTimeout(() => ss.speak(u), 120); else ss.speak(u);
  // The speech engine can take a few seconds to wake up the first time; only report, never cut it off.
  if (opts.onNoVoice) setTimeout(() => { if (!started && !ss.speaking && live.includes(u)) opts.onNoVoice?.('timeout'); }, 8000);
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
  if (vol <= 0) return;
  const a = ac(); const t = a.currentTime + when;
  const src = a.createBufferSource(); src.buffer = noise();
  const f = a.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = 0.8;
  const g = a.createGain();
  g.gain.setValueAtTime(vol * 0.6, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f).connect(g).connect(out()); src.start(t); src.stop(t + dur + 0.02);
}
function thump(f0: number, f1: number, vol: number, dur: number) {
  if (vol <= 0) return;
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
export function pop(vol = 0.5) { hiss(vol, 0.07, 1800); play(700 + Math.random() * 500, 'bubble', vol * 0.6, 0.25); }
export function shaker(vol = 0.5) { hiss(vol * 0.7, 0.12, 6000, 'highpass'); }

/** Read a list of paragraphs aloud. Everything is queued at once: chaining from onend breaks on Android Chrome.
 *  Long paragraphs are split into sentences because some engines stop after ~15 seconds of one utterance. */
export function speakQueue(texts: string[], lang: string, onDone: () => void) {
  if (!('speechSynthesis' in window)) return false;
  const ss = speechSynthesis;
  const v = bestVoice(lang);
  if (!v && lang !== 'en') return false;
  const busy = ss.speaking || ss.pending;
  if (busy) ss.cancel();
  if (ss.paused) ss.resume();
  const parts = texts.flatMap((t) => t.match(/[^.!?।]+[.!?।]?\s*/g) ?? [t]).map((s) => s.trim()).filter(Boolean);
  if (!parts.length) return false;
  const us = parts.map((p, i) => {
    const u = utter(p, lang, v, mode); u.rate = 0.95;
    live.push(u);
    u.onend = () => { const k = live.indexOf(u); if (k >= 0) live.splice(k, 1); if (i === parts.length - 1) onDone(); };
    u.onerror = (e) => { const k = live.indexOf(u); if (k >= 0) live.splice(k, 1); if (e.error !== 'interrupted' && e.error !== 'canceled' && i === parts.length - 1) onDone(); };
    return u;
  });
  const go = () => us.forEach((u) => ss.speak(u));
  if (busy) setTimeout(go, 120); else go();
  return true;
}
export function stopSpeaking() { if ('speechSynthesis' in window) speechSynthesis.cancel(); live.length = 0; }
