import { useRegisterSW } from 'virtual:pwa-register/react';
import { useT } from '../i18n';

export function UpdatePrompt() {
  const { t } = useT();
  const { needRefresh: [need, setNeed], updateServiceWorker } = useRegisterSW({ immediate: true });
  if (!need) return null;
  return (
    <div role="status" className="fixed z-[65] left-4 right-4 bottom-24 lg:left-auto lg:right-6 lg:bottom-6 lg:w-96 card p-4 flex items-center gap-3 anim-in">
      <p className="flex-1 font-semibold">{t('updateReady')}</p>
      <button className="btn-ghost px-3" onClick={() => setNeed(false)}>{t('later')}</button>
      <button className="btn-primary px-4" onClick={() => updateServiceWorker(true)}>{t('update')}</button>
    </div>
  );
}
