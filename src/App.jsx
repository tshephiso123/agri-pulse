import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Calculator, Search, NotebookPen, Info } from 'lucide-react';
import Header from './components/Header';
import NpkCalculator from './components/NpkCalculator';
import FawDiagnosis from './components/FawDiagnosis';
import FarmLogbook from './components/FarmLogbook';
import LanguagePicker from './components/LanguagePicker';
import { WizardNavigation } from './components/WizardNavigation';
import { Button } from './components/ui/button';
function needsLanguage() { try { return !localStorage.getItem('agripulse_lang'); } catch { return true; } }
const tools = [
  { id: 'diagnostics', label: 'ui_nav_diagnose', title: 'ui_diagnose_home', description: 'ui_diagnose_description', action: 'ui_start_check', icon: Search },
  { id: 'calculator', label: 'ui_nav_calculator', title: 'ui_calculator_home', description: 'ui_calculator_description', action: 'ui_start_calculator', icon: Calculator },
  { id: 'logbook', label: 'ui_nav_logbook', title: 'ui_logbook_home', description: 'ui_logbook_description', action: 'ui_start_records', icon: NotebookPen }
];
export default function App() {
  const { t, i18n } = useTranslation();
  const [languagePicker, setLanguagePicker] = useState(needsLanguage);
  const [tab, setTab] = useState('diagnostics');
  const [running, setRunning] = useState(false);
  const tool = tools.find(item => item.id === tab);
  return <WizardNavigation.Provider value={{ exit: () => setRunning(false) }}><div className={`app-shell h-dvh ${running || languagePicker ? 'wizard-running' : ''}`}><a href="#main-content" className="skip-link">{t('Skip to main content')}</a><Header />{!running && !languagePicker && <nav className="tool-nav" aria-label={t('Farm tools')}>{tools.map(({ id, label, icon: Icon }) => <button type="button" key={id} aria-current={tab === id ? 'page' : undefined} onClick={() => setTab(id)}><Icon aria-hidden="true" /><span>{t(label)}</span></button>)}</nav>}<main id="main-content" className="tool-main" tabIndex={-1}>{languagePicker ? <LanguagePicker onComplete={() => setLanguagePicker(false)} /> : tab === 'logbook' ? <FarmLogbook onRunningChange={setRunning} /> : !running ? <section className="wizard tool-home"><div className="wizard-content" tabIndex={0} aria-label={t('ui_step_content')}><h2 tabIndex={-1} ref={node => node?.focus()} className="screen-heading">{t(tool.title)}</h2><div className="step-body"><p>{t(tool.description)}</p><p className="secondary-copy">{t('ui_faw_offline_short')}</p>{tab !== 'logbook' && <p className="sample-note"><Info aria-hidden="true" />{t('ui_sample_short')}</p>}{i18n.resolvedLanguage !== 'en' && i18n.resolvedLanguage !== 'en-XA' && <><p className="secondary-copy">{t('translation_draft')}</p><p className="secondary-copy">{t('ui_translation_pending')}</p></>}</div></div><footer className="wizard-actions"><Button onClick={() => setRunning(true)}>{t(tool.action)}</Button></footer></section> : tab === 'diagnostics' ? <FawDiagnosis /> : tab === 'calculator' ? <NpkCalculator /> : null}</main></div></WizardNavigation.Provider>;
}
