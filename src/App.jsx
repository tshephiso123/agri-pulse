import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';
import Header from './components/Header';
import NpkCalculator from './components/NpkCalculator';
import SymptomTree from './components/SymptomTree';
import FarmLogbook from './components/FarmLogbook';
import SyncStatusBadge from './components/SyncStatusBadge';
import SoilGuide from './components/SoilGuide';
import AccessGuide from './components/AccessGuide';

function TabIcon({ name }) {
  const icons = {
    calculator: <><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M8 7h8M8 11h2m4 0h2m-8 4h2m4 0h2m-8 4h2m4 0h2" /></>,
    diagnostics: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" /></>,
    logbook: <><path d="M5 4.5A2.5 2.5 0 0 1 7.5 2H20v18H7.5A2.5 2.5 0 0 1 5 17.5z" /><path d="M5 4.5v13M9 6h7m-7 4h7m-7 4h5" /></>,
    soil: <><path d="M12 21V11M12 14C5 15 3 9 4 5c6 0 9 4 8 9ZM12 11C11 5 16 2 21 3c0 6-4 9-9 8Z"/><path d="M4 21h16"/></>,
    access: <><rect x="6" y="2" width="12" height="20" rx="3"/><path d="M10 18h4m-5-8 2 2 4-4"/></>
  };
  return <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{icons[name] || <path d="M12 3v18M3 12h18M5 5l14 14M5 19 19 5" />}</svg>;
}

export default function App() {
  const { t, i18n } = useTranslation();
  const [tab, setTab] = useState('calculator');
  const [soil,setSoil] = useState('unknown');
  const [online,setOnline] = useState(navigator.onLine);
  useEffect(()=>{const update=()=>setOnline(navigator.onLine);window.addEventListener('online',update);window.addEventListener('offline',update);return()=>{window.removeEventListener('online',update);window.removeEventListener('offline',update);};},[]);

  const tabs = [
    { id: 'calculator', label: t('nav_calculator') },
    { id: 'diagnostics', label: t('nav_diagnostics') },
    { id: 'logbook', label: t('nav_logbook') },
    { id: 'soil', label: t('nav_soil') },
    { id: 'access', label: t('nav_access') }
  ];

  return (
    <div className="app-shell">
      <Header />
      <main className="app-main">
        <section className="page-intro">
          <div className="intro-topline"><span className="eyebrow">{t('field_eyebrow')}</span><span className={`connection-pill ${online?'':'is-offline'}`} role="status"><span aria-hidden="true"/>{t(online?'connection_online':'connection_offline')}</span></div>
          <h2>{tabs.find(item=>item.id===tab).label}</h2>
          <p>{t('field_tagline')}</p>
          <div className="free-note"><span aria-hidden="true">✓</span>{t('free_short')}</div>
        </section>
        {i18n.language !== 'en' && <p className="mx-4 mt-2 text-xs">{t('translation_notice')}</p>}
        {tab === 'logbook' ? <div className="flex justify-center pt-3">
          <SyncStatusBadge />
        </div> : null}
        <div className="tool-content">
        {tab === 'calculator' && <NpkCalculator key={soil} soil={soil}/>}
        {tab === 'diagnostics' && <SymptomTree />}
        {tab === 'logbook' && <FarmLogbook />}
        {tab === 'soil' && <SoilGuide onChoose={type=>{setSoil(type);setTab('calculator');}}/>}
        {tab === 'access' && <AccessGuide/>}
        </div>
      </main>
      <nav className="tool-navigation" aria-label="Field tools">
        {tabs.map((tb) => (
          <button key={tb.id} onClick={() => setTab(tb.id)} aria-current={tab===tb.id?'page':undefined}
            className={`nav-item ${tab===tb.id?'is-active':''}`}>
            <TabIcon name={tb.id} />
            {tb.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
