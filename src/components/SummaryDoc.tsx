import { db, getSheet, type Child, type Medicine, type Progress, type Seizure, type GenericRecord } from '../lib/db';
import { isActive } from '../lib/meds';
import { meta, sheetById } from '../lib/content';
import { tr } from '../i18n';
import type { Lang } from '../lib/store';
import { ageFrom, fmtDate, fmtDur } from '../lib/util';
import { A4 } from './sheets/PrintSheet';
import { SCALES, scaleLabel, scaleName } from '../lib/scales';

export interface SummaryData { child?: Child; me: Record<string, string>; card: Record<string, string>; meds: Medicine[]; seizures: Seizure[]; progress: Progress[]; diagnoses: GenericRecord[]; questions: string[] }
export async function loadSummary(childId: number): Promise<SummaryData> {
  return {
    child: await db.children.get(childId),
    me: ((await getSheet(childId, 'my-child')).values ?? {}) as Record<string, string>,
    card: ((await getSheet(childId, 'emergency')).values ?? {}) as Record<string, string>,
    meds: (await db.medicines.where('childId').equals(childId).toArray()).filter((m) => isActive(m)),
    seizures: await db.seizures.where('childId').equals(childId).toArray(),
    progress: await db.progress.where('childId').equals(childId).sortBy('date'),
    diagnoses: await db.diagnoses.where('childId').equals(childId).sortBy('date'),
    questions: (((await getSheet(childId, 'questions')).rows as Record<string, string>[]) ?? []).filter((r) => r.question && !r.answer).map((r) => r.question),
  };
}

const C = meta.parts[2].color;
const H = ({ children }: { children: React.ReactNode }) => <h3 style={{ fontSize: 15, fontWeight: 800, color: C, margin: '14px 0 6px', borderBottom: `2px solid ${meta.parts[2].tint}`, paddingBottom: 3 }}>{children}</h3>;

export function SummaryDoc({ d, lang }: { d: SummaryData; lang: Lang }) {
  const T = (k: Parameters<typeof tr>[1], v?: Record<string, string | number>) => tr(lang, k, v);
  const f1 = sheetById('my-child')!.fields!; const f6 = sheetById('emergency')!.fields!;
  const lab = (fs: typeof f1, id: string) => { const l = fs.find((f) => f.id === id)!.label; return l[lang] ?? l.en; };
  const now = Date.now();
  const stat = (days: number) => {
    const s = d.seizures.filter((x) => x.start > now - days * 86400_000);
    const avg = s.length ? s.reduce((a, b) => a + b.durationSec, 0) / s.length : 0;
    const max = s.reduce((a, b) => Math.max(a, b.durationSec), 0);
    return { n: s.length, avg, max, rescue: s.filter((x) => x.rescue === 'yes').length };
  };
  const s30 = stat(30), s90 = stat(90);
  const recent = d.progress.filter((p) => new Date(p.date).getTime() > now - 120 * 86400_000);
  const first = recent[0], last = recent[recent.length - 1];
  const changes = first && last && first !== last ? SCALES.filter((s) => first.scores[s] !== undefined && last.scores[s] !== undefined && first.scores[s] !== last.scores[s]) : [];
  const age = ageFrom(d.child?.dob);
  const kv = (k: string, v?: string) => v ? <tr><td style={{ width: '34%', fontWeight: 700, background: '#faf6ef' }}>{k}</td><td style={{ whiteSpace: 'pre-wrap' }}>{v}</td></tr> : null;
  return (
    <A4 lang={lang} footer={<><b>{T('disclaimer')}:</b> {meta.disclaimer[lang]}</>}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <h2 style={{ fontSize: 24, fontWeight: 800, margin: 0, color: '#3b3127' }}>{T('summaryTitle')}</h2>
        <span style={{ fontSize: 12, color: '#666' }}>{T('preparedOn', { date: fmtDate(now, lang) })}</span>
      </div>
      <p style={{ fontSize: 12, color: '#666', margin: '2px 0 8px' }}>{T('summaryParentNote')}</p>
      <table><tbody>
        {kv(T('childName'), d.child?.name)}
        {kv(T('ageDob'), [age ? T('ageYm', { y: age.y, m: age.m }) : '', d.child?.dob ? fmtDate(d.child.dob, lang) : ''].filter(Boolean).join(' · '))}
        {kv(lab(f1, 'condition'), d.me.condition)}
        {kv(T('diagnoses'), d.diagnoses.map((x) => `${x.name ?? ''} (${fmtDate(x.date, lang)})`).join('\n') || d.me.diagnosis)}
        {kv(lab(f1, 'allergies'), d.me.allergies || '—')}
        {kv(lab(f1, 'main_doctor'), d.me.main_doctor)}
        {kv(lab(f1, 'main_contact'), d.me.main_contact || d.card.contact)}
      </tbody></table>
      <H>{T('currentMedicines')}</H>
      {d.meds.length ? <table><thead><tr><th>{T('medName')}</th><th>{T('medPurpose')}</th><th>{T('medDose')}</th><th>{T('medTimes')}</th><th>{T('startDate')}</th></tr></thead>
        <tbody>{d.meds.map((m) => <tr key={m.id}><td>{m.name}</td><td>{m.purpose}</td><td>{m.dose}</td><td>{m.times.join(', ')}</td><td>{fmtDate(m.start, lang)}</td></tr>)}</tbody></table> : <p style={{ fontSize: 13 }}>—</p>}
      <H>{T('seizureStats')}</H>
      <table><thead><tr><th></th><th>{T('last30')}</th><th>{T('last90')}</th></tr></thead><tbody>
        <tr><td>{T('numberOfSeizures')}</td><td>{s30.n}</td><td>{s90.n}</td></tr>
        <tr><td>{T('averageLength')}</td><td>{s30.n ? fmtDur(s30.avg) : '—'}</td><td>{s90.n ? fmtDur(s90.avg) : '—'}</td></tr>
        <tr><td>{T('longest')}</td><td>{s30.n ? fmtDur(s30.max) : '—'}</td><td>{s90.n ? fmtDur(s90.max) : '—'}</td></tr>
        <tr><td>{T('rescueGivenTimes')}</td><td>{s30.rescue}</td><td>{s90.rescue}</td></tr>
      </tbody></table>
      <H>{T('recentChanges')}</H>
      {changes.length ? <ul style={{ margin: 0, paddingInlineStart: 18, fontSize: 13 }}>{changes.map((s) => <li key={s}><b>{T(scaleName(s))}:</b> {T(scaleLabel(s, first.scores[s]!))} ({fmtDate(first.date, lang)}) → {T(scaleLabel(s, last.scores[s]!))} ({fmtDate(last.date, lang)})</li>)}</ul> : <p style={{ fontSize: 13 }}>{T('noRecentChanges')}</p>}
      {last?.notes && <p style={{ fontSize: 13 }}><b>{T('notes')}:</b> {last.notes}</p>}
      <H>{T('openQuestions')}</H>
      {d.questions.length ? <ol style={{ margin: 0, paddingInlineStart: 18, fontSize: 13 }}>{d.questions.map((q, i) => <li key={i}>{q}</li>)}</ol> : <p style={{ fontSize: 13 }}>—</p>}
      <H>{T('emergencyPlan')}</H>
      <table><tbody>{f6.map((f) => <tr key={f.id}><td style={{ width: '34%', fontWeight: 700, background: '#faf6ef' }}>{lab(f6, f.id)}</td><td style={{ whiteSpace: 'pre-wrap' }}>{d.card[f.id] ?? ''}</td></tr>)}</tbody></table>
    </A4>
  );
}
