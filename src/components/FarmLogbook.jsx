import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { db } from '../db/schema';

export default function FarmLogbook() {
  const { t } = useTranslation();
  const [logs, setLogs] = useState([]);
  const [activity, setActivity] = useState('');
  const [category, setCategory] = useState('planting');
  const [notes, setNotes] = useState('');
  const [savedMsg, setSavedMsg] = useState(false);

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

  return (
    <div className="p-4 space-y-4">
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

      <div className="space-y-2">
        {logs.length === 0 && <p className="text-gray-500">{t('log_empty')}</p>}
        {logs.map((log) => (
          <div key={log.id} className="border rounded-lg p-3 flex justify-between items-start">
            <div>
              <p className="font-semibold">{log.activity}</p>
              <p className="text-sm text-gray-600">{log.category}</p>
              {log.notes && <p className="text-sm">{log.notes}</p>}
              <p className="text-xs text-gray-400">{new Date(log.createdAt).toLocaleString()}</p>
            </div>
            <span className={`text-xs font-bold px-2 py-1 rounded ${log.synced ? 'bg-green-100 text-pulse-green' : 'bg-amber-100 text-pulse-amber'}`}>
              {log.synced ? '✓' : '⏳'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
