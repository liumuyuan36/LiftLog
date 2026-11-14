import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {retrieveKnowledge,knowledgeMessages,KNOWLEDGE_VERSION} from '../dist/knowledge.js';
const root=new URL('../evaluation/knowledge/',import.meta.url),file=new URL('FROZEN.json',root);
try{await fs.access(file);throw Error('Frozen file exists; never silently overwrite a predicted test.');}catch(e){if(e.code!=='ENOENT')throw e;}
const bytes=await fs.readFile(new URL('cases.json',root));const cases=JSON.parse(bytes);
const sha=s=>createHash('sha256').update(s).digest('hex');
const frozen={...cases,frozenAt:new Date().toISOString(),caseSha256:sha(bytes),knowledgeVersion:KNOWLEDGE_VERSION,adapterSha256:'37a915c0d6b128abea960cafbd43e8a0cf48bb7ab395ca95f83d827314325a66',cases:cases.cases.map(c=>{
 const retrieval=retrieveKnowledge(c.question),messages=knowledgeMessages(retrieval);if(c.expectedIds.some(id=>!retrieval.chunks.some(f=>f.id===id)))throw Error('Recall missing '+c.id);
 return {...c,retrieval,messages,promptSha256:sha(JSON.stringify(messages))};
}),policyControls:cases.policyControls.map(c=>{const actual=retrieveKnowledge(c.question);if(actual.status!==c.expectedStatus)throw Error('Policy mismatch');return {...c,actual};})};
await fs.writeFile(file,JSON.stringify(frozen,null,2)+'\n');console.log(JSON.stringify({frozenAt:frozen.frozenAt,caseSha256:frozen.caseSha256,cases:frozen.cases.length,policyControls:frozen.policyControls.length,budgetUSD:frozen.budgetUSD}));
