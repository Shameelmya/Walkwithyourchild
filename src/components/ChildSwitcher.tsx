import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, Plus, Check } from 'lucide-react';
import { useChild, useChildren } from '../lib/hooks';
import { useUI } from '../lib/store';
import { useT } from '../i18n';
import { Avatar, Modal } from './ui';

export function ChildSwitcher() {
  const { t } = useT();
  const child = useChild();
  const kids = useChildren();
  const setActive = useUI((s) => s.setActiveChild);
  const [open, setOpen] = useState(false);
  const nav = useNavigate();
  return (
    <>
      <button className="flex items-center gap-2.5 min-h-[48px] rounded-2xl pr-2 pl-1 hover:bg-surface2 min-w-0 max-w-full" onClick={() => setOpen(true)} aria-label={t('switchChild')}>
        <Avatar blobId={child?.photoBlobId} name={child?.name} size={42} />
        <span className="min-w-0 text-left leading-tight"><span className="block text-[0.7rem] font-bold text-muted">{t('caringFor')}</span><span className="block font-extrabold truncate">{child?.name ?? ''}</span></span>
        <ChevronDown size={16} aria-hidden className="shrink-0 text-muted" />
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title={t('switchChild')}>
        <ul className="grid gap-2 mb-4">
          {kids.map((k) => (
            <li key={k.id}><button className="w-full flex items-center gap-3 p-2 rounded-2xl hover:bg-surface2 min-h-[60px]" onClick={() => { setActive(k.id!); setOpen(false); }}>
              <Avatar blobId={k.photoBlobId} name={k.name} size={46} /><span className="flex-1 text-left font-bold">{k.name}</span>{k.id === child?.id && <Check className="text-[rgb(var(--accent))]" />}
            </button></li>
          ))}
        </ul>
        <div className="flex gap-2 flex-wrap">
          <button className="btn-ghost" onClick={() => { setOpen(false); nav('/child/profile?new=1'); }}><Plus size={18} /> {t('addChild')}</button>
          <button className="btn-outline" onClick={() => { setOpen(false); nav('/child/profile'); }}>{t('editProfile')}</button>
        </div>
      </Modal>
    </>
  );
}
