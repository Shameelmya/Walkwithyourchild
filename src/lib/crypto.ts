const enc = new TextEncoder();
export const ITER = 210_000;
const b64 = (u: Uint8Array) => btoa(String.fromCharCode(...u));
const unb64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

async function baseKey(pw: string) { return crypto.subtle.importKey('raw', enc.encode(pw), 'PBKDF2', false, ['deriveBits', 'deriveKey']); }
export async function deriveKey(pw: string, salt: Uint8Array) {
  return crypto.subtle.deriveKey({ name: 'PBKDF2', hash: 'SHA-256', salt: salt as BufferSource, iterations: ITER }, await baseKey(pw), { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}
export interface PinHash { salt: string; hash: string; iter: number }
export async function hashPin(pin: string, saltIn?: Uint8Array): Promise<PinHash> {
  const salt = saltIn ?? crypto.getRandomValues(new Uint8Array(16));
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: salt as BufferSource, iterations: ITER }, await baseKey(pin), 256);
  return { salt: b64(salt), hash: b64(new Uint8Array(bits)), iter: ITER };
}
export async function verifyPin(pin: string, h: PinHash) {
  const r = await hashPin(pin, unb64(h.salt));
  return r.hash === h.hash;
}
const MAGIC = enc.encode('WWYC1');
export async function encryptBytes(data: Uint8Array, pw: string): Promise<Blob> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await deriveKey(pw, salt), data as BufferSource);
  return new Blob([MAGIC, salt, iv, new Uint8Array(ct)], { type: 'application/octet-stream' });
}
export async function decryptBytes(buf: ArrayBuffer, pw: string): Promise<Uint8Array> {
  const u = new Uint8Array(buf);
  for (let i = 0; i < MAGIC.length; i++) if (u[i] !== MAGIC[i]) throw new Error('format');
  const salt = u.slice(5, 21), iv = u.slice(21, 33), ct = u.slice(33);
  return new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, await deriveKey(pw, salt), ct));
}
