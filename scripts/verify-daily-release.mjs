// Runs in the already-installed Node 24 image, with --network none.
import fs from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
execFileSync(process.execPath,['/release/restore.mjs','/tmp/liftlog'],{stdio:'pipe'});
const {createAppServer}=await import('/tmp/liftlog/server.mjs');
const {knowledgeChunks}=await import('/tmp/liftlog/dist/knowledge-data.js');
const server=createAppServer();await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const origin='http://127.0.0.1:'+server.address().port;
const report={createdAt:new Date().toISOString(),environment:'existing Node24 Docker image, external network disabled',modelCalls:0,restoredChecksumsVerified:true,knowledgeCards:knowledgeChunks.length,requests:[]};
try{
 for(const route of ['/','/app.js','/sw.js','/knowledge.js','/knowledge-data.js','/portfolio/index.html','/portfolio/atlas-run02.html','/portfolio/atlas-run02/semantic.fresh40.json','/healthz','/api/ai/status']){
  const response=await fetch(origin+route),text=await response.text();
  const entry={path:route,status:response.status,sha256:createHash('sha256').update(text).digest('hex')};
  if(route==='/healthz'||route==='/api/ai/status')entry.body=JSON.parse(text);
  report.requests.push(entry);
 }
 const boundary=await fetch(origin+'/api/ai/knowledge',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({question:'量子计算机是什么',consent:true,engine:'deepseek'})});
 report.requests.push({path:'/api/ai/knowledge out of scope',status:boundary.status,body:await boundary.json()});
 report.passed=report.knowledgeCards===61&&report.requests.every(r=>r.status===200)&&report.requests.find(r=>r.path==='/healthz').body.version==='1.14.1'&&report.requests.find(r=>r.path==='/api/ai/status').body.provider==='DeepSeek'&&report.requests.at(-1).body.meta.modelCalled===false;
 await fs.writeFile('/verify/daily-release-container.json',JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify(report));if(!report.passed)process.exitCode=1;
}finally{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
