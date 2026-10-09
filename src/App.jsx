import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Header from './components/Header';
import NpkCalculator from './components/NpkCalculator';
import SymptomTree from './components/SymptomTree';
import FarmLogbook from './components/FarmLogbook';
import SyncStatusBadge from './components/SyncStatusBadge';

function TabIcon({ name }) {
  const icons = {
    calculator: <><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M8 7h8M8 11h2m4 0h2m-8 4h2m4 0h2m-8 4h2m4 0h2" /></>,
    diagnostics: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" /></>,
    logbook: <><path d="M5 4.5A2.5 2.5 0 0 1 7.5 2H20v18H7.5A2.5 2.5 0 0 1 5 17.5z" /><path d="M5 4.5v13M9 6h7m-7 4h7m-7 4h5" /></>
  };
  return <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{icons[name]}</svg>;
}

export default function App() {
  const { t } = useTranslation();
  const [tab, setTab] = useState('calculator');

  const tabs = [
    { id: 'calculator', label: t('nav_calculator') },
    { id: 'diagnostics', label: t('nav_diagnostics') },
    { id: 'logbook', label: t('nav_logbook') }
  ];

  return (
    <div className="min-h-screen flex flex-col max-w-lg mx-auto">
      <Header />
      <main className="flex-1 pb-20">
        <div className="flex justify-center pt-3">
          <SyncStatusBadge />
        </div>
        {tab === 'calculator' && <NpkCalculator />}
        {tab === 'diagnostics' && <SymptomTree />}
        {tab === 'logbook' && <FarmLogbook />}
      </main>
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-200 flex max-w-lg mx-auto">
        {tabs.map((tb) => (
          <button key={tb.id} onClick={() => setTab(tb.id)}
            className={`flex-1 py-3 flex flex-col items-center text-xs font-semibold ${
              tab === tb.id ? 'text-pulse-green border-t-4 border-pulse-green' : 'text-gray-500'
            }`}>
            <TabIcon name={tb.id} />
            {tb.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
