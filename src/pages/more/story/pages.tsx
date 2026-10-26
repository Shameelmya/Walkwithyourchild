import type { CSSProperties, ReactNode } from 'react';
import { PALETTE, Scene, Sprig, type ThemeId } from './art';

export const LAYOUTS = ['classic', 'window', 'band', 'frame'] as const;
export type CoverLayout = (typeof LAYOUTS)[number];
export interface SPage { id: string; prompt: string; text: string; photo?: number; drawing?: number; voice?: number }
export interface Book { id: string; kind: string; title: string; author: string; theme: ThemeId; layout: CoverLayout; coverPhoto?: number; pages: SPage[]; createdAt: number; updatedAt: number; color?: string }

/* Every page is drawn in units of its own width (cqw), so the same design works as a thumbnail, in the reader and on A4. */
const sheet = (bg: string, extra?: CSSProperties): CSSProperties => ({ containerType: 'inline-size', position: 'relative', overflow: 'hidden', aspectRatio: '1 / 1.414', width: '100%', background: bg, ...extra });
const titleSize = (t: string) => (t.length > 34 ? 7.2 : t.length > 22 ? 8.6 : 10.4);

function Spine() {
  return <div aria-hidden style={{ position: 'absolute', insetBlock: 0, insetInlineStart: 0, width: '5cqw', background: 'linear-gradient(90deg, rgba(0,0,0,.22), rgba(0,0,0,.05) 60%, transparent)' }} />;
}
function Photo({ url, style }: { url: string; style?: CSSProperties }) {
  return <img src={url} alt="" style={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover', ...style }} />;
}

export function CoverView({ book, photoUrl }: { book: Pick<Book, 'title' | 'author' | 'theme' | 'layout'>; photoUrl?: string }) {
  const p = PALETTE[book.theme];
  const art = photoUrl ? <Photo url={photoUrl} /> : <Scene theme={book.theme} />;
  const title = <p style={{ fontSize: `${titleSize(book.title)}cqw`, fontWeight: 800, lineHeight: 1.18, margin: 0, overflowWrap: 'anywhere' }}>{book.title}</p>;
  const by = book.author ? <p style={{ fontSize: '4.4cqw', fontWeight: 600, margin: '2.4cqw 0 0', opacity: 0.85 }}>{book.author}</p> : null;
  let body: ReactNode;
  if (book.layout === 'window') {
    body = (<>
      <div style={{ position: 'absolute', inset: 0 }}>{art}</div>
      <div style={{ position: 'absolute', insetInline: '9cqw', top: '13cqw', padding: '6cqw 5cqw', borderRadius: '5cqw', background: `${p.paper}EE`, color: p.ink, textAlign: 'center', boxShadow: '0 1.5cqw 4cqw rgba(0,0,0,.18)' }}>
        <Sprig color={p.accent} style={{ width: '16cqw', margin: '0 auto 2cqw', display: 'block' }} />{title}{by}
      </div>
    </>);
  } else if (book.layout === 'band') {
    body = (<>
      <div style={{ position: 'absolute', insetInline: 0, top: 0, height: '66%' }}>{art}</div>
      <svg viewBox="0 0 100 10" preserveAspectRatio="none" style={{ position: 'absolute', insetInline: 0, top: 'calc(66% - 5cqw)', width: '100%', height: '6cqw' }} aria-hidden><path d="M0 6 Q25 0 50 5 T100 4 V10 H0Z" fill={p.deep} /></svg>
      <div style={{ position: 'absolute', insetInline: 0, bottom: 0, top: '66%', background: p.deep, color: p.onDeep, padding: '5cqw 9cqw', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>{title}{by}</div>
    </>);
  } else if (book.layout === 'frame') {
    body = (
      <div style={{ position: 'absolute', inset: '5cqw', borderRadius: '3cqw', background: p.paper, border: `0.9cqw double ${p.accent}`, color: p.ink, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '9cqw 7cqw', textAlign: 'center' }}>
        <div style={{ width: '62cqw', aspectRatio: '1', borderRadius: '50%', overflow: 'hidden', border: `1.4cqw solid ${p.paper}`, boxShadow: `0 0 0 0.6cqw ${p.accent}55, 0 2cqw 5cqw rgba(0,0,0,.15)` }}>{art}</div>
        <div style={{ marginTop: '7cqw' }}>{title}</div>{by}
        <Sprig color={p.accent} style={{ width: '18cqw', marginTop: 'auto' }} />
      </div>
    );
  } else {
    body = (<>
      <div style={{ padding: '13cqw 9cqw 0', color: p.ink }}>
        <div style={{ width: '12cqw', height: '1.2cqw', borderRadius: 9, background: p.accent, marginBottom: '4cqw' }} />{title}{by}
      </div>
      <div style={{ position: 'absolute', insetInline: 0, bottom: 0, height: '56%', borderTopLeftRadius: '50% 9cqw', borderTopRightRadius: '50% 9cqw', overflow: 'hidden' }}>{art}</div>
    </>);
  }
  return <div style={sheet(book.layout === 'frame' ? p.deep : p.paper, { borderRadius: '1.6cqw 3cqw 3cqw 1.6cqw' })}>{body}<Spine /></div>;
}

const textSize = (len: number, withArt: boolean) => (len < 50 ? 8 : len < 120 ? 6.6 : len < 240 ? 5.4 : len < 420 ? 4.6 : 3.9) * (withArt ? 0.85 : 1);

/** An inside page: a starter line, the child's words, and either their pictures (in fixed frames) or a theme picture. */
export function PageView({ page, n, theme, photoUrl, drawUrl, overlay }: { page: Pick<SPage, 'prompt' | 'text'>; n: number; theme: ThemeId; photoUrl?: string; drawUrl?: string; overlay?: ReactNode }) {
  const p = PALETTE[theme];
  const pics = [photoUrl && { u: photoUrl, fit: 'cover' as const }, drawUrl && { u: drawUrl, fit: 'contain' as const }].filter(Boolean) as { u: string; fit: 'cover' | 'contain' }[];
  const text = page.text.trim();
  const flip = n % 2 === 0;
  return (
    <div style={sheet(p.paper, { color: p.ink, borderRadius: n % 2 ? '1.2cqw 2.4cqw 2.4cqw 1.2cqw' : '2.4cqw 1.2cqw 1.2cqw 2.4cqw' })}>
      <div aria-hidden style={{ position: 'absolute', inset: '3.4cqw', border: `0.35cqw solid ${p.accent}33`, borderRadius: '3cqw' }} />
      <Sprig color={p.accent} style={{ position: 'absolute', top: '5cqw', insetInlineEnd: '6cqw', width: '13cqw', opacity: 0.8, transform: flip ? 'scaleX(-1)' : undefined }} />
      <div style={{ position: 'absolute', inset: '9cqw 9cqw 12cqw', display: 'flex', flexDirection: 'column', gap: '5cqw' }}>
        {pics.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: pics.length > 1 ? '1fr 1fr' : '1fr', gap: '4cqw', paddingTop: '3cqw' }}>
            {pics.map((x, i) => (
              <div key={x.u} style={{ background: '#fff', padding: '2cqw 2cqw 5cqw', borderRadius: '1cqw', boxShadow: '0 1.2cqw 3cqw rgba(0,0,0,.16)', transform: `rotate(${(i + n) % 2 ? 1.6 : -1.6}deg)`, position: 'relative' }}>
                <div style={{ aspectRatio: pics.length > 1 ? '3 / 4' : '4 / 3', overflow: 'hidden', borderRadius: '0.6cqw', background: '#fff' }}>
                  <img src={x.u} alt="" style={{ display: 'block', width: '100%', height: '100%', objectFit: x.fit }} />
                </div>
                <div aria-hidden style={{ position: 'absolute', top: '-2.2cqw', left: '50%', width: '16cqw', height: '4.4cqw', marginLeft: '-8cqw', background: `${p.accent}44`, transform: 'rotate(-3deg)' }} />
              </div>
            ))}
          </div>
        ) : (
          <div style={{ height: text.length > 240 ? '30%' : '46%', flexShrink: 0, borderRadius: '5cqw', overflow: 'hidden' }}><Scene theme={theme} flip={flip} /></div>
        )}
        <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', justifyContent: pics.length ? 'flex-start' : 'center' }}>
          {page.prompt && <p style={{ margin: 0, fontSize: '4.3cqw', fontWeight: 700, color: p.accent, display: 'flex', alignItems: 'center', gap: '2cqw' }}><span aria-hidden style={{ width: '6cqw', height: '0.6cqw', background: p.accent, borderRadius: 9, flexShrink: 0 }} />{page.prompt}</p>}
          {text ? <p style={{ margin: '2.6cqw 0 0', fontSize: `${textSize(text.length, pics.length > 0)}cqw`, lineHeight: 1.5, fontWeight: 600, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{text}</p>
            : <div aria-hidden style={{ marginTop: '4cqw', display: 'grid', gap: '7cqw' }}>{[0, 1, 2].map((i) => <div key={i} style={{ borderBottom: `0.3cqw dashed ${p.ink}33` }} />)}</div>}
        </div>
      </div>
      <p style={{ position: 'absolute', bottom: '5cqw', insetInline: 0, textAlign: 'center', margin: 0, fontSize: '3.4cqw', fontWeight: 700, color: `${p.ink}88` }}>· {n} ·</p>
      {overlay}
    </div>
  );
}

export function EndView({ theme, text }: { theme: ThemeId; text: string }) {
  const p = PALETTE[theme];
  return (
    <div style={sheet(p.paper, { borderRadius: '3cqw 1.6cqw 1.6cqw 3cqw' })}>
      <div style={{ position: 'absolute', inset: 0 }}><Scene theme={theme} flip /></div>
      <div style={{ position: 'absolute', insetInline: '16cqw', top: '34%', padding: '7cqw 4cqw', borderRadius: '50%', background: `${p.paper}F0`, textAlign: 'center', color: p.accent, boxShadow: '0 2cqw 5cqw rgba(0,0,0,.18)' }}>
        <Sprig color={p.accent} style={{ width: '14cqw', display: 'block', margin: '0 auto 1cqw' }} />
        <p style={{ margin: 0, fontSize: '11cqw', fontWeight: 800 }}>{text}</p>
      </div>
    </div>
  );
}
