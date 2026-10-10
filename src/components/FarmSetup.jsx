import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Wizard from './Wizard';
import { Button } from './ui/button';
import { Sprout } from 'lucide-react';
import { FARM_CROPS, saveFarmProfile } from '../utils/farmProfile';
const steps = ['ui_farm_about', 'ui_farm_crops', 'ui_farm_size', 'ui_farm_review'];
export default function FarmSetup({ profile, onComplete, onBack }) {
  const { t } = useTranslation();
  const [step, setStep] = useState(0);
  const [details, setDetails] = useState(profile || { name: '', community: '', crops: ['maize'], area: '' });
  const [error, setError] = useState('');
  function field(key, value) { setDetails(previous => ({ ...previous, [key]: value })); setError(''); }
  function next() {
    if (step === 1 && !details.crops.length) { setError('ui_farm_crop_required'); return; }
    if (step === 2 && details.area.trim() && (!Number.isFinite(Number(details.area)) || Number(details.area) <= 0)) { setError('ui_farm_size_error'); return; }
    if (step < 3) { setStep(step + 1); return; }
    const value = { ...details, name: details.name.trim(), community: details.community.trim(), area: details.area.trim(), version: 1 };
    try { saveFarmProfile(value); onComplete(value); } catch { setError('ui_farm_save_error'); }
  }
  return <div className="farm-setup contents"><Wizard title={t(steps[step])} step={step + 1} total={steps.length} onBack={() => step ? setStep(step - 1) : onBack()} onNext={next} nextLabel={t(step === 3 ? 'ui_farm_finish' : 'ui_next')}>
    {step === 0 && <><p>{t('ui_farm_welcome')}</p>{['name', 'community'].map(key => <label className="field-label" key={key}>{t(`ui_farm_${key}`)}<input className="field-control" maxLength={100} value={details[key]} onChange={event => field(key, event.target.value)} autoComplete="off" /></label>)}<p className="secondary-copy">{t('ui_farm_privacy')}</p></>}
    {step === 1 && <fieldset><legend className="secondary-copy">{t('ui_farm_choose_crops')}</legend><div className="answer-list">{FARM_CROPS.map(crop => <label key={crop} className="answer-target"><input type="checkbox" value={crop} checked={details.crops.includes(crop)} onChange={event => field('crops', event.target.checked ? [...details.crops, crop] : details.crops.filter(item => item !== crop))} /><Sprout aria-hidden="true" /><span>{t(`ui_crop_${crop}`)}</span></label>)}</div></fieldset>}
    {step === 2 && <><label className="field-label">{t('ui_farm_hectares')}<input className="field-control" type="number" inputMode="decimal" min="0" step="any" value={details.area} onChange={event => field('area', event.target.value)} /></label><p className="secondary-copy">{t('ui_farm_size_help')}</p></>}
    {step === 3 && <><dl className="estimate-details">{[[t('ui_farm_name'), details.name || t('ui_not_provided')], [t('ui_farm_community'), details.community || t('ui_not_provided')], [t('ui_farm_crops'), details.crops.map(crop => t(`ui_crop_${crop}`)).join(', ')], [t('ui_farm_hectares'), details.area || t('ui_not_provided')]].map(([label,value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl><p className="secondary-copy">{t('ui_farm_privacy')}</p></>}
    {error && <p role="alert" className="ui-alert ui-alert-error">{t(error)}</p>}{error === 'ui_farm_save_error' && <Button variant="outline" onClick={() => onComplete({ ...details, version: 1 })}>{t('ui_continue_for_now')}</Button>}
  </Wizard></div>;
}
