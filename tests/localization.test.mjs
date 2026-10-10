import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createInstance } from 'i18next';
import { LANGUAGES, normalizeLanguage } from '../src/utils/languages.js';

const catalogs = Object.fromEntries(LANGUAGES.map(({ code }) => [code, JSON.parse(readFileSync(new URL(`../src/locales/${code}.json`, import.meta.url), 'utf8'))]));
const tokens = text => [...text.matchAll(/\{\{([^}]+)\}\}/g)].map(match => match[1]).sort();

test('every offline language pack covers the UI and preserves placeholders', () => {
  for (const { code } of LANGUAGES) {
    assert.deepEqual(Object.keys(catalogs[code]).filter(key => !key.startsWith('ui_')).sort(), Object.keys(catalogs.en).filter(key => !key.startsWith('ui_')).sort());
    for (const [key, value] of Object.entries(catalogs.en).filter(([key]) => !key.startsWith('ui_'))) {
      assert.equal(typeof catalogs[code][key], 'string');
      assert.ok(catalogs[code][key].trim(), `${code}: ${key}`);
      assert.deepEqual(tokens(catalogs[code][key]), tokens(value), `${code}: ${key}`);
    }
  }
});

test('language preferences migrate Sepedi and reject unsupported codes', () => {
  assert.equal(normalizeLanguage('se'), 'nso');
  assert.equal(normalizeLanguage('NSO-ZA'), 'nso');
  assert.equal(normalizeLanguage('ts_ZA'), 'ts');
  assert.equal(normalizeLanguage('not-a-language'), 'en');
  assert.equal(normalizeLanguage(null), 'en');
});

test('offline translations interpolate values and retain unreviewed chemical instructions', async () => {
  const instance = createInstance();
  await instance.init({ resources: Object.fromEntries(Object.entries(catalogs).map(([code, translation]) => [code, { translation }])), lng: 'en', fallbackLng: 'en', keySeparator: false, nsSeparator: false, interpolation: { escapeValue: false } });
  for (const { code } of LANGUAGES) {
    await instance.changeLanguage(code);
    assert.match(instance.t('estimate_context', { area: '2.5' }), /2\.5/);
    assert.match(instance.t('pending_count', { count: 3 }), /3/);
    assert.equal(instance.t('dose_armyworm_cap'), catalogs.en.dose_armyworm_cap);
    assert.equal(instance.t('dose_blight_copper'), catalogs.en.dose_blight_copper);
    assert.notEqual(instance.t('calc_button'), 'calc_button');
  }
});

test('new UI copy falls back to English and is listed for the localization lead', async () => {
  const needed = readFileSync(new URL('../docs/ui/translations-needed.md', import.meta.url), 'utf8');
  for (const code of ['nso', 've', 'ts']) {
    const instance = createInstance();
    await instance.init({ resources: { en: { translation: catalogs.en }, [code]: { translation: catalogs[code] } }, lng: code, fallbackLng: 'en', keySeparator: false });
    for (const key of Object.keys(catalogs.en).filter(key => key.startsWith('ui_'))) { assert.equal(instance.t(key), catalogs.en[key]); assert.ok(needed.includes(key), key); }
  }
});

