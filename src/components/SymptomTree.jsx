import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import trees from '../data/diagnosticTrees.json';

export default function SymptomTree() {
  const { t } = useTranslation();
  const [selected, setSelected] = useState(null);

  const plantParts = Object.keys(trees);

  if (selected) {
    const d = selected;
    return (
      <div className="p-4 space-y-4">
        <button onClick={() => setSelected(null)}
          className="text-pulse-green font-semibold underline">
          &larr; {t('diag_title')}
        </button>
        <div className="border-2 border-pulse-amber rounded-lg p-4 space-y-3">
          <h2 className="text-xl font-bold text-pulse-green">{t(d.titleKey)}</h2>
          <p>{t(d.descriptionKey)}</p>
          <div className="bg-amber-50 border-l-4 border-pulse-amber p-3">
            <p className="font-semibold">{t('diag_action_label') || 'What to do:'}</p>
            <p>{t(d.actionKey)}</p>
          </div>
          <div className="bg-green-50 border-l-4 border-pulse-green p-3">
            <p className="font-semibold">{t('dose_label') || 'Practical dose:'}</p>
            <p className="font-bold">{t(d.practicalDoseKey)}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-lg font-bold">{t('diag_title')}</h2>
      {plantParts.map((part) => (
        <div key={part}>
          <h3 className="font-semibold text-gray-600 mb-2">{t(`diag_part_${part}`)}</h3>
          <div className="space-y-2">
            {trees[part].map((d) => (
              <button key={d.id} onClick={() => setSelected(d)}
                className="w-full text-left border-2 border-pulse-soil rounded-lg p-4 font-semibold active:bg-green-100">
                {t(d.symptomKey)}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
