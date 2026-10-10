import {useEffect,useState} from 'react';
import {useTranslation} from 'react-i18next';
import {cloudEnabled} from '../sync/engine.js';
export default function AccessGuide(){
 const {t}=useTranslation(); const [ready,setReady]=useState(false),[prompt,setPrompt]=useState(null);
 useEffect(()=>{let active=true; navigator.serviceWorker?.ready.then(()=>{if(active)setReady(true);});const install=e=>{e.preventDefault();setPrompt(e);};window.addEventListener('beforeinstallprompt',install);return()=>{active=false;window.removeEventListener('beforeinstallprompt',install);};},[]);
 return <section className="p-4 space-y-4"><h2 className="font-bold text-lg">{t('free_title')}</h2><p className="rounded bg-green-50 p-4">{t('free_promise')}</p><p role="status">{ready?t('offline_ready'):t('offline_preparing')}</p>
 {prompt && <button className="rounded bg-pulse-green text-white px-4" onClick={async()=>{await prompt.prompt();setPrompt(null);}}>{t('install_app')}</button>}
 <article className="rounded border p-4"><h3 className="font-bold">{t('install_title')}</h3><p>{t('install_help')}</p><p className="mt-3">{t('distribution_help')}</p></article>
 <article className="rounded border p-4"><h3 className="font-bold">{t('kit_title')}</h3><p>{t('kit_help')}</p><a className="inline-block rounded border border-pulse-green p-3 mt-3" href="/agripulse-offline.html" download="agripulse-offline.html">{t('kit_download')}</a></article>
 <article className="rounded border p-4"><h3 className="font-bold">{t('backup_title')}</h3><p>{t('backup_help')}</p>{!cloudEnabled && <p className="mt-3 rounded bg-amber-50 p-3 text-sm">Cloud backup is not connected on this deployment. Use the logbook's encrypted backup download and keep the file on another device.</p>}</article><p className="text-sm">{t('translation_notice')}</p>
 </section>;
}
