import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
const root=new URL('../',import.meta.url),data=new URL('training/atlas-1.7b/run02/data-v2/',root);
const read=async url=>JSON.parse(await fs.readFile(url,'utf8'));
test('Run02 hashes, test isolation and new missing task coverage are explicit',async()=>{
 const manifest=await read(new URL('manifest.json',data));
 const train=await fs.readFile(new URL('train.sft.jsonl',data),'utf8'),validation=await fs.readFile(new URL('validation.sft.jsonl',data),'utf8');
 for(const [name,text]of [['train.sft.jsonl',train],['validation.sft.jsonl',validation]])assert.equal(createHash('sha256').update(text).digest('hex'),manifest.files[name].sha256);
 const cases=await read(new URL('evaluation/atlas17-run02/fresh40.cases.json',root));assert.equal(cases.length,40);
 for(const c of cases){const text=JSON.stringify(c.question).slice(1,-1);assert.ok(!train.includes(text));assert.ok(!validation.includes(text));}
 const prompts=[...train.trim().split('\n'),...validation.trim().split('\n')].map(s=>JSON.stringify(JSON.parse(s).prompt));assert.equal(new Set(prompts).size,prompts.length);
 const rows=train.trim().split('\n').map(JSON.parse),index=await read(new URL('train.index.json',data));
 const selections=rows.map((r,i)=>({kind:index[i].kind,value:JSON.parse(r.completion[0].content)}));
 assert.ok(selections.filter(r=>r.kind==='review-selection'&&r.value.factIds[0]==='excluded').length>20);
 assert.ok(selections.filter(r=>r.kind==='decision-selection'&&r.value.status==='clarify').length>20);
 assert.equal(manifest.testFilesReadByBuilder,0);
});
