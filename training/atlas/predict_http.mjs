import fs from 'node:fs/promises';
const args=process.argv.slice(2),arg=(k,d)=>args.includes(k)?args[args.indexOf(k)+1]:d;
const input=arg('--input'),out=arg('--out'),expected=arg('--artifact-sha');if(!input||!out||!expected)throw Error('Require --input --out --artifact-sha');
const base=new URL(arg('--endpoint','http://127.0.0.1:7861'));
if(base.hostname!=='127.0.0.1'||base.protocol!=='http:')throw Error('Benchmark worker must use loopback');
const health=await (await fetch(new URL('/healthz',base),{redirect:'error'})).json();
if(health.artifactSha!==expected||!health.ready)throw Error('Worker identity mismatch');
const rows=(await fs.readFile(input,'utf8')).trim().split('\n').map(JSON.parse),file=await fs.open(out,'wx');let done=0;
try{for(const row of rows){
 const started=performance.now();let prediction;
 try{const response=await fetch(new URL('/generate',base),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({messages:row.messages}),signal:AbortSignal.timeout(25000),redirect:'error'});const body=await response.json();if(!response.ok||body.artifactSha!==expected)throw Error('worker_response');prediction={id:row.id,...body,elapsedMs:Math.round(performance.now()-started),promptSha256:row.promptSha256,datasetSha256:row.datasetSha256,quantization:health.quantization};}
 catch(e){prediction={id:row.id,output:null,errorCode:e.name==='TimeoutError'?'timeout':'worker_failed',elapsedMs:Math.round(performance.now()-started),promptSha256:row.promptSha256,datasetSha256:row.datasetSha256};}
 await file.writeFile(JSON.stringify(prediction)+'\n');done++;
 if(done%10===0||done===rows.length)console.log(JSON.stringify({done,total:rows.length,mode:health.quantization}));
}}finally{await file.close();}
