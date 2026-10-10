import { useTranslation } from 'react-i18next';
export default function SoilGuide({ onChoose }) {
  const {t}=useTranslation();
  return <section className="p-4 space-y-4"><h2 className="text-lg font-bold">{t('nav_soil')}</h2><p>{t('soil_intro')}</p>
    {['sandy','clay','loam'].map(type=><article key={type} className="rounded border p-4 space-y-2"><h3 className="font-bold">{t('soil_'+type)}</h3><p>{t('soil_'+type+'_help')}</p><button className="rounded border border-pulse-green px-3" onClick={()=>onChoose(type)}>{t('use_soil')}</button></article>)}
    <article className="rounded bg-green-50 p-4"><h3 className="font-bold">{t('jar_title')}</h3><ol className="list-decimal pl-5 space-y-2">{[1,2,3,4].map(n=><li key={n}>{t('jar_'+n)}</li>)}</ol><p className="text-sm mt-3">{t('jar_limit')}</p><p className="text-xs mt-3">{t('source_label')}: FAO, Soil Texture (training manual). {t('offline_sources')}</p></article>
  </section>;
}
