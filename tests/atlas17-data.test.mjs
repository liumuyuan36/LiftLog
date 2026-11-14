import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {validateIntakeOutput} from '../dist/intake.js';
import {validateKnowledgeAnswer} from '../dist/knowledge.js';
import {validatePayload} from '../ai.mjs';
import {validateSelection} from '../dist/review.js';
import {validateDecisionAdvice} from '../dist/decision.js';
const root=new URL('../',import.meta.url),dir=new URL('training/atlas-1.7b/data/',root);
const manifest=JSON.parse(await fs.readFile(new URL('manifest.json',dir),'utf8'));
const readRows=async name=>(await fs.readFile(new URL(name,dir),'utf8')).trim().split('\n').map(s=>JSON.parse(s));

test('Atlas1.7B数据哈希固定，100题和训练问题无完全相同文本',async()=>{
 const questions=JSON.parse(await fs.readFile(new URL('evaluation/fitness-100/cases.json',root),'utf8'));
 assert.equal(questions.length,100);assert.equal(new Set(questions.map(c=>c.id)).size,100);
 const trainText=await fs.readFile(new URL('train.sft.jsonl',dir),'utf8');
 for(const c of questions)assert.ok(!trainText.includes(JSON.stringify(c.question).slice(1,-1)),c.id);
 const seen=new Set();
 for(const [name,entry]of Object.entries(manifest.files)){
  const text=await fs.readFile(new URL(name,dir),'utf8');assert.equal(createHash('sha256').update(text).digest('hex'),entry.sha256);
  const rows=text.trim().split('\n').map(s=>JSON.parse(s));assert.equal(rows.length,entry.rows);
  for(const row of rows){const input=JSON.stringify(row.prompt);assert.ok(!seen.has(input),'Duplicate prompt across train/validation');seen.add(input);}
 }
 assert.equal(manifest.testQuestionsReadByBuilder,0);
 const index=async name=>JSON.parse(await fs.readFile(new URL(name+'.index.json',dir),'utf8'));
 const trainIds=(await index('train')).filter(r=>r.kind==='knowledge').map(r=>r.id.match(/F\d+/)[0]);
 const valIds=(await index('validation')).filter(r=>r.kind==='knowledge').map(r=>r.id.match(/F\d+/)[0]);
 assert.ok(valIds.every(id=>!trainIds.includes(id)));
});
test('SFT完成标签符合知识、录入、复盘和取舍的实际产品结构',async()=>{
 for(const name of ['train','validation']){
  const rows=await readRows(name+'.sft.jsonl');
  const index=JSON.parse(await fs.readFile(new URL(name+'.index.json',dir),'utf8'));
  for(let i=0;i<rows.length;i++){
   const row=rows[i],input=JSON.parse(row.prompt[1].content),expected=JSON.parse(row.completion[0].content),kind=index[i].kind;
   if(['knowledge','insufficient'].includes(kind))validateKnowledgeAnswer(expected,{question:input.question,chunks:input.passages});
   else if(kind==='intake')validateIntakeOutput(expected,input);
   else if(kind==='review-selection')validateSelection(expected,validatePayload(input));
   else if(kind==='decision-selection')validateDecisionAdvice(expected,input.candidates.map(c=>c.id));
   else assert.fail('Unknown task '+kind);
  }
 }
});
