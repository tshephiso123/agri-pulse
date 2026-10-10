import { useTranslation } from 'react-i18next';
import { setLanguage } from '../utils/i18n';

const languages = [
  { code: 'en', name: 'English' },
  { code: 'nso', name: 'Sepedi' },
  { code: 've', name: 'Tshivenda' },
  { code: 'ts', name: 'Xi' + 'tsonga' }
];

export default function Header() {
  const { t, i18n } = useTranslation();
  return <header className="app-header">
    <div className="brand-lockup">
      <span className="brand-mark" aria-hidden="true"><svg viewBox="0 0 32 32" fill="none"><path d="M16 26V14M16 19C6 20 5 10 5 10c9-1 12 5 11 9ZM16 15C15 6 22 3 27 4c0 8-5 12-11 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></span>
      <div><h1>{t('app_title')}</h1><span>{t('brand_caption')}</span></div>
    </div>
    <label className="language-picker"><span>{t('language_label')}</span>
      <select aria-label="Language" value={i18n.language} onChange={e => setLanguage(e.target.value)}>
        {languages.map(language => <option key={language.code} value={language.code}>{language.name}</option>)}
      </select>
    </label>
  </header>;
}
