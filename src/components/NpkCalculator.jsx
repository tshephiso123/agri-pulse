import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import cropsData from '../data/cropsData.json';
import { calculateNPK } from '../utils/agronomyCalculators';

export default function NpkCalculator({ soil = 'unknown' }) {
  const { t, i18n } = useTranslation();
  const [cropId,setCrop] = useState('maize'), [fertId,setFert] = useState('urea');
  const [area,setArea] = useState('1'), [credit,setCredit] = useState('0');
  const [plants,setPlants] = useState(''), [cap,setCap] = useState('');
  const [result,setResult] = useState(null), [error,setError] = useState('');
  const crop = cropsData.crops[cropId], fert = cropsData.fertilizers[fertId];
  function reset(setter,value) { setter(value); setResult(null); setError(''); }
  return <section className="p-4 space-y-4">
    <p className="rounded bg-amber-50 p-3 text-sm">{t('sample_notice')}</p>
    <form className="space-y-3" onSubmit={e => { e.preventDefault(); setError(''); try { setResult(calculateNPK({ cropTargetN:crop.targetN_kg_ha, areaHectares:Number(area), activeRatio:fert.n_ratio, soilCredit:Number(credit), soil, ...(plants || cap ? {plantCount:Number(plants),capGrams:Number(cap)} : {}) })); } catch(e) { setResult(null); setError(e.message); } }}>
      <label className="block font-semibold">{t('calc_crop')}<select className="field" value={cropId} onChange={e=>reset(setCrop,e.target.value)}>{Object.values(cropsData.crops).map(c=><option key={c.id} value={c.id}>{c.names[i18n.language] || c.names.en}</option>)}</select></label>
      <label className="block font-semibold">{t('calc_fertilizer')}<select className="field" value={fertId} onChange={e=>reset(setFert,e.target.value)}>{Object.entries(cropsData.fertilizers).map(([id,f])=><option key={id} value={id}>{f.name}</option>)}</select></label>
      <label className="block font-semibold">{t('calc_area')}<input className="field" required type="number" min="0.0001" max="10000" step="any" value={area} onChange={e=>reset(setArea,e.target.value)}/></label>
      <p className="text-sm">{t('hectare_help')} · {t('soil_selected')}: {t('soil_'+soil)}</p>
      <details className="rounded border p-3"><summary>{t('soil_credit_title')}</summary><p className="text-sm py-2">{t('soil_credit_help')}</p><label>{t('soil_credit_label')}<input className="field" type="number" min="0" max="500" step="any" value={credit} onChange={e=>reset(setCredit,e.target.value)}/></label></details>
      <details className="rounded border p-3"><summary>{t('cap_title')}</summary><p className="text-sm py-2">{t('cap_help')}</p><label>{t('plant_count')}<input className="field" type="number" min="1" step="1" value={plants} onChange={e=>reset(setPlants,e.target.value)}/></label><label>{t('cap_mass')}<input className="field" type="number" min="0.001" max="100" step="any" value={cap} onChange={e=>reset(setCap,e.target.value)}/></label></details>
      <button className="w-full bg-pulse-green text-white rounded font-bold">{t('calc_button')}</button>
    </form>
    {error && <p role="alert">{error}</p>}
    {result && <div className="rounded border-2 border-pulse-green p-4 space-y-2" aria-live="polite">
      <h2 className="font-bold">{t('sample_result')}</h2>
      <p>{t('calc_result_kg')}: <strong>{result.totalProductKg} kg</strong></p><p>{t('calc_result_bags')}: {result.bags} ({t('purchase_rounding')})</p><p>{t('calc_result_buckets')}: {result.buckets}</p>
      <p>{t('calc_result_caps')}: {result.capsPerPlant ?? t('cap_missing')}</p>
      <p className="text-sm">{t('formula_help')} {result.netN} × {area} ÷ {fert.n_ratio}. {t('bucket_help')}</p>
      {result.caution && <p className="rounded bg-amber-50 p-3">{t('split_warning')}</p>}
      <p className="text-sm">{t('nitrogen_only')}</p>
    </div>}
  </section>;
}
