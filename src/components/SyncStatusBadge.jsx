import { useEffect, useState } from 'react';
import { db } from '../db/schema.js';
import { requestSync, cloudEnabled } from '../sync/engine.js';
export default function SyncStatusBadge() {
  const [state, setState] = useState({ online: navigator.onLine, pending: 0, message: 'Checking sync status...' });
  useEffect(() => {
    let active = true;
    const update = async () => {
      const pending = await db.mutations.count(); const message = (await db.settings.get('syncStatus'))?.value || 'Records stay local until shared.';
      if (active) setState({ online: navigator.onLine, pending, message });
    };
    const sync = async () => { await requestSync(); await update(); };
    const worker = event => { if (event.data?.type === 'AGRIPULSE_SYNC_CHANGED') { window.dispatchEvent(new Event('agripulse-change')); void update(); } };
    void sync();
    window.addEventListener('online', sync); window.addEventListener('offline', update); window.addEventListener('agripulse-change', update);
    navigator.serviceWorker?.addEventListener('message', worker);
    const timer = setInterval(() => { if (navigator.onLine) void sync(); else void update(); }, 15000);
    return () => { active = false; clearInterval(timer); window.removeEventListener('online', sync); window.removeEventListener('offline', update); window.removeEventListener('agripulse-change', update); navigator.serviceWorker?.removeEventListener('message', worker); };
  }, []);
  return <div className="mx-4 flex flex-wrap items-center justify-center gap-2 text-xs" role="status">
    <span className="rounded-full bg-amber-50 px-3 py-1">{state.online ? 'Online' : 'Offline'} · {state.pending} pending</span>
    <span>{state.message}</span>
    {cloudEnabled && <button type="button" onClick={() => void requestSync()} className="rounded border border-pulse-green px-2 py-1 font-semibold">Sync now</button>}
  </div>;
}
