import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { readLogs, saveLog, deleteLog, isUnlocked, readCloudRecord } from '../security/vault.js';
import { requestSync, resolveCloudConflict, fetchCloudRecord } from '../sync/engine.js';
import { db } from '../db/schema.js';
import VaultControls from './VaultControls.jsx';
export default function FarmLogbook() {
  const { t } = useTranslation();
  const [logs, setLogs] = useState([]);
  const [blocked, setBlocked] = useState([]);
  const [cloudCopies, setCloudCopies] = useState({});
  const [unlocked, setUnlocked] = useState(isUnlocked());
  const [activity, setActivity] = useState('');
  const [category, setCategory] = useState('planting');
  const [notes, setNotes] = useState('');
  const [sharing, setSharing] = useState('local');
  const [editing, setEditing] = useState(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let active = true;
    async function update() {
      try {
        const rows = await readLogs(); const queued = await db.mutations.toArray();
        if (!active) return;
        setUnlocked(isUnlocked()); setLogs(rows); setBlocked(queued.filter(row => row.status === 'blocked'));
        if (!isUnlocked()) { setActivity(''); setNotes(''); setEditing(null); setCloudCopies({}); }
      } catch (error) { if (active) setMessage(error.message); }
    }
    void update(); window.addEventListener('agripulse-change', update);
    return () => { active = false; window.removeEventListener('agripulse-change', update); };
  }, []);
  function clear() { setEditing(null); setActivity(''); setNotes(''); setCategory('planting'); setSharing('local'); }
  async function act(task) {
    setBusy(true); setMessage('');
    try { await task(); window.dispatchEvent(new Event('agripulse-change')); void requestSync(); }
    catch (error) { setMessage(error.message); }
    finally { setBusy(false); }
  }
  return <div className="min-w-0 space-y-4 p-4">
    <h2 className="text-lg font-bold">{t('log_title')}</h2>
    <VaultControls />
    {unlocked && <>
      <form className="space-y-3" onSubmit={event => {
        event.preventDefault(); void act(async () => {
          if (!activity.trim()) return;
          await saveLog({ activity: activity.trim(), category, notes: notes.trim() }, sharing, editing?.id, editing?.version);
          clear(); setMessage(sharing === 'local' ? 'Saved encrypted on this phone.' : 'Saved encrypted on this phone and queued for cloud sync.');
        });
      }}>
        <label className="block text-sm">{t('log_activity')}<input required maxLength={500} value={activity} onChange={e => setActivity(e.target.value)} className="w-full rounded border-2 border-pulse-soil px-3" /></label>
        <label className="block text-sm">{t('log_category')}<select value={category} onChange={e => setCategory(e.target.value)} className="w-full rounded border-2 border-pulse-soil px-3">
          <option value="planting">Planting</option><option value="fertilizing">Fertilizing</option><option value="pest_control">Pest Control</option><option value="harvest">Harvest</option>
        </select></label>
        <div><label htmlFor="logbook-notes" className="block text-sm">{t('log_notes')}</label><textarea id="logbook-notes" maxLength={20000} value={notes} onChange={e => setNotes(e.target.value)} rows={3} className="w-full rounded border-2 border-pulse-soil px-3 py-2" /></div>
        <label className="flex items-center gap-2"><input type="checkbox" checked={sharing === 'local'} onChange={e => setSharing(e.target.checked ? 'local' : 'cloud')} />Local-Only: keep this record on my phone</label>
        <p className="text-xs text-gray-600">{sharing === 'local' ? 'A previously shared cloud copy will be deleted when sync succeeds.' : 'You agree to upload this encrypted record to your account. You can withdraw sharing later.'}</p>
        <div className="flex gap-2"><button disabled={busy} className="flex-1 rounded bg-pulse-green py-3 font-bold text-white disabled:opacity-50">{editing ? t('log_update') : t('log_save')}</button>
          {editing && <button type="button" onClick={clear} className="rounded border px-3">{t('log_cancel')}</button>}
        </div>
      </form>
      {logs.length === 0 && <p className="text-gray-500">{t('log_empty')}</p>}
      {logs.map(log => <article key={log.id} className="space-y-2 rounded-lg border border-gray-200 p-3">
        <p className="break-words font-semibold">{log.activity}</p><p className="text-sm text-gray-600">{log.category}</p>
        {log.notes && <p className="whitespace-pre-wrap break-words text-sm">{log.notes}</p>}
        <p className="text-xs text-gray-500">{new Date(log.createdAt).toLocaleString()} | {log.removingCloud ? 'Cloud removal pending' : log.sharing === 'local' ? 'Local-Only' : log.synced ? 'Synced' : 'Queued for sync'}</p>
        {log.updatedAt && <p className="text-xs text-gray-500">Server timestamp: {new Date(log.updatedAt).toLocaleString()}</p>}
        <div className="flex gap-2">
          <button disabled={busy} type="button" onClick={() => { setEditing(log); setActivity(log.activity); setCategory(log.category); setNotes(log.notes || ''); setSharing(log.sharing); }} className="rounded border px-3 py-2 text-sm">{t('log_edit')}</button>
          <button disabled={busy} type="button" onClick={() => { if (window.confirm(t('log_confirm_delete'))) void act(() => deleteLog(log.id)); }} className="rounded border px-3 py-2 text-sm text-red-700">{t('log_delete')}</button>
        </div>
      </article>)}
      {blocked.map(item => <div key={item.id} className="space-y-2 rounded border border-amber-300 p-3">
        <p className="text-sm">{logs.find(log => log.id === item.recordId)?.activity || 'Deleted entry'}: {item.error}</p>
        <p className="text-xs">Review the cloud copy and the phone entry above. You can edit the phone entry to combine changes before choosing which version to keep. Local-Only records retain their phone content.</p>
        <button disabled={busy} type="button" className="rounded border px-3 py-2 text-sm" onClick={() => void act(async () => {
          const copy = await readCloudRecord(await fetchCloudRecord(item.recordId));
          setCloudCopies(current => ({ ...current, [item.recordId]: copy }));
        })}>Review cloud copy</button>
        {cloudCopies[item.recordId] && <div className="space-y-2 rounded bg-amber-50 p-2">
          <p className="text-sm font-semibold">Cloud copy</p>
          {cloudCopies[item.recordId].deleted ? <p className="text-sm">No live cloud copy.</p> : <>
            <p className="break-words text-sm">{cloudCopies[item.recordId].activity}</p>
            <p className="whitespace-pre-wrap break-words text-sm">{cloudCopies[item.recordId].notes}</p>
          </>}
          <button disabled={busy} type="button" className="rounded border px-3 py-2 text-sm" onClick={() => {
            if (window.confirm('Use the reviewed cloud version and discard pending edits? Local-Only records keep their phone content and retry cloud removal.')) void act(() => resolveCloudConflict(item.recordId, 'cloud', cloudCopies[item.recordId].version));
          }}>Use cloud version / retry removal</button>
          {logs.find(log => log.id === item.recordId)?.sharing === 'cloud' && <button disabled={busy} type="button" className="rounded border px-3 py-2 text-sm" onClick={() => {
            if (window.confirm('Upload the current phone version to replace the reviewed cloud copy?')) void act(() => resolveCloudConflict(item.recordId, 'local', cloudCopies[item.recordId].version));
          }}>Keep current phone version</button>}
        </div>}
      </div>)}
    </>}
    {message && <p role="status" className="rounded bg-green-50 p-3 text-sm">{message}</p>}
  </div>;
}
