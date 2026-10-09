import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Calculator, Search, NotebookPen, Info } from 'lucide-react';
import Header from './components/Header';
import NpkCalculator from './components/NpkCalculator';
import CropCheck from './components/CropCheck';
import FarmLogbook from './components/FarmLogbook';
import FarmSetup from './components/FarmSetup';
import LanguagePicker from './components/LanguagePicker';
import { readFarmProfile } from './utils/farmProfile';
import { WizardNavigation } from './components/WizardNavigation';
import { Button } from './components/ui/button';
function needsLanguage() { try { return !localStorage.getItem('agripulse_lang'); } catch { return true; } }
const tools = [
  { id: 'diagnostics', label: 'ui_nav_diagnose', title: 'ui_diagnose_home', description: 'ui_diagnose_description', action: 'ui_start_check', icon: Search },
  { id: 'calculator', label: 'ui_nav_calculator', title: 'ui_calculator_home', description: 'ui_calculator_description', action: 'ui_start_calculator', icon: Calculator },
  { id: 'logbook', label: 'ui_nav_logbook', icon: NotebookPen }
];
export default function App() {
  const { t, i18n } = useTranslation();
  const [languagePicker, setLanguagePicker] = useState(needsLanguage);
  const [profile, setProfile] = useState(readFarmProfile);
  const [editingProfile, setEditingProfile] = useState(false);
  const [tab, setTab] = useState('diagnostics');
  const [running, setRunning] = useState(false);
  const setup = !profile || editingProfile;
  const tool = tools.find(item => item.id === tab);
  return <WizardNavigation.Provider value={{ exit: () => setRunning(false) }}>
    <div className={`app-shell h-dvh ${running || languagePicker || setup ? 'wizard-running' : ''}`}>
      <a href="#main-content" className="skip-link">{t('Skip to main content')}</a><Header />
      {!running && !languagePicker && !setup && <nav className="tool-nav" aria-label={t('Farm tools')}>{tools.map(({id,label,icon:Icon}) => <button type="button" key={id} aria-current={tab === id ? 'page' : undefined} onClick={() => setTab(id)}><Icon aria-hidden="true" /><span>{t(label)}</span></button>)}</nav>}
      <main id="main-content" className="tool-main" tabIndex={-1}>
        {languagePicker ? <LanguagePicker onComplete={() => setLanguagePicker(false)} /> : setup ? <FarmSetup profile={profile} onBack={() => profile ? setEditingProfile(false) : setLanguagePicker(true)} onComplete={value => { setProfile(value); setEditingProfile(false); }} /> : tab === 'logbook' ? <FarmLogbook onRunningChange={setRunning} /> : !running ?
          <section className="wizard tool-home"><div className="wizard-content" tabIndex={0} aria-label={t('ui_step_content')}><h2 tabIndex={-1} ref={node => node?.focus()} className="screen-heading">{t(tool.title)}</h2><div className="step-body">
            <p>{t(tool.description)}</p>{tab === 'diagnostics' && <><p className="secondary-copy">{t('ui_your_crops', { crops: profile.crops.map(crop => t(`ui_crop_${crop}`)).join(', ') })}</p><Button variant="ghost" onClick={() => setEditingProfile(true)}>{t('ui_edit_farm')}</Button></>}
            <p className="secondary-copy">{t('ui_faw_offline_short')}</p><p className="sample-note"><Info aria-hidden="true" />{t('ui_sample_short')}</p>
            {!['en','en-XA'].includes(i18n.resolvedLanguage) && <><p className="secondary-copy">{t('translation_draft')}</p><p className="secondary-copy">{t('ui_translation_pending')}</p></>}
          </div></div><footer className="wizard-actions"><Button onClick={() => setRunning(true)}>{t(tool.action)}</Button></footer></section> : tab === 'diagnostics' ? <CropCheck profile={profile} /> : <NpkCalculator />}
      </main>
    </div>
  </WizardNavigation.Provider>;
}
