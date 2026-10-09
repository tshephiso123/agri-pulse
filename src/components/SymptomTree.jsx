import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Leaf } from 'lucide-react';
import Wizard from './Wizard';
import english from '../locales/en.json';
import trees from '../data/diagnosticTrees.json';
const outcomes = Object.values(trees).flat();
const steps = ['diag_title', 'Possible cause · sample information', 'diag_action_label', 'dose_label'];
export default function SymptomTree({ onBack }) {
  const { t } = useTranslation();
  const [selected, setSelected] = useState(null);
  const [step, setStep] = useState(0);
  const [error, setError] = useState(false);
  return <Wizard title={t(step ? selected.titleKey : steps[0])} step={step + 1} total={steps.length} onBack={() => step ? setStep(step - 1) : onBack()} onNext={() => { if (!selected) { setError(true); return; } if (step === 3) { setStep(0); setSelected(null); } else setStep(step + 1); }} nextLabel={t(step === 3 ? 'faw_reset' : 'ui_next')}>
    <p className="sample-note">{t('Sample information only. Confirm the problem with an agricultural adviser before treatment.')}</p>
    {step === 0 ? <fieldset><legend className="sr-only">{t('diag_title')}</legend><div className="answer-list">{outcomes.map(item => <label className="answer-target" key={item.id}><input type="radio" name="symptom" checked={selected?.id === item.id} onChange={() => { setSelected(item); setError(false); }} /><Leaf aria-hidden="true" />{t(item.symptomKey)}</label>)}</div></fieldset> : step === 1 ? <p>{t(selected.descriptionKey)}</p> : <><h3>{t(steps[step])}</h3><p lang="en">{english[step === 2 ? selected.actionKey : selected.practicalDoseKey]}</p><p className="secondary-copy">{t('treatment_review')}</p></>}
    {error && <p role="alert" className="ui-alert ui-alert-error">{t('ui_choose_answer')}</p>}
  </Wizard>;
}
