import type { Block, Book } from './content';
import { section, type Src } from './care';

export interface Step { html: string; head: string; en: string }
export interface Parts { steps: Step[]; urgent: string[]; why: string[]; ask: string[] }

const items = (html: string) => {
  const d = new DOMParser().parseFromString(html, 'text/html');
  const lis = [...d.querySelectorAll('li')];
  if (lis.length) return lis.map((li) => li.innerHTML.trim());
  const ps = [...d.querySelectorAll('p')].map((p) => p.innerHTML.trim()).filter(Boolean);
  return ps.length ? ps : [html];
};
/** A short bold line that only introduces a list ("During a seizure:") is a label, not a step. */
const isLabel = (b: Block) => b.t === 'html' && /^<p><strong>[^<]{1,60}<\/strong><\/p>\s*$/.test(b.html.trim()) && /:\s*$/.test(b.text);

/** Split the book's own sections into single steps, keeping its words exactly. */
export function toParts(book: Book, src: Src[]): Parts {
  const out: Parts = { steps: [], urgent: [], why: [], ask: [] };
  for (const s of src) {
    const blocks = section(book, s);
    const head = blocks[0]?.b.t === 'h' ? blocks[0].b.text : '';
    for (const { b } of blocks) {
      if (b.t === 'h' || isLabel(b)) continue;
      if (b.t === 'callout') {
        if (b.kind === 'alert' || b.kind === 'soft' || b.kind === 'urgent') out.urgent.push(b.html);
        else if (b.kind === 'why') out.why.push(b.html);
        else if (b.kind === 'ask') out.ask.push(b.html);
        else items(b.html).forEach((h) => out.steps.push({ html: h, head, en: '' }));
        continue;
      }
      if (b.t === 'check') { b.items.forEach((h) => out.steps.push({ html: h, head, en: '' })); continue; }
      items(b.html).forEach((h) => out.steps.push({ html: h, head, en: '' }));
    }
  }
  return out;
}
const plain = (h: string) => h.replace(/<[^>]+>/g, ' ').toLowerCase();
/** A picture for each step, chosen from the English wording of the same step. */
const PICS: [RegExp, string][] = [
  [/note the time|time it started/, '⏱️'], [/hard or sharp|tight threads|chains/, '🧸'], [/onto their side|on their side/, '🛌'],
  [/anything in the mouth|hold the body|water or food/, '🚫'], [/stay with your child|until they are awake/, '🤲'],
  [/diary|video/, '📹'], [/108|hospital|emergency/, '🚑'], [/upright/, '🪑'], [/small amounts|soft food|swallow/, '🥄'],
  [/cough|choking|gurgly/, '😮‍💨'], [/too much food|weight/, '⚖️'], [/protein|malted|drinks/, '🥤'], [/special diet|ketogenic|copper/, '🥗'],
  [/feeding tube|tube|peg|ryle/, '🩺'], [/chart|write each medicine/, '📋'], [/same times/, '⏰'], [/miss a dose|double/, '❓'],
  [/never stop|change a medicine/, '⚠️'], [/buy more|run out|travel/, '🛒'], [/rash|swelling/, '🩹'], [/review|doses often/, '📅'],
  [/exercises|therapist shows/, '🤸'], [/right amount|tired or in pain/, '😴'], [/good sitting|slumps|chair|carpenter/, '🪑'],
  [/every 2 hours|change their position/, '🔄'], [/lifting|bend your knees/, '🏋️'], [/splints|braces/, '🦿'],
  [/skin|diaper|red patches/, '🧴'], [/air mattress/, '🛏️'], [/constipation|fibre/, '🚽'], [/drooling/, '💧'], [/puberty|periods/, '🌸'],
  [/cannot speak still feel pain|crying|changed face/, '😢'], [/sleep/, '😴'], [/breath|lips|blue|grey/, '🫁'], [/positions that ease|secretions|machine/, '🌬️'],
  [/walking|sitting without support/, '🚶'], [/speech|signals|gesture/, '👋'], [/yes \/ no|blink|squeeze/, '👍'], [/pictures|cards/, '🖼️'],
  [/share the list|everyone who cares/, '🤝'], [/scream|frustration/, '💬'], [/seizures become|seizures/, '⚡'], [/stiff|curving/, '🦵'],
  [/sight|hearing|behaviour/, '👁️'], [/bladder|bowel/, '🚽'], [/tell your team|notice a change/, '👩‍⚕️'],
  [/morphine|pain and breathlessness|treated/, '💊'], [/small pleasures|favourite/, '🍦'], [/for any treatment|feel better/, '❔'],
  [/not giving up|live more comfortably/, '💛'], [/earlier is often easier|timing/, '⏳'], [/plan for home|keep it clean/, '🏠'],
];
export function picFor(enHtml: string) { const t = plain(enHtml); return PICS.find(([r]) => r.test(t))?.[1] ?? '✅'; }
