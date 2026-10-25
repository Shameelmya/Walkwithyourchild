// Lists, per chapter, which blocks of content/<lang>/*.md carry <!-- claude-translated --> (translated from the English for review)
// and which are the author's own text. Usage: node scripts/translated-report.mjs kn
import fs from 'node:fs';
import path from 'node:path';
import MarkdownIt from 'markdown-it';

const lang = process.argv[2];
if (!lang) { console.error('usage: node scripts/translated-report.mjs <lang>'); process.exit(1); }
const md = new MarkdownIt({ html: false });
const MARK = /^[ \t]*<!--\s*claude-translated\s*-->[ \t]*$/;
const out = [];
for (const f of ['book.md', 'professionals.md']) {
  const file = path.join('content', lang, f);
  if (!fs.existsSync(file)) continue;
  const lines = fs.readFileSync(file, 'utf8').split('\n');
  const marked = new Set(); // line numbers (in the stripped text) where a marked block starts
  const clean = []; let pending = false;
  for (const l of lines) { if (MARK.test(l)) { pending = true; continue; } if (pending && l.trim()) { marked.add(clean.length); pending = false; } clean.push(l); }
  const src = clean.join('\n');
  let chapter = '', n = 0, mine = 0, theirs = [];
  const flush = () => { if (chapter) out.push(`${chapter}: ${n} blocks, ${mine} translated by Claude${theirs.length ? `; author's own text in block(s) ${theirs.join(', ')}` : ' (all)'}`); };
  for (const t of md.parse(src, {})) {
    if (t.level !== 0 || !t.map || t.nesting === -1) continue;
    const first = clean[t.map[0]];
    const h = first.match(/^##\s+(chapter:\d+|appendix)/);
    if (h) { flush(); chapter = h[1]; n = 0; mine = 0; theirs = []; continue; }
    if (/^#\s+part:/.test(first)) continue;
    n++;
    if (marked.has(t.map[0])) mine++; else theirs.push(n);
  }
  flush();
}
console.log(out.join('\n'));
