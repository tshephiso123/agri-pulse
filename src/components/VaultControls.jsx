import { useEffect, useState } from 'react';
import { db, exclusive } from '../db/schema.js';
import { vaultInfo, openVault, adoptVault, isUnlocked, lockVault, exportLocal, restoreLocal } from '../security/vault.js';
import { api, requestSync } from '../sync/engine.js';
import { decrypt, unlockVault } from '../security/crypto.js';

function download(value, filename) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' }));
  const link = document.createElement('a'); link.href = url; link.download = filename; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function VaultControls() {
  const [vault, setVault] = useState(null);
  const [unlocked, setUnlocked] = useState(isUnlocked());
  const [account, setAccount] = useState(null);
  const [passphrase, setPassphrase] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const update = async () => { setVault(await vaultInfo()); setUnlocked(isUnlocked()); setAccount((await db.settings.get('account'))?.value || null); };
    void update(); window.addEventListener('agripulse-change', update);
    return () => window.removeEventListener('agripulse-change', update);
  }, []);

  async function act(task) {
    setBusy(true); setMessage('');
    try { await task(); setPassphrase(''); setConfirmation(''); setPassword(''); window.dispatchEvent(new Event('agripulse-change')); }
    catch (error) { setMessage(error.message); }
    finally { setBusy(false); }
  }

  async function authenticate(register) {
    if (password === passphrase) throw new Error('Use different values for your account password and encryption passphrase.');
    if (register && !vault) throw new Error('Create your local vault before registering.');
    if (register) await unlockVault(passphrase, vault);
    await exclusive(async () => {
      const result = await api('/api/v1/auth/' + (register ? 'register' : 'login'), { method: 'POST', body: JSON.stringify({ email, password, ...(register ? { vault } : {}) }) });
      try { await adoptVault(result.vault, passphrase); }
      catch (error) { await api('/api/v1/auth/logout', { method: 'POST', body: '{}' }); throw error; }
      await exclusive(() => db.settings.put({ id: 'account', value: { ...result.user, vaultId: result.vault.id } }));
    }, 'agripulse-sync');
    await requestSync(); setMessage('Signed in. Only records you choose to share will upload.');
  }

  const input = 'w-full rounded border border-gray-300 px-3 py-2';
  const button = 'rounded border border-pulse-green px-3 py-2 text-sm font-semibold disabled:opacity-50';
  return <section className="space-y-3 rounded-lg border border-gray-200 p-3">
    <p className="font-semibold">{unlocked ? 'Logbook unlocked' : vault ? 'Unlock your logbook' : 'Protect your logbook'}</p>
    <p className="text-sm text-gray-600">Your encryption passphrase stays on this phone. Keep it safe: a forgotten passphrase cannot be recovered. Use a separate password for your account.</p>
    <form className="space-y-2" onSubmit={event => { event.preventDefault(); void act(async () => {
      if (!vault && passphrase !== confirmation) throw new Error('Passphrases do not match.');
      await openVault(passphrase);
    }); }}>
      <label className="block text-sm">Encryption passphrase<input type="password" autoComplete="off" value={passphrase} onChange={e => setPassphrase(e.target.value)} className={input} /></label>
      {!vault && <label className="block text-sm">Confirm new passphrase<input type="password" autoComplete="off" value={confirmation} onChange={e => setConfirmation(e.target.value)} className={input} /></label>}
      <div className="flex flex-wrap gap-2">
        {!unlocked && <button disabled={busy} className={button}>{vault ? 'Unlock offline' : 'Create local vault'}</button>}
        {unlocked && <button type="button" disabled={busy} onClick={() => { lockVault(); setPassphrase(''); }} className={button}>Lock logbook</button>}
        {vault && <button type="button" disabled={busy} onClick={() => void act(async () => download(await exportLocal(), 'agripulse-encrypted-backup.json'))} className={button}>Back up encrypted records</button>}
      </div>
    </form>
    {!vault && <label className="block text-sm">Restore an encrypted backup (enter its passphrase above). Records restore as Local-Only; signing in later removes any existing cloud copies.<input type="file" accept="application/json,.json" disabled={busy} onChange={event => {
      const file = event.target.files?.[0]; if (file) void act(async () => { if (file.size > 10000000) throw new Error('Backup is too large.'); await restoreLocal(JSON.parse(await file.text()), passphrase); });
      event.target.value = '';
    }} className="block w-full text-sm" /></label>}
    <details>
      <summary className="cursor-pointer font-semibold">{account ? 'Cloud account: ' + account.email : 'Optional cloud account'}</summary>
      <form className="mt-3 space-y-2" onSubmit={event => { event.preventDefault(); void act(() => authenticate(false)); }}>
        <p className="text-sm">Enter your encryption passphrase above to connect or restore your vault. Local-Only records stay on the phone. HTTPS protects your account details; the server stores encrypted field records.</p>
        <label className="block text-sm">Email<input required type="email" autoComplete="username" value={email} onChange={e => setEmail(e.target.value)} className={input} /></label>
        <label className="block text-sm">Account password (at least 12 characters)<input required type="password" minLength={12} maxLength={128} autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} className={input} /></label>
        <div className="flex flex-wrap gap-2">
          <button disabled={busy} className={button}>Sign in</button>
          {!account && <button type="button" disabled={busy || !vault} onClick={() => void act(() => authenticate(true))} className={button}>Register this vault</button>}
          {account && <>
            <button type="button" disabled={busy} className={button} onClick={() => void act(async () => {
              await exclusive(async () => { await api('/api/v1/auth/logout', { method: 'POST', body: '{}' }); await exclusive(() => db.settings.delete('account')); }, 'agripulse-sync'); setMessage('Signed out. Local records are retained.');
            })}>Sign out</button>
            <button type="button" disabled={busy} className={button} onClick={() => void act(async () => {
              const snapshot = await api('/api/v1/me/export');
              if (snapshot.vault.id !== vault.id) throw new Error('Account does not match this vault.');
              const exportKey = await unlockVault(passphrase, vault);
              const records = await Promise.all(snapshot.records.filter(row => !row.deleted).map(async row => ({ id: row.id, updatedAt: row.updatedAt, ...await decrypt(exportKey, vault.id, row.id, row.envelope) })));
              download({ email: snapshot.email, records }, 'agripulse-readable-cloud-export.json'); setMessage('Readable export downloaded. This file contains unencrypted personal information.');
            })}>Export readable cloud data</button>
            <button type="button" disabled={busy} className={button} onClick={() => {
              if (!window.confirm('Delete your cloud account and its records? Local records stay on this phone. This cannot be undone.')) return;
              void act(async () => {
                await exclusive(async () => {
                  const identity = await api('/api/v1/me'); if (identity.vault.id !== vault.id) throw new Error('Account does not match this vault.');
                  await api('/api/v1/me', { method: 'DELETE', body: JSON.stringify({ password }) });
                  await exclusive(() => db.transaction('rw', db.settings, db.mutations, db.encryptedLogs, async () => {
                    await db.settings.bulkDelete(['account', 'cursor']); await db.mutations.clear();
                    await db.encryptedLogs.filter(row => row.hidden).delete();
                    await db.encryptedLogs.toCollection().modify({ sharing: 'local', version: 0, synced: false, removingCloud: false });
                  }));
                }, 'agripulse-sync'); setMessage('Cloud account deleted. Local records are retained.');
              });
            }}>Delete cloud account</button>
          </>}
        </div>
      </form>
    </details>
    {message && <p role="status" className="text-sm text-pulse-soil">{message}</p>}
  </section>;
}
