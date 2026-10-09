export const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'nso', label: 'Sepedi' },
  { code: 've', label: 'Tshivenda' },
  { code: 'ts', label: 'Xitsonga' }
];

export function normalizeLanguage(value) {
  const code = typeof value === 'string' ? value.toLowerCase().split(/[-_]/)[0] : 'en';
  // The prototype used se (Northern Sami) for Sepedi. Migrate saved preferences.
  if (code === 'se') return 'nso';
  return LANGUAGES.some(language => language.code === code) ? code : 'en';
}
