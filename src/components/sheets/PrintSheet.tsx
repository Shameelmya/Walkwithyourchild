import type { ReactNode } from 'react';
import { meta, workbook, type Sheet, type L10n } from '../../lib/content';
import type { SheetData } from '../../lib/sheets';
import type { Lang } from '../../lib/store';
import { tr } from '../../i18n';
import { fmtDate } from '../../lib/util';

const GOLD = meta.notebookColor.color;
const TINT = meta.notebookColor.tint;

export function A4({ lang, children, footer }: { lang: Lang; children: ReactNode; footer?: ReactNode }) {
  return (
    <div className="a4" lang={lang} style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `3px solid ${GOLD}`, paddingBottom: 8, marginBottom: 18, fontSize: 12, color: '#6b5a3c' }}>
        <b style={{ fontFamily: "'Google Sans', 'Noto Sans Malayalam', 'Noto Sans Kannada', sans-serif", fontSize: 14 }}>{meta.appTitle[lang]}</b>
        <span>{workbook.title[lang] ?? workbook.title.en}</span>
      </div>
      <div style={{ flex: 1 }}>{children}</div>
      {footer && <div style={{ borderTop: '1px solid #ddd', marginTop: 16, paddingTop: 8, fontSize: 11, color: '#555' }}>{footer}</div>}
    </div>
  );
}

export function PrintSheet({ sheet, data, lang, blank }: { sheet: Sheet; data?: SheetData; lang: Lang; blank: boolean }) {
  const L = (v?: L10n) => (v ? v[lang] ?? v.en : '');
  const d = blank ? undefined : data;
  const head = (
    <div style={{ marginBottom: 14 }}>
      <span style={{ display: 'inline-block', background: GOLD, color: '#fff', borderRadius: 999, padding: '2px 12px', fontSize: 12, fontWeight: 800 }}>{tr(lang, 'sheetN', { n: sheet.n })}</span>
      <h2 style={{ fontSize: 26, fontWeight: 800, margin: '8px 0 4px', color: '#3b3127', fontFamily: "'Google Sans', 'Noto Sans Malayalam', 'Noto Sans Kannada', sans-serif" }}>{L(sheet.title)}</h2>
      {sheet.hint && <p style={{ margin: 0, color: '#555', fontSize: 13 }}>{L(sheet.hint)}</p>}
    </div>
  );
  let body: ReactNode = null;
  if (sheet.type === 'form' || sheet.type === 'card') {
    body = (
      <div style={sheet.type === 'card' ? { border: `3px solid ${meta.urgentColor.color}`, borderRadius: 14, padding: 16 } : undefined}>
        {sheet.banner && <p style={{ background: meta.urgentColor.color, color: '#fff', fontWeight: 800, padding: '6px 12px', borderRadius: 8, margin: '0 0 12px' }}>{L(sheet.banner)} · 108</p>}
        {sheet.fields!.map((f) => (
          <div key={f.id} style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: GOLD }}>{L(f.label)}{f.sub && <span style={{ fontWeight: 400, color: '#777' }}> ({L(f.sub)})</span>}</div>
            <div style={{ borderBottom: '1px solid #bbb', minHeight: f.size === 'long' ? 64 : 30, padding: '4px 2px', fontSize: 14, whiteSpace: 'pre-wrap' }}>{d?.values[f.id] ?? ''}</div>
          </div>
        ))}
      </div>
    );
  } else if (sheet.type === 'table') {
    const cols = sheet.columns!;
    const rows = d ? [...d.rows, ...Array(3).fill({})] : sheet.id === 'support' ? (sheet.prefilled ?? []).map((p) => ({ need: p[lang] })) : Array(typeof sheet.rows === 'number' ? sheet.rows : 10).fill({});
    body = (
      <table>
        <thead><tr>{cols.map((c) => <th key={c.id} style={{ background: TINT, width: c.width ? `${c.width}%` : undefined }}>{L(c.label)}{c.sub && <div style={{ fontWeight: 400, fontSize: 11 }}>{L(c.sub)}</div>}</th>)}</tr></thead>
        <tbody>{rows.map((r: Record<string, string>, i: number) => <tr key={i}>{cols.map((c) => <td key={c.id} style={{ whiteSpace: 'pre-wrap' }}>{fmtCell(r[c.id], c.input, lang)}</td>)}</tr>)}</tbody>
      </table>
    );
  } else if (sheet.type === 'checklist') {
    const on = new Set([...(d?.checked ?? []), ...(d?.auto ?? [])]);
    body = (
      <>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {sheet.items!.map((it, i) => <li key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '7px 0', borderBottom: '1px solid #eee', fontSize: 14 }}><span style={{ width: 18, height: 18, border: `2px solid ${GOLD}`, borderRadius: 4, flexShrink: 0, textAlign: 'center', lineHeight: '14px', fontWeight: 800, color: GOLD }}>{on.has(i) ? '✓' : ''}</span>{L(it)}</li>)}
        </ul>
        {sheet.note && <p style={{ background: TINT, padding: 10, borderRadius: 8, fontSize: 13, marginTop: 14 }}>{L(sheet.note)}</p>}
      </>
    );
  } else if (sheet.type === 'boxes') {
    body = (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {sheet.boxes!.map((b, i) => <div key={i} style={{ border: `2px solid ${TINT}`, borderRadius: 12, padding: 10, minHeight: 150 }}><div style={{ fontWeight: 800, color: GOLD, fontSize: 13 }}>{L(b)}</div><div style={{ whiteSpace: 'pre-wrap', fontSize: 14 }}>{d?.values[String(i)] ?? ''}</div></div>)}
      </div>
    );
  } else if (sheet.type === 'weekly') {
    const rows = sheet.rows as { id: string; label: { en: string; ml: string }; input: string }[];
    const weeks = d?.weeks ?? Array.from({ length: sheet.weeks ?? 4 }, () => ({ week: '', values: {} as Record<string, boolean | number | undefined> }));
    body = (
      <>
        <table>
          <thead><tr><th style={{ background: TINT }}>{L(sheet.rowHeader)}</th>{weeks.map((w, i) => <th key={i} style={{ background: TINT, width: '13%', textAlign: 'center' }}>{L(sheet.weekLabel)} {i + 1}{w.week && <div style={{ fontWeight: 400, fontSize: 10 }}>{fmtDate(w.week, lang, { day: 'numeric', month: 'short' })}</div>}</th>)}</tr></thead>
          <tbody>{rows.map((r) => <tr key={r.id}><td>{L(r.label)}</td>{weeks.map((w, i) => { const v = w.values[r.id]; return <td key={i} style={{ textAlign: 'center', fontWeight: 800 }}>{r.input === 'check' ? (v ? '✓' : '') : v ?? ''}</td>; })}</tr>)}</tbody>
        </table>
        {sheet.warning && <p style={{ border: `2px solid ${meta.urgentColor.color}`, background: meta.urgentColor.tint, padding: 10, borderRadius: 8, fontSize: 13, marginTop: 14 }}>{L(sheet.warning)}</p>}
      </>
    );
  }
  return <A4 lang={lang}>{head}{body}</A4>;
}

function fmtCell(v: string | undefined, input: string, lang: Lang) {
  if (!v) return '';
  if (input === 'date') return fmtDate(v, lang);
  if (input === 'yesno') return tr(lang, v === 'yes' ? 'yes' : v === 'no' ? 'no' : 'dash');
  return v;
}
