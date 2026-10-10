import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from '../locales/en.json';
import se from '../locales/se.json';
import ve from '../locales/ve.json';
import ts from '../locales/ts.json';
import features from '../locales/features.en.json';

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: { ...en, ...features } },
    se: { translation: se },
    ve: { translation: ve },
    ts: { translation: ts }
  },
  lng: localStorage.getItem('agripulse_lang') || 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false }
});

export function setLanguage(lang) {
  localStorage.setItem('agripulse_lang', lang);
  i18n.changeLanguage(lang);
}

export default i18n;
