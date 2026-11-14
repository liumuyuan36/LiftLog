import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const origin='https://vermouthlau-liftlog.ms.show',root=new URL('../',import.meta.url);
const paths=['index.html','app.js','sw.js','knowledge.js','knowledge-data.js','knowledge-ui.js','knowledge.css','voice-ui.js','portfolio/index.html','portfolio/fitness-rag.html','portfolio/atlas-run02.html','portfolio/atlas-run02/semantic.fresh40.json','portfolio/atlas-run02/run02.fresh40.report.json'];
const report={checkedAt:new Date().toISOString(),version:'1.14.1',sourceCommit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),modelCalls:0,requests:[]};
for(let i=0;i<paths.length;i+=4){
 const settled=await Promise.allSettled(paths.slice(i,i+4).map(async name=>{const response=await fetch(origin+'/'+name+'?release=1.14.1',{signal:AbortSignal.timeout(20000)}),body=Buffer.from(await response.arrayBuffer());return {path:name,status:response.status,matchesLocal:body.equals(await fs.readFile(new URL('dist/'+name,root))),sha256:createHash('sha256').update(body).digest('hex')};}));
 settled.forEach((r,j)=>report.requests.push(r.status==='fulfilled'?r.value:{path:paths[i+j],error:String(r.reason)}));
}
for(const route of ['/healthz','/api/ai/status']){try{const response=await fetch(origin+route,{signal:AbortSignal.timeout(20000)});report.requests.push({path:route,status:response.status,body:await response.json()});}catch(error){report.requests.push({path:route,error:String(error)});}}
try{const response=await fetch(origin+'/api/ai/knowledge',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({question:'量子计算机是什么',consent:true,engine:'deepseek'}),signal:AbortSignal.timeout(20000)});report.requests.push({path:'/api/ai/knowledge uncovered',status:response.status,body:await response.json()});}catch(error){report.requests.push({path:'/api/ai/knowledge uncovered',error:String(error)});}
report.passed=report.requests.every(r=>r.status===200&&r.matchesLocal!==false)&&report.requests.find(r=>r.path==='/healthz')?.body.version==='1.14.1'&&report.requests.find(r=>r.path==='/api/ai/status')?.body.provider==='DeepSeek'&&report.requests.find(r=>r.path==='/api/ai/knowledge uncovered')?.body.meta?.modelCalled===false;
await fs.writeFile(new URL('docs/v1.14.1-live-http.json',root),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));if(!report.passed)process.exitCode=1;
