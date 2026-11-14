import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {retrieveKnowledge,knowledgeMessages,KNOWLEDGE_PROMPT_VERSION} from '../dist/knowledge.js';
import {retrieveKnowledge as baselineRetrieve,knowledgeMessages as baselineMessages} from '../evaluation/v1.14/baseline/knowledge.js';
const root=new URL('../',import.meta.url),dir=new URL('evaluation/v1.14/',root);
const read=name=>fs.readFile(new URL(name,root),'utf8');
const hash=value=>createHash('sha256').update(value).digest('hex');
const write=(name,value)=>fs.writeFile(new URL(name,dir),JSON.stringify(value,null,2)+'\n');
const cases=JSON.parse(await read('evaluation/v1.14/cases.raw.json')).cases.filter(c=>c.category==='knowledge');
const gold=JSON.parse(await read('evaluation/v1.14/knowledge-gold.json'));
const liveIds=['K02','K05','K08','K20','K23','K27','K29','K34'];
const mode=process.argv[2]??'offline';
if(mode==='offline'){
 const rows=cases.map(c=>{
  const expected=gold.mapping[c.id]??[],baseline=baselineRetrieve(c.input.question),candidate=retrieveKnowledge(c.input.question);
  const summarize=r=>({status:r.status,ids:r.chunks.map(c=>c.id),hits:expected.filter(id=>r.chunks.some(c=>c.id===id))});
  return {id:c.id,split:c.split,question:c.input.question,goldIds:expected,uncoveredReason:gold.uncovered[c.id],baseline:summarize(baseline),candidate:summarize(candidate)};
 });
 const covered=rows.filter(r=>r.goldIds.length);
 const summary=key=>({queries:covered.length,hitAt3:covered.filter(r=>r[key].hits.length).length,meanRecallAt3:covered.reduce((n,r)=>n+r[key].hits.length/r.goldIds.length,0)/covered.length});
 await write('retrieval-results.json',{createdAt:new Date().toISOString(),method:'AI-authored conceptual mapping, offline retrieval only; not answer accuracy',total:rows.length,covered:covered.length,baseline:summary('baseline'),candidate:summary('candidate'),rows});
 console.log(JSON.stringify({baseline:summary('baseline'),candidate:summary('candidate'),misses:covered.filter(r=>!r.candidate.hits.length).map(r=>({id:r.id,question:r.question,ids:r.candidate.ids,gold:r.goldIds}))}));
}else if(mode==='freeze'){
 const names=['dist/knowledge.js','dist/knowledge-data.js','lib/knowledge-model.mjs','lib/deepseek.mjs','lib/model-config.mjs','evaluation/v1.14/cases.raw.json','evaluation/v1.14/knowledge-gold.json','evaluation/v1.14/baseline/knowledge.js','evaluation/v1.14/baseline/knowledge-data.js'];
 const hashes=Object.fromEntries(await Promise.all(names.map(async name=>[name,hash(await read(name))])));
 const reserveUsd=liveIds.reduce((n,id)=>{
  const question=cases.find(c=>c.id===id).input.question;
  for(const [retrieve,messages]of [[baselineRetrieve,baselineMessages],[retrieveKnowledge,knowledgeMessages]]){
   const r=retrieve(question);if(r.chunks.length)n+=(Buffer.byteLength(JSON.stringify(messages(r)))*.30+512*1.20)/1e6;
  }return n;
 },0);
 if(reserveUsd>.10)throw Error('Conservative preflight exceeds budget; no live requests permitted.');
 const freeze={createdAt:new Date().toISOString(),promptVersion:KNOWLEDGE_PROMPT_VERSION,liveIds,maxRequestsPerVersion:8,attemptsPerQuestion:1,maxTotalRequests:16,budgetUsd:0.10,conservativeReserveUsd:reserveUsd,reserveMethod:'One input token per UTF-8 byte upper estimate, peak uncached input $0.30/M, output $1.20/M; excludes future price changes; no retries',scope:'All35 retrieval questions used for diagnostics, not unseen holdout. Eight API pairs fixed before predictions; remaining85 cases not executed.',requestMode:'existing same-origin public synthetic knowledge route; no production key read or exported',hashes};
 try{await fs.writeFile(new URL('FREEZE.json',dir),JSON.stringify(freeze,null,2)+'\n',{flag:'wx'});}catch(e){if(e.code==='EEXIST')throw Error('Freeze already exists; do not overwrite predictions protocol.');throw e;}
 console.log(JSON.stringify(freeze));
}else if(['live-baseline','live-candidate'].includes(mode)){
 const freeze=JSON.parse(await fs.readFile(new URL('FREEZE.json',dir),'utf8'));
 if(mode==='live-candidate')for(const [name,expected]of Object.entries(freeze.hashes))if(hash(await read(name))!==expected)throw Error('Candidate source changed after freeze: '+name);
 const origin=process.env.LIFTLOG_EVAL_ORIGIN??'https://vermouthlau-liftlog.ms.show';
 if(origin!=='https://vermouthlau-liftlog.ms.show')throw Error('Only original public origin permitted.');
 const filename=mode+'.json';
 try{await fs.access(new URL(filename,dir));throw Error('Existing result must not be overwritten or silently retried.');}catch(e){if(e.code!=='ENOENT')throw e;}
 const report={createdAt:new Date().toISOString(),mode,origin,authorship:'Synthetic, AI-authored; structural results only until separate semantic review',rows:[]};
 for(const id of freeze.liveIds){
  const c=cases.find(c=>c.id===id),start=Date.now();
  try{
   const response=await fetch(origin+'/api/ai/knowledge',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({question:c.input.question,consent:true}),signal:AbortSignal.timeout(40000)});
   const body=await response.json();report.rows.push({id,question:c.input.question,httpStatus:response.status,elapsedMs:Date.now()-start,body});
   if([401,402,429,503].includes(response.status)){report.stoppedReason='Provider/configuration/rate limit; no retries';break;}
  }catch(e){report.rows.push({id,question:c.input.question,elapsedMs:Date.now()-start,error:e.message});}
  await write(filename,report);
 }
 report.complete=report.rows.length===freeze.liveIds.length;
 report.usage=report.rows.reduce((a,r)=>({inputTokens:a.inputTokens+(r.body?.meta?.usage?.inputTokens??0),outputTokens:a.outputTokens+(r.body?.meta?.usage?.outputTokens??0)}),{inputTokens:0,outputTokens:0});
 report.conservativeCostUsd=(report.usage.inputTokens*.30+report.usage.outputTokens*1.20)/1e6;
 await write(filename,report);
 console.log(JSON.stringify({mode,complete:report.complete,requests:report.rows.length,modelCalls:report.rows.filter(r=>r.body?.meta?.modelCalled).length,structureAccepted:report.rows.filter(r=>r.httpStatus===200&&r.body?.meta?.modelCalled).length,usage:report.usage,conservativeCostUsd:report.conservativeCostUsd}));
}else throw Error('Unknown evaluation mode');
