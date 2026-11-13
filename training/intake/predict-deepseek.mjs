import fs from 'node:fs/promises';
import {deepseekJSON} from '../../lib/deepseek.mjs';
import {messagesFor,digest} from './protocol.mjs';
const args=process.argv.slice(2),arg=(k,d)=>args.includes(k)?args[args.indexOf(k)+1]:d;
const split=arg('--split','test');if(!['test','validation'].includes(split))throw Error('Invalid split');
const raw=await fs.readFile(new URL(`./data/${split}.cases.jsonl`,import.meta.url),'utf8');
const cases=raw.trim().split('\n').map(JSON.parse),limit=Number(arg('--limit','1'));
if(!Number.isInteger(limit)||limit<1||limit>cases.length)throw Error('Invalid limit');
if(!args.includes('--live')){
 console.log(JSON.stringify({mode:'dry_run',modelCalls:0,split,selected:limit,total:cases.length,warning:'Use --live --max-calls N --out NEW.jsonl only after authorizing paid calls. Missing cases count as failures in full-set evaluation.'},null,2));
}else{
 const budget=Number(arg('--max-calls','0')),out=arg('--out');
 if(!Number.isInteger(budget)||budget<limit||!out)throw Error('Explicit --max-calls >= --limit and new --out required');
 if(!process.env.DEEPSEEK_API_KEY)throw Error('Set DEEPSEEK_API_KEY locally; never pass key on command line or commit it');
 const handle=await fs.open(out,'wx');let calls=0;
 try{for(const c of cases.slice(0,limit)){
  const started=performance.now(),messages=messagesFor(c);let prediction;
  try{
   calls++;const response=await deepseekJSON({messages,maxTokens:2200});
   prediction={id:c.id,output:response.value,elapsedMs:Math.round(performance.now()-started),...response.meta,promptSha256:digest(messages),datasetSha256:digest(raw)};
  }catch(error){prediction={id:c.id,output:null,elapsedMs:Math.round(performance.now()-started),errorCode:error.code??'request_failed',datasetSha256:digest(raw)};}
  await handle.writeFile(JSON.stringify(prediction)+'\n');
  if(prediction.errorCode)break;
 }}finally{await handle.close();}
 console.log(JSON.stringify({modelCalls:calls,retries:0,file:out}));
}
