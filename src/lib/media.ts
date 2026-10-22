export async function compressImage(file: Blob, max = 1600, q = 0.8): Promise<Blob> {
  if (!file.type.startsWith('image/') || file.type === 'image/gif') return file;
  try {
    const bmp = await createImageBitmap(file);
    const s = Math.min(1, max / Math.max(bmp.width, bmp.height));
    const c = document.createElement('canvas');
    c.width = Math.round(bmp.width * s); c.height = Math.round(bmp.height * s);
    c.getContext('2d')!.drawImage(bmp, 0, 0, c.width, c.height);
    const out = await new Promise<Blob | null>((r) => c.toBlob(r, 'image/jpeg', q));
    return out && out.size < file.size ? out : file;
  } catch { return file; }
}

export function pickMime(kind: 'audio' | 'video') {
  const opts = kind === 'video'
    ? ['video/webm;codecs=vp8,opus', 'video/webm', 'video/mp4']
    : ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg'];
  return opts.find((m) => typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(m)) ?? '';
}

export interface Rec { stop: () => Promise<Blob>; stream: MediaStream }
export async function startRecording(kind: 'audio' | 'video', maxMs: number, onAutoStop?: (b: Blob) => void): Promise<Rec> {
  const stream = await navigator.mediaDevices.getUserMedia(kind === 'video'
    ? { video: { facingMode: 'environment', height: { ideal: 480 }, width: { ideal: 640 } }, audio: true }
    : { audio: true });
  const mime = pickMime(kind);
  const mr = new MediaRecorder(stream, mime ? { mimeType: mime, videoBitsPerSecond: 600_000 } : undefined);
  const chunks: Blob[] = [];
  mr.ondataavailable = (e) => e.data.size && chunks.push(e.data);
  let resolve!: (b: Blob) => void;
  const done = new Promise<Blob>((r) => (resolve = r));
  mr.onstop = () => { stream.getTracks().forEach((t) => t.stop()); const b = new Blob(chunks, { type: mr.mimeType || mime || (kind + '/webm') }); resolve(b); onAutoStop?.(b); };
  mr.start(1000);
  const timer = setTimeout(() => mr.state !== 'inactive' && mr.stop(), maxMs);
  return { stream, stop: () => { clearTimeout(timer); onAutoStop = undefined; if (mr.state !== 'inactive') mr.stop(); return done; } };
}

