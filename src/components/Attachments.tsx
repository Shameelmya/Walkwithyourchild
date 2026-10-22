import { Paperclip, FileText, X } from 'lucide-react';
import { useT } from '../i18n';
import { FileButton } from './ui';
import { useBlobUrl, useChildId } from '../lib/hooks';
import { putBlob } from '../lib/db';
import { compressImage } from '../lib/media';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';

export function Thumb({ id, onRemove }: { id: number; onRemove?: () => void }) {
  const url = useBlobUrl(id);
  const rec = useLiveQuery(() => db.blobs.get(id), [id]);
  const isImg = rec?.type.startsWith('image/');
  return (
    <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-line bg-surface2">
      <a href={url} target="_blank" rel="noreferrer" className="block w-full h-full" aria-label={rec?.name || 'file'}>
        {isImg && url ? <img src={url} alt="" className="w-full h-full object-cover" /> : <span className="flex w-full h-full items-center justify-center"><FileText aria-hidden /></span>}
      </a>
      {onRemove && <button className="absolute top-0 right-0 bg-black/60 text-white rounded-bl-lg w-7 h-7 flex items-center justify-center" onClick={onRemove} aria-label="remove"><X size={16} /></button>}
    </div>
  );
}

export function Attachments({ value, onChange }: { value: number[]; onChange: (v: number[]) => void }) {
  const { t } = useT();
  const childId = useChildId();
  return (
    <div>
      <p className="label">{t('attachments')}</p>
      <div className="flex flex-wrap gap-2 items-center">
        {value.map((id) => <Thumb key={id} id={id} onRemove={() => onChange(value.filter((x) => x !== id))} />)}
        <FileButton accept="image/*,application/pdf" multiple onFile={async (f) => { const b = await compressImage(f); const id = await putBlob(b, childId, f.name); onChange([...value, id]); }}><Paperclip size={18} aria-hidden /> {t('addPhotoOrPdf')}</FileButton>
      </div>
    </div>
  );
}
