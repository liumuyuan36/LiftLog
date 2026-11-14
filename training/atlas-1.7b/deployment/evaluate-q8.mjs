import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {atlasCompletionBody} from '../../../lib/atlas-text.mjs';
import {ATLAS_MODEL,ATLAS_SHA256} from '../../../lib/atlas-text-config.mjs';
const root=new URL('../../../',import.meta.url),dir=new URL('evaluation/atlas17-deployment/',root);
await fs.mkdir(dir,{recursive:true});
const manifest={createdAt:new Date().toISOString(),model:ATLAS_MODEL,ggufSha256:ATLAS_SHA256,sourceModel:'LiftLog Atlas 1.7B Run02 merged BF16',sourceAdapterSha256:'bffa62c24fb61a189c350e8f5b7bbbd9f31ccea95fe06d227701f66a2b61e837',runtime:'official llama.cpp b12377 / 32bdc3a89e6528d3e419024c833c5dabf32c7541',cpuLimit:2,memoryGiB:8,decoding:'greedy, seed42, exact two-message Qwen3 template, JSON grammar, no prompt cache',protocol:'Existing fresh40 + workflow16 deployment regression, already viewed and shared-source synthetic questions; NOT new accuracy benchmark. No labels or checkpoint changes. Grammar and runtime differ from the GPU test; differences are not attributed to weights alone.',maxTokens:{knowledge:512,workflow:1024},inputs:[]};
for(const name of ['evaluation/atlas17-run02/fresh40.prompts.jsonl','evaluation/fitness-100/workflow.prompts.jsonl'])manifest.inputs.push({path:name,sha256:createHash('sha256').update(await fs.readFile(new URL(name,root))).digest('hex')});
await fs.writeFile(new URL('FREEZE.json',dir),JSON.stringify(manifest,null,2)+'\n',{flag:'wx'});
for(const [kind,name,max]of [['fresh40','evaluation/atlas17-run02/fresh40.prompts.jsonl',512],['workflow16','evaluation/fitness-100/workflow.prompts.jsonl',1024]]){
 const rows=(await fs.readFile(new URL(name,root),'utf8')).trim().split('\n').map(JSON.parse),out=await fs.open(new URL(kind+'.predictions.jsonl',dir),'wx');
 try{for(const row of rows){const start=Date.now();let record={id:row.id,promptSha256:row.promptSha256,datasetSha256:row.datasetSha256,model:ATLAS_MODEL,ggufSha256:ATLAS_SHA256};try{const r=await fetch('http://127.0.0.1:7862/completion',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(atlasCompletionBody(row.messages,max)),signal:AbortSignal.timeout(90000)});const raw=await r.json();record={...record,httpStatus:r.status,output:raw.content??'',inputTokens:raw.tokens_evaluated,outputTokens:raw.tokens_predicted,limited:raw.truncated===true||raw.stop_type==='limit'||r.status!==200,stopType:raw.stop_type,timings:raw.timings};}catch(error){record={...record,output:'',limited:true,error:error.name};}record.elapsedMs=Date.now()-start;await out.write(JSON.stringify(record)+'\n');console.log(JSON.stringify({kind,id:row.id,http:record.httpStatus,ms:record.elapsedMs,limited:record.limited}));}}
 finally{await out.close();}
}
