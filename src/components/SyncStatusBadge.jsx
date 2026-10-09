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
    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
      online ? 'bg-green-100 text-pulse-green' : 'bg-amber-100 text-pulse-amber'
    }`}>
      {online ? t('sync_done') : t('sync_pending')}
    </span>
  );
}
