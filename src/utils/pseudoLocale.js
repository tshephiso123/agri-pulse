import en from '../locales/en.json';
export function expandText(value) {
  const tokens = value.match(/\{\{[^}]+\}\}/g) || [];
  const plainLength = tokens.reduce((length, token) => length - token.length, value.length);
  return value + ' ' + '～'.repeat(Math.ceil(plainLength * 0.4));
}
export const pseudoCatalog = Object.fromEntries(Object.entries(en).map(([key, value]) => [key, expandText(value)]));
