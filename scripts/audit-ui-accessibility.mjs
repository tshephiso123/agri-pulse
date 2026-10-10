import fs from 'node:fs';
import puppeteer from '../.tools/lighthouse/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js';
import { startFlow, generateReport } from '../.tools/lighthouse/node_modules/lighthouse/core/index.js';
const url=process.argv[2]||'http://127.0.0.1:4193';
const output='docs/ui/phase4/lighthouse';fs.mkdirSync(output,{recursive:true});const scores=[];
for(const width of [360,1366]){
 const browser=await puppeteer.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true,args:['--disable-gpu','--renderer-process-limit=2'],defaultViewport:{width,height:width===360?640:768}});
 try{
  const page=await browser.newPage();await page.setViewport({width,height:width===360?640:768});await page.goto(url,{waitUntil:'networkidle0'});
  const flow=await startFlow(page,{name:`AgriSmart ${width}px accessibility`,config:{extends:'lighthouse:default',settings:{onlyCategories:['accessibility'],formFactor:width===360?'mobile':'desktop',screenEmulation:{disabled:true}}}});
  const take=async name=>{await page.evaluate(async()=>{await document.fonts.ready;});await flow.snapshot({name});process.stdout.write(`${width}px: ${name}\n`);};
  const click=async selector=>{await page.waitForSelector(selector);await page.$eval(selector,node=>node.click());await new Promise(resolve=>setTimeout(resolve,120));};
  const next=()=>click('.wizard-actions .ui-primary');
  await take('Language');await next();for(const name of ['Farm details','Farm crops','Farm size','Farm review']){await take(name);await next();}
  await take('Crop home');await next();await take('Crop choice');await next();await take('Maize introduction');await next();for(let i=0;i<3;i++){await click('input[value="yes"]');await take(`FAW observation ${i+1}`);await next();}await take('FAW result with immediate guidance');await next();for(let i=0;i<6;i++){await take(`Management ${i+1}`);await next();}await click('.wizard-actions .ui-outline');await click('.wizard-actions .ui-outline');
  await click('.tool-nav button:nth-child(2)');await next();await take('Calculator crop');await next();await take('Calculator product');await next();await take('Calculator area');await next();await take('Calculator review');await next();await take('Calculator result');await next();await click('.wizard-actions .ui-outline');
  await click('.tool-nav button:nth-child(3)');await take('Protected record home');await next();await take('Record passphrase');
  await page.$$eval('input[type="password"]',inputs=>inputs.forEach(input=>{const setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;setter.call(input,'fictional audit passphrase');input.dispatchEvent(new Event('input',{bubbles:true}));}));await next();await page.waitForSelector('.tool-nav');await take('Empty records');await next();await take('Entry activity');await page.$eval('input[maxlength="500"]',input=>{Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,'Fictional audit activity');input.dispatchEvent(new Event('input',{bubbles:true}));});await next();await take('Entry notes');await next();await take('Entry sharing');await next();await page.waitForFunction(()=>document.querySelector('h2')?.textContent==='Entry saved');await take('Saved entry');await next();await page.waitForSelector('.tool-nav');await click('.tool-home .choice-list > button:last-child');await take('Record settings');
  const result=await flow.createFlowResult();fs.writeFileSync(`${output}/${width}.json`,JSON.stringify(result,null,2));fs.writeFileSync(`${output}/${width}.html`,generateReport(result,'html'));for(const step of result.steps){const lhr=step.lhr;scores.push({width,name:step.name,score:lhr.categories.accessibility.score*100,failures:Object.values(lhr.audits).filter(audit=>audit.score!==null&&audit.score<1).map(audit=>({id:audit.id,title:audit.title,details:audit.details}))});}
 }finally{await browser.close();}
}
fs.writeFileSync(`${output}/summary.json`,JSON.stringify(scores,null,2));for(const score of scores)process.stdout.write(`${score.width}px ${score.name}: ${score.score}\n`);if(scores.some(score=>score.score<95))process.exitCode=1;

