import { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { readLogs, saveLog, deleteLog, isUnlocked, readCloudRecord } from '../security/vault.js';
import { requestSync, resolveCloudConflict, fetchCloudRecord } from '../sync/engine.js';
import { db } from '../db/schema.js';
import VaultControls from './VaultControls.jsx';
import { Button } from './ui/button';
import { Skeleton } from './ui/skeleton';
import { Empty, EmptyTitle, EmptyDescription } from './ui/empty';
import { ConfirmDialog } from './ui/dialog';
import { LockKeyhole } from 'lucide-react';
import Feedback from './Feedback';
import Wizard from './Wizard';
export default function FarmLogbook({ onRunningChange }) {
  const { t, i18n } = useTranslation();
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
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const deleteTrigger = useRef(null);
  const [view, setView] = useState('home');
  const [entryStep, setEntryStep] = useState(0);
  const [page, setPage] = useState(0);
  const [height, setHeight] = useState(window.innerHeight);
  const [selected, setSelected] = useState(null);
  const [conflictIndex, setConflictIndex] = useState(0);
  const [conflictStep, setConflictStep] = useState(0);
  const [resolution, setResolution] = useState('cloud');
  const entrySteps = ['ui_entry_activity', 'ui_entry_notes', 'ui_entry_review'];
  const pageSize = height < 700 ? 3 : 5;
  const totalPages = Math.max(1, Math.ceil(logs.length / pageSize));
  const currentPage = Math.min(page, totalPages - 1);
  useEffect(() => { onRunningChange?.(view !== 'home'); }, [view, onRunningChange]);
  useEffect(() => { const resize = () => setHeight(window.innerHeight); window.addEventListener('resize', resize); return () => window.removeEventListener('resize', resize); }, []);
  function startEntry(log) { clear(); if (log) { setEditing(log); setActivity(log.activity); setCategory(log.category); setNotes(log.notes || ''); setSharing(log.sharing); } setMessage(''); setEntryStep(0); setView('entry'); }
  async function saveEntry() { await act(async () => { if (!activity.trim()) throw new Error('Enter an activity, such as Planted maize.'); await saveLog({ activity: activity.trim(), category, notes: notes.trim() }, sharing, editing?.id, editing?.version); clear(); setMessage(sharing === 'local' ? 'Saved encrypted on this phone.' : 'Saved encrypted on this phone and queued for cloud sync.'); setView('saved'); }); }

  useEffect(() => {
    let active = true;
    async function update() {
      try {
        const rows = await readLogs(); const queued = await db.mutations.toArray();
        if (!active) return;
        setUnlocked(isUnlocked()); setLogs(rows); setBlocked(queued.filter(row => row.status === 'blocked'));
        if (!isUnlocked()) { setActivity(''); setNotes(''); setEditing(null); setCloudCopies({}); }
      } catch { if (active) { setFailed(true); setMessage('We could not open your records. Try again. If this continues, check that your browser allows storage for this app.'); } }
      finally { if (active) setLoading(false); }
    }
    void update(); window.addEventListener('agripulse-change', update);
    return () => { active = false; window.removeEventListener('agripulse-change', update); };
  }, []);
  function clear() { setEditing(null); setActivity(''); setNotes(''); setCategory('planting'); setSharing('local'); }
  async function act(task) {
    setBusy(true); setMessage(''); setFailed(false);
    try { await task(); window.dispatchEvent(new Event('agripulse-change')); void requestSync(); }
    catch (error) { setFailed(true); setMessage({ detail: error.message, text: 'Your changes were not completed. Please try again.' }); }
    finally { setBusy(false); }
  }

  const feedback = message && <Feedback error={failed} message={message}>{failed && <Button variant="outline" onClick={() => { setLoading(true); setMessage(''); window.dispatchEvent(new Event('agripulse-change')); }}>{t('Reload records')}</Button>}</Feedback>;
  const status = log => log.removingCloud ? t('Cloud removal pending') : log.sharing === 'local' ? t('ui_phone_only') : log.synced ? t('Synced') : t('Queued for sync');
  const summaries = rows => rows.map(log => <article key={log.id} className="record-summary"><Button variant="outline" onClick={() => { setSelected(log.id); setView('detail'); }}>{log.activity}</Button><p className="secondary-copy">{status(log)}</p></article>);
  let screen;
  if (view === 'protection' || view === 'settings') screen = <VaultControls initialView={view === 'settings' ? 'menu' : 'passphrase'} onBack={() => setView('home')} onOpened={() => setView('home')} />;
  else if (view === 'entry') screen = <Wizard title={t(entrySteps[entryStep])} step={entryStep + 1} total={entrySteps.length} onBack={() => entryStep ? setEntryStep(entryStep - 1) : setView('home')} onNext={() => { if (!activity.trim()) { setFailed(true); setMessage('Enter an activity, such as Planted maize.'); return; } setMessage(''); if (entryStep < 2) setEntryStep(entryStep + 1); else void saveEntry(); }} nextLabel={entryStep === 2 ? t(editing ? 'log_update' : 'log_save') : t('ui_next')} busy={busy}>
    {entryStep === 0 && <><label className="field-label">{t('log_activity')}<input required maxLength={500} value={activity} onChange={e => setActivity(e.target.value)} className="field-control" /></label><label className="field-label">{t('log_category')}<select value={category} onChange={e => setCategory(e.target.value)} className="field-control">{['planting','fertilizing','pest_control','harvest'].map((value, index) => <option key={value} value={value}>{t(['Planting','Fertilizing','Pest Control','Harvest'][index])}</option>)}</select></label></>}
    {entryStep === 1 && <div><label htmlFor="logbook-notes" className="field-label">{t('log_notes')}</label><textarea id="logbook-notes" maxLength={20000} value={notes} onChange={e => setNotes(e.target.value)} rows={3} className="field-control" /></div>}
    {entryStep === 2 && <><p className="record-text">{activity}</p><p className="record-text">{notes}</p><label className="flex items-center gap-3"><input type="checkbox" checked={sharing === 'local'} onChange={e => setSharing(e.target.checked ? 'local' : 'cloud')} />{t('ui_phone_only')}</label><p className="secondary-copy">{t(sharing === 'local' ? 'A previously shared cloud copy will be deleted when sync succeeds.' : 'You agree to upload this encrypted record to your account. You can withdraw sharing later.')}</p></>}{feedback}
  </Wizard>;
  else if (view === 'saved') screen = <Wizard title={t('ui_entry_saved')} result onBack={() => setView('home')} onNext={() => setView('home')} nextLabel={t('ui_view_records')}>{feedback}</Wizard>;
  else if (view === 'detail') { const log = logs.find(row => row.id === selected); screen = <Wizard title={t('ui_entry_detail')} onBack={() => setView('home')} onNext={log ? () => startEntry(log) : () => setView('home')} nextLabel={t(log ? 'log_edit' : 'ui_done')}>
    {log && <article><p className="record-text font-semibold">{log.activity}</p><p className="secondary-copy">{t({planting:'Planting',fertilizing:'Fertilizing',pest_control:'Pest Control',harvest:'Harvest'}[log.category])}</p><p className="record-text">{log.notes}</p><p className="secondary-copy">{new Date(log.createdAt).toLocaleString(i18n.resolvedLanguage)} · {status(log)}</p>{log.updatedAt && <p>{t('Server timestamp:')} {new Date(log.updatedAt).toLocaleString(i18n.resolvedLanguage)}</p>}<Button variant="outline" disabled={busy} onClick={event => { deleteTrigger.current = event.currentTarget; setDeleting(log); }}>{t('log_delete')}</Button></article>}{feedback}
  </Wizard>; }
  else if (view === 'conflicts') {
    const item = blocked[Math.min(conflictIndex, blocked.length - 1)];
    const phone = logs.find(log => log.id === item?.recordId);
    const copy = cloudCopies[item?.recordId];
    screen = <Wizard title={t(conflictStep ? 'Cloud copy' : 'Review cloud copy')} step={conflictStep + 1} total={2} onBack={() => conflictStep ? setConflictStep(0) : setView('home')} onNext={() => {
      if (!item) { setView('home'); return; }
      if (!conflictStep) void act(async () => { const reviewed = await readCloudRecord(await fetchCloudRecord(item.recordId)); setCloudCopies(current => ({...current, [item.recordId]: reviewed})); setResolution('cloud'); setConflictStep(1); });
      else if (window.confirm(t(resolution === 'cloud' ? 'Use the reviewed cloud version and discard pending edits? Local-Only records keep their phone content and retry cloud removal.' : 'Upload the current phone version to replace the reviewed cloud copy?'))) void act(async () => { await resolveCloudConflict(item.recordId, resolution, copy.version); setConflictStep(0); setView('home'); });
    }} nextLabel={t(conflictStep ? 'ui_apply_choice' : 'Review cloud copy')} busy={busy}>
      {!item ? <p>{t('ui_no_pending')}</p> : !conflictStep ? <><p className="record-text">{phone?.activity || t('Delete entry')}</p><p className="record-text">{phone?.notes}</p><p className="ui-alert">{t(item.error)}</p><p>{t('Review the cloud copy and the phone entry above. You can edit the phone entry to combine changes before choosing which version to keep. Local-Only records retain their phone content.')}</p><p>{t('ui_page',{page: Math.min(conflictIndex + 1, blocked.length),total:blocked.length})}</p><div className="choice-list"><Button variant="outline" disabled={!conflictIndex} onClick={() => setConflictIndex(conflictIndex - 1)}>{t('ui_previous_page')}</Button><Button variant="outline" disabled={conflictIndex + 1 >= blocked.length} onClick={() => setConflictIndex(conflictIndex + 1)}>{t('ui_next_page')}</Button>{phone && <Button variant="outline" onClick={() => startEntry(phone)}>{t('log_edit')}</Button>}</div></> : <><p className="record-text">{copy?.deleted ? t('No live cloud copy.') : copy?.activity}</p><p className="record-text">{copy?.notes}</p><fieldset><legend>{t('ui_choose_version')}</legend><div className="answer-list"><label className="answer-target"><input type="radio" name="resolution" checked={resolution === 'cloud'} onChange={() => setResolution('cloud')} />{t('Use cloud version / retry removal')}</label>{phone?.sharing === 'cloud' && <label className="answer-target"><input type="radio" name="resolution" checked={resolution === 'local'} onChange={() => setResolution('local')} />{t('Keep current phone version')}</label>}</div></fieldset></>}{feedback}
    </Wizard>;
  }
  else if (view === 'all') screen = <Wizard title={t('ui_all_entries')} onBack={() => setView('home')} onNext={() => setView('home')} nextLabel={t('ui_done')}><div className="choice-list">{summaries(logs.slice(currentPage * pageSize, (currentPage + 1) * pageSize))}<p>{t('ui_page', {page: currentPage + 1, total: totalPages})}</p><Button variant="outline" disabled={!currentPage} onClick={() => setPage(currentPage - 1)}>{t('ui_previous_page')}</Button><Button variant="outline" disabled={currentPage + 1 >= totalPages} onClick={() => setPage(currentPage + 1)}>{t('ui_next_page')}</Button></div></Wizard>;
  else screen = <section className="wizard tool-home"><div className="wizard-content" tabIndex={0} aria-label={t('ui_step_content')}><h2 className="screen-heading">{t('log_title')}</h2><div className="step-body"><p>{t('ui_logbook_description')}</p>{loading ? <div role="status"><p>{t('Loading your records…')}</p><Skeleton className="h-24" /></div> : !unlocked ? <Empty><LockKeyhole aria-hidden="true" /><EmptyTitle>{t('Your records are protected')}</EmptyTitle></Empty> : <><h3>{t('ui_recent_entries')}</h3>{logs.length ? <div className="choice-list">{summaries(logs.slice(0,3))}</div> : <Empty><EmptyTitle>{t('log_empty')}</EmptyTitle><EmptyDescription>{t('ui_logbook_description')}</EmptyDescription></Empty>}<div className="choice-list"><Button variant="outline" onClick={() => { setPage(0); setView('all'); }}>{t('ui_all_entries')}</Button><Button variant="outline" onClick={() => setView('settings')}>{t('ui_record_settings')}</Button>{blocked.length > 0 && <Button variant="outline" onClick={() => { setConflictIndex(0); setConflictStep(0); setView('conflicts'); }}>{t('Review cloud copy')} ({blocked.length})</Button>}</div></>}{feedback}</div></div><footer className="wizard-actions"><Button disabled={loading} onClick={() => unlocked ? startEntry() : setView('protection')}>{t(unlocked ? 'ui_add_entry' : 'ui_start_records')}</Button></footer></section>;
  return <>{screen}    <ConfirmDialog returnFocus={deleteTrigger} open={!!deleting} onOpenChange={open => { if (!open) setDeleting(null); }} title={t("Delete this entry?")} description={t("This removes the entry from your logbook. You cannot undo it.")} busy={busy} onConfirm={() => void act(async () => { await deleteLog(deleting.id); setDeleting(null); setView('home'); if (editing?.id === deleting.id) clear(); })} /></>;
}
