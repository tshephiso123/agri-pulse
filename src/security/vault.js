import { db, exclusive } from '../db/schema.js';
import { createVault, unlockVault, encrypt, decrypt } from './crypto.js';

let key;

export const changed = () => globalThis.dispatchEvent?.(new Event('agripulse-change'));
export const isUnlocked = () => Boolean(key);
export const lockVault = () => { key = undefined; changed(); };

export async function vaultInfo() { return (await db.settings.get('vault'))?.value; }

export async function openVault(passphrase) {
  await exclusive(async () => {
    let vault = await vaultInfo();
    let unlocked;
    if (!vault) { const created = await createVault(passphrase); vault = created.vault; unlocked = created.key; }
    else unlocked = await unlockVault(passphrase, vault);
    const old = await db.logs.toArray();
    const migrated = await Promise.all(old.map(async row => {
      const id = crypto.randomUUID();
      return { id, vaultId: vault.id, createdAt: row.createdAt, sharing: 'local', version: 0, envelope: await encrypt(unlocked, vault.id, id, { activity: row.activity, category: row.category, notes: row.notes || '', createdAt: row.createdAt }) };
    }));
    await db.transaction('rw', db.settings, db.logs, db.syncQueue, db.encryptedLogs, async () => {
      await db.settings.put({ id: 'vault', value: vault });
      await db.encryptedLogs.bulkPut(migrated);
      await db.logs.clear(); await db.syncQueue.clear();
    });
    key = unlocked;
  });
  changed();
}

export async function adoptVault(vault, passphrase) {
  const unlocked = await unlockVault(passphrase, vault);
  await exclusive(async () => {
    const existing = await vaultInfo();
    if (existing && existing.id !== vault.id) throw new Error('This phone contains another vault. Export it before using a different account.');
    if (!existing && await db.logs.count()) throw new Error('Unlock and export your existing local entries before restoring another vault.');
    await db.settings.put({ id: 'vault', value: vault }); key = unlocked;
  }); changed();
}

export async function readLogs() {
  if (!key) return [];
  const activeKey = key;
  const vault = await vaultInfo();
  const rows = await db.encryptedLogs.where('vaultId').equals(vault.id).toArray();
  const result = await Promise.all(rows.filter(row => !row.hidden).map(async row => ({ ...row, ...await decrypt(activeKey, vault.id, row.id, row.envelope) })));
  return key === activeKey ? result.sort((a, b) => b.createdAt - a.createdAt) : [];
}

function mutation(row, operation) {
  return { recordId: row.id, vaultId: row.vaultId, endpoint: '/api/v1/sync', method: 'POST', attempts: 0, nextAttempt: 0, status: 'pending', sent: false, payload: { mutationId: crypto.randomUUID(), recordId: row.id, vaultId: row.vaultId, baseVersion: row.version || 0, operation, sharing: 'cloud', ...(operation === 'upsert' ? { envelope: row.envelope } : {}) } };
}

export async function saveLog(data, sharing, id, expectedVersion) {
  if (!key) throw new Error('Unlock your logbook first.');
  await exclusive(async () => {
    const vault = await vaultInfo();
    const old = id ? await db.encryptedLogs.get(id) : null;
    if (id && (!old || old.hidden || old.vaultId !== vault.id)) throw new Error('Entry no longer available.');
    if (expectedVersion !== undefined && old.version !== expectedVersion) throw new Error('This record changed while you were editing. Reopen it and review the latest content before saving.');
    const row = { ...old, id: id || crypto.randomUUID(), vaultId: vault.id, createdAt: old?.createdAt || Date.now(), sharing, version: old?.version || 0, synced: false };
    row.envelope = await encrypt(key, vault.id, row.id, { ...data, createdAt: row.createdAt });
    await db.transaction('rw', db.encryptedLogs, db.mutations, async () => {
      const pending = await db.mutations.where('recordId').equals(row.id).toArray();
      if (sharing === 'local') {
        await db.mutations.bulkDelete(pending.filter(item => !item.sent).map(item => item.id));
        const uncertain = pending.filter(item => item.sent);
        if (row.version > 0 || uncertain.length) {
          await db.mutations.add(mutation(row, 'delete')); row.removingCloud = true;
        } else row.removingCloud = false;
      } else {
        row.removingCloud = false;
        await db.mutations.add(mutation(row, 'upsert'));
      }
      await db.encryptedLogs.put(row);
    });
  }); changed();
}
export async function deleteLog(id) {
  await exclusive(async () => {
    await db.transaction('rw', db.encryptedLogs, db.mutations, async () => {
      const row = await db.encryptedLogs.get(id);
      const pending = await db.mutations.where('recordId').equals(id).toArray();
      await db.mutations.bulkDelete(pending.filter(item => !item.sent).map(item => item.id));
      if (row.version || pending.some(item => item.sent)) { await db.encryptedLogs.put({ ...row, hidden: true }); await db.mutations.add(mutation(row, 'delete')); }
      else await db.encryptedLogs.delete(id);
    });
  }); changed();
}

export async function exportLocal() {
  const vault = await vaultInfo();
  return { format: 'AgriPulse-encrypted-backup-v1', vault, records: await db.encryptedLogs.where('vaultId').equals(vault.id).toArray() };
}

export async function restoreLocal(backup, passphrase) {
  if (backup.format !== 'AgriPulse-encrypted-backup-v1' || !Array.isArray(backup.records)) throw new Error('Invalid backup.');
  const restoredKey = await unlockVault(passphrase, backup.vault);
  for (const row of backup.records) await decrypt(restoredKey, backup.vault.id, row.id, row.envelope);
  await exclusive(async () => {
    if (await vaultInfo() || await db.logs.count()) throw new Error('Restore requires a phone without an existing vault.');
    await db.transaction('rw', db.settings, db.encryptedLogs, async () => {
      await db.settings.put({ id: 'vault', value: backup.vault });
      await db.encryptedLogs.bulkPut(backup.records.map(row => ({ id: row.id, vaultId: backup.vault.id, createdAt: row.createdAt, envelope: row.envelope, sharing: 'local', version: 0, synced: false })));
    }); key = restoredKey;
  }); changed();
}
export async function readCloudRecord(record) {
  if (!key) throw new Error('Unlock your logbook first.');
  if (!record || record.deleted) return { deleted: true, version: record?.version || 0 };
  const activeKey = key; const vault = await vaultInfo();
  const data = await decrypt(activeKey, vault.id, record.id, record.envelope);
  if (key !== activeKey) throw new Error('Unlock your logbook first.');
  return { ...data, id: record.id, version: record.version, updatedAt: record.updatedAt };
}
