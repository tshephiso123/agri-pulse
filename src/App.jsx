import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Header from './components/Header';
import NpkCalculator from './components/NpkCalculator';
import SymptomTree from './components/SymptomTree';
import FarmLogbook from './components/FarmLogbook';
import SyncStatusBadge from './components/SyncStatusBadge';

export default function App() {
  const { t } = useTranslation();
  const [tab, setTab] = useState('calculator');

  const tabs = [
    { id: 'calculator', label: t('nav_calculator'), icon: '🧮' },
    { id: 'diagnostics', label: t('nav_diagnostics'), icon: '🔍' },
    { id: 'logbook', label: t('nav_logbook'), icon: '📔' }
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
            <span className="text-xl">{tb.icon}</span>
            {tb.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
