import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import { db, exclusive } from '../db/schema.js';
import { vaultInfo, openVault, adoptVault, isUnlocked, lockVault, exportLocal, restoreLocal } from '../security/vault.js';
import { api, requestSync } from '../sync/engine.js';
import { Button } from './ui/button';
import Wizard from './Wizard';
import Feedback from './Feedback';
import { decrypt, unlockVault } from '../security/crypto.js';

function download(value, filename) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' }));
  const link = document.createElement('a'); link.href = url; link.download = filename; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function VaultControls({ onBack, initialView = 'passphrase', onOpened }) {
  const { t } = useTranslation();
  const [vault, setVault] = useState(null);
  const [unlocked, setUnlocked] = useState(isUnlocked());
  const [account, setAccount] = useState(null);
  const [passphrase, setPassphrase] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const [view, setView] = useState(initialView);
  const [show, setShow] = useState(false);
  const [restoreFile, setRestoreFile] = useState(null);

  useEffect(() => {
    const update = async () => { try { setVault(await vaultInfo()); setUnlocked(isUnlocked()); setAccount((await db.settings.get('account'))?.value || null); } catch { setFailed(true); setMessage('We could not access logbook storage. Check your browser storage settings and reload this page.'); } };
    void update(); window.addEventListener('agripulse-change', update);
    return () => window.removeEventListener('agripulse-change', update);
  }, []);

  async function act(task) {
    setBusy(true); setMessage(''); setFailed(false);
    try { await task(); setPassphrase(''); setConfirmation(''); setPassword(''); window.dispatchEvent(new Event('agripulse-change')); }
    catch (error) { setFailed(true); setMessage({ detail: error.message, text: 'Check your details and try again.' }); }
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

  async function signOut() {
    await exclusive(async () => { await api('/api/v1/auth/logout', { method: 'POST', body: '{}' }); await exclusive(() => db.settings.delete('account')); }, 'agripulse-sync'); setView('menu'); setMessage('Signed out. Local records are retained.');
  }
  async function readableExport() {
    const snapshot = await api('/api/v1/me/export');
    if (snapshot.vault.id !== vault.id) throw new Error('Account does not match this vault.');
    const exportKey = await unlockVault(passphrase, vault);
    const records = await Promise.all(snapshot.records.filter(row => !row.deleted).map(async row => ({ id: row.id, updatedAt: row.updatedAt, ...await decrypt(exportKey, vault.id, row.id, row.envelope) })));
    download({ email: snapshot.email, records }, 'agripulse-readable-cloud-export.json'); setMessage('Readable export downloaded. This file contains unencrypted personal information.');
  }
  async function deleteAccount() {
    if (!window.confirm(t('Delete your cloud account and its records? Local records stay on this phone. This cannot be undone.'))) return;
    await exclusive(async () => {
      const identity = await api('/api/v1/me'); if (identity.vault.id !== vault.id) throw new Error('Account does not match this vault.');
      await api('/api/v1/me', { method: 'DELETE', body: JSON.stringify({ password }) });
      await exclusive(() => db.transaction('rw', db.settings, db.mutations, db.encryptedLogs, async () => {
        await db.settings.bulkDelete(['account', 'cursor']); await db.mutations.clear();
        await db.encryptedLogs.filter(row => row.hidden).delete();
        await db.encryptedLogs.toCollection().modify({ sharing: 'local', version: 0, synced: false, removingCloud: false });
      }));
    }, 'agripulse-sync'); setView('menu'); setMessage('Cloud account deleted. Local records are retained.');
  }
  const feedback = <>{busy && <p role="status">{t('Please wait. We are processing your request…')}</p>}{message && <Feedback error={failed} message={message} />}</>;
  const passInput = <label className="field-label">{t('Encryption passphrase')}<input type={show ? 'text' : 'password'} autoComplete="off" value={passphrase} onChange={event => setPassphrase(event.target.value)} className="field-control" /></label>;
  function back() { setMessage(''); if (view === initialView) onBack?.(); else setView(initialView); }
  if (view === 'menu') return <Wizard title={t('ui_record_settings')} onBack={onBack} onNext={() => { if (unlocked) { lockVault(); onBack?.(); } else setView('passphrase'); }} nextLabel={t(unlocked ? 'Lock logbook' : 'ui_open_records')}><p className="secondary-copy">{t('ui_protection_short')}</p><div className="choice-list"><Button variant="outline" onClick={() => setView('backup')}>{t('ui_backup_restore')}</Button><Button variant="outline" onClick={() => setView('account')}>{t(account ? 'Cloud account' : 'Optional cloud account')}</Button>{account && <Button variant="outline" onClick={() => setView('account-tools')}>{t('ui_account_tools')}</Button>}</div>{feedback}</Wizard>;
  if (view === 'backup') return <Wizard title={t('ui_backup_restore')} onBack={back} onNext={vault ? () => void act(async () => download(await exportLocal(), 'agripulse-encrypted-backup.json')) : () => void act(async () => { if (!restoreFile) throw new Error(t('ui_choose_backup')); if (restoreFile.size > 10000000) throw new Error('Backup is too large.'); await restoreLocal(JSON.parse(await restoreFile.text()), passphrase); setRestoreFile(null); setMessage('ui_backup_restored'); })} nextLabel={t(vault ? 'Back up encrypted records' : 'ui_restore_backup')} busy={busy}><p>{t('ui_backup_description')}</p>{!vault && <>{passInput}<label className="field-label">{t('Restore an encrypted backup (enter its passphrase above). Records restore as Local-Only; signing in later removes any existing cloud copies.')}<input type="file" accept="application/json,.json" disabled={busy} onChange={event => setRestoreFile(event.target.files?.[0] || null)} className="field-control" /></label></>}{feedback}</Wizard>;
  if (view === 'account-tools' || view === 'export' || view === 'delete-account') return <Wizard title={t(view === 'export' ? 'Export readable cloud data' : view === 'delete-account' ? 'Delete cloud account' : 'ui_account_tools')} onBack={() => setView(view === 'account-tools' ? initialView : 'account-tools')} onNext={view === 'export' ? () => void act(readableExport) : view === 'delete-account' ? () => void act(deleteAccount) : () => void act(signOut)} nextLabel={t(view === 'export' ? 'Export readable cloud data' : view === 'delete-account' ? 'Delete cloud account' : 'Sign out')} busy={busy}>{view === 'account-tools' ? <><p>{account?.email}</p><div className="choice-list"><Button variant="outline" onClick={() => setView('export')}>{t('Export readable cloud data')}</Button><Button variant="outline" onClick={() => setView('delete-account')}>{t('Delete cloud account')}</Button></div></> : view === 'export' ? <>{passInput}<p>{t('ui_readable_warning')}</p></> : <><p>{t('Delete your cloud account and its records? Local records stay on this phone. This cannot be undone.')}</p><label className="field-label">{t('Account password (at least 12 characters)')}<input type="password" value={password} onChange={event => setPassword(event.target.value)} className="field-control" /></label></>}{feedback}</Wizard>;
  if (view === 'account' || view === 'register') return <Wizard title={t(view === 'register' ? 'ui_register_account' : 'Optional cloud account')} onBack={() => setView(view === 'register' ? 'account' : initialView)} onNext={() => void act(() => authenticate(view === 'register'))} nextLabel={t(view === 'register' ? 'Register this vault' : 'Sign in')} busy={busy}><p className="secondary-copy">{t('ui_account_description')}</p>{passInput}<label className="field-label">{t('Email')}<input required type="email" autoComplete="username" value={email} onChange={event => setEmail(event.target.value)} className="field-control" /></label><label className="field-label">{t('Account password (at least 12 characters)')}<input required type="password" minLength={12} maxLength={128} autoComplete="current-password" value={password} onChange={event => setPassword(event.target.value)} className="field-control" /></label>{!account && view !== 'register' && <Button variant="outline" disabled={!vault} onClick={() => setView('register')}>{t('ui_register_account')}</Button>}{feedback}</Wizard>;
  if (unlocked && view === 'passphrase') return <Wizard title={t('Logbook unlocked')} onBack={onBack} onNext={onOpened || onBack} nextLabel={t('ui_view_records')}><p>{t('ui_protection_short')}</p><Button variant="outline" onClick={() => setView('menu')}>{t('ui_record_settings')}</Button></Wizard>;
  return <Wizard title={t(unlocked ? 'Logbook unlocked' : vault ? 'Unlock your logbook' : 'Protect your logbook')} step={1} total={1} onBack={onBack || (() => setView('menu'))} onNext={unlocked ? () => { lockVault(); setPassphrase(''); } : () => void act(async () => { if (!vault && passphrase !== confirmation) throw new Error('Passphrases do not match.'); await openVault(passphrase); onOpened?.(); })} nextLabel={t(unlocked ? 'Lock logbook' : vault ? 'Unlock offline' : 'Create local vault')} busy={busy}><p className="secondary-copy">{t('ui_protection_short')}</p><p className="secondary-copy">{t('Use at least 12 characters, such as several words you can remember.')}</p>{passInput}{!vault && <label className="field-label">{t('Confirm new passphrase')}<input type={show ? 'text' : 'password'} autoComplete="off" value={confirmation} onChange={event => setConfirmation(event.target.value)} className="field-control" /></label>}<label className="flex items-center gap-3"><input type="checkbox" checked={show} onChange={event => setShow(event.target.checked)} />{t('ui_show_passphrase')}</label><div className="choice-list"><Button variant="ghost" onClick={() => setView('account')}>{t('Optional cloud account')}</Button>{!vault && <Button variant="ghost" onClick={() => setView('backup')}>{t('ui_restore_records')}</Button>}</div>{feedback}</Wizard>;
}
