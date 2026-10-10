export const FARM_CROPS = ['maize', 'tomato', 'beans', 'cabbage'];
const key = 'agrismart_farm_setup';
export function readFarmProfile() {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    if (value?.version !== 1 || !Array.isArray(value.crops)) return null;
    const crops = value.crops.filter(crop => FARM_CROPS.includes(crop));
    if (!crops.length) return null;
    return { version: 1, name: String(value.name || '').slice(0, 100), community: String(value.community || '').slice(0, 100), crops, area: String(value.area || '').slice(0, 20) };
  } catch { return null; }
}
export function saveFarmProfile(profile) { localStorage.setItem(key, JSON.stringify({ ...profile, version: 1 })); }
