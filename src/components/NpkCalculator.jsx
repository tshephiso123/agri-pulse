import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import cropsData from '../data/cropsData.json';
import { calculateNPK } from '../utils/agronomyCalculators';

export default function NpkCalculator() {
  const { t, i18n } = useTranslation();
  const [cropId, setCropId] = useState('maize');
  const [fertId, setFertId] = useState('urea');
  const [area, setArea] = useState('1');
  const [result, setResult] = useState(null);

  const crop = cropsData.crops[cropId];
  const fert = cropsData.fertilizers[fertId];

  const nRatio = fert.n_ratio;
  const targetN = crop.targetN_kg_ha;

  const handleCalculate = (e) => {
    e.preventDefault();
    const areaHectares = parseFloat(area);
    if (isNaN(areaHectares) || areaHectares <= 0) return;
    setResult(calculateNPK({ cropTargetN: targetN, areaHectares, activeRatio: nRatio }));
  };

  return (
    <div className="p-4 space-y-4">
      <form onSubmit={handleCalculate} className="space-y-4">
        <div>
          <label className="block font-semibold mb-1">{t('calc_crop')}</label>
          <select value={cropId} onChange={(e) => setCropId(e.target.value)}
            className="w-full border-2 border-pulse-soil rounded px-3">
            {Object.values(cropsData.crops).map((c) => (
              <option key={c.id} value={c.id}>{c.names[i18n.language] || c.names.en}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-semibold mb-1">{t('calc_fertilizer')}</label>
          <select value={fertId} onChange={(e) => setFertId(e.target.value)}
            className="w-full border-2 border-pulse-soil rounded px-3">
            {Object.entries(cropsData.fertilizers).map(([id, f]) => (
              <option key={id} value={id}>{f.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-semibold mb-1">{t('calc_area')}</label>
          <input type="number" step="0.01" min="0.01" value={area}
            onChange={(e) => setArea(e.target.value)}
            className="w-full border-2 border-pulse-soil rounded px-3" />
        </div>

        <button type="submit"
          className="w-full bg-pulse-green text-white font-bold rounded py-3 text-lg active:bg-pulse-greenlight">
          {t('calc_button')}
        </button>
      </form>

      {result && (
        <div className="border-2 border-pulse-green rounded-lg p-4 space-y-2 bg-green-50">
          <ResultRow label={t('calc_result_kg')} value={`${result.totalProductKg} kg`} highlight />
          <ResultRow label={t('calc_result_bags')} value={`${result.bags}`} />
          <ResultRow label={t('calc_result_buckets')} value={`${result.buckets}`} />
          <ResultRow label={t('calc_result_caps')} value={`${result.capsPerPlant}`} />
        </div>
      )}
    </div>
  );
}

function ResultRow({ label, value, highlight }) {
  return (
    <div className={`flex justify-between items-center py-2 ${highlight ? 'text-xl font-bold text-pulse-green border-b-2 border-pulse-green' : 'border-b border-gray-200'}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
