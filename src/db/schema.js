import Dexie from 'dexie';

export const db = new Dexie('AgriPulseDB');

db.version(1).stores({
  logs: '++id, activity, meta, category, createdAt, synced',
  syncQueue: '++id, payload, action, status, createdAt'
});
