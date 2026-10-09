import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function SyncStatusBadge() {
  const { t } = useTranslation();
  const [online, setOnline] = useState(navigator.onLine);

  useEffect(() => {
    const up = () => setOnline(true);
    const down = () => setOnline(false);
    window.addEventListener('online', up);
    window.addEventListener('offline', down);
    return () => { window.removeEventListener('online', up); window.removeEventListener('offline', down); };
  }, []);

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
      online ? 'bg-green-100 text-pulse-green' : 'bg-amber-100 text-pulse-amber'
    }`}>
      <svg aria-hidden="true" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {online ? <path d="m5 12 4 4L19 6" /> : <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>}
      </svg>
      {online ? t('sync_done') : t('sync_pending')}
    </span>
  );
}
