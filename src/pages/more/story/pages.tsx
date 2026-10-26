import type { CSSProperties, ReactNode } from 'react';
import { PALETTE, Scene, Sprig, type ThemeId } from './art';

export const LAYOUTS = ['classic', 'window', 'band', 'frame', 'arch', 'polaroid', 'badge', 'corner', 'diagonal', 'minimal', 'stamp', 'split'] as const;
export type CoverLayout = (typeof LAYOUTS)[number];
export const PAGE_LAYOUTS = ['auto', 'textTop', 'big', 'full', 'side', 'frame'] as const;
export type PageLayout = (typeof PAGE_LAYOUTS)[number];
export const STICKERS = ['⭐', '❤️', '🌸', '🦋', '🌈', '☀️', '🌙', '🎈', '🐶', '🐱', '🐘', '🦁', '🐟', '🐦', '🌳', '🍎', '🚗', '🚂', '⚽', '🎵', '🎂', '🏠', '👨‍👩‍👧', '🙂'] as const;
export interface SPage { id: string; prompt: string; text: string; photo?: number; drawing?: number; voice?: number; layout?: PageLayout; scene?: ThemeId; stickers?: string[] }
export interface Book { id: string; kind: string; title: string; author: string; theme: ThemeId; layout: CoverLayout; coverPhoto?: number; pages: SPage[]; createdAt: number; updatedAt: number; color?: string }

/* Every page is drawn in units of its own width (cqw), so the same design works as a thumbnail, in the reader and on A4. */
const sheet = (bg: string, extra?: CSSProperties): CSSProperties => ({ containerType: 'inline-size', position: 'relative', overflow: 'hidden', aspectRatio: '1 / 1.414', width: '100%', background: bg, ...extra });
const titleSize = (t: string) => (t.length > 34 ? 7.2 : t.length > 22 ? 8.6 : 10.4);
const abs = (s: CSSProperties): CSSProperties => ({ position: 'absolute', ...s });

function Spine() {
  return <div aria-hidden style={abs({ insetBlock: 0, insetInlineStart: 0, width: '5cqw', background: 'linear-gradient(90deg, rgba(0,0,0,.22), rgba(0,0,0,.05) 60%, transparent)' })} />;
}
function Photo({ url, fit = 'cover' }: { url: string; fit?: 'cover' | 'contain' }) {
  return <img src={url} alt="" style={{ display: 'block', width: '100%', height: '100%', objectFit: fit, background: '#fff' }} />;
}

export function CoverView({ book, photoUrl }: { book: Pick<Book, 'title' | 'author' | 'theme' | 'layout'>; photoUrl?: string }) {
  const p = PALETTE[book.theme];
  const art = photoUrl ? <Photo url={photoUrl} /> : <Scene theme={book.theme} />;
  const title = (size = titleSize(book.title)) => <p style={{ fontSize: `${size}cqw`, fontWeight: 800, lineHeight: 1.18, margin: 0, overflowWrap: 'anywhere' }}>{book.title}</p>;
  const by = book.author ? <p style={{ fontSize: '4.4cqw', fontWeight: 600, margin: '2.4cqw 0 0', opacity: 0.85 }}>{book.author}</p> : null;
  let bg = p.paper;
  let body: ReactNode;
  switch (book.layout) {
    case 'window':
      body = (<>
        <div style={abs({ inset: 0 })}>{art}</div>
        <div style={abs({ insetInline: '9cqw', top: '13cqw', padding: '6cqw 5cqw', borderRadius: '5cqw', background: `${p.paper}EE`, color: p.ink, textAlign: 'center', boxShadow: '0 1.5cqw 4cqw rgba(0,0,0,.18)' })}>
          <Sprig color={p.accent} style={{ width: '16cqw', margin: '0 auto 2cqw', display: 'block' }} />{title()}{by}
        </div>
      </>);
      break;
    case 'band':
      body = (<>
        <div style={abs({ insetInline: 0, top: 0, height: '66%' })}>{art}</div>
        <svg viewBox="0 0 100 10" preserveAspectRatio="none" style={abs({ insetInline: 0, top: 'calc(66% - 5cqw)', width: '100%', height: '6cqw' })} aria-hidden><path d="M0 6 Q25 0 50 5 T100 4 V10 H0Z" fill={p.deep} /></svg>
        <div style={abs({ insetInline: 0, bottom: 0, top: '66%', background: p.deep, color: p.onDeep, padding: '5cqw 9cqw', display: 'flex', flexDirection: 'column', justifyContent: 'center' })}>{title()}{by}</div>
      </>);
      break;
    case 'frame':
      bg = p.deep;
      body = (
        <div style={abs({ inset: '5cqw', borderRadius: '3cqw', background: p.paper, border: `0.9cqw double ${p.accent}`, color: p.ink, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '9cqw 7cqw', textAlign: 'center' })}>
          <div style={{ width: '62cqw', aspectRatio: '1', borderRadius: '50%', overflow: 'hidden', border: `1.4cqw solid ${p.paper}`, boxShadow: `0 0 0 0.6cqw ${p.accent}55, 0 2cqw 5cqw rgba(0,0,0,.15)` }}>{art}</div>
          <div style={{ marginTop: '7cqw' }}>{title()}</div>{by}
          <Sprig color={p.accent} style={{ width: '18cqw', marginTop: 'auto' }} />
        </div>
      );
      break;
    case 'arch':
      body = (<>
        <div style={abs({ insetInline: '12cqw', top: '10cqw', height: '86cqw', borderRadius: '38cqw 38cqw 3cqw 3cqw', overflow: 'hidden', border: `1.2cqw solid ${p.accent}`, boxShadow: '0 2cqw 5cqw rgba(0,0,0,.15)' })}>{art}</div>
        <div style={abs({ insetInline: '9cqw', top: '104cqw', color: p.ink, textAlign: 'center' })}>{title(titleSize(book.title) * 0.9)}{by}</div>
      </>);
      break;
    case 'polaroid':
      bg = p.deep;
      body = (<>
        <div aria-hidden style={abs({ inset: 0, backgroundImage: `radial-gradient(${p.onDeep}22 0.7cqw, transparent 0.8cqw)`, backgroundSize: '7cqw 7cqw' })} />
        <div style={abs({ insetInline: '11cqw', top: '11cqw', background: '#fff', padding: '3.5cqw 3.5cqw 14cqw', transform: 'rotate(-3deg)', boxShadow: '0 2.4cqw 5cqw rgba(0,0,0,.35)' })}>
          <div style={{ aspectRatio: '1', overflow: 'hidden' }}>{art}</div>
          <div aria-hidden style={abs({ top: '-3cqw', left: '50%', width: '22cqw', height: '6cqw', marginLeft: '-11cqw', background: `${p.onDeep}AA`, transform: 'rotate(4deg)' })} />
          <p style={abs({ insetInline: '4cqw', bottom: '3cqw', margin: 0, fontSize: '4.6cqw', fontWeight: 700, color: '#555', textAlign: 'center' })}>{book.author}</p>
        </div>
        <div style={abs({ insetInline: '9cqw', bottom: '11cqw', color: p.onDeep, textAlign: 'center' })}>{title(titleSize(book.title) * 0.92)}</div>
      </>);
      break;
    case 'badge':
      body = (<>
        <div style={abs({ inset: 0 })}>{art}</div>
        <div style={abs({ left: '50%', bottom: '-14cqw', width: '96cqw', height: '96cqw', marginLeft: '-48cqw', borderRadius: '50%', background: p.paper, boxShadow: '0 -1.5cqw 5cqw rgba(0,0,0,.2)', border: `1cqw solid ${p.accent}`, display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '13cqw', paddingInline: '14cqw', color: p.ink, textAlign: 'center' })}>
          {title(titleSize(book.title) * 0.9)}{by}
        </div>
      </>);
      break;
    case 'corner':
      body = (<>
        <div style={abs({ inset: 0 })}>{art}</div>
        <div style={abs({ insetInlineStart: 0, bottom: '9cqw', maxWidth: '84cqw', padding: '6cqw 8cqw 6cqw 9cqw', background: p.paper, color: p.ink, borderStartEndRadius: '8cqw', borderEndEndRadius: '8cqw', boxShadow: '0 1.5cqw 4cqw rgba(0,0,0,.2)' })}>
          <div style={{ width: '10cqw', height: '1cqw', background: p.accent, borderRadius: 9, marginBottom: '3cqw' }} />{title()}{by}
        </div>
      </>);
      break;
    case 'diagonal':
      body = (<>
        <div style={abs({ insetInline: 0, top: 0, height: '78%' })}>{art}</div>
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={abs({ insetInline: 0, bottom: 0, width: '100%', height: '58%' })} aria-hidden><path d="M0 34 L100 0 V100 H0Z" fill={p.paper} /><path d="M0 34 L100 0" stroke={p.accent} strokeWidth="1.4" /></svg>
        <div style={abs({ insetInline: '9cqw', bottom: '12cqw', color: p.ink })}>{title()}{by}</div>
      </>);
      break;
    case 'minimal':
      body = (
        <div style={abs({ inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16cqw 10cqw', color: p.ink, textAlign: 'center' })}>
          <div style={{ width: '100%', borderTop: `0.4cqw solid ${p.accent}`, borderBottom: `0.4cqw solid ${p.accent}`, padding: '6cqw 0' }}>{title()}</div>
          <div style={{ width: '44cqw', aspectRatio: '1', borderRadius: '50%', overflow: 'hidden', margin: '12cqw 0 8cqw' }}>{art}</div>
          {by}
        </div>
      );
      break;
    case 'stamp':
      body = (<>
        <div style={abs({ insetInline: '9cqw', top: '12cqw', color: p.ink, textAlign: 'center' })}>{title()}</div>
        <div style={abs({ insetInline: '14cqw', bottom: '16cqw', padding: '3cqw', background: '#fff', border: `0.8cqw dashed ${p.accent}`, transform: 'rotate(2deg)', boxShadow: '0 1.5cqw 4cqw rgba(0,0,0,.15)' })}>
          <div style={{ aspectRatio: '1 / 1.1', overflow: 'hidden' }}>{art}</div>
        </div>
        <div style={abs({ insetInline: 0, bottom: '6cqw', color: p.ink, textAlign: 'center' })}>{by}</div>
      </>);
      break;
    case 'split':
      bg = p.deep;
      body = (<>
        <div style={abs({ insetInline: 0, top: 0, height: '40%', padding: '12cqw 9cqw 0', color: p.onDeep })}>{title()}{by}</div>
        <div style={abs({ insetInline: 0, bottom: 0, height: '60%', borderStartStartRadius: '30cqw', overflow: 'hidden', background: p.paper })}>{art}</div>
      </>);
      break;
    default:
      body = (<>
        <div style={{ padding: '13cqw 9cqw 0', color: p.ink }}>
          <div style={{ width: '12cqw', height: '1.2cqw', borderRadius: 9, background: p.accent, marginBottom: '4cqw' }} />{title()}{by}
        </div>
        <div style={abs({ insetInline: 0, bottom: 0, height: '56%', borderTopLeftRadius: '50% 9cqw', borderTopRightRadius: '50% 9cqw', overflow: 'hidden' })}>{art}</div>
      </>);
  }
  return <div style={sheet(bg, { borderRadius: '1.6cqw 3cqw 3cqw 1.6cqw' })}>{body}<Spine /></div>;
}

const textSize = (len: number, k = 1) => (len < 50 ? 8 : len < 120 ? 6.6 : len < 240 ? 5.4 : len < 420 ? 4.6 : 3.9) * k;
const STICKER_SPOTS: CSSProperties[] = [{ top: '6cqw', insetInlineStart: '6cqw' }, { bottom: '9cqw', insetInlineEnd: '7cqw' }, { bottom: '9cqw', insetInlineStart: '7cqw' }, { top: '18cqw', insetInlineEnd: '6cqw' }];

/** An inside page in one of six layouts: a starter line, the child's words, and their pictures (in fixed frames) or a theme picture. */
export function PageView({ page, n, theme, photoUrl, drawUrl, overlay }: { page: Pick<SPage, 'prompt' | 'text' | 'layout' | 'scene' | 'stickers'>; n: number; theme: ThemeId; photoUrl?: string; drawUrl?: string; overlay?: ReactNode }) {
  const p = PALETTE[theme];
  const scene = page.scene ?? theme;
  const layout = page.layout ?? 'auto';
  const pics = [photoUrl && { u: photoUrl, fit: 'cover' as const }, drawUrl && { u: drawUrl, fit: 'contain' as const }].filter(Boolean) as { u: string; fit: 'cover' | 'contain' }[];
  const text = page.text.trim();
  const flip = n % 2 === 0;
  const prompt = page.prompt ? <p style={{ margin: 0, fontSize: '4.3cqw', fontWeight: 700, color: p.accent, display: 'flex', alignItems: 'center', gap: '2cqw' }}><span aria-hidden style={{ width: '6cqw', height: '0.6cqw', background: p.accent, borderRadius: 9, flexShrink: 0 }} />{page.prompt}</p> : null;
  const words = (k = 1) => text ? <p style={{ margin: '2.6cqw 0 0', fontSize: `${textSize(text.length, k)}cqw`, lineHeight: 1.5, fontWeight: 600, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{text}</p>
    : <div aria-hidden style={{ marginTop: '4cqw', display: 'grid', gap: '7cqw' }}>{[0, 1, 2].map((i) => <div key={i} style={{ borderBottom: `0.3cqw dashed ${p.ink}33` }} />)}</div>;
  const polaroids = (aspect: string) => (
    <div style={{ display: 'grid', gridTemplateColumns: pics.length > 1 ? '1fr 1fr' : '1fr', gap: '4cqw' }}>
      {pics.map((x, i) => (
        <div key={x.u} style={{ background: '#fff', padding: '2cqw 2cqw 5cqw', borderRadius: '1cqw', boxShadow: '0 1.2cqw 3cqw rgba(0,0,0,.16)', transform: `rotate(${(i + n) % 2 ? 1.6 : -1.6}deg)`, position: 'relative' }}>
          <div style={{ aspectRatio: pics.length > 1 ? '3 / 4' : aspect, overflow: 'hidden', borderRadius: '0.6cqw' }}><Photo url={x.u} fit={x.fit} /></div>
          <div aria-hidden style={abs({ top: '-2.2cqw', left: '50%', width: '16cqw', height: '4.4cqw', marginLeft: '-8cqw', background: `${p.accent}44`, transform: 'rotate(-3deg)' })} />
        </div>
      ))}
    </div>
  );
  const art = (h: string, radius = '5cqw') => <div style={{ height: h, flexShrink: 0, borderRadius: radius, overflow: 'hidden' }}><Scene theme={scene} flip={flip} /></div>;
  const visual = (aspect: string, h: string) => (pics.length ? polaroids(aspect) : art(h));
  const textBlock = (k = 1, center = false) => <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', justifyContent: center ? 'center' : 'flex-start' }}>{prompt}{words(k)}</div>;

  let body: ReactNode;
  let framed = true;
  switch (layout) {
    case 'textTop':
      body = <div style={abs({ inset: '10cqw 9cqw 13cqw', display: 'flex', flexDirection: 'column', gap: '6cqw' })}>{textBlock(0.95)}{visual('4 / 3', '44%')}</div>;
      break;
    case 'big':
      body = <div style={abs({ inset: '9cqw 8cqw 12cqw', display: 'flex', flexDirection: 'column', gap: '5cqw' })}>{pics.length ? polaroids('4 / 5') : art('64%')}{textBlock(0.7)}</div>;
      break;
    case 'full': {
      framed = false;
      const first = pics[0];
      body = (<>
        <div style={abs({ inset: 0 })}>{first ? <Photo url={first.u} fit={first.fit} /> : <Scene theme={scene} flip={flip} />}</div>
        <div style={abs({ insetInline: '6cqw', bottom: '11cqw', padding: '5cqw 6cqw', borderRadius: '5cqw', background: `${p.paper}F2`, boxShadow: '0 1.5cqw 4cqw rgba(0,0,0,.2)', maxHeight: '58%', overflow: 'hidden' })}>{prompt}{words(0.75)}</div>
      </>);
      break;
    }
    case 'side':
      body = (
        <div style={abs({ inset: '10cqw 8cqw 13cqw', display: 'grid', gridTemplateColumns: '44% 1fr', gap: '5cqw', alignItems: 'start' })}>
          <div style={{ display: 'grid', gap: '4cqw' }}>
            {pics.length ? pics.map((x, i) => <div key={x.u} style={{ background: '#fff', padding: '1.6cqw', boxShadow: '0 1cqw 2.5cqw rgba(0,0,0,.16)', transform: `rotate(${i % 2 ? 2 : -2}deg)` }}><div style={{ aspectRatio: '3 / 4', overflow: 'hidden' }}><Photo url={x.u} fit={x.fit} /></div></div>)
              : <div style={{ aspectRatio: '3 / 5', borderRadius: '4cqw', overflow: 'hidden' }}><Scene theme={scene} flip={flip} /></div>}
          </div>
          {textBlock(0.72)}
        </div>
      );
      break;
    case 'frame':
      body = (<>
        <div aria-hidden style={abs({ inset: '6cqw', border: `1.4cqw double ${p.accent}`, borderRadius: '5cqw' })} />
        <div style={abs({ top: '10cqw', left: '50%', width: '34cqw', height: '34cqw', marginLeft: '-17cqw', borderRadius: '50%', overflow: 'hidden', border: `1cqw solid ${p.paper}`, boxShadow: `0 0 0 0.5cqw ${p.accent}66` })}>
          {pics[0] ? <Photo url={pics[0].u} fit={pics[0].fit} /> : <Scene theme={scene} flip={flip} />}
        </div>
        <div style={abs({ inset: '52cqw 13cqw 16cqw', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' })}>
          {page.prompt && <p style={{ margin: 0, fontSize: '4.3cqw', fontWeight: 700, color: p.accent }}>{page.prompt}</p>}
          {words(0.85)}
        </div>
      </>);
      break;
    default:
      body = (
        <div style={abs({ inset: '9cqw 9cqw 12cqw', display: 'flex', flexDirection: 'column', gap: '5cqw' })}>
          {pics.length ? <div style={{ paddingTop: '3cqw' }}>{polaroids('4 / 3')}</div> : art(text.length > 240 ? '30%' : '46%')}
          {textBlock(pics.length ? 0.85 : 1, !pics.length)}
        </div>
      );
  }
  return (
    <div style={sheet(p.paper, { color: p.ink, borderRadius: n % 2 ? '1.2cqw 2.4cqw 2.4cqw 1.2cqw' : '2.4cqw 1.2cqw 1.2cqw 2.4cqw' })}>
      {framed && layout !== 'frame' && <div aria-hidden style={abs({ inset: '3.4cqw', border: `0.35cqw solid ${p.accent}33`, borderRadius: '3cqw' })} />}
      {framed && layout !== 'frame' && <Sprig color={p.accent} style={abs({ top: '5cqw', insetInlineEnd: '6cqw', width: '13cqw', opacity: 0.8, transform: flip ? 'scaleX(-1)' : undefined })} />}
      {body}
      {(page.stickers ?? []).slice(0, 4).map((e, i) => <span key={i} aria-hidden style={abs({ ...STICKER_SPOTS[i], fontSize: '10cqw', lineHeight: 1, transform: `rotate(${i % 2 ? 12 : -10}deg)`, filter: 'drop-shadow(0 0.6cqw 0.8cqw rgba(0,0,0,.2))' })}>{e}</span>)}
      <p style={abs({ bottom: '5cqw', insetInline: 0, textAlign: 'center', margin: 0, fontSize: '3.4cqw', fontWeight: 700, color: layout === 'full' ? '#fff' : `${p.ink}88`, textShadow: layout === 'full' ? '0 0 1cqw rgba(0,0,0,.6)' : undefined })}>· {n} ·</p>
      {overlay}
    </div>
  );
}

export function EndView({ theme, text }: { theme: ThemeId; text: string }) {
  const p = PALETTE[theme];
  return (
    <div style={sheet(p.paper, { borderRadius: '3cqw 1.6cqw 1.6cqw 3cqw' })}>
      <div style={abs({ inset: 0 })}><Scene theme={theme} flip /></div>
      <div style={abs({ insetInline: '16cqw', top: '34%', padding: '7cqw 4cqw', borderRadius: '50%', background: `${p.paper}F0`, textAlign: 'center', color: p.accent, boxShadow: '0 2cqw 5cqw rgba(0,0,0,.18)' })}>
        <Sprig color={p.accent} style={{ width: '14cqw', display: 'block', margin: '0 auto 1cqw' }} />
        <p style={{ margin: 0, fontSize: '11cqw', fontWeight: 800 }}>{text}</p>
      </div>
    </div>
  );
}
