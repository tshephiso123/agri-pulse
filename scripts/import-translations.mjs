import fs from 'node:fs';
const readJson = path => JSON.parse(fs.readFileSync(path,'utf8').replace(/^\uFEFF/,''));
const source = readJson('src/locales/en.json');
const batches = readJson('scripts/translation-batches.json');
const extras = [
 ['Your estimated amount','Estimated fertilizer quantity'],
 ['We could not calculate this amount. Check your field size and try again.','We could not calculate the fertilizer quantity. Check your field size and try again.'],
 ['Sample estimates only. Confirm amounts with your local agricultural adviser before use.','Sample fertilizer quantities only. Ask your local agricultural adviser to confirm these quantities before use.'],
 ['Logbook unlocked','Your farm records are open.'],
 ['symptom_yellow_spots','Yellow patches on maize leaves'],
 ['symptom_ragged_holes','Uneven holes in maize leaves'],
 ['Saved encrypted on this phone.','Saved safely on this phone. Protected with your passphrase.'],
 ['log_update','Save changes'],
 ['Cloud account','Cloud account'],
 ['Checking your connection…','Checking your connection…'],
 ['Records stay on this phone until you share them.','Records stay on this phone until you share them.'],
 ['Your changes were not completed. Please try again.','Your changes were not completed. Please try again.'],
 ['Check your details and try again.','Check your details and try again.'],
 ['translation_draft','Machine translation. Some words may be incorrect.'],
 ['treatment_review','Agricultural chemical instructions are shown in English until reviewed.'],
 ['Your encryption passphrase stays on this phone. Keep it safe: a forgotten passphrase cannot be recovered. Use a separate password for your account.','Your records are protected by your passphrase. Remember it: we cannot reset it for you. Use a different password for your cloud account.'],
 ['Your estimate will appear here','The quantity of fertilizer you need will appear here.']
];
const targets = ['nso','ts','ve'];
for(const [key,value] of extras) if(!source[key]) source[key]=value;
function readBatch(language,index,expected) {
 const lines=fs.readFileSync(`scripts/translations/${language}-${index}.txt`,'utf8').replace(/^\uFEFF/,'').trim().split(/\r?\n/);
 if(lines.length!==expected) throw new Error(`${language} batch ${index}: expected ${expected} lines, received ${lines.length}`);
 return lines.map((line,i)=>{ const match=line.match(/^(\d+)\.\s*(.+)$/);if(!match||Number(match[1])!==i+1) throw new Error(`${language}: line ${i+1} missing or out of order`);return match[2].replace(/[\u200b\uFEFF]/g,'').trim().replace(/\s+\.$/,''); });
}
const packs={};
for(const language of targets){
 const pack={app_title:source.app_title};
 for(let i=0;i<batches.length;i++){
  const entries=i===2?[...batches[i],...extras]:batches[i];
  const values=readBatch(language,i,entries.length);
  entries.forEach(([key],j)=>{pack[key]=values[j];});
 }
 // Brand and pesticide names remain unambiguous. Chemical instructions are held in English until review.
 for(const key of ['diag_armyworm_title','diag_armyworm_action','diag_blight_action','dose_armyworm_cap','dose_blight_copper']) pack[key]=source[key];
 for(const [key,value] of Object.entries(source)) {
  if(!pack[key]) throw new Error(`${language} missing ${key}`);
  const tokens=text=>[...text.matchAll(/\{\{([^}]+)\}\}/g)].map(m=>m[1]).sort().join(',');
  if(tokens(value)!==tokens(pack[key])) throw new Error(`${language} changed placeholders in ${key}`);
 }
 packs[language]=pack;
}
// Only publish after every pack passes shape and placeholder checks.
fs.writeFileSync('src/locales/en.json',JSON.stringify(source,null,2)+'\n');
for(const [language,pack] of Object.entries(packs)) fs.writeFileSync(`src/locales/${language}.json`,JSON.stringify(pack,null,2)+'\n');
console.log('Imported',Object.keys(source).length,'strings in each of',targets.join(', '));
