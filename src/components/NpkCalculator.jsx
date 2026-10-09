import { useState, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { Info, Wheat, Sprout, Package } from 'lucide-react';
import cropsData from '../data/cropsData.json';
import { calculateNPK } from '../utils/agronomyCalculators';
import Wizard from './Wizard';
import { WizardNavigation } from './WizardNavigation';
import { Input } from './ui/input';
import Feedback from './Feedback';
const steps = [
  { id: 'crop', title: 'ui_calc_crop_question', action: 'ui_next' },
  { id: 'fertilizer', title: 'ui_calc_fertilizer_question', action: 'ui_next' },
  { id: 'area', title: 'ui_calc_area_question', action: 'ui_next' },
  { id: 'review', title: 'ui_calc_review', action: 'calc_button' },
  { id: 'result', title: 'ui_calc_result', action: 'ui_calculate_again' }
];
export default function NpkCalculator() {
  const { t, i18n } = useTranslation();
  const navigation = useContext(WizardNavigation);
  const [step, setStep] = useState(0);
  const [cropId, setCropId] = useState('maize');
  const [fertId, setFertId] = useState('urea');
  const [area, setArea] = useState('1');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const current = steps[step];
  const numberLocale = i18n.resolvedLanguage === 'en-XA' ? 'en' : i18n.resolvedLanguage;
  function format(value) { return value.toLocaleString(numberLocale, { maximumFractionDigits: 20 }); }
  function change(setter, value) { setter(value); setResult(null); setError(''); }
  function validArea() {
    const hectares = Number(area);
    if (!Number.isFinite(hectares) || hectares < 0.01) { setError('Enter a field size of at least 0.01 hectares. For example, enter 2 for two hectares.'); return false; }
    return true;
  }
  function calculate() {
    if (!validArea()) { setStep(2); return; }
    try {
      const output = calculateNPK({ cropTargetN: cropsData.crops[cropId].targetN_kg_ha, areaHectares: Number(area), activeRatio: cropsData.fertilizers[fertId].n_ratio });
      if (!Number.isFinite(output.totalProductKg) || output.totalProductKg > Number.MAX_SAFE_INTEGER) throw new Error();
      setResult(output); setError(''); setStep(4);
    } catch { setError('We could not calculate this amount. Check your field size and try again.'); setStep(2); }
  }
  function next() {
    if (current.id === 'review') { calculate(); return; }
    if (current.id === 'area' && !validArea()) return;
    setError(''); setResult(null); setStep(current.id === 'result' ? 0 : step + 1);
  }
  function back() { setResult(null); setError(''); if (step === 0) navigation.exit(); else setStep(step - 1); }
  const details = [[t('calc_crop'), t(`crop_${cropId}`)], [t('calc_fertilizer'), t(`ui_fertilizer_${fertId}`)], [t('calc_area'), t('ui_calc_hectares', { area: format(Number(area)) })]];
  return <Wizard title={t(current.title)} step={step + 1} total={steps.length} result={current.id === 'result'} onBack={back} onNext={next} nextLabel={t(current.action)}>
    {current.id === 'crop' && <fieldset><legend className="sr-only">{t('calc_crop')}</legend><div className="answer-list">{Object.values(cropsData.crops).map(crop => { const Icon = crop.id === 'maize' ? Wheat : Sprout; return <label className="answer-target" key={crop.id}><Icon aria-hidden="true" /><input id={`crop-${crop.id}`} type="radio" name="crop" value={crop.id} checked={cropId === crop.id} onChange={() => change(setCropId, crop.id)} /><span>{t(`crop_${crop.id}`)}</span></label>; })}</div><p className="sample-note"><Info aria-hidden="true" />{t('ui_calc_sample_short')}</p></fieldset>}
    {current.id === 'fertilizer' && <fieldset><legend className="sr-only">{t('calc_fertilizer')}</legend><div className="answer-list">{Object.keys(cropsData.fertilizers).map(id => <label className="answer-target" key={id}><Package aria-hidden="true" /><input id={`fertilizer-${id}`} type="radio" name="fertilizer" value={id} checked={fertId === id} onChange={() => change(setFertId, id)} /><span>{t(`ui_fertilizer_${id}`)}</span></label>)}</div></fieldset>}
    {current.id === 'area' && <form onSubmit={event => { event.preventDefault(); next(); }} noValidate><label htmlFor="area" className="field-label">{t('calc_area')}</label><Input id="area" type="number" inputMode="decimal" step="any" min="0.01" value={area} aria-invalid={!!error} aria-describedby={error ? 'area-error' : 'area-help'} onChange={event => change(setArea, event.target.value)} /><p id="area-help" className="secondary-copy mt-4">{t('Use hectares. For example: 1 or 2.5.')}</p>{error && <div id="area-error"><Feedback error message={error} /></div>}</form>}
    {current.id === 'review' && <><p>{t('ui_calc_review_help')}</p><dl className="estimate-details">{details.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl><p className="sample-note"><Info aria-hidden="true" />{t('ui_calc_sample_short')}</p></>}
    {current.id === 'result' && result && <><p className="result-heading" data-testid="calculator-total">{t('ui_calc_kilograms', { amount: format(result.totalProductKg) })}</p><p className="secondary-copy">{t('calc_result_kg')}</p><dl className="estimate-details">{[[t('calc_result_bags'), result.bags], [t('calc_result_buckets'), result.buckets], [t('calc_result_caps'), result.capsPerPlant]].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{format(value)}</dd></div>)}</dl><p className="secondary-copy">{t('ui_calc_context', { crop: t(`crop_${cropId}`), fertilizer: t(`ui_fertilizer_${fertId}`), area: format(Number(area)) })}</p><p className="sample-note"><Info aria-hidden="true" />{t('ui_calc_sample_short')}</p></>}
  </Wizard>;
}
