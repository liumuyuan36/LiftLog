import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {requestFor,expand,compileAtlas,digest} from './protocol.mjs';
import {validateIntakeOutput} from '../../dist/intake.js';
const args=process.argv.slice(2),arg=(k,d)=>args.includes(k)?args[args.indexOf(k)+1]:d;
const split=arg('--split','validation'),file=arg('--predictions'),destination=arg('--out');
if(!['validation','test','user-terms','acceptance','control'].includes(split)||!file||!destination)throw Error('Require --split --predictions --out');
const directory=arg('--data',fileURLToPath(new URL('./data-v3/',import.meta.url)));
const promptFile=arg('--prompts',path.join(directory,split==='control'?'control.zero.prompts.jsonl':split+'.prompts.jsonl'));
const expectedPrompts=new Map((await fs.readFile(promptFile,'utf8')).trim().split('\n').map(JSON.parse).map(p=>[p.id,p]));
const raw=await fs.readFile(path.join(directory,split+'.cases.jsonl'),'utf8'),cases=raw.trim().split('\n').map(JSON.parse);
const predictions=(await fs.readFile(file,'utf8')).trim().split('\n').map(JSON.parse),seen=new Set();
for(const p of predictions){if(seen.has(p.id)||!cases.some(c=>c.id===p.id))throw Error('Duplicate/unknown id');seen.add(p.id);if(p.datasetSha256!==digest(raw))throw Error('Dataset mismatch');if(p.promptSha256!==digest(expectedPrompts.get(p.id)?.messages))throw Error('Prompt mismatch');}
const canonical=(out,c)=>{const v=validateIntakeOutput(out,requestFor(c));return {status:v.status,date:v.date,exercises:v.exercises.map(e=>({name:e.name,sets:e.sets.map(s=>({w:s.weight,r:s.reps,rir:s.rir===''?null:s.rir,t:s.type}))}))};};
const rows=cases.map(c=>{
 const p=predictions.find(p=>p.id===c.id),result={id:c.id,category:c.category,expectedStatus:c.expected.status,jsonValid:false,rawExact:false,servedExact:false,unsafeReady:false,criticalNumericError:false};
 if(!p)return {...result,error:'missing_prediction'};
 result.elapsedMs=p.elapsedMs;result.outputTokens=p.outputTokens;
 try{
  const value=JSON.parse(p.output);result.jsonValid=!!value&&typeof value==='object'&&!Array.isArray(value);if(!result.jsonValid)throw Error('not_object');
  try{result.rawExact=JSON.stringify(canonical(expand(value,c),c))===JSON.stringify(canonical(c.expected,c));}
  catch(e){result.rawRejection=e.message;}
  const compiled=compileAtlas(value,c),served=compiled.result;
  for(const key of ['policyRouted','schemaProjected','guardRejected'])result[key]=compiled[key];
  if(p.limited)throw Error('generation_limited');
  result.servedExact=JSON.stringify(canonical(served,c))===JSON.stringify(canonical(c.expected,c));
  result.actualStatus=served.status;
  result.unsafeReady=served.status==='ready'&&c.expected.status!=='ready';
  result.criticalNumericError=served.status==='ready'&&c.expected.status==='ready'&&!result.servedExact;
 }catch(e){result.error=e.message;}
 return result;
});
const count=k=>rows.filter(r=>r[k]).length,ratio=k=>({correct:count(k),total:cases.length,rate:count(k)/cases.length});
const latency=rows.map(r=>r.elapsedMs).filter(Number.isFinite).sort((a,b)=>a-b);
const metrics={coverage:{correct:predictions.length,total:cases.length,rate:predictions.length/cases.length},jsonValid:ratio('jsonValid'),rawExact:ratio('rawExact'),servedExact:ratio('servedExact'),policyRouted:count('policyRouted'),schemaProjected:count('schemaProjected'),guardRejected:count('guardRejected'),unsafeReady:count('unsafeReady'),criticalNumericErrors:count('criticalNumericError'),latencyMs:{p50:latency[Math.ceil(latency.length*.5)-1]??null,p95:latency[Math.ceil(latency.length*.95)-1]??null}};
const passed=metrics.coverage.rate===1&&metrics.jsonValid.rate>=.99&&metrics.servedExact.rate>=.95&&metrics.unsafeReady===0&&metrics.criticalNumericErrors===0;
const report={split,pipelineVersion:'atlas-pipeline-v3.5',checkedAt:new Date().toISOString(),datasetSha256:digest(raw),labels:'synthetic_pending_independent_review',metrics,qualityGatePassed:passed,categories:Object.fromEntries([...new Set(rows.map(r=>r.category))].map(k=>{const group=rows.filter(r=>r.category===k);return [k,{correct:group.filter(r=>r.servedExact).length,total:group.length}];})),rows};
await fs.writeFile(destination,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({split,metrics,qualityGatePassed:passed}));
