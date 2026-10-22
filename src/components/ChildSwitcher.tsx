import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronDown, Plus, Check } from 'lucide-react';
import { useChild, useChildren } from '../lib/hooks';
import { useUI } from '../lib/store';
import { useT } from '../i18n';
import { Avatar, Modal } from './ui';
import { meta } from '../lib/content';

export function ChildSwitcher({ compact = false }: { compact?: boolean }) {
  const { t, lang } = useT();
  const child = useChild();
  const kids = useChildren();
  const setActive = useUI((s) => s.setActiveChild);
  const [open, setOpen] = useState(false);
  const nav = useNavigate();
  return (
    <>
      <div className="flex items-center gap-2 w-full">
        <button className="flex items-center gap-2 min-h-[48px] rounded-full pr-2 hover:bg-surface2 min-w-0" onClick={() => setOpen(true)} aria-label={t('switchChild')}>
          <Avatar blobId={child?.photoBlobId} name={child?.name} size={40} />
          <span className="font-extrabold truncate">{child?.name ?? meta.appTitle[lang]}</span>
          <ChevronDown size={18} aria-hidden className="shrink-0" />
        </button>
        {compact && <Link to="/" className="ml-auto text-sm font-bold text-muted truncate max-w-[45%] text-right" aria-label={meta.appTitle[lang]}>{meta.appTitle[lang]}</Link>}
      </div>
      <Modal open={open} onClose={() => setOpen(false)} title={t('switchChild')}>
        <ul className="grid gap-2 mb-4">
          {kids.map((k) => (
            <li key={k.id}><button className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-surface2 min-h-[56px]" onClick={() => { setActive(k.id!); setOpen(false); }}>
              <Avatar blobId={k.photoBlobId} name={k.name} size={44} /><span className="flex-1 text-left font-bold">{k.name}</span>{k.id === child?.id && <Check className="text-accent" />}
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
