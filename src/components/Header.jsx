import { useTranslation } from 'react-i18next';
import { setLanguage } from '../utils/i18n';

const LANGS = [
  { code: 'en', label: 'EN' },
  { code: 'se', label: 'SE' },
  { code: 've', label: 'VE' },
  { code: 'ts', label: 'TS' }
];

export default function Header() {
  const { t, i18n } = useTranslation();
  return (
    <header className="sticky top-0 z-10 bg-pulse-green text-white shadow-md">
      <div className="flex items-center justify-between px-4 py-3">
        <h1 className="text-lg font-bold">{t('app_title')}</h1>
        <div className="flex gap-1" role="group" aria-label="Language">
          {LANGS.map((l) => (
            <button
              key={l.code}
              onClick={() => setLanguage(l.code)}
              className={`px-3 py-1.5 rounded text-sm font-bold transition-colors ${
                i18n.language === l.code
                  ? 'bg-white text-pulse-green'
                  : 'bg-pulse-green/60 text-white'
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}
