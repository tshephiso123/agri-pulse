import { useTranslation } from 'react-i18next';
import { setLanguage } from '../utils/i18n';
import { LANGUAGES } from '../utils/languages';
import SyncStatusBadge from './SyncStatusBadge';
export default function Header() {
  const { t, i18n } = useTranslation();
  return <header className="app-header"><h1>{t('ui_brand')}</h1><SyncStatusBadge /><label className="language-control"><span className="sr-only">{t('Language')}</span><select aria-label={t('Language')} value={i18n.resolvedLanguage} onChange={event => setLanguage(event.target.value)}>{i18n.resolvedLanguage === 'en-XA' && <option value="en-XA">English +40%</option>}{LANGUAGES.map(language => <option key={language.code} value={language.code}>{language.label}</option>)}</select></label></header>;
}
