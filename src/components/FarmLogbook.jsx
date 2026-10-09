import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { db } from '../db/schema';

function Icon({ name, className = 'h-4 w-4' }) {
  const paths = {
    edit: <><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" /></>,
    trash: <><path d="M3 6h18" /><path d="M8 6V4h8v2" /><path d="m19 6-1 14H6L5 6" /><path d="M10 11v5M14 11v5" /></>,
    close: <><path d="m18 6-12 12M6 6l12 12" /></>,
    check: <><path d="m5 12 4 4L19 6" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>
  };

  return <svg aria-hidden="true" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

export default function FarmLogbook() {
  const { t } = useTranslation();
  const [logs, setLogs] = useState([]);
  const [activity, setActivity] = useState('');
  const [category, setCategory] = useState('planting');
  const [notes, setNotes] = useState('');
  const [savedMsg, setSavedMsg] = useState(false);
  const [editingLog, setEditingLog] = useState(null);

  const loadLogs = async () => {
    setLogs(await db.logs.orderBy('createdAt').reverse().toArray());
  };

  useEffect(() => { loadLogs(); }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!activity.trim()) return;
    const createdAt = Date.now();
    await db.logs.add({ activity, category, notes, createdAt, synced: false });
    await db.syncQueue.add({ payload: { activity, category, notes, createdAt }, action: 'CREATE_LOG', status: 'pending', createdAt });
    setActivity(''); setNotes(''); setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 3000);
    loadLogs();
  };

  const startEditing = (log) => {
    setEditingLog(log);
    setActivity(log.activity);
    setCategory(log.category);
    setNotes(log.notes || '');
  };

  const closeEditor = () => {
    setEditingLog(null);
    setActivity('');
    setCategory('planting');
    setNotes('');
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    const trimmedActivity = activity.trim();
    if (!trimmedActivity || !editingLog) return;

    const changes = { activity: trimmedActivity, category, notes: notes.trim() };
    await db.transaction('rw', db.logs, db.syncQueue, async () => {
      await db.logs.update(editingLog.id, { ...changes, synced: false });
      const queued = await db.syncQueue.toArray();
      const createAction = queued.find((item) => item.action === 'CREATE_LOG' && item.payload.createdAt === editingLog.createdAt);
      const updateAction = queued.find((item) => item.action === 'UPDATE_LOG' && item.payload.id === editingLog.id);

      if (!editingLog.synced && createAction) {
        await db.syncQueue.update(createAction.id, { payload: { ...createAction.payload, ...changes } });
      } else if (updateAction) {
        await db.syncQueue.update(updateAction.id, { payload: { ...updateAction.payload, ...changes } });
      } else {
        await db.syncQueue.add({
          payload: { id: editingLog.id, ...changes, createdAt: editingLog.createdAt },
          action: 'UPDATE_LOG',
          status: 'pending',
          createdAt: Date.now()
        });
      }
    });

    closeEditor();
    await loadLogs();
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 3000);
  };

  const handleDelete = async (log) => {
    if (!window.confirm(t('log_confirm_delete'))) return;

    await db.transaction('rw', db.logs, db.syncQueue, async () => {
      const queued = await db.syncQueue.toArray();
      const createAction = queued.find((item) => item.action === 'CREATE_LOG' && item.payload.createdAt === log.createdAt);
      const updateActions = queued.filter((item) => item.action === 'UPDATE_LOG' && item.payload.id === log.id);
      if (!log.synced && createAction) {
        await db.syncQueue.delete(createAction.id);
      } else if (log.synced || updateActions.length > 0) {
        await db.syncQueue.bulkDelete(updateActions.map((item) => item.id));
        await db.syncQueue.add({
          payload: { id: log.id },
          action: 'DELETE_LOG',
          status: 'pending',
          createdAt: Date.now()
        });
      }
      await db.logs.delete(log.id);
    });

    if (editingLog?.id === log.id) closeEditor();
    await loadLogs();
  };

  return (
    <div className="p-4 space-y-4 min-w-0">
      <h2 className="text-lg font-bold">{t('log_title')}</h2>

      <form onSubmit={handleSave} className="space-y-3">
        <input value={activity} onChange={(e) => setActivity(e.target.value)}
          placeholder={t('log_activity')}
          className="w-full border-2 border-pulse-soil rounded px-3" />
        <select value={category} onChange={(e) => setCategory(e.target.value)}
          className="w-full border-2 border-pulse-soil rounded px-3">
          <option value="planting">Planting</option>
          <option value="fertilizing">Fertilizing</option>
          <option value="pest_control">Pest Control</option>
          <option value="harvest">Harvest</option>
        </select>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
          placeholder={t('log_notes')} rows="2"
          className="w-full border-2 border-pulse-soil rounded px-3 py-2" />
        <button type="submit"
          className="w-full bg-pulse-green text-white font-bold rounded py-3 active:bg-pulse-greenlight">
          {t('log_save')}
        </button>
      </form>

      {savedMsg && (
        <p className="bg-green-100 border border-pulse-green text-pulse-green rounded p-3 font-semibold">
          {t('log_saved_offline')}
        </p>
      )}

      <div className="space-y-2 min-w-0">
        {logs.length === 0 && <p className="text-gray-500">{t('log_empty')}</p>}
        {logs.map((log) => (
          <div key={log.id} className="border border-gray-200 rounded-lg p-3 grid grid-cols-[minmax(0,1fr)_auto] gap-3 items-start">
            <div className="min-w-0">
              <p className="font-semibold break-words">{log.activity}</p>
              <p className="text-sm text-gray-600">{log.category}</p>
              {log.notes && <p className="text-sm whitespace-pre-wrap break-words">{log.notes}</p>}
              <p className="text-xs text-gray-400">{new Date(log.createdAt).toLocaleString()}</p>
            </div>
            <div className="flex items-center gap-1">
              <span title={log.synced ? t('sync_done') : t('sync_pending')} className={`p-1 ${log.synced ? 'text-pulse-green' : 'text-pulse-amber'}`}>
                <Icon name={log.synced ? 'check' : 'clock'} className="h-4 w-4" />
              </span>
              <button type="button" onClick={() => startEditing(log)} aria-label={t('log_edit')} title={t('log_edit')}
                className="min-h-9 min-w-9 grid place-items-center rounded text-gray-600 hover:bg-gray-100 hover:text-pulse-green">
                <Icon name="edit" />
              </button>
              <button type="button" onClick={() => handleDelete(log)} aria-label={t('log_delete')} title={t('log_delete')}
                className="min-h-9 min-w-9 grid place-items-center rounded text-gray-600 hover:bg-red-50 hover:text-red-700">
                <Icon name="trash" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {editingLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onMouseDown={(e) => { if (e.target === e.currentTarget) closeEditor(); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="log-editor-title" className="w-full max-w-md max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-lg bg-white p-4 shadow-xl">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 id="log-editor-title" className="text-lg font-bold">{t('log_edit')}</h3>
              <button type="button" onClick={closeEditor} aria-label={t('log_close')} title={t('log_close')} className="min-h-9 min-w-9 grid place-items-center rounded text-gray-600 hover:bg-gray-100">
                <Icon name="close" />
              </button>
            </div>
            <form onSubmit={handleUpdate} className="space-y-3">
              <input autoFocus required value={activity} onChange={(e) => setActivity(e.target.value)} placeholder={t('log_activity')}
                className="w-full min-w-0 border-2 border-pulse-soil rounded px-3" />
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full min-w-0 border-2 border-pulse-soil rounded px-3">
                <option value="planting">Planting</option>
                <option value="fertilizing">Fertilizing</option>
                <option value="pest_control">Pest Control</option>
                <option value="harvest">Harvest</option>
              </select>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={t('log_notes')} rows="4"
                className="w-full min-w-0 resize-y border-2 border-pulse-soil rounded px-3 py-2" />
              <div className="flex flex-wrap justify-end gap-2 pt-1">
                <button type="button" onClick={closeEditor} className="min-h-10 rounded border border-gray-300 px-4 font-semibold text-gray-700 hover:bg-gray-50">{t('log_cancel')}</button>
                <button type="submit" className="min-h-10 rounded bg-pulse-green px-4 font-bold text-white hover:bg-pulse-greenlight">{t('log_update')}</button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
