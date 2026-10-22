import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Plus, Trash2 } from 'lucide-react';
import { useT } from '../../i18n';
import { Page, PageHeader, Empty, Modal, Confirm, BottomBar } from '../../components/ui';
import { db, type Note } from '../../lib/db';
import { useChildId } from '../../lib/hooks';
import { fmtDate } from '../../lib/util';

export default function Notes() {
  const { t, lang } = useT();
  const childId = useChildId();
  const notes = useLiveQuery(() => db.notes.where('childId').equals(childId).reverse().sortBy('updatedAt'), [childId]) ?? [];
  const [edit, setEdit] = useState<Note | null>(null);
  const [del, setDel] = useState(false);
  // Save every change straight away.
  useEffect(() => { if (edit?.id) void db.notes.update(edit.id, { title: edit.title, body: edit.body, updatedAt: Date.now() }); }, [edit]);
  const close = async () => { if (edit?.id) await db.notes.update(edit.id, { title: edit.title, body: edit.body, updatedAt: Date.now() }); setEdit(null); };
  const add = async () => { const n: Note = { childId, title: '', body: '', updatedAt: Date.now() }; n.id = await db.notes.add(n); setEdit(n); };
  return (
    <Page>
      <PageHeader back="/notebook" title={t('myNotes')} />
      {!notes.length ? <Empty kind="leaf" title={t('noNotes')} text={t('noNotesText')} /> : (
        <ul className="grid sm:grid-cols-2 gap-3">
          {notes.map((n) => (
            <li key={n.id}><button className="card p-4 w-full text-left min-h-[96px]" onClick={() => setEdit(n)}>
              <p className="font-extrabold line-clamp-1">{n.title || t('untitled')}</p>
              <p className="text-muted line-clamp-3 whitespace-pre-wrap">{n.body}</p>
              <p className="text-xs text-muted mt-2">{fmtDate(n.updatedAt, lang)}</p>
            </button></li>
          ))}
        </ul>
      )}
      <Modal open={!!edit} onClose={close} title={t('myNotes')} full>
        {edit && (<>
          <label className="label" htmlFor="n-title">{t('title')}</label>
          <input id="n-title" className="input mb-3" value={edit.title} onChange={(e) => setEdit({ ...edit, title: e.target.value })} />
          <label className="label" htmlFor="n-body">{t('note')}</label>
          <textarea id="n-body" className="input min-h-[45vh] font-read" value={edit.body} onChange={(e) => setEdit({ ...edit, body: e.target.value })} />
          <div className="flex justify-between mt-4"><button className="btn-ghost text-danger" onClick={() => setDel(true)}><Trash2 size={18} aria-hidden /> {t('delete')}</button><button className="btn-primary" onClick={close}>{t('done')}</button></div>
        </>)}
      </Modal>
      <BottomBar><button className="btn-primary w-full" onClick={add}><Plus size={18} aria-hidden /> {t('newNote')}</button></BottomBar>
      <Confirm open={del} danger text={t('deleteNoteQ')} onNo={() => setDel(false)} onYes={async () => { if (edit?.id) await db.notes.delete(edit.id); setDel(false); setEdit(null); }} />
    </Page>
  );
}
