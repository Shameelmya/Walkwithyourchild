// Converts /content (markdown + json) into src/generated/*.json at build time.
import fs from 'node:fs';
import path from 'node:path';
import MarkdownIt from 'markdown-it';
import fm from 'front-matter';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const C = path.join(root, 'content');
const OUT = path.join(root, 'src', 'generated');
fs.mkdirSync(OUT, { recursive: true });

const md = new MarkdownIt({ html: false, linkify: false, typographer: false });
const strip = (h) => h.replace(/<[^>]+>/g, ' ').replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#39;/g, "'").replace(/\s+/g, ' ').trim();
const NUM_RE = /\b(1-800-\d{3}-\d{4}|14416|108)\b/g;

function blocksOf(src) {
  const lines = src.split('\n');
  const tokens = md.parse(src, {});
  const out = [];
  for (const t of tokens) {
    if (t.level !== 0 || !t.map || t.nesting === -1) continue;
    out.push(lines.slice(t.map[0], t.map[1]).join('\n'));
  }
  return out.map(toBlock);
}

function toBlock(s) {
  const h = s.match(/^###\s+(.*)$/);
  if (h) return { t: 'h', html: md.renderInline(h[1].trim()) };
  const co = s.match(/^>\s*\[!(\w+)\]\s*\n?([\s\S]*)$/);
  if (co) {
    const kind = co[1];
    const inner = co[2].split('\n').map((l) => l.replace(/^>\s?/, '')).join('\n');
    const html = md.render(inner);
    const b = { t: 'callout', kind, html };
    if (kind === 'ask') {
      b.questions = inner.split('\n').filter((l) => /^\s*[-*]\s+/.test(l)).map((l) => strip(md.renderInline(l.replace(/^\s*[-*]\s+/, ''))).replace(/^["“”'‘’]+|["“”'‘’]+$/g, '').trim());
    }
    if (kind === 'urgent' || kind === 'alert' || kind === 'care') {
      b.numbers = [...new Set([...strip(html).matchAll(NUM_RE)].map((m) => m[1]))];
    }
    return b;
  }
  if (/^\s*[-*]\s+\[ \]/.test(s)) {
    const items = s.split('\n').filter((l) => /^\s*[-*]\s+\[ \]/.test(l)).map((l) => md.renderInline(l.replace(/^\s*[-*]\s+\[ \]\s*/, '')));
    return { t: 'check', items };
  }
  return { t: 'html', html: md.render(s) };
}

function parseBook(src) {
  const parts = [];
  const chapters = [];
  let cur = null;
  let part = 0;
  const flush = () => { if (cur) { cur.blocks = blocksOf(cur.src.join('\n')); delete cur.src; chapters.push(cur); } };
  let partIntro = null;
  for (const line of src.split('\n')) {
    let m;
    if ((m = line.match(/^#\s+part:(\d+)\s*\|\s*(.*)$/))) {
      flush(); cur = null; part = +m[1];
      partIntro = { n: part, title: m[2].trim(), src: [] }; parts.push(partIntro);
      continue;
    }
    if ((m = line.match(/^##\s+chapter:(\d+)\s*\|\s*(.*)$/))) {
      flush(); partIntro = null;
      const n = +m[1];
      cur = { id: 'c' + n, n, part: n === 0 ? 0 : part, title: m[2].trim(), src: [] };
      continue;
    }
    if ((m = line.match(/^##\s+appendix\s*\|\s*(.*)$/))) {
      flush(); partIntro = null;
      cur = { id: 'appendix', n: 99, part: -1, title: m[1].trim(), src: [] };
      continue;
    }
    if (cur) cur.src.push(line); else if (partIntro) partIntro.src.push(line);
  }
  flush();
  for (const p of parts) { p.intro = p.src.join('\n').trim() ? md.render(p.src.join('\n')) : ''; delete p.src; }
  return { parts, chapters };
}

const books = {};
for (const lang of ['en', 'ml']) {
  const b = parseBook(fs.readFileSync(path.join(C, lang, 'book.md'), 'utf8'));
  const pro = parseBook(fs.readFileSync(path.join(C, lang, 'professionals.md'), 'utf8'));
  b.chapters.push(...pro.chapters);
  books[lang] = b;
}

// Verify parallel structure and derive cross-language links from English.
const en = books.en, ml = books.ml;
let warnings = 0;
en.chapters.forEach((c, i) => {
  const o = ml.chapters[i];
  if (!o || o.id !== c.id || o.blocks.length !== c.blocks.length) { warnings++; console.warn(`! ${c.id}: en ${c.blocks.length} blocks, ml ${o && o.blocks.length}`); }
  c.blocks.forEach((b, j) => {
    const mb = o && o.blocks[j];
    if (b.t === 'callout' && b.kind === 'try') {
      const txt = strip(b.html).toLowerCase();
      b.link = txt.includes('treatment map') ? 'treatments' : txt.includes('support circle') ? 'support' : txt.includes('good moment') ? 'good-moments' : 'notes';
      if (mb) mb.link = b.link;
    }
    if (mb && mb.t !== b.t) { warnings++; console.warn(`! ${c.id}#${j}: type ${b.t} vs ${mb.t}`); }
  });
});

const find = (cid, pred) => { const c = en.chapters.find((x) => x.id === cid); return c ? c.blocks.findIndex(pred) : -1; };
const fa = find('c5', (b) => b.t === 'html' && /During a seizure/.test(b.html));
const rx = find('c10', (b) => b.t === 'h' && /calm your body/i.test(b.html));
const anchors = {
  firstAid: { c: 'c5', from: fa, to: fa + 2 },
  relax: { c: 'c10', from: rx + 1, to: rx + 1 },
};

for (const lang of ['en', 'ml']) {
  const b = books[lang];
  for (const c of b.chapters) c.blocks.forEach((x) => { x.text = strip(x.html || (x.items || []).join(' ')); });
  fs.writeFileSync(path.join(OUT, `book.${lang}.json`), JSON.stringify(b));
}
// Light table of contents for the initial bundle.
const toc = en.chapters.map((c, i) => ({ id: c.id, n: c.n, part: c.part, blocks: c.blocks.length, title: { en: c.title, ml: ml.chapters[i]?.title ?? c.title } }));
const parts = en.parts.map((p, i) => ({ n: p.n, title: { en: p.title, ml: ml.parts[i]?.title ?? p.title } }));
fs.writeFileSync(path.join(OUT, 'toc.json'), JSON.stringify({ toc, parts, anchors }));

// Updates
const updates = {};
for (const lang of ['en', 'ml']) {
  const dir = path.join(C, 'updates', lang);
  updates[lang] = (fs.existsSync(dir) ? fs.readdirSync(dir) : []).filter((f) => f.endsWith('.md')).map((f) => {
    const { attributes: a, body } = fm(fs.readFileSync(path.join(dir, f), 'utf8'));
    return { id: String(a.id ?? f.replace(/\.md$/, '')), date: String(a.date instanceof Date ? a.date.toISOString().slice(0, 10) : a.date ?? ''), title: String(a.title ?? ''), html: md.render(body) };
  }).sort((x, y) => y.date.localeCompare(x.date));
}
fs.writeFileSync(path.join(OUT, 'updates.json'), JSON.stringify(updates));
fs.copyFileSync(path.join(C, 'meta.json'), path.join(OUT, 'meta.json'));
fs.copyFileSync(path.join(C, 'workbook.json'), path.join(OUT, 'workbook.json'));
console.log(`content: ${en.chapters.length} chapters, ${en.parts.length} parts, anchors ${JSON.stringify(anchors)}, warnings ${warnings}`);
