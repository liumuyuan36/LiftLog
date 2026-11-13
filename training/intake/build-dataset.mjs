import fs from 'node:fs/promises';
import {cases} from './seeds.mjs';
import {requestFor,messagesFor,checkOutput,digest} from './protocol.mjs';
const root=new URL('./data/',import.meta.url);
await fs.mkdir(root,{recursive:true});
const ids=new Set(),families=new Map(),normalized=new Map();
for(const c of cases){
 if(ids.has(c.id))throw Error('Duplicate id '+c.id);ids.add(c.id);
 if(!['train','validation','test'].includes(c.split))throw Error('Invalid split');
 if(families.has(c.family)&&families.get(c.family)!==c.split)throw Error('Family leakage '+c.family);families.set(c.family,c.split);
 const key=c.text.normalize('NFKC').replace(/[\s，。；、：:;,！!?？]/g,'').replace(/\d+(?:\.\d+)?/g,'#');
 if(normalized.has(key))throw Error('Exact/numeric-template duplicate: '+c.id+' '+normalized.get(key));normalized.set(key,c.id);
 requestFor(c);
 if(!checkOutput(c.expected,c).exact)throw Error('Invalid gold label: '+c.id+' '+JSON.stringify(checkOutput(c.expected,c)));
}
const jsonl=rows=>rows.map(x=>JSON.stringify(x)).join('\n')+'\n';
const files={};
for(const split of ['train','validation','test']){
 const selected=cases.filter(c=>c.split===split),name=split+'.cases.jsonl',raw=jsonl(selected);
 await fs.writeFile(new URL(name,root),raw);files[name]={rows:selected.length,sha256:digest(raw)};
 if(split!=='test'){
  const name=split+'.sft.jsonl',data=jsonl(selected.map(c=>({prompt:messagesFor(c),completion:[{role:'assistant',content:JSON.stringify(c.expected)}]})));
  await fs.writeFile(new URL(name,root),data);files[name]={rows:selected.length,sha256:digest(data)};
 }
}
const manifest={version:'liftlog-intake-pilot-v1',provenance:'AI-authored synthetic; no real user data; pending independent human review',total:cases.length,promptSha256:digest(messagesFor(cases[0])[0].content),catalogSha256:digest(requestFor(cases[0]).catalog),files,leakageChecks:{familyCrossSplit:0,exactOrNumberTemplateDuplicates:0,semanticParaphraseReview:'manual review still required'},modelCalls:0,containsPersonalData:false};
await fs.writeFile(new URL('manifest.json',root),JSON.stringify(manifest,null,2)+'\n');
console.log(JSON.stringify(manifest,null,2));
