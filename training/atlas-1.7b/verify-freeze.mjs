import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
const root=new URL('../../',import.meta.url),dir=new URL('evaluation/fitness-100/',root),hash=s=>createHash('sha256').update(s).digest('hex');
const freeze=JSON.parse(await fs.readFile(new URL('FREEZE.json',dir),'utf8'));
const amendment=JSON.parse(await fs.readFile(new URL('RESOURCE-AMENDMENT.json',dir),'utf8'));
const checks=[];
for(const [name,expected]of Object.entries(freeze.files)){
 const actual=hash(await fs.readFile(new URL(name,root))),approved=name==='training/intake/train_lora.py'?amendment.newSourceSha256:expected;
 checks.push({name,actual,expected:approved,passed:actual===approved,resourceAmendment:name==='training/intake/train_lora.py'});
}
for(const [name,expected]of [['cases.json',freeze.datasetSha256],['prompts.jsonl',freeze.promptsSha256]]){
 const actual=hash(await fs.readFile(new URL(name,dir)));checks.push({name,actual,expected,passed:actual===expected});
}
const result={checkedAt:new Date().toISOString(),passed:checks.every(c=>c.passed),checks};
console.log(JSON.stringify(result));
if(!result.passed)process.exitCode=1;
