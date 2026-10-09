import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { db } from '../db/schema.js';
import { requestSync } from '../sync/engine.js';
import { Button } from './ui/button';
import * as Dialog from '@radix-ui/react-dialog';
import { StateMessage } from './SharedStates';
export default function SyncStatusBadge() {
  const { t } = useTranslation();
  const [state, setState] = useState({ online: navigator.onLine, pending: 0, message: 'Checking your connection…' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    async function update() {
      try {
        const pending = await db.mutations.count();
        const message = (await db.settings.get('syncStatus'))?.value || 'Records stay on this phone until you share them.';
        if (active) { setState({ online: navigator.onLine, pending, message }); setError(''); }
      } catch { if (active) setError('Cannot check saved records. Reload the page to try again.'); }
    }
    async function sync() { try { await requestSync(); await update(); } catch { if (active) setError('Sync could not finish. Your saved records stay on this phone. Try again when connected.'); } }
    const worker = event => { if (event.data?.type === 'AGRIPULSE_SYNC_CHANGED') { window.dispatchEvent(new Event('agripulse-change')); void update(); } };
    void sync();
    window.addEventListener('online', sync); window.addEventListener('offline', update); window.addEventListener('agripulse-change', update);
    navigator.serviceWorker?.addEventListener('message', worker);
    const timer = setInterval(() => { if (navigator.onLine) void sync(); else void update(); }, 15000);
    return () => { active = false; clearInterval(timer); window.removeEventListener('online', sync); window.removeEventListener('offline', update); window.removeEventListener('agripulse-change', update); navigator.serviceWorker?.removeEventListener('message', worker); };
  }, []);
  async function manualSync() { setBusy(true); setError(''); try { await requestSync(); window.dispatchEvent(new Event('agripulse-change')); } catch { setError('Sync could not finish. Your saved records stay on this phone. Try again when connected.'); } finally { setBusy(false); } }
  return <Dialog.Root><Dialog.Trigger asChild><button type="button" className={`status-chip ${state.online ? '' : 'offline'}`} aria-label={t('ui_connection')}><span aria-hidden="true">{busy ? <RefreshCw /> : state.online ? <Wifi /> : <WifiOff />}</span><span>{busy ? t('Syncing…') : state.online ? t('Online') : t('ui_offline')}</span></button></Dialog.Trigger><Dialog.Portal><Dialog.Overlay className="fixed inset-0 z-30 bg-[var(--ink)] opacity-30" /><Dialog.Content className="status-dialog"><Dialog.Title className="screen-heading">{t('ui_connection')}</Dialog.Title><Dialog.Description className="mt-4">{state.online ? t(state.message) : t('ui_offline_description')}</Dialog.Description><StateMessage state={error ? 'error' : !state.online ? 'offline' : busy ? 'syncing' : state.pending ? 'pending' : 'online'} /><p role="status" className="my-4">{state.pending ? t('pending_count', { count: state.pending }) : t('ui_no_pending')}</p>{error && <p role="alert">{t(error)}</p>}<div className="choice-list"><Button type="button" disabled={busy || !state.online} onClick={manualSync}><RefreshCw aria-hidden="true" />{busy ? t('Syncing…') : t('Sync now')}</Button><Dialog.Close asChild><Button variant="outline">{t('log_close')}</Button></Dialog.Close></div></Dialog.Content></Dialog.Portal></Dialog.Root>;
}
