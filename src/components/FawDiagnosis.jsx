import { useState, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { Info, Check, X, HelpCircle } from 'lucide-react';
import Wizard from './Wizard';
import { WizardNavigation } from './WizardNavigation';
import { Button } from './ui/button';
import SymptomTree from './SymptomTree';
const questions = ['windows', 'eggs', 'damage'];
export default function FawDiagnosis({ onExit, progressOffset = 0 }) {
  const { t, i18n } = useTranslation();
  const navigation = useContext(WizardNavigation);
  const [answers, setAnswers] = useState({});
  const [step, setStep] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(false);
  const [view, setView] = useState('check');
  const steps = ['scout', ...(result === 'possible' ? ['remove'] : []), 'record', ...(result !== 'clear' ? ['adviser'] : []), 'monitor', 'chemical'];
  function next() {
    if (step > 0 && step <= 3 && !answers[questions[step - 1]]) { setError(true); return; }
    setError(false);
    if (step === 3) setResult(Object.values(answers).includes('yes') ? 'possible' : Object.values(answers).includes('unsure') ? 'unknown' : 'clear');
    setStep(step + 1);
  }
  function restart() { setAnswers({}); setResult(null); setError(false); setStep(0); setView('check'); }
  if (view === 'reference') return <Wizard title={t('ui_reference')} onBack={() => setView('check')} onNext={() => setView('other')} nextLabel={t('faw_extra')}><p>{t('faw_reference')}</p><p className="secondary-copy">{t('faw_sources')}</p><a className="underline" href="https://www.fao.org/newsroom/detail/FAO-launches-guide-to-tackle-Fall-Armyworm-in-Africa-head-on/en">{t('ui_fao_source')}</a><a className="underline" href="https://repository.cimmyt.org/bitstream/10883/19204/1/59133.pdf">{t('ui_cimmyt_source')}</a><p className="sample-note"><Info aria-hidden="true" />{t('faw_sample')}</p></Wizard>;
  if (view === 'other') return <SymptomTree onBack={() => setView('reference')} />;
  if (step === 0) return <Wizard title={t('faw_title')} step={1 + progressOffset} total={5 + progressOffset} onBack={onExit || navigation.exit} onNext={next} nextLabel={t('ui_start_check')}><p>{t('faw_intro')}</p><p className="secondary-copy">{t('ui_faw_offline_short')}</p><p className="sample-note"><Info aria-hidden="true" />{t('ui_sample_short')}</p>{!['en', 'en-XA'].includes(i18n.resolvedLanguage) && <p className="secondary-copy">{t('translation_draft')}</p>}{!['en', 'en-XA', 'nso'].includes(i18n.resolvedLanguage) && <p lang="en" className="secondary-copy">{t('faw_draft')}</p>}<Button variant="ghost" onClick={() => setView('reference')}>{t('ui_reference')}</Button></Wizard>;
  if (step <= 3) {
    const key = questions[step - 1];
    return <Wizard title={t(`faw_${key}`)} step={step + 1 + progressOffset} total={5 + progressOffset} onBack={() => { setStep(step - 1); setError(false); }} onNext={next} nextLabel={step === 3 ? t('faw_submit') : t('ui_next')}><fieldset><legend className="sr-only">{t(`faw_${key}`)}</legend><div className="answer-list">{['yes', 'no', 'unsure'].map(value => <label key={value} className="answer-target"><input type="radio" name={key} value={value} checked={answers[key] === value} onChange={() => { setAnswers(previous => ({ ...previous, [key]: value })); setResult(null); setError(false); }} />{value === 'yes' ? <Check aria-hidden="true" /> : value === 'no' ? <X aria-hidden="true" /> : <HelpCircle aria-hidden="true" />}{t(`faw_${value}`)}</label>)}</div></fieldset>{error && <p role="alert" className="ui-alert ui-alert-error">{t('ui_choose_answer')}</p>}</Wizard>;
  }
  if (step === 4) return <Wizard title={t(`faw_${result}`)} step={5 + progressOffset} total={5 + progressOffset} result onBack={() => setStep(3)} onNext={next} nextLabel={t('ui_next_steps')}><p>{t(`faw_${result}_desc`)}</p><h3 className="font-semibold">{t("ui_do_now")}</h3><ol className="guidance-list">{steps.map(key => <li key={key}>{t(`faw_${key}`)}</li>)}</ol><p className="sample-note"><Info aria-hidden="true" />{t('ui_sample_short')}</p></Wizard>;
  const index = step - 5;
  return <Wizard title={t(`ui_${steps[index]}`)} step={index + 1} total={steps.length} onBack={() => setStep(step - 1)} onNext={index === steps.length - 1 ? restart : next} nextLabel={index === steps.length - 1 ? t('faw_reset') : t('ui_next')}><p>{t(`faw_${steps[index]}`)}</p>{index === steps.length - 1 && <Button variant="ghost" onClick={() => setView('reference')}>{t('ui_reference')}</Button>}</Wizard>;
}
