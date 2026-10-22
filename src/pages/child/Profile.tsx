import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Camera } from 'lucide-react';
import { PhotoCrop } from '../../components/PhotoCrop';
import { useT } from '../../i18n';
import { Avatar, FileButton, Page, PageHeader, useToast, BottomBar } from '../../components/ui';
import { db, putBlob, getSetting } from '../../lib/db';
import { useChild } from '../../lib/hooks';
import { useUI } from '../../lib/store';
import { useBack } from '../../lib/nav';

export default function Profile() {
  const { t } = useT();
  const [sp] = useSearchParams();
  const isNew = sp.get('new') === '1';
  const child = useChild();
  const back = useBack();
  const toast = useToast((s) => s.show);
  const setActive = useUI((s) => s.setActiveChild);
  const [crop, setCrop] = useState<Blob | null>(null);
  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  const [rescue, setRescue] = useState(5);
  const [photoId, setPhotoId] = useState<number>();
  useEffect(() => {
    if (isNew) { getSetting('defaultRescue', 5).then(setRescue); return; }
    if (child) { setName(child.name); setDob(child.dob ?? ''); setRescue(child.rescueMinutes ?? 5); setPhotoId(child.photoBlobId); }
  }, [child, isNew]);
  const save = async () => {
    if (!name.trim()) return toast(t('nameNeeded'));
    if (isNew) { const id = await db.children.add({ name: name.trim(), dob: dob || undefined, photoBlobId: photoId, rescueMinutes: rescue, createdAt: Date.now() }); setActive(id); }
    else if (child?.id) await db.children.update(child.id, { name: name.trim(), dob: dob || undefined, photoBlobId: photoId, rescueMinutes: rescue });
    toast(t('saved')); back('/child');
  };
  return (
    <Page>
      <PageHeader title={isNew ? t('addChild') : t('editProfile')} />
      {crop && <PhotoCrop file={crop} onCancel={() => setCrop(null)} onDone={async (b) => { setCrop(null); setPhotoId(await putBlob(b, child?.id ?? 0, 'photo')); }} />}
      <div className="card p-4 grid gap-4">
        <div className="flex items-center gap-4">
          <Avatar blobId={photoId} name={name} size={72} />
          <FileButton className="chip" accept="image/*" onFile={(f) => setCrop(f)}><Camera size={16} aria-hidden /> {t('changePhoto')}</FileButton>
        </div>
        <div><label className="label" htmlFor="p-name">{t('childName')} *</label><input id="p-name" className="input" value={name} onChange={(e) => setName(e.target.value)} /></div>
        <div><label className="label" htmlFor="p-dob">{t('dobOptional')}</label><input id="p-dob" type="date" className="input" value={dob} onChange={(e) => setDob(e.target.value)} /></div>
        <div><label className="label" htmlFor="p-rescue">{t('rescueTime')}</label>
          <div className="flex items-center gap-3"><input id="p-rescue" type="number" min={1} max={30} className="input w-28" value={rescue} onChange={(e) => setRescue(Math.max(1, Math.min(30, +e.target.value || 5)))} /><span>{t('minutes')}</span></div>
          <p className="text-sm text-muted mt-1">{t('rescueHint')}</p></div>
      </div>
      <BottomBar><button className="btn-primary w-full" onClick={save}>{t('save')}</button></BottomBar>
    </Page>
  );
}
