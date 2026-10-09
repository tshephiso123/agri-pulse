import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Sprout, Check, X, HelpCircle } from 'lucide-react';
import Wizard from './Wizard';
import FawDiagnosis from './FawDiagnosis';
import { FARM_CROPS } from '../utils/farmProfile';
const questions = ['chewing', 'spots', 'wilting'];
const guidance = ['inspect', 'record', 'confirm', 'treatment'];
export default function CropCheck({ profile }) {
  const { t } = useTranslation();
  const [crop, setCrop] = useState(profile?.crops?.[0] || 'maize');
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [error, setError] = useState(false);
  function chooseCrop(value) { setCrop(value); setAnswers({}); setError(false); }
  if (!step) return <Wizard title={t('ui_crop_question')} step={1} total={6} onNext={() => setStep(1)}><fieldset><legend className="sr-only">{t('ui_crop_question')}</legend><div className="answer-list">{FARM_CROPS.map(value => <label className="answer-target" key={value}><input type="radio" name="check-crop" value={value} checked={crop === value} onChange={() => chooseCrop(value)} /><Sprout aria-hidden="true" /><span>{t(`ui_crop_${value}`)}</span></label>)}</div></fieldset><p className="secondary-copy">{t('ui_crop_scope')}</p></Wizard>;
  if (crop === 'maize') return <FawDiagnosis progressOffset={1} onExit={() => { setStep(0); setAnswers({}); }} />;
  const result = Object.values(answers).every(value => value === 'no') ? 'clear' : 'review';
  if (step === 1) return <Wizard title={t('ui_crop_intro', { crop: t(`ui_crop_${crop}`) })} step={2} total={6} onBack={() => setStep(0)} onNext={() => setStep(2)}><p>{t('ui_crop_general_intro')}</p><p className="sample-note">{t('ui_sample_short')}</p></Wizard>;
  if (step <= 4) { const key = questions[step - 2]; return <Wizard title={t(`ui_crop_${key}`)} step={step + 1} total={6} onBack={() => { setStep(step - 1); setError(false); }} onNext={() => { if (!answers[key]) { setError(true); return; } setStep(step + 1); setError(false); }}><fieldset><legend className="sr-only">{t(`ui_crop_${key}`)}</legend><div className="answer-list">{['yes','no','unsure'].map(value => { const Icon = value === 'yes' ? Check : value === 'no' ? X : HelpCircle; return <label key={value} className="answer-target"><input type="radio" name={key} value={value} checked={answers[key] === value} onChange={() => { setAnswers(current => ({ ...current, [key]: value })); setError(false); }} /><Icon aria-hidden="true" />{t(`faw_${value}`)}</label>; })}</div></fieldset>{error && <p role="alert" className="ui-alert ui-alert-error">{t('ui_choose_answer')}</p>}</Wizard>; }
  return <Wizard title={t(`ui_crop_result_${result}`, { crop: t(`ui_crop_${crop}`) })} step={6} total={6} result onBack={() => setStep(4)} onNext={() => { setAnswers({}); setStep(0); }} nextLabel={t('ui_crop_again')}><p>{t('ui_crop_limit')}</p><h3 className="font-semibold">{t('ui_do_now')}</h3><ol className="guidance-list">{guidance.map(key => <li key={key}>{t(`ui_crop_guidance_${key}`)}</li>)}</ol><p className="sample-note">{t('ui_sample_short')}</p><a href="https://ask.ifas.ufl.edu/publication/CV298" className="underline">{t('ui_crop_source')}</a><p className="secondary-copy">{t('ui_external_source')}</p></Wizard>;
}
