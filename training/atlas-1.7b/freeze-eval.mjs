import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {retrieveKnowledge,knowledgeMessages} from '../../dist/knowledge.js';
const root=new URL('../../',import.meta.url),dir=new URL('evaluation/fitness-100/',root);
const hash=s=>createHash('sha256').update(s).digest('hex');
const raw=await fs.readFile(new URL('cases.json',dir),'utf8'),dataset=JSON.parse(raw),cases=Array.isArray(dataset)?dataset:dataset.cases;
if(cases.length!==100||new Set(cases.map(c=>c.id)).size!==100)throw Error('Expected exactly100 unique cases');
const sft=await fs.readFile(new URL('data/train.sft.jsonl',import.meta.url),'utf8');
for(const c of cases){if(sft.includes(JSON.stringify(c.question).slice(1,-1)))throw Error('Exact test question appears in training: '+c.id);}
const rows=cases.map(c=>{const retrieval=retrieveKnowledge(c.question),messages=knowledgeMessages(retrieval);return {id:c.id,split:c.split,messages,retrieval,promptSha256:hash(JSON.stringify(messages)),datasetSha256:hash(raw)};});
const text=rows.map(c=>JSON.stringify(c)).join('\n')+'\n';
const names=['training/atlas-1.7b/data/train.sft.jsonl','training/atlas-1.7b/data/validation.sft.jsonl','training/atlas-1.7b/data/manifest.json','training/intake/train_lora.py','training/atlas-1.7b/predict.py','dist/knowledge.js','dist/knowledge-data.js'];
const files=Object.fromEntries(await Promise.all(names.map(async name=>[name,hash(await fs.readFile(new URL(name,root)))])));
const freeze={createdAt:new Date().toISOString(),model:'Qwen/Qwen3-1.7B',revision:'70d244cc86ccca08cf5af4e1e306ecf908b1ad5e',count:100,datasetSha256:hash(raw),promptsSha256:hash(text),files,training:{epochs:3,earlyStoppingPatience:1,learningRate:5e-5,rank:16,alpha:32,batchSize:2,accumulation:4,seed:42,loss:'completion only',selection:'minimum validation loss, never100 questions'},decoding:{thinking:false,sample:false,maxNewTokens:512,batchSize:4,seed:42},evaluation:'All100 go through the raw local model, including empty-evidence questions. Application policy is reported separately; no repaired JSON or retries. Semantic checks are AI-reviewed, not expert or user accuracy.',sftOverlap:'0 exact question strings; concepts and source cards may overlap, not semantic novelty proof'};
await fs.writeFile(new URL('FREEZE.json',dir),JSON.stringify(freeze,null,2)+'\n',{flag:'wx'});
await fs.writeFile(new URL('prompts.jsonl',dir),text,{flag:'wx'});
await fs.mkdir(new URL('snapshot/',dir),{recursive:true});
for(const name of ['knowledge.js','knowledge-data.js'])await fs.copyFile(new URL('dist/'+name,root),new URL('snapshot/'+name,dir));
console.log(JSON.stringify({count:100,retrieved:rows.filter(r=>r.retrieval.chunks.length).length,policyOnly:rows.filter(r=>!r.retrieval.chunks.length).length,promptsSha256:freeze.promptsSha256}));
