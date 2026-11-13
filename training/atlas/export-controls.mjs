import fs from 'node:fs/promises';
import {messagesFor,compact,digest} from './protocol.mjs';
const root=new URL('./data/',import.meta.url),read=async n=>(await fs.readFile(new URL(n,root),'utf8')).trim().split('\n').map(JSON.parse);
const train=await read('train.cases.jsonl'),validation=await read('validation.cases.jsonl'),seen=new Set();
const cases=validation.filter(c=>{if(seen.has(c.category))return false;seen.add(c.category);return true;});
const serialized=cases.map(c=>JSON.stringify(c)).join('\n')+'\n';await fs.writeFile(new URL('control.cases.jsonl',root),serialized);
const examples=[train.find(c=>c.expected.status==='ready'&&c.expected.exercises[0].sets.length===2),train.find(c=>c.expected.status==='clarify'),train.find(c=>c.expected.status==='not_log')];
for(const mode of ['zero','fewshot']){
 const rows=cases.map(c=>{const messages=messagesFor(c);if(mode==='fewshot')messages.splice(1,0,...examples.flatMap(ex=>[messagesFor(ex)[1],{role:'assistant',content:JSON.stringify(compact(ex.expected))}]));return {id:c.id,messages,promptMode:mode,promptSha256:digest(messages),datasetSha256:digest(serialized)};});
 await fs.writeFile(new URL(`control.${mode}.prompts.jsonl`,root),rows.map(x=>JSON.stringify(x)).join('\n')+'\n');
}
await fs.writeFile(new URL('control-policy.json',root),JSON.stringify({selection:'first validation sample in each category; exploratory validation comparison, never the final held-out test',cases:cases.map(c=>c.id),fewshotExamples:examples.map(c=>c.id),decoding:'greedy non-thinking, max 512 output tokens for every model'},null,2)+'\n');
console.log(JSON.stringify({controlCases:cases.length,fewshotExamples:examples.map(c=>c.id),paidCalls:0}));
