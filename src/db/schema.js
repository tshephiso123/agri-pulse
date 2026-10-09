import Dexie from 'dexie';

export const db = new Dexie('AgriPulseDB');

db.version(1).stores({ logs: '++id, activity, meta, category, createdAt, synced', syncQueue: '++id, payload, action, status, createdAt' });
db.version(2).stores({ logs: '++id, activity, meta, category, createdAt, synced', syncQueue: '++id, payload, action, status, createdAt', encryptedLogs: 'id, vaultId, createdAt', mutations: '++id, recordId, vaultId', settings: 'id' });

export async function exclusive(task, name = 'agripulse-storage') {
  if (!globalThis.navigator?.locks) throw new Error('This browser needs Web Locks support for safe storage and sync. Use a current browser over HTTPS or localhost.');
  return navigator.locks.request(name, task);
}
