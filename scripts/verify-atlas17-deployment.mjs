import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {ATLAS_MODEL,ATLAS_SHA256} from '../lib/atlas-text-config.mjs';
import {validateIntakeOutput} from '../dist/intake.js';
const root=new URL('../',import.meta.url),origin=process.argv[2],output=process.argv[3];
if(!origin||!output)throw Error('Pass origin and output path');
const cases=JSON.parse(await fs.readFile(new URL('evaluation/fitness-100/workflow.cases.json',root),'utf8'));
const report={checkedAt:new Date().toISOString(),origin,version:'1.15.0',model:ATLAS_MODEL,ggufSha256:ATLAS_SHA256,data:'Synthetic frozen smoke inputs only; no user browser data accessed or saved.',requests:[]};
async function request(path,payload,extra={}){const start=Date.now();const response=await fetch(origin+path,{...(payload?{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify(payload)}:{}),...extra,signal:AbortSignal.timeout(115000)});const body=await response.json();const row={path,status:response.status,elapsedMs:Date.now()-start,body};report.requests.push(row);console.log(JSON.stringify({path,status:row.status,ms:row.elapsedMs}));return row;}
const checks=[];
const health=await request('/healthz');checks.push(health.body.version==='1.15.0');
const status=await request('/api/ai/status');checks.push(status.body.configured===true&&status.body.model===ATLAS_MODEL&&status.body.atlas?.artifactSha===ATLAS_SHA256&&status.body.atlas?.ready===true&&status.body.voice?.configured===false);
const input=id=>({...cases.find(c=>c.id===id).input,engine:'atlas',consent:true});
const intake=await request('/api/ai/intake',input('WF-I01'));checks.push(intake.status===200&&intake.body.meta?.model===ATLAS_MODEL);if(intake.status===200)checks.push(validateIntakeOutput(intake.body.result,input('WF-I01')).status==='ready');
const knowledge=await request('/api/ai/knowledge',{question:'RIR2是什么意思',engine:'atlas',consent:true});checks.push(knowledge.status===200&&knowledge.body.meta?.model===ATLAS_MODEL&&knowledge.body.result?.status==='answered'&&knowledge.body.result.points.some(p=>p.sourceIds.includes('F01')));
const decision=await request('/api/ai/decision',input('WF-D0'));checks.push(decision.status===200&&decision.body.meta?.model===ATLAS_MODEL&&decision.body.advice?.candidateId==='balanced');
const review=await request('/api/ai/review',input('WF-R2'));checks.push(review.status===200&&review.body.model===ATLAS_MODEL&&review.body.factIds?.[0]==='rir');
const guarded=await request('/api/ai/review',input('WF-R0'));checks.push(guarded.status===502&&guarded.body.code==='review_priority_failed'||guarded.status===200&&guarded.body.factIds?.[0]==='frequency');
const retired=await request('/api/ai/intake',{...input('WF-I01'),engine:'deepseek'});checks.push(retired.status===410&&retired.body.code==='provider_changed');
const uncovered=await request('/api/ai/knowledge',{question:'量子计算机是什么',engine:'atlas',consent:true});checks.push(uncovered.status===200&&uncovered.body.meta?.modelCalled===false);
const audio=await request('/api/ai/transcribe',null,{method:'POST',headers:{Origin:origin,'Content-Type':'audio/wav','x-audio-consent':'yes'},body:'synthetic invalid audio'});checks.push(audio.status===410&&audio.body.code==='feature_changed');
const cross=await request('/api/ai/intake',input('WF-I01'),{headers:{Origin:'https://attacker.example','Content-Type':'application/json'}});checks.push(cross.status===403);
report.assets=[];
for(const name of ['app.js','sw.js','intake-ui.js','knowledge-ui.js','review-ui.js','decision-ui.js','voice-ui.js','portfolio/index.html','portfolio/atlas-deployment.html','portfolio/atlas-deployment/model-manifest.json']){const r=await fetch(origin+'/'+name,{signal:AbortSignal.timeout(20000)}),bytes=Buffer.from(await r.arrayBuffer()),matches=bytes.equals(await fs.readFile(new URL('dist/'+name,root)));report.assets.push({path:name,status:r.status,matchesLocal:matches,sha256:createHash('sha256').update(bytes).digest('hex')});checks.push(r.status===200&&matches);}
report.passed=checks.every(Boolean);report.checks=checks;await fs.writeFile(new URL(output,root),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({passed:report.passed,checks:checks.length,output}));if(!report.passed)process.exitCode=1;
