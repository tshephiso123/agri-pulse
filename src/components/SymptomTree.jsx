import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import flow from '../data/diagnosticFlow.json';
import { calculateTank } from '../utils/agronomyCalculators';
export default function SymptomTree() {
  const {t} = useTranslation();
  const [path,setPath]=useState(['start']), [rate,setRate]=useState(''), [tank,setTank]=useState('15'), [dose,setDose]=useState(null), [error,setError]=useState('');
  const node=flow[path.at(-1)];
  return <section className="p-4 space-y-4"><h2 className="font-bold text-lg">{t('diag_title')}</h2><p className="rounded bg-amber-50 p-3 text-sm">{t('diagnosis_notice')}</p>
    <div className="rounded border p-4 space-y-3"><h3 className="font-bold">{t(node.question || node.title)}</h3>{node.detail && <p>{t(node.detail)}</p>}
    {node.choices?.map(([label,next])=><button key={next} className="w-full rounded border-2 border-pulse-green p-3 text-left" onClick={()=>setPath([...path,next])}>{t(label)}</button>)}</div>
    <div className="flex gap-3"><button disabled={path.length===1} className="rounded border px-4 disabled:opacity-40" onClick={()=>setPath(path.slice(0,-1))}>{t('back')}</button><button className="rounded border px-4" onClick={()=>{setPath(['start']);setDose(null);}}>{t('restart')}</button></div>
    {!node.choices && <details className="rounded border p-3"><summary>{t('tank_title')}</summary><p className="text-sm py-2">{t('tank_help')}</p><form onSubmit={e=>{e.preventDefault();setError('');try{setDose(calculateTank(Number(rate),Number(tank)));}catch(e){setDose(null);setError(e.message);}}}>
    <label>{t('label_rate')}<input className="field" required type="number" min="0.001" max="1000" step="any" value={rate} onChange={e=>{setRate(e.target.value);setDose(null);}}/></label><label>{t('tank_size')}<input className="field" required type="number" min="0.001" max="1000" step="any" value={tank} onChange={e=>{setTank(e.target.value);setDose(null);}}/></label><button className="rounded bg-pulse-green text-white px-4 mt-3">{t('calc_button')}</button></form>{error && <p role="alert">{error}</p>}{dose !== null && <p role="status" className="font-bold mt-3">{dose} mL · {t('label_required')}</p>}</details>}
  </section>;
}
