import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from '../locales/en.json';
import nso from '../locales/nso.json';
import ve from '../locales/ve.json';
import ts from '../locales/ts.json';
import features from '../locales/features.en.json';
import { normalizeLanguage } from './languages';

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: { ...en, ...features } },
    nso: { translation: { ...nso, app_title: features.app_title } },
    ve: { translation: { ...ve, app_title: features.app_title } },
    ts: { translation: { ...ts, app_title: features.app_title } }
  },
  lng: normalizeLanguage(localStorage.getItem('agripulse_lang')),
  fallbackLng: 'en',
  interpolation: { escapeValue: false }
});

export function setLanguage(lang) {
  const code = normalizeLanguage(lang);
  localStorage.setItem('agripulse_lang', code);
  i18n.changeLanguage(code);
}

export default i18n;
