import { getSetting, setSetting } from './db';

/* Fingerprint or face unlock through the phone's own screen lock (WebAuthn). The fingerprint never reaches the app:
   the phone only tells us that its owner confirmed. Like the PIN, this is a privacy lock for a shared phone. */
const b64 = (b: ArrayBuffer) => btoa(String.fromCharCode(...new Uint8Array(b)));
const unb64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
const KEY = 'bioCred';

export async function bioAvailable() {
  try { return !!window.PublicKeyCredential && (await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()); } catch { return false; }
}
export const bioEnabled = async () => !!(await getSetting<string | null>(KEY, null));

export async function bioEnroll(appName: string): Promise<boolean> {
  try {
    const cred = (await navigator.credentials.create({
      publicKey: {
        rp: { name: appName, id: location.hostname },
        user: { id: crypto.getRandomValues(new Uint8Array(16)), name: 'parent', displayName: appName },
        challenge: crypto.getRandomValues(new Uint8Array(32)),
        pubKeyCredParams: [{ type: 'public-key', alg: -7 }, { type: 'public-key', alg: -257 }],
        authenticatorSelection: { authenticatorAttachment: 'platform', userVerification: 'required', residentKey: 'discouraged' },
        timeout: 60_000, attestation: 'none',
      },
    })) as PublicKeyCredential | null;
    if (!cred) return false;
    await setSetting(KEY, b64(cred.rawId));
    return true;
  } catch { return false; }
}

export async function bioUnlock(): Promise<boolean> {
  const id = await getSetting<string | null>(KEY, null);
  if (!id) return false;
  try {
    const r = await navigator.credentials.get({ publicKey: { challenge: crypto.getRandomValues(new Uint8Array(32)), allowCredentials: [{ type: 'public-key', id: unb64(id) }], userVerification: 'required', timeout: 60_000 } });
    return !!r;
  } catch { return false; }
}
export const bioOff = () => setSetting(KEY, null);
