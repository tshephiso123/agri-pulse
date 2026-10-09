import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {crops,calculate,tree} from '../public/js/data.js';
test('offline precache paths match the public folder',async()=>{
 const worker=await readFile(new URL('../public/sw.js',import.meta.url),'utf8');
 const shell=vm.runInNewContext(worker+ '\nSHELL;', {self:{addEventListener(){}}});
 for(const asset of shell)await readFile(new URL('../public/'+(asset==='./'?'index.html':asset.slice(2)),import.meta.url));
 const html=await readFile(new URL('../public/index.html',import.meta.url),'utf8');
 for(const [,asset] of html.matchAll(/(?:href|src)="([^"]+)"/g)){
  if(asset==='./')continue;
  await readFile(new URL('../public/'+asset,import.meta.url));
 }
});
test('calculator conversion and invalid boundaries',()=>{assert.equal(calculate(crops[0].rate,2),100);assert.equal(calculate(25,.5),12.5);for(const area of [0,-1,NaN,Infinity,100001])assert.throws(()=>calculate(50,area));});
test('tree paths exist, terminate, and have no cycles',()=>{const outcomes=new Set();function walk(id,ancestors=[]){assert.ok(tree[id],id);assert.ok(!ancestors.includes(id),'cycle');const node=tree[id];if(node.choices){assert.ok(node.question);for(const [,next] of node.choices)walk(next,[...ancestors,id]);}else{assert.ok(node.title&&node.detail);outcomes.add(id);}}walk('start');assert.equal(outcomes.size,11);});
test('mock API rejects invalid requests and keeps private files private',async()=>{const child=spawn(process.execPath,[fileURLToPath(new URL('../server/index.mjs',import.meta.url))],{env:{...process.env,PORT:'4179'},stdio:['ignore','pipe','pipe']});try{await new Promise((resolve,reject)=>{child.stdout.once('data',resolve);child.once('error',reject);child.once('exit',code=>reject(new Error('Server exited '+code)));});const base='http://localhost:4179';assert.equal((await fetch(base+'/')).status,200);assert.equal((await fetch(base+'/agent.md')).status,404);assert.equal((await fetch(base+'/mock-data/entries.json')).status,404);assert.equal((await fetch(base+'/api/entries',{method:'POST',body:'bad'})).status,400);assert.equal((await fetch(base+'/api/entries',{method:'POST',body:'{}'})).status,400);assert.ok(Array.isArray(await(await fetch(base+'/api/entries')).json()));for(const icon of ['icon-192.png','icon-512.png'])assert.equal((await fetch(base+'/icons/'+icon)).status,200);}finally{child.kill();}});
