import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LANGUAGES } from '../utils/languages';
import { setLanguage } from '../utils/i18n';
import { Button } from './ui/button';
import { Languages } from 'lucide-react';
export default function LanguagePicker({ onComplete }) {
  const { t, i18n } = useTranslation();
  const [chosen, setChosen] = useState(i18n.resolvedLanguage === 'en-XA' ? 'en' : i18n.resolvedLanguage);
  return <section className="wizard language-picker"><div className="wizard-content" tabIndex={0} aria-label={t('ui_step_content')}><h2 className="screen-heading" tabIndex={-1} ref={node => node?.focus()}>{t('ui_choose_language')}</h2><p className="secondary-copy my-4">{t('ui_language_help')}</p><fieldset><legend className="sr-only">{t('Language')}</legend><div className="answer-list">{LANGUAGES.map(language => <label className="answer-target" key={language.code}><Languages aria-hidden="true" /><input type="radio" name="language" checked={chosen === language.code} onChange={() => setChosen(language.code)} /><span>{language.label}</span></label>)}</div></fieldset></div><footer className="wizard-actions"><Button onClick={async () => { if (i18n.resolvedLanguage !== 'en-XA') await setLanguage(chosen); else { try { localStorage.setItem('agripulse_lang', chosen); } catch { /* The current language remains usable. */ } } onComplete(); }}>{t('ui_language_continue')}</Button></footer></section>;
}
