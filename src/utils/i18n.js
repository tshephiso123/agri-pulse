import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from '../locales/en.json';
import nso from '../locales/nso.json';
import ve from '../locales/ve.json';
import ts from '../locales/ts.json';
import { normalizeLanguage } from './languages';
import { pseudoCatalog } from './pseudoLocale';
const pseudo = typeof location !== 'undefined' && new URLSearchParams(location.search).get('pseudo') === '1';

function savedLanguage() {
  try { return normalizeLanguage(localStorage.getItem('agripulse_lang')); }
  catch { return 'en'; }
}

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    'en-XA': { translation: pseudoCatalog },
    nso: { translation: nso },
    ve: { translation: ve },
    ts: { translation: ts }
  },
  lng: pseudo ? 'en-XA' : savedLanguage(),
  supportedLngs: ['en', 'nso', 've', 'ts', 'en-XA'],
  fallbackLng: 'en',
  keySeparator: false,
  nsSeparator: false,
  interpolation: { escapeValue: false }
});

export function setLanguage(lang) {
  const code = normalizeLanguage(lang);
  try { localStorage.setItem('agripulse_lang', code); }
  catch { /* Language switching still works when browser storage is unavailable. */ }
  return i18n.changeLanguage(code);
}

if (typeof document !== 'undefined') {
  document.documentElement.lang = i18n.resolvedLanguage || 'en';
  i18n.on('languageChanged', lang => { document.documentElement.lang = normalizeLanguage(lang); });
}

export default i18n;
