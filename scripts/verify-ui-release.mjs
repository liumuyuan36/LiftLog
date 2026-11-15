import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {ATLAS_MODEL,ATLAS_SHA256} from '../lib/atlas-text-config.mjs';
const origin=process.argv[2],output=process.argv[3];if(!origin||!output)throw Error('Pass origin and output JSON path');
const root=new URL('../',import.meta.url),{version}=JSON.parse(await fs.readFile(new URL('package.json',root)));
const report={checkedAt:new Date().toISOString(),origin,version,actualModelCalls:0,requests:[],assets:[]};
for(const p of ['/healthz','/api/ai/status']){const r=await fetch(origin+p,{signal:AbortSignal.timeout(20000)});assert.equal(r.status,200,p);report.requests.push({path:p,status:r.status,body:await r.json()});}
assert.equal(report.requests[0].body.version,version);const status=report.requests[1].body;
assert.equal(status.model,ATLAS_MODEL);assert.equal(status.atlas?.ready,true);assert.equal(status.atlas?.artifactSha,ATLAS_SHA256);
for(const file of ['app.js','trail-ui.js','intake-ui.js','voice-ui.js','decision-ui.js','review-ui.js','knowledge-ui.js','fitness-ui.js','routine-ui.js','trail.css','product.css','knowledge.css','sw.js','knowledge.js','knowledge-data.js']){
 const r=await fetch(origin+'/'+file,{signal:AbortSignal.timeout(20000)});assert.equal(r.status,200,file);const bytes=Buffer.from(await r.arrayBuffer()),expected=await fs.readFile(new URL('dist/'+file,root));assert.ok(bytes.equals(expected),file+' differs');report.assets.push({path:file,status:r.status,matchesLocal:true,sha256:createHash('sha256').update(bytes).digest('hex')});
}
report.passed=report.assets.length+report.requests.length+4;await fs.writeFile(output,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({version,passed:report.passed,modelReady:true,actualModelCalls:0}));
