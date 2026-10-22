let ctx: AudioContext | null = null;
export function ac() {
  if (!ctx) ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}
export function tone(freq: number, dur = 0.5, vol = 0.5, type: OscillatorType = 'sine', when = 0) {
  const a = ac(); const t = a.currentTime + when;
  const o = a.createOscillator(); const g = a.createGain();
  o.type = type; o.frequency.value = freq;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol * 0.4), t + 0.03);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(a.destination); o.start(t); o.stop(t + dur + 0.05);
}
export function alarm() { for (let i = 0; i < 6; i++) { tone(880, 0.25, 1, 'square', i * 0.5); tone(660, 0.25, 1, 'square', i * 0.5 + 0.25); } }
export const PENTA = [261.6, 293.7, 329.6, 392, 440, 523.3, 587.3, 659.3, 784, 880];

export function voicesFor(lang: string): SpeechSynthesisVoice[] {
  if (!('speechSynthesis' in window)) return [];
  return speechSynthesis.getVoices().filter((v) => v.lang.toLowerCase().startsWith(lang));
}
export function speak(text: string, lang: string, onend?: () => void) {
  if (!('speechSynthesis' in window)) return false;
  const v = voicesFor(lang)[0];
  if (!v && lang !== 'en') return false;
  const u = new SpeechSynthesisUtterance(text);
  if (v) u.voice = v;
  u.lang = v?.lang ?? (lang === 'ml' ? 'ml-IN' : 'en-IN');
  u.rate = 0.95;
  if (onend) u.onend = onend;
  speechSynthesis.speak(u);
  return true;
}
