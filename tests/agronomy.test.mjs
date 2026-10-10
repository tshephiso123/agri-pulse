import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { calculateNPK, calculateTank } from '../src/utils/agronomyCalculators.js';
test('nitrogen credit, purchasing units and measured caps use actual quantities',()=>{
 const result=calculateNPK({cropTargetN:100,soilCredit:20,areaHectares:.1,activeRatio:.4,plantCount:1000,capGrams:5,soil:'sandy'});
 assert.equal(result.totalProductKg,20);assert.equal(result.bags,1);assert.equal(result.buckets,1.33);assert.equal(result.capsPerPlant,4);assert.equal(result.caution,true);
 assert.equal(calculateNPK({cropTargetN:100,soilCredit:200,areaHectares:1,activeRatio:.46}).totalProductKg,0);
 assert.equal(calculateNPK({cropTargetN:100,areaHectares:1,activeRatio:.46}).capsPerPlant,null);
});
test('invalid field sizes, ratio and uncalibrated caps are rejected',()=>{
 const base={cropTargetN:100,areaHectares:1,activeRatio:.46};
 for(const area of [0,-1,NaN,Infinity,10001])assert.throws(()=>calculateNPK({...base,areaHectares:area}));
 assert.throws(()=>calculateNPK({...base,activeRatio:0}));assert.throws(()=>calculateNPK({...base,plantCount:100}));assert.throws(()=>calculateNPK({...base,soilCredit:-1}));
 assert.equal(calculateTank(2,15),30);assert.throws(()=>calculateTank(NaN,15));assert.throws(()=>calculateTank(2,0));
});
test('diagnostic paths are reachable and translated with no cycles',async()=>{
 const flow=JSON.parse(await readFile(new URL('../src/data/diagnosticFlow.json',import.meta.url)));
 const words=JSON.parse(await readFile(new URL('../src/locales/features.en.json',import.meta.url)));
 function visit(id,trail=[]){assert.ok(flow[id]);assert.ok(!trail.includes(id));const node=flow[id];assert.ok(words[node.question||node.title]);if(node.choices)for(const [label,next] of node.choices){assert.ok(words[label]);visit(next,[...trail,id]);}else assert.ok(words[node.detail]);}
 visit('start');
});
